import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import * as UI from "@/styles/ui";
import { getDefinitionById, type NoticeDefinition } from "@/next/publish/config/noticeTypes";
import { getNoticePermissions, canSubmitNoticeType, getWorkflowDescription } from "@/next/publish/config/noticePermissions";
import type { NoticeBase } from "@/types/notice";
import NoticeTypeStep from "@/next/publish/flow/steps/NoticeTypeStep";
import UploadMethodStep, { type UploadMethod } from "@/next/publish/flow/steps/UploadMethodStep";
import ConfirmStep from "./steps/ConfirmStep";
import PaymentStep from "./steps/PaymentStep";
import { getNoticeBuilder } from "@/next/publish/schema/registry";
import { validateWindowRules, type WindowRuleIssue } from "@/next/publish/validation/windowRules";
import { getNoticeTemplateRenderer } from "@/next/publish/templates";
import { buildSampleDraft } from "@/next/publish/sampleData";
import { getNested, setNested } from "@/next/publish/utils/object";
import { getMandatoryFieldsForOCR } from "@/next/publish/config/formBlueprints";
import type { UploadStatus } from "@/components/publish/UploadDropzone";
import WizardStepper from "@/wizard/WizardStepper";
import { wizardSteps } from "@/wizard/wizardSteps";
import { useSafeTransition } from "@/wizard/useSafeTransition";
import { getDraftId as getStoredDraftId, setDraftId as persistDraftId } from "@/wizard/draftStore";
import { toast } from "@/lib/ui/toast";
import type { Council } from "@/components/CouncilSelect";
import {
  APPLICATION_TYPE_OPTIONS,
  createInitialLegalDetails,
  extractLegalDetailsFromOcr,
  generateNoticeSummary,
  type LegalDetails,
  type LegalMetaMap,
  type OCRHighlight,
  type RequiredFieldKey,
  type RecommendedFieldKey,
  validateLegalDetails,
} from "@/next/publish/flow/lib/legalDetails";
const LazyTemplateBuilderForm = React.lazy(() => import("./TemplateBuilderForm"));
const LazyNoticePreview = React.lazy(() => import("./NoticePreview"));
import ReviewCard from "./components/ReviewCard";
import ProgressBar from "./components/ProgressBar";
import StickyRailLayout from "./components/StickyRailLayout";

type Step = (typeof wizardSteps)[number]["id"];
type TemplateDraft = Record<string, unknown> | null;

const STEP_PATHS: Record<Step, string> = wizardSteps.reduce(
  (acc, step) => {
    acc[step.id] = step.path;
    return acc;
  },
  {} as Record<Step, string>
);

const NOTICE_TYPE_STORAGE_PREFIX = "publish:noticeType:";

const stepFromPath = (pathname: string): Step | null => {
  if (pathname.startsWith("/publish/step-1")) return 1;
  if (pathname.startsWith("/publish/step-2")) return 2;
  if (pathname.startsWith("/publish/step-3")) return 3;
  if (pathname.startsWith("/publish/step-4")) return 4;
  return null;
};

const inferApplicationTypeFromDefinition = (definitionId: string | null): string | null => {
  if (!definitionId) return null;
  const id = definitionId.toLowerCase();
  if (id.includes("variation")) return "premises-licence-variation";
  if (id.includes("review")) return "review";
  if (id.includes("club")) return "club-certificate";
  if (id.includes("premises")) return "premises-licence-new";
  return null;
};

/** Small right-rail card */
function RailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={`${UI.card} p-4 md:p-5`}>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-2 text-sm text-slate-600">{children}</div>
    </section>
  );
}

/** Tabs for Preview source (OCR vs Structured) */
function PreviewTabs({
  source,
  onSource,
}: {
  source: "ocr" | "structured";
  onSource: (s: "ocr" | "structured") => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-xs">
      <button
        className={`rounded-md px-2 py-1 ${source === "ocr" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
        onClick={() => onSource("ocr")}
      >
        OCR text
      </button>
      <button
        className={`rounded-md px-2 py-1 ${source === "structured" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
        onClick={() => onSource("structured")}
      >
        Structured fields
      </button>
    </div>
  );
}

type WizardBoundaryProps = {
  contextKey: string;
  onReset?: () => void;
  children: React.ReactNode;
};

type WizardBoundaryState = {
  hasError: boolean;
};

class WizardBoundary extends React.Component<WizardBoundaryProps, WizardBoundaryState> {
  state: WizardBoundaryState = { hasError: false };

  static getDerivedStateFromError(): WizardBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("[publish-wizard:error]", { error, info, contextKey: this.props.contextKey });
  }

  componentDidUpdate(prevProps: WizardBoundaryProps) {
    if (this.state.hasError && prevProps.contextKey !== this.props.contextKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={`${UI.card} space-y-3 border border-rose-200 bg-rose-50 p-6`}>
          <h2 className="text-base font-semibold text-rose-900">Something went wrong</h2>
          <p className="text-sm text-rose-800">
            The publishing wizard hit an unexpected error. Try starting again from Step 1. If the problem persists,
            contact support.
          </p>
          <button
            type="button"
            className={UI.btnPrimary}
            onClick={() => this.props.onReset?.()}
          >
            Restart wizard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Department selector for applicants submitting to councils */
function DepartmentSelector({
  value,
  onChange
}: {
  value: string;
  onChange: (id: string, name: string) => void
}) {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string; orgName: string }>>([]);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      // Load departments and organizations separately to avoid RLS recursion
      const [deptsResult, orgsResult] = await Promise.all([
        supabase.from('departments').select('id, name, organization_id').eq('type', 'licensing').eq('status', 'active'),
        supabase.from('organizations').select('id, name, type').eq('type', 'council').eq('status', 'active')
      ]);

      if (deptsResult.error) throw deptsResult.error;
      if (orgsResult.error) throw orgsResult.error;

      // Create organization lookup map
      const orgMap = new Map(orgsResult.data?.map(org => [org.id, org]) || []);

      // Join departments with their organizations
      const mapped = (deptsResult.data || [])
        .map(dept => {
          const org = orgMap.get(dept.organization_id);
          if (!org) return null; // Filter out departments without matching council org
          return {
            id: dept.id,
            name: dept.name,
            orgName: org.name
          };
        })
        .filter(Boolean as any) as Array<{ id: string; name: string; orgName: string }>;

      // Sort by organization name
      mapped.sort((a, b) => a.orgName.localeCompare(b.orgName));

      setDepartments(mapped);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load departments:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
        <div className="animate-pulse h-10 bg-white/20 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
      <label className="block text-sm font-semibold text-white mb-2">
        Select Council <span className="text-yellow-300">*</span>
      </label>
      <select
        value={value}
        onChange={(e) => {
          const selectedId = e.target.value;
          const selectedDept = departments.find(d => d.id === selectedId);
          const displayName = selectedDept ? `${selectedDept.orgName} - ${selectedDept.name}` : '';
          onChange(selectedId, displayName);
        }}
        required
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
      >
        <option value="">-- Choose a council --</option>
        {departments.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.orgName} - {dept.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-white/80 mt-2">
        The council that will review your application
      </p>
    </div>
  );
}

export default function NewPublishFlow() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const currentStep = stepFromPath(pathname);

  // User context detection
  const [userType, setUserType] = useState<'council' | 'law_firm' | 'applicant' | 'loading'>('loading');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [targetDepartmentId, setTargetDepartmentId] = useState<string | null>(null);
  const [selectedCouncilName, setSelectedCouncilName] = useState<string>('');
  const [councilSelectorLocked, setCouncilSelectorLocked] = useState(false); // Lock after first selection

  const [definitionId, setDefinitionId] = useState<string | null>(null);
  const [draftId, setDraftIdState] = useState<string | null>(() => {
    const params = new URLSearchParams(search);
    const fromSearch = params.get("draft");
    return fromSearch ?? getStoredDraftId();
  });
  useEffect(() => {
    const params = new URLSearchParams(search);
    const fromSearch = params.get("draft");
    const normalized = fromSearch ?? null;
    if (normalized === draftId) return;
    setDraftIdState(normalized);
    persistDraftId(normalized);
  }, [search, draftId]);

  // Detect user type on mount
  useEffect(() => {
    detectUserContext();
  }, []);

  const detectUserContext = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Unauthenticated user → applicant
        setUserType('applicant');
        return;
      }

      setUserEmail(session.user.email || null);

      // Check user memberships
      const { data: memberships } = await supabase
        .from('memberships')
        .select(`
          organization_id,
          department_id,
          role,
          organization:organizations!inner (type)
        `)
        .eq('user_id', session.user.id);

      const councilMembership = memberships?.find((m: any) => m.organization?.type === 'council');
      const lawFirmMembership = memberships?.find((m: any) => m.organization?.type === 'law_firm');

      if (councilMembership) {
        // User is council member → can publish regulatory notices
        setUserType('council');
        setTargetDepartmentId(councilMembership.department_id);
      } else if (lawFirmMembership) {
        // User is law firm member → can publish probate notices
        setUserType('law_firm');
        // Law firms don't need targetDepartmentId (they publish directly)
      } else {
        // User is authenticated but no org membership → individual applicant
        setUserType('applicant');
      }
    } catch (error) {
      console.error('Failed to detect user context:', error);
      // Default to applicant on error
      setUserType('applicant');
    }
  };

  const buildStepUrl = React.useCallback(
    (target: Step, overrideDraft?: string | null) => {
      const base = STEP_PATHS[target];
      const params = new URLSearchParams(search);
      const effectiveDraft = overrideDraft === undefined ? draftId : overrideDraft;
      if (effectiveDraft) {
        params.set("draft", effectiveDraft);
      } else {
        params.delete("draft");
      }
      const query = params.toString();
      return query ? `${base}?${query}` : base;
    },
    [draftId, search]
  );

  const goToStep = React.useCallback(
    (target: Step, options?: { replace?: boolean; draftOverride?: string | null }) => {
      const next = buildStepUrl(target, options?.draftOverride);
      navigate(next, { replace: options?.replace });
    },
    [buildStepUrl, navigate]
  );
  const ensureDraftId = React.useCallback(async () => {
    if (draftId) return draftId;

    const params = new URLSearchParams(search);
    const fromSearch = params.get("draft");
    if (fromSearch) {
      setDraftIdState(fromSearch);
      persistDraftId(fromSearch);
      return fromSearch;
    }

    const stored = getStoredDraftId();
    if (stored) {
      setDraftIdState(stored);
      persistDraftId(stored);
      return stored;
    }

    const generated =
      typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
    setDraftIdState(generated);
    persistDraftId(generated);
    return generated;
  }, [draftId, search]);

  useEffect(() => {
    if (pathname === "/publish") {
      navigate(buildStepUrl(1), { replace: true });
    }
  }, [buildStepUrl, pathname, navigate]);

  useEffect(() => {
    if (currentStep === null && pathname.startsWith("/publish")) {
      navigate(buildStepUrl(1), { replace: true });
    }
  }, [buildStepUrl, currentStep, navigate, pathname]);

  const definition = useMemo<NoticeDefinition | null>(
    () => (definitionId ? getDefinitionById(definitionId) ?? null : null),
    [definitionId]
  );
  const [uploadMethod, setUploadMethod] = useState<UploadMethod | null>(null);
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft>(null);
  const [previewSource, setPreviewSource] = useState<"ocr" | "structured">("structured");
  const [guardMessage, setGuardMessage] = useState<string | null>(null);
  const [legalDetails, setLegalDetails] = useState<LegalDetails>(() => createInitialLegalDetails());
  const [legalMeta, setLegalMeta] = useState<LegalMetaMap>({});
  const [ocrHighlights, setOcrHighlights] = useState<OCRHighlight[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [selectedCouncil, setSelectedCouncil] = useState<Council | null>(null);
  const [activeHighlightKey, setActiveHighlightKey] = useState<string | null>(null);
  const focusNonceRef = useRef(0);
  const [focusRequest, setFocusRequest] = useState<{ key: string | null; nonce: number } | null>(null);
  const missingDraftRedirectedRef = useRef(false);
  const missingDefinitionRedirectedRef = useRef(false);
  const missingUploadRedirectedRef = useRef(false);
  const lastNoticeTypePersistedRef = useRef<{ draftId: string; definitionId: string } | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const hasBootstrappedRef = useRef(false);
  const draftFromQuery = useMemo(() => {
    const params = new URLSearchParams(search);
    const fromSearch = params.get("draft");
    return fromSearch ? true : false;
  }, [search]);
  const hasDraft = Boolean(draftId || draftFromQuery);
  const hasDefinition = Boolean(definitionId && definition);
  const ocrText = typeof (templateDraft as any)?.ocrText === "string" ? (templateDraft as any).ocrText : "";
  const hasNoticeUpload = Boolean(ocrText && ocrText.trim().length > 0);
  const hasUpload =
    uploadMethod === "template"
      ? Boolean(uploadMethod)
      : uploadMethod === "notice"
      ? hasNoticeUpload
      : false;
  const hasMeaningfulManualDetails = React.useMemo(
    () =>
      [
        legalDetails.applicantName,
        legalDetails.premisesLine1,
        legalDetails.premisesCity,
        legalDetails.premisesPostcode,
        legalDetails.councilName,
        legalDetails.applicationSummary,
        legalDetails.representationDeadline,
      ].some((value) => value.trim().length > 0),
    [
      legalDetails.applicantName,
      legalDetails.premisesLine1,
      legalDetails.premisesCity,
      legalDetails.premisesPostcode,
      legalDetails.councilName,
      legalDetails.applicationSummary,
      legalDetails.representationDeadline,
    ]
  );
  const shouldShowRequiredDetails = hasNoticeUpload || hasMeaningfulManualDetails;

  // Debug logging for upload flow
  useEffect(() => {
    console.log('[NewPublishFlow] Upload flow state:', {
      hasNoticeUpload,
      hasMeaningfulManualDetails,
      shouldShowRequiredDetails,
      uploadStatus,
      ocrTextLength: ocrText.length,
      uploadMethod,
    });
  }, [hasNoticeUpload, hasMeaningfulManualDetails, shouldShowRequiredDetails, uploadStatus, ocrText.length, uploadMethod]);

  useEffect(() => {
    if (!definition) {
      setUploadMethod((prev) => (prev ? null : prev));
      setTemplateDraft((prev) => (prev ? null : prev));
    }
  }, [definition]);

  useEffect(() => {
    const inferred = inferApplicationTypeFromDefinition(definition?.id ?? null);
    if (!inferred) return;
    setLegalDetails((prev) => {
      if (prev.applicationType) return prev;
      return { ...prev, applicationType: inferred };
    });
    setLegalMeta((prev) => {
      if (prev.applicationType?.confidence) return prev;
      if (!prev.applicationType && inferred) {
        return { ...prev, applicationType: { confidence: 0.5 } };
      }
      return prev;
    });
  }, [definition?.id]);

  useEffect(() => {
    if (previewSource !== "ocr") {
      setActiveHighlightKey(null);
    }
  }, [previewSource]);

  useEffect(() => {
    if (!hasBootstrappedRef.current) {
      hasBootstrappedRef.current = true;
      return;
    }
    setSaveState('saving');
    const handle = window.setTimeout(() => {
      setSaveState('saved');
      setSavedAt(Date.now());
    }, 800);
    return () => window.clearTimeout(handle);
  }, [legalDetails, templateDraft, uploadMethod, selectedCouncil]);

  useEffect(() => {
    if (!draftId || definitionId) return;
    if (typeof window === "undefined") return;
    try {
      const stored = window.sessionStorage.getItem(`${NOTICE_TYPE_STORAGE_PREFIX}${draftId}`);
      if (stored) {
        setDefinitionId(stored);
        lastNoticeTypePersistedRef.current = { draftId, definitionId: stored };
      }
    } catch {
      // ignore storage access errors
    }
  }, [draftId, definitionId]);

  const persistNoticeTypeIfNeeded = React.useCallback(
    async (draft: string, selectedDefinition: string) => {
      const last = lastNoticeTypePersistedRef.current;
      if (last && last.draftId === draft && last.definitionId === selectedDefinition) {
        return;
      }
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(`${NOTICE_TYPE_STORAGE_PREFIX}${draft}`, selectedDefinition);
        } catch {
          // best-effort persistence; ignore storage errors
        }
      }
      lastNoticeTypePersistedRef.current = { draftId: draft, definitionId: selectedDefinition };
    },
    []
  );

  const { run: handleContinueFromStep1, pending: step1Pending } = useSafeTransition(async () => {
    if (!definitionId) {
      toast("Select a notice type to continue.");
      return;
    }
    const id = await ensureDraftId();
    await persistNoticeTypeIfNeeded(id, definitionId);
    goToStep(2, { draftOverride: id });
  });

  const handleOcrText = React.useCallback(
    async (text: string) => {
      console.log('[NewPublishFlow] handleOcrText called:', { textLength: text.length, hasText: Boolean(text.trim()) });
      setTemplateDraft((prev) => ({ ...(prev ?? {}), ocrText: text }));
      setUploadMethod((prev) => prev ?? "notice");
      setPreviewSource("ocr");
      const extraction = extractLegalDetailsFromOcr(text);

      // Generate AI summary for residents using ChatGPT API
      let aiSummary = "";
      try {
        const response = await fetch('/api/ai-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (response.ok) {
          const data = await response.json();
          aiSummary = data.summary || "";
        } else {
          // Fallback to heuristic if API fails
          console.warn('[AI_SUMMARY] API failed, using fallback');
          aiSummary = generateNoticeSummary(text);
        }
      } catch (error) {
        // Fallback to heuristic if API is unavailable
        console.error('[AI_SUMMARY] Error calling API:', error);
        aiSummary = generateNoticeSummary(text);
      }

      // Store extraction results but DO NOT auto-fill form fields
      setLegalMeta((prev) => ({ ...prev, ...extraction.meta }));
      setOcrHighlights(extraction.highlights);
      setLegalDetails((prev) => ({ ...prev, aiGeneratedSummary: aiSummary }));
      // DO NOT set legalDetails automatically - fields must be filled manually for compliance
      if (text.trim()) {
        toast('Text extracted. Please complete the required fields manually.');
      }
    },
    []
  );

  const handleOcrMeta = React.useCallback((meta: { engine?: string; [k: string]: unknown }) => {
    setTemplateDraft((prev) => ({ ...(prev ?? {}), ocrMeta: meta }));
  }, []);

  const handleOcrTextChange = React.useCallback((text: string) => {
    setTemplateDraft((prev) => ({ ...(prev ?? {}), ocrText: text }));
  }, []);

  const handleDetailChange = React.useCallback((key: keyof LegalDetails, value: string) => {
    setLegalDetails((prev) => ({ ...prev, [key]: value }));
    setLegalMeta((prev) => {
      let metaKey: keyof LegalMetaMap | null = null;
      switch (key) {
        case "applicationType":
        case "applicantName":
        case "premisesLine1":
        case "premisesCity":
        case "premisesPostcode":
        case "tradingName":
        case "premisesName":
        case "applicationSummary":
        case "representationDeadline":
        case "viewingInformation":
        case "representationContact":
        case "contactEmail":
        case "contactPhone":
          metaKey = key;
          break;
        case "councilName":
          metaKey = "council";
          break;
        default:
          metaKey = null;
      }
      if (!metaKey) return prev;
      const existing = prev[metaKey];
      if (!existing?.confidence) return prev;
      return { ...prev, [metaKey]: { ...existing, confidence: null } };
    });
  }, []);

  const handleCouncilSelect = React.useCallback((council: Council) => {
    setSelectedCouncil(council);
    setLegalDetails((prev) => ({
      ...prev,
      councilName: council.name,
      councilEmail: council.email || prev.councilEmail,
      councilAddress: council.address || prev.councilAddress,
    }));
    setLegalMeta((prev) => ({ ...prev, council: { ...(prev.council ?? {}), confidence: 1 } }));
  }, []);

  const handleCouncilInput = React.useCallback((value: string) => {
    setSelectedCouncil(null);
    setLegalDetails((prev) => ({ ...prev, councilName: value }));
    setLegalMeta((prev) => {
      if (!prev.council) return prev;
      return { ...prev, council: { ...prev.council, confidence: null } };
    });
  }, []);

  const focusField = React.useCallback(
    (key: RequiredFieldKey | RecommendedFieldKey) => {
      focusNonceRef.current += 1;
      setFocusRequest({ key, nonce: focusNonceRef.current });
      setActiveHighlightKey(key);
    },
    []
  );

  const handleFieldFocus = React.useCallback((key: RequiredFieldKey | RecommendedFieldKey) => {
    setActiveHighlightKey(key);
  }, []);

  const handleHighlightRequest = React.useCallback((key: RequiredFieldKey | RecommendedFieldKey) => {
    setActiveHighlightKey(key);
  }, []);

  const syncLegalDetailsToTemplate = React.useCallback(() => {
    setTemplateDraft((prev) => {
      const base = { ...(prev ?? {}) };
      const applyIfEmpty = (path: (string | number)[], value: string | null | undefined) => {
        if (!value || !value.trim()) return;
        const existing = getNested<string | undefined>(base, path);
        if (existing && existing.trim().length > 0) return;
        setNested(base, path, value);
      };

      applyIfEmpty(["applicant", "fullName"], legalDetails.applicantName);
      applyIfEmpty(["applicant", "companyName"], legalDetails.applicantName);
      applyIfEmpty(["applicant", "contactEmail"], legalDetails.contactEmail);
      applyIfEmpty(["applicant", "contactPhone"], legalDetails.contactPhone);
      applyIfEmpty(["applicant", "serviceAddress", "line1"], legalDetails.premisesLine1);
      applyIfEmpty(["applicant", "serviceAddress", "line2"], legalDetails.premisesLine2);
      applyIfEmpty(["applicant", "serviceAddress", "town"], legalDetails.premisesCity);
      applyIfEmpty(["applicant", "serviceAddress", "postcode"], legalDetails.premisesPostcode);

      const premisesName = legalDetails.premisesName || legalDetails.tradingName || legalDetails.premisesLine1;
      applyIfEmpty(["premises", "name"], premisesName);
      applyIfEmpty(["premises", "address", "line1"], legalDetails.premisesLine1);
      applyIfEmpty(["premises", "address", "line2"], legalDetails.premisesLine2);
      applyIfEmpty(["premises", "address", "town"], legalDetails.premisesCity);
      applyIfEmpty(["premises", "address", "postcode"], legalDetails.premisesPostcode);

      const authorityName = selectedCouncil?.name || legalDetails.councilName;
      applyIfEmpty(["licensingAuthority", "name"], authorityName);
      applyIfEmpty(["licensingAuthority", "email"], selectedCouncil?.email || "");

      applyIfEmpty(["inspectionAddressOrURL"], legalDetails.viewingInformation);
      applyIfEmpty(["representations", "postal"], legalDetails.representationContact);
      applyIfEmpty(["representations", "email"], legalDetails.contactEmail);
      applyIfEmpty(["consultation", "repsDeadline"], legalDetails.representationDeadline);

      return base;
    });
  }, [legalDetails, selectedCouncil]);

  useEffect(() => {
    if (uploadMethod !== "template") return;
    syncLegalDetailsToTemplate();
  }, [uploadMethod, syncLegalDetailsToTemplate]);

  const { run: handleContinueFromStep2, pending: step2Pending } = useSafeTransition(async () => {
    if (!uploadMethod) return;
    const id = await ensureDraftId();
    goToStep(3, { draftOverride: id });
  });

  useEffect(() => {
    if (currentStep === null) return;

    if (currentStep === 1) {
      missingDraftRedirectedRef.current = false;
      missingDefinitionRedirectedRef.current = false;
      missingUploadRedirectedRef.current = false;
      return;
    }

    if (!hasDraft && !step1Pending && !step2Pending) {
      if (!missingDraftRedirectedRef.current) {
        missingDraftRedirectedRef.current = true;
        setGuardMessage("Start at Step 1 to create your draft.");
        toast("Start at Step 1 to create your draft.");
        goToStep(1, { replace: true });
      }
      return;
    }
    missingDraftRedirectedRef.current = false;

    // Allow Step 2 to load while definition restores; enforce from Step 3 onward
    if (currentStep >= 3 && !hasDefinition && !step1Pending && !step2Pending) {
      if (!missingDefinitionRedirectedRef.current) {
        missingDefinitionRedirectedRef.current = true;
        setGuardMessage("Choose a notice type to continue.");
        toast("Choose a notice type to continue.");
        goToStep(1, { replace: true });
      }
      return;
    }
    missingDefinitionRedirectedRef.current = false;

    if (currentStep >= 3) {
      if ((!hasUpload || !hasDefinition || !hasDraft) && !step1Pending && !step2Pending) {
        if (!missingUploadRedirectedRef.current) {
          missingUploadRedirectedRef.current = true;
          toast("Upload your notice before continuing.");
          goToStep(hasDefinition ? 2 : 1, { replace: true });
        }
        return;
      }
      missingUploadRedirectedRef.current = false;
    }
  }, [currentStep, goToStep, hasDefinition, hasDraft, hasUpload, step1Pending, step2Pending]);

  const handleSelectDefinition = React.useCallback((id: string, _def: NoticeDefinition) => {
    setDefinitionId(id);
    setUploadMethod(null);
    setTemplateDraft({});
  }, []);

  const handleMethodChange = React.useCallback(
    (method: UploadMethod) => {
      setUploadMethod(method);
      if (method === "template") setTemplateDraft((prev) => prev ?? {});
      if (method === "notice") setPreviewSource("ocr");
      if (method === "template") setPreviewSource("structured");
      if (method === "template") syncLegalDetailsToTemplate();
    },
    [syncLegalDetailsToTemplate]
  );

  const handleBackToStep1 = React.useCallback(() => goToStep(1), [goToStep]);
  const handleBackToStep2 = React.useCallback(() => goToStep(2), [goToStep]);

  // For applicants: skip payment and submit directly
  // For councils/law firms: proceed to payment step
  const { run: handleContinueFromStep3, pending: step3Pending } = useSafeTransition(async () => {
    if (userType === 'applicant') {
      // Skip payment step - submit application directly
      await handleSubmit();
    } else {
      // Proceed to payment step for councils/law firms
      const id = await ensureDraftId();
      goToStep(4, { draftOverride: id });
    }
  });

  const stepGuards = useMemo(
    () => ({
      "notice-type": true,
      "upload-ocr": hasDefinition && hasDraft,
      "confirm-data": hasDefinition && hasDraft && hasUpload,
      pay: hasDefinition && hasDraft && hasUpload,
    }),
    [hasDefinition, hasDraft, hasUpload]
  );
  const stepHrefMap = useMemo(() => {
    const map: Partial<Record<(typeof wizardSteps)[number]["key"], string>> = {};
    wizardSteps.forEach((step) => {
      map[step.key] = buildStepUrl(step.id);
    });
    return map;
  }, [buildStepUrl]);

  // Builder + renderers
  const builder = useMemo(() => (definition ? getNoticeBuilder(definition.id) : null), [definition?.id]);
  const templateRenderer = useMemo(
    () => (definition ? getNoticeTemplateRenderer(definition.templateKey) : null),
    [definition?.templateKey]
  );

  const updateTemplateDraftPath = React.useCallback((path: (string | number)[], value: unknown) => {
    setTemplateDraft((prev) => setNested(prev ?? {}, path, value));
  }, []);
  const handleTemplatePatch = React.useCallback((patch: Record<string, unknown>) => {
    setTemplateDraft((prev) => ({ ...(prev ?? {}), ...patch }));
  }, []);

  const templatePayload = useMemo(() => {
    if (!builder || uploadMethod !== "template") return null;
    return { ...(templateDraft ?? {}), variant: definition?.id };
  }, [builder, uploadMethod, templateDraft, definition?.id]);

  const templateParse = useMemo(() => {
    if (!builder || !templatePayload) return null;
    const result = builder.schema.safeParse(templatePayload);
    if (!result.success) {
      console.log('[NewPublishFlow] Template parse FAILED');
      console.log('Errors:', JSON.stringify(result.error.flatten(), null, 2));
      console.log('Payload:', JSON.stringify(templatePayload, null, 2));
    } else {
      console.log('[NewPublishFlow] Template parse SUCCESS');
    }
    return result;
  }, [builder, templatePayload]);

  const templateFieldErrors = React.useMemo(() => {
    if (!templateParse || templateParse.success) return {} as Record<string, string[]>;
    const flattened = templateParse.error.flatten();
    return flattened.fieldErrors ?? {};
  }, [templateParse]);

  const templateNotice: NoticeBase | null = useMemo(() => {
    if (!builder || !templateParse || !templateParse.success) return null;
    try {
      return builder.mapToNoticeBase(templateParse.data);
    } catch {
      return null;
    }
  }, [builder, templateParse]);

  const templateText = useMemo(() => {
    if (!templateRenderer || !templateNotice) return "";
    try {
      return templateRenderer.renderText(templateNotice) ?? "";
    } catch {
      return "";
    }
  }, [templateRenderer, templateNotice]);

  // Validation
  const validationIssues: WindowRuleIssue[] = useMemo(
    () => (templateNotice ? validateWindowRules(templateNotice) : []),
    [templateNotice]
  );
  const parseMessages = useMemo(() => {
    const e = templateParse && !templateParse.success ? templateParse.error : null;
    if (!e) return [] as string[];
    const flat = e.flatten();
    const fieldErrors = Object.values(flat.fieldErrors || {}).flat().filter(Boolean) as string[];
    return [...flat.formErrors, ...fieldErrors];
  }, [templateParse]);
  const issues = useMemo(
    () => [
      ...parseMessages.map((m) => ({ type: "parse", message: m } as const)),
      ...validationIssues.map((i) => ({ type: "window", message: i.message } as const)),
    ],
    [parseMessages, validationIssues]
  );

  // Placeholders
  const sampleTemplateDraft = useMemo(
    () => (definition ? buildSampleDraft(definition.id) : null),
    [definition?.id]
  );

  const legalValidation = useMemo(
    () => validateLegalDetails(legalDetails, legalMeta, { selectedCouncil }),
    [legalDetails, legalMeta, selectedCouncil]
  );

  const handleUploadStatusChange = React.useCallback((status: UploadStatus) => {
    console.log('[NewPublishFlow] Upload status changed:', status);
    setUploadStatus(status);
  }, []);

  const uploadPaneProps = useMemo(
    () => ({
      definition: definition ?? null,
      uploadComponentProps: {
        onText: handleOcrText,
        onMeta: handleOcrMeta,
        onStatusChange: handleUploadStatusChange,
      },
      showRequiredDetails: shouldShowRequiredDetails,
      templateDraft,
      onChange: updateTemplateDraftPath,
      errors: templateFieldErrors,
      onSwitchToTemplate: () => handleMethodChange("template"),
    }),
    [
      definition,
      handleOcrText,
      handleOcrMeta,
      handleUploadStatusChange,
      shouldShowRequiredDetails,
      templateDraft,
      updateTemplateDraftPath,
      templateFieldErrors,
      handleMethodChange,
    ]
  );

  // Calculate missing mandatory fields for blueprint-driven forms (both notice and template)
  const blueprintMissingCount = React.useMemo(() => {
    if (!uploadMethod || !definition) return 0;
    const blueprint = getMandatoryFieldsForOCR(definition);
    let count = 0;
    const missingFields: string[] = [];
    for (const section of blueprint.sections) {
      for (const field of section.fields) {
        if (field.required) {
          const raw = templateDraft?.[field.token];
          const value = typeof raw === "string" ? raw : typeof raw === "number" ? String(raw) : "";
          const fieldErrors = (templateFieldErrors as Record<string, string[] | undefined>)[field.token];
          const hasError = fieldErrors && fieldErrors.length > 0;
          if (!value || hasError) {
            count++;
            missingFields.push(`${field.label} (${field.token})${hasError ? ' [has errors]' : ''}`);
          }
        }
      }
    }

    // Debug logging for applicants to see what's blocking Step 3
    if (count > 0 && userType === 'applicant') {
      console.log('[Step 2→3 Debug] Missing required fields:', {
        count,
        hasDraft,
        continueDisabled: count > 0 || !hasDraft,
      });
      console.log('Missing field details:');
      missingFields.forEach(field => console.log('  ❌', field));
    }

    return count;
  }, [uploadMethod, definition, templateDraft, templateFieldErrors, userType, hasDraft]);

  const continueDisabledStep2 =
    uploadMethod === "notice"
      ? blueprintMissingCount > 0 || !hasDraft
      : uploadMethod === "template"
      ? blueprintMissingCount > 0 || !hasDraft
      : true;

  const formatRelativeTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  const templateFormContent = builder ? (
    <div className="space-y-4 p-0">
      <React.Suspense
        fallback={
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
            Loading template fields…
          </div>
        }
      >
        {/* definition guaranteed non-null here because builder exists */}
        <LazyTemplateBuilderForm
          definition={definition!}
          draft={templateDraft}
          onChange={updateTemplateDraftPath}
          errors={templateFieldErrors}
        />
      </React.Suspense>
      {sampleTemplateDraft && (
        <button
          type="button"
          className={`${UI.btnSecondary} h-9 px-3 text-xs`}
          onClick={() => handleTemplatePatch(sampleTemplateDraft)}
        >
          Load example data
        </button>
      )}
    </div>
  ) : (
    <div className="p-6 text-sm text-neutral-600 space-y-3">
      Templates for this notice type are not yet available.
    </div>
  );

  // Right rail content for Step 2 (only when a definition exists)
  const rightRail = useMemo(() => {
    if (!definition) return null;

    const applicationTypeLabel =
      APPLICATION_TYPE_OPTIONS.find((option) => option.value === legalDetails.applicationType)?.label ??
      (legalDetails.applicationType || "—");
    const addressSummary = [
      legalDetails.premisesLine1,
      legalDetails.premisesLine2,
      legalDetails.premisesCity,
      legalDetails.premisesPostcode,
    ]
      .filter((part) => part && part.trim().length > 0)
      .join(", ");

    const isOcrProcessing =
      uploadMethod === "notice" && (uploadStatus === 'uploading' || uploadStatus === 'ocr');

    const previewContent = (
      <React.Suspense
        fallback={
          <div className="flex h-32 items-center justify-center text-sm text-slate-500">
            Loading preview…
          </div>
        }
      >
        {previewSource === "ocr" ? (
          isOcrProcessing ? (
            <div className="space-y-3">
              <div className="h-3 w-28 rounded-full bg-slate-200/80" />
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="h-2 rounded bg-slate-200/90" />
                <div className="h-2 rounded bg-slate-200/80" />
                <div className="h-2 rounded bg-slate-200/70" />
                <div className="h-20 rounded bg-slate-100" />
              </div>
              <p className="text-xs text-slate-500">Extracting text…</p>
            </div>
          ) : (
            <LazyNoticePreview
              text={String((templateDraft as any)?.ocrText ?? "")}
              highlights={undefined}
              activeHighlight={null}
              onHighlightClick={undefined}
            />
          )
        ) : uploadMethod === "notice" ? (
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Application type</p>
              <p className="font-medium text-slate-900">{applicationTypeLabel}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Applicant</p>
              <p className="font-medium text-slate-900">{legalDetails.applicantName || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Premises</p>
              <p className="font-medium text-slate-900 whitespace-pre-line">{addressSummary || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Licensing authority</p>
              <p className="font-medium text-slate-900">{legalDetails.councilName || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Summary</p>
              <p className="font-medium text-slate-900 whitespace-pre-line">
                {legalDetails.applicationSummary || "Add a brief summary to help readers."}
              </p>
            </div>
          </div>
        ) : (
          <LazyNoticePreview text={templateText} />
        )}
      </React.Suspense>
    );

    const complianceItems = legalValidation.statuses.map((status) => {
      const text =
        status.status === 'found'
          ? `${status.label} detected`
          : status.status === 'review'
          ? `${status.label} needs review`
          : `${status.label} missing`;
      const dotClass =
        status.status === 'found'
          ? 'bg-emerald-400'
          : status.status === 'review'
          ? 'bg-amber-400'
          : 'bg-rose-400';
      const textTone =
        status.status === 'found'
          ? 'text-slate-600'
          : status.status === 'review'
          ? 'text-amber-600'
          : 'text-rose-600';
      return (
        <li key={status.key}>
          <button
            type="button"
            onClick={() => focusField(status.key)}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12px] font-medium transition-colors duration-200 hover:bg-blue-50/70 ${textTone}`}
          >
            <span>{text}</span>
            <span className={`ml-3 inline-flex h-1 w-1 rounded-full ${dotClass}`} aria-hidden />
          </button>
        </li>
      );
    });

    const keyDates = [
      {
        label: "Application date",
        value: templateNotice?.consultation?.applicationDate || "—",
      },
      {
        label: "Representation deadline",
        value: legalDetails.representationDeadline || templateNotice?.consultation?.repsDeadline || "—",
      },
      {
        label: "Publish by (newspaper)",
        value: templateNotice?.publication?.targetDate || "—",
      },
    ];

    // Transform compliance items for ReviewCard
    const reviewComplianceItems = legalValidation.statuses.map((status) => ({
      key: status.key,
      label: status.label,
      status: status.status,
    }));

    // Transform key dates for ReviewCard
    const reviewKeyDates = keyDates.map((date) => ({
      label: date.label,
      value: date.value,
    }));

    // Transform detections for ReviewCard (from OCR highlights)
    const reviewDetections = uploadMethod === "notice" && ocrHighlights.length > 0
      ? ocrHighlights.slice(0, 5).map((highlight) => ({
          field: highlight.label,
          value: String((templateDraft as any)?.ocrText ?? "").slice(highlight.start, highlight.end),
          confidence: highlight.confidence ?? 0.5,
        }))
      : [];

    return (
      <>
        <section className="rounded-2xl border border-slate-200/40 bg-white/50 p-4 shadow-none backdrop-blur-sm md:p-5 opacity-80 hover:opacity-100 transition-opacity duration-300">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Preview</h3>
            <PreviewTabs source={previewSource} onSource={setPreviewSource} />
          </div>
          <div className="rounded-xl border border-slate-200/30 bg-slate-50/50 p-3 shadow-inner transition-opacity duration-200">
            {previewContent}
          </div>
        </section>

        <ReviewCard
          complianceItems={reviewComplianceItems}
          keyDates={reviewKeyDates}
          detections={reviewDetections}
          onItemClick={(key) => focusField(key as RequiredFieldKey | RecommendedFieldKey)}
          recommendedWarnings={legalValidation.recommendedWarnings}
        />
      </>
    );
  }, [
    definition,
    previewSource,
    templateDraft,
    templateText,
    issues,
    uploadMethod,
    uploadStatus,
    ocrHighlights,
    activeHighlightKey,
    legalDetails,
    focusField,
    legalValidation,
    templateNotice,
  ]);

  const { run: handleSubmit, pending: paymentPending } = useSafeTransition(async () => {
    try {
      if (userType === 'council') {
        // Council → Publish directly (existing flow)
        const { submitNotice } = await import("@/lib/notices");

        let payload: any;

        if (uploadMethod === "template" && templateNotice) {
          // Submitting from template builder
          payload = {
            id: draftId || undefined,
            notice_type: definition?.id || "unknown",
            applicant: templateNotice.applicant || {},
            premises: templateNotice.premises || {},
            consultation: templateNotice.consultation || {},
            publication: templateNotice.publication || {},
            extras: templateNotice.extras || {},
            latitude: templateNotice.premises?.coordinates?.latitude || null,
            longitude: templateNotice.premises?.coordinates?.longitude || null,
          };
        } else if (uploadMethod === "notice") {
          // Submitting from OCR upload
          payload = {
            id: draftId || undefined,
            notice_type: definition?.id || "unknown",
            applicant: {
              name: legalDetails.applicantName || "",
              email: legalDetails.applicantEmail || "",
            },
            premises: {
              name: legalDetails.premisesName || "",
              address: legalDetails.premisesAddress || "",
              postcode: legalDetails.premisesPostcode || "",
            },
            consultation: {
              applicationDate: legalDetails.applicationDate || null,
              repsDeadline: legalDetails.representationDeadline || null,
            },
            publication: {
              targetDate: legalDetails.publicationDate || null,
            },
            extras: {
              ocrText: ocrText || "",
              applicationType: legalDetails.applicationType || null,
            },
            latitude: null,
            longitude: null,
          };
        } else {
          toast("Please complete the form before submitting");
          return;
        }

        console.log("[NewPublishFlow] Publishing notice (council) with payload:", payload);

        const result = await submitNotice(payload);

        if (result.success) {
          toast("✓ Notice published successfully!");
          console.info("✓ Notice published with ID:", result.id);

          // Navigate to success page after short delay
          setTimeout(() => {
            navigate("/success?noticeId=" + result.id);
          }, 1500);
        }
      } else {
        // Applicant → Create submission
        if (!targetDepartmentId) {
          toast("Please select a council to submit to");
          return;
        }

        // Generate unique reference number
        const referenceNumber = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const submissionData: any = {
          // Required: Target council department
          target_department_id: targetDepartmentId,

          // NULL for anonymous applicants, organization ID for authenticated firms
          source_organization_id: null,

          // Required: Reference number
          reference_number: referenceNumber,

          // Required: Notice type
          notice_type: definition?.id || "unknown",

          // Required: Complete notice data as JSONB
          notice_data: {
            ...templateNotice,
            metadata: {
              submittedViaPublicForm: true,
              uploadMethod,
              ocrText: uploadMethod === "notice" ? ocrText : undefined
            }
          },

          // Optional: Message to council
          firm_message: legalDetails.applicationSummary || "Application submitted via public form",

          // NULL for anonymous submissions
          submitted_by: null,

          // Status defaults to 'new'
          status: 'new'
        };

        console.log("[NewPublishFlow] Creating submission (applicant) with data:", submissionData);

        const { data, error } = await supabase
          .from('submissions')
          .insert(submissionData)
          .select()
          .single();

        if (error) throw error;

        // Send magic link if unauthenticated
        if (!userEmail && submissionData.applicant_email) {
          await supabase.auth.signInWithOtp({
            email: submissionData.applicant_email,
            options: {
              emailRedirectTo: `${window.location.origin}/applicant/dashboard`,
            },
          });
        }

        toast("✓ Application submitted successfully!");
        console.info("✓ Submission created with ID:", data.id);

        // Navigate to success page
        setTimeout(() => {
          navigate("/apply/success");
        }, 1500);
      }
    } catch (error: any) {
      console.error("✗ Failed to submit:", error);
      const errorMsg = error.message || "Failed to submit. Please try again.";
      toast("✗ " + errorMsg);
    }
  });

  const boundaryContextKey = useMemo(
    () => `${currentStep ?? "none"}:${definition?.id ?? "none"}:${uploadMethod ?? "none"}`,
    [currentStep, definition?.id, uploadMethod]
  );

  // Step 2 should always render; controls inside handle disabled states
  const step2Blocked = false;
  const step3Blocked = currentStep === 3 && (!hasDefinition || !hasDraft || !hasUpload);
  const step4Blocked = currentStep === 4 && (!hasDefinition || !hasDraft || !hasUpload);

  return (
    <WizardBoundary contextKey={boundaryContextKey} onReset={() => goToStep(1, { replace: true })}>
      <div className="relative">
        {/* Hero Band with Integrated Stepper */}
        <section className="relative overflow-hidden pb-8 pt-12 md:pb-12 md:pt-16">
          <div className="absolute -right-16 -top-16 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-300/10 blur-3xl" />

          <div className={`${UI.container} relative z-10`}>
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)] md:text-5xl lg:text-6xl">
                {userType === 'council' ? 'Publish with calm,' : 'Submit your application'}
                {userType === 'council' && <br />}
                {userType === 'council' && 'compliant confidence'}
              </h1>
              <p className="mt-6 text-base leading-relaxed text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.12)] md:text-lg">
                {userType === 'council'
                  ? "Start by choosing your notice type. We'll tailor everything automatically."
                  : "Select your council and complete the licensing application. We'll send you a link to track your progress."}
              </p>

              {/* Department Selector for Applicants - Only show at Step 1 */}
              {userType === 'applicant' && currentStep === 1 && !councilSelectorLocked && (
                <div className="mt-8 mx-auto max-w-md">
                  <DepartmentSelector
                    value={targetDepartmentId || ''}
                    onChange={(id, name) => {
                      setTargetDepartmentId(id);
                      setSelectedCouncilName(name);
                      setCouncilSelectorLocked(true); // Lock after first selection
                    }}
                  />
                </div>
              )}

              {/* Read-only badge showing selected council on steps 2-4 */}
              {userType === 'applicant' && currentStep && currentStep > 1 && councilSelectorLocked && targetDepartmentId && (
                <div className="mt-8 mx-auto max-w-md">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Submitting to</span>
                      <p className="text-sm font-semibold text-blue-900 mt-0.5">
                        {selectedCouncilName || 'Council selected'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCouncilSelectorLocked(false);
                        goToStep(1);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {/* Integrated Lightweight Stepper */}
              <div className="mt-12 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 shadow-lg backdrop-blur-md">
                  <WizardStepper currentPath={pathname} guards={stepGuards} hrefs={stepHrefMap} />
                  <div className="ml-4 h-4 w-px bg-white/20" />
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-white/90">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
                    {saveState === 'saving'
                      ? 'Saving…'
                      : savedAt
                      ? `Saved • ${formatRelativeTimestamp(savedAt)}`
                      : 'Saved'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="bg-[#F9FAFB] py-12 md:py-16" data-testid="publish-next-flow">
          <div className={UI.container}>
          {currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <NoticeTypeStep
              selectedId={definitionId}
              onSelect={handleSelectDefinition}
              onContinue={handleContinueFromStep1}
              continuePending={step1Pending}
              guardMessage={guardMessage}
              onClearGuard={() => setGuardMessage(null)}
              userType={userType === 'loading' ? undefined : userType}
            />
            </div>
          )}

          {currentStep === 2 && !step2Blocked && (
            <>
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <UploadMethodStep
                  definition={definition ?? null /* tolerant to transition frames */}
                  method={uploadMethod}
                  onMethodChange={handleMethodChange}
                  onBack={handleBackToStep1}
                  onContinue={handleContinueFromStep2}
                  continueDisabled={continueDisabledStep2}
                  continuePending={step2Pending}
                  uploadPaneProps={uploadPaneProps}
                  templateContent={templateFormContent}
                  rightRail={rightRail}
                  userType={userType === 'loading' ? undefined : userType}
                />
              </div>
              {uploadMethod === "notice" && shouldShowRequiredDetails && (
                <ProgressBar
                  completed={legalValidation.statuses.filter((s) => s.status === 'found').length}
                  total={legalValidation.statuses.filter((s) => s.key !== 'representationContact' && s.key !== 'viewingInformation').length}
                  isComplete={legalValidation.missingCount === 0}
                />
              )}
            </>
          )}

          {currentStep === 3 && !step3Blocked && definition && uploadMethod && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <ConfirmStep
              definition={definition}
              notice={uploadMethod === "template" ? templateNotice : null}
              uploadMethod={uploadMethod}
              onBack={handleBackToStep2}
              onContinue={handleContinueFromStep3}
              continueDisabled={(uploadMethod === "template" && !templateNotice) || !hasDraft}
              continuePending={step3Pending}
              ocrText={uploadMethod === "notice" ? ocrText : undefined}
              onOcrTextChange={uploadMethod === "notice" ? handleOcrTextChange : undefined}
              continueButtonText={userType === 'applicant' ? 'Send to Council' : 'Continue to payment'}
              readyText={userType === 'applicant' ? 'Ready to submit' : 'Ready to publish'}
              readyDescription={
                userType === 'applicant'
                  ? 'Your application will be submitted to the council for review.'
                  : 'Proceed to payment to publish your notice.'
              }
              preview={
                <div className="rounded-xl border border-slate-200 p-3">
                  <React.Suspense
                    fallback={
                      <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                        Loading preview…
                      </div>
                    }
                  >
                    <LazyNoticePreview
                      text={
                        uploadMethod === "template"
                          ? templateText
                          : String((templateDraft as any)?.ocrText ?? "")
                      }
                    />
                  </React.Suspense>
                </div>
              }
              metadata={
                issues.length ? (
                  <ul className="list-disc space-y-1 pl-4">
                    {issues.map((i, idx) => (
                      <li key={idx}>{i.message}</li>
                    ))}
                  </ul>
                ) : null
              }
            />
            </div>
          )}

          {currentStep === 4 && !step4Blocked && definition && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <PaymentStep
              definition={definition}
              notice={uploadMethod === "template" ? templateNotice : null}
              onBack={() => goToStep(3)}
              onSubmit={handleSubmit}
              submitting={paymentPending}
              submitButtonText={userType === 'council' ? 'Publish notice' : 'Submit application'}
              submitDescription={
                userType === 'council'
                  ? 'Your notice will be published after successful payment.'
                  : 'Your application will be submitted to the council for review.'
              }
            />
            </div>
          )}
          </div>
        </div>
      </div>
    </WizardBoundary>
  );
}

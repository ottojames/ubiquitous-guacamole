import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as UI from "@/styles/ui";
import { getDefinitionById, type NoticeDefinition } from "@/next/publish/config/noticeTypes";
import type { NoticeBase } from "@/types/notice";
import NoticeTypeStep from "@/next/publish/flow/steps/NoticeTypeStep";
import UploadMethodStep, { type UploadMethod } from "@/next/publish/flow/steps/UploadMethodStep";
import ConfirmStep from "./steps/ConfirmStep";
import PaymentStep from "./steps/PaymentStep";
import { getNoticeBuilder } from "@/next/publish/schema/registry";
import { validateWindowRules, type WindowRuleIssue } from "@/next/publish/validation/windowRules";
import { getNoticeTemplateRenderer } from "@/next/publish/templates";
import { renderNoticeWithTemplateInfo, type TemplateRenderResult } from "@/lib/templateService";
import { buildSampleDraft } from "@/next/publish/sampleData";
import { getNested, setNested } from "@/next/publish/utils/object";
import { getMandatoryFieldsForOCR } from "@/next/publish/config/formBlueprints";
import type { UploadStatus } from "@/components/publish/UploadDropzone";
import WizardStepper from "@/wizard/WizardStepper";
import { wizardSteps } from "@/wizard/wizardSteps";
import { useSafeTransition } from "@/wizard/useSafeTransition";
import { getDraftId as getStoredDraftId, setDraftId as persistDraftId } from "@/wizard/draftStore";
import { toast } from "@/lib/ui/toast";
import type { Council } from "@/components/DynamicCouncilSelect";
import { getDepartmentTypeForCategory } from "@/next/publish/config/categoryToDepartment";
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
const LazyEditableNoticePreview = React.lazy(() => import("./EditableNoticePreview"));
import ReviewCard from "./components/ReviewCard";
import ProgressBar from "./components/ProgressBar";
import StickyRailLayout from "./components/StickyRailLayout";
import PublishSuccessModal from "@/components/publish/PublishSuccessModal";
import { supabase } from "@/lib/supabase";
import type { PublishNoticeResponse } from "@/lib/notices";
import { useAuth } from "@/contexts/UnifiedAuthContext";

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
  // Handle both public (/publish/step-X) and portal (/f/slug/publish/step-X or /c/slug/dept/publish/step-X) paths
  if (pathname.includes("/publish/step-1")) return 1;
  if (pathname.includes("/publish/step-2")) return 2;
  if (pathname.includes("/publish/step-3")) return 3;
  if (pathname.includes("/publish/step-4")) return 4;
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

export default function NewPublishFlow() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { organization, department } = useAuth(); // Get organization context from UnifiedAuth
  const currentStep = stepFromPath(pathname);
  const [definitionId, setDefinitionId] = useState<string | null>(null);

  // Detect if user is in a portal context (firm or council account)
  const isPortalContext = pathname.startsWith('/f/') || pathname.startsWith('/c/');

  // Firm practice area filtering
  const [firmPracticeAreas, setFirmPracticeAreas] = useState<string[] | null>(null);
  const [firmSlug, setFirmSlug] = useState<string | null>(null);
  const [practiceAreasLoading, setPracticeAreasLoading] = useState(true);
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

  const buildStepUrl = React.useCallback(
    (target: Step, overrideDraft?: string | null) => {
      // Detect if we're in a portal context and build the appropriate path
      let base: string;
      if (pathname.startsWith('/f/')) {
        // Extract firm slug and build firm portal path
        const firmMatch = pathname.match(/\/f\/([^\/]+)/);
        const firmSlug = firmMatch ? firmMatch[1] : '';
        base = `/f/${firmSlug}/publish/step-${target}`;
      } else if (pathname.startsWith('/c/')) {
        // Extract council/dept slug and build council portal path
        const councilMatch = pathname.match(/\/c\/([^\/]+)\/([^\/]+)/);
        const orgSlug = councilMatch ? councilMatch[1] : '';
        const deptSlug = councilMatch ? councilMatch[2] : '';
        base = `/c/${orgSlug}/${deptSlug}/publish/step-${target}`;
      } else {
        // Public path
        base = STEP_PATHS[target];
      }

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
    [draftId, search, pathname]
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
    // Redirect to step-1 if we're at the base publish path (no step specified)
    // Handles: /publish, /f/slug/publish, /c/org/dept/publish
    if (pathname.endsWith("/publish") || pathname === "/publish") {
      navigate(buildStepUrl(1), { replace: true });
    }
  }, [buildStepUrl, pathname, navigate]);

  useEffect(() => {
    // Redirect to step-1 if no valid step is detected
    // Handles both public and portal contexts
    if (currentStep === null && pathname.includes("/publish")) {
      navigate(buildStepUrl(1), { replace: true });
    }
  }, [buildStepUrl, currentStep, navigate, pathname]);

  // Load firm practice areas if publishing from firm context
  useEffect(() => {
    const loadFirmPracticeAreas = async () => {
      try {
        // Check if we have a firm slug in URL or session storage
        let slug: string | null = null;

        // First check if we're in a firm portal route
        const firmMatch = pathname.match(/\/f\/([^\/]+)/);
        if (firmMatch) {
          slug = firmMatch[1];
        } else {
          // Fallback to referrer
          const referrer = document.referrer;
          const referrerMatch = referrer.match(/\/f\/([^\/]+)/);
          if (referrerMatch) {
            slug = referrerMatch[1];
          } else {
            // Check session storage for last accessed firm
            const stored = sessionStorage.getItem('lastAccessedFirm');
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                slug = parsed.slug;
              } catch {
                // Ignore parse errors
              }
            }
          }
        }

        if (slug) {
          setFirmSlug(slug);

          // Load practice areas from Supabase
          const { data, error } = await supabase
            .from('organizations')
            .select('practice_areas')
            .eq('slug', slug)
            .eq('type', 'firm')
            .single();

          if (!error && data) {
            setFirmPracticeAreas(data.practice_areas || null);
          }
        }
      } catch (err) {
        console.error('Failed to load firm practice areas:', err);
      } finally {
        setPracticeAreasLoading(false);
      }
    };

    loadFirmPracticeAreas();
  }, [pathname]);

  const definition = useMemo<NoticeDefinition | null>(
    () => (definitionId ? getDefinitionById(definitionId) ?? null : null),
    [definitionId]
  );
  const [uploadMethod, setUploadMethod] = useState<UploadMethod | null>(null);
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft>(() => {
    // Check for quick publish data from firm dashboard
    const quickPublishDataStr = sessionStorage.getItem('quickPublishData');
    if (quickPublishDataStr) {
      try {
        const quickData = JSON.parse(quickPublishDataStr);
        // Clear it after reading to avoid stale data
        sessionStorage.removeItem('quickPublishData');

        // Map quick publish data to template draft format
        return {
          applicant: {
            fullName: quickData.applicantName || '',
            companyName: quickData.applicantCompany || '',
            contactEmail: quickData.applicantEmail || '',
            contactPhone: quickData.applicantPhone || '',
            serviceAddress: {
              line1: quickData.premisesAddress || '',
              postcode: quickData.premisesPostcode || ''
            }
          },
          premises: {
            name: quickData.premisesName || '',
            address: {
              line1: quickData.premisesAddress || '',
              postcode: quickData.premisesPostcode || ''
            }
          }
        };
      } catch (e) {
        console.error('Failed to parse quick publish data:', e);
      }
    }
    return null;
  });
  const [previewSource, setPreviewSource] = useState<"ocr" | "structured">("structured");
  const [guardMessage, setGuardMessage] = useState<string | null>(null);
  const [legalDetails, setLegalDetails] = useState<LegalDetails>(() => createInitialLegalDetails());
  const [legalMeta, setLegalMeta] = useState<LegalMetaMap>({});
  const [ocrHighlights, setOcrHighlights] = useState<OCRHighlight[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [selectedCouncil, setSelectedCouncil] = useState<Council | null>(null);
  const [contactEmail, setContactEmail] = useState<string>("");
  const [activeHighlightKey, setActiveHighlightKey] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<PublishNoticeResponse | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
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
  // Show form if: (1) OCR extracted text, (2) user manually entered data, OR (3) upload completed (even if OCR failed)
  const shouldShowRequiredDetails = hasNoticeUpload || hasMeaningfulManualDetails || (uploadStatus === 'ready' && uploadMethod === 'notice');

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
      // Don't auto-load sample data - let users fill it themselves or click "Load example data"
      if (method === "notice") setPreviewSource("ocr");
      if (method === "template") setPreviewSource("structured");
      if (method === "template") syncLegalDetailsToTemplate();
    },
    [syncLegalDetailsToTemplate, definition]
  );

  const handleBackToStep1 = React.useCallback(() => goToStep(1), [goToStep]);
  const handleBackToStep2 = React.useCallback(() => goToStep(2), [goToStep]);

  // Forward declaration for handleSubmit
  const handleSubmitRef = React.useRef<(() => Promise<void>) | null>(null);

  const { run: handleContinueToPayment, pending: step3Pending } = useSafeTransition(async () => {
    // For portal users (firm/council accounts), skip payment and submit directly
    if (isPortalContext) {
      console.log('[NewPublishFlow] Portal context detected - submitting directly without payment step');
      if (handleSubmitRef.current) {
        await handleSubmitRef.current();
      }
    } else {
      // For public users, go to payment step
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
    if (!builder || !templateDraft) {
      console.log('[NewPublishFlow] templateNotice=null: missing builder or draft', { hasBuilder: !!builder, hasDraft: !!templateDraft });
      return null;
    }
    try {
      // Ensure variant is always set
      const draftWithVariant = { ...templateDraft, variant: definition?.id || 'licensing-premises-new' };

      // Try to parse, but if it fails, still try to map with partial data
      const parseResult = builder.schema.safeParse(draftWithVariant);
      if (parseResult.success) {
        console.log('[NewPublishFlow] templateNotice: validation SUCCESS');
        return builder.mapToNoticeBase(parseResult.data);
      } else {
        console.log('[NewPublishFlow] templateNotice: validation FAILED, errors:', parseResult.error.issues);
        console.log('[NewPublishFlow] Draft data:', draftWithVariant);

        // Validation failed - this means required fields are missing
        // Return null so the Continue button stays disabled until fields are filled
        return null;
      }
    } catch (err) {
      console.error('[NewPublishFlow] templateNotice: unexpected error', err);
      return null;
    }
  }, [builder, templateDraft, definition?.id]);

  const [templateText, setTemplateText] = useState("");
  const [templateInfo, setTemplateInfo] = useState<TemplateRenderResult | null>(null);

  // Draft generation state
  const [draftGenerating, setDraftGenerating] = useState(false);
  const [draftSuggestions, setDraftSuggestions] = useState<string[]>([]);

  // Handle draft generation from template data
  const handleGenerateDraft = React.useCallback(async () => {
    if (!templateNotice) return;

    setDraftGenerating(true);
    setDraftSuggestions([]);

    try {
      const response = await fetch('/api/drafting/from-notice-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateNotice),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate draft');
      }

      const result = await response.json();

      if (result.success && result.draftText) {
        // Update the template text with the generated draft
        setTemplateText(result.draftText);

        // Store suggestions if any
        if (result.suggestions && result.suggestions.length > 0) {
          setDraftSuggestions(result.suggestions);
        }

        toast('Draft text generated successfully');
      } else {
        toast('Could not generate draft text');
      }
    } catch (error) {
      console.error('[NewPublishFlow] Draft generation error:', error);
      toast('Failed to generate draft text');
    } finally {
      setDraftGenerating(false);
    }
  }, [templateNotice]);

  // Render notice text with custom template support
  useEffect(() => {
    if (!templateNotice) {
      setTemplateText("");
      setTemplateInfo(null);
      return;
    }

    let cancelled = false;

    const renderText = async () => {
      try {
        // Get department ID from template draft (populated by CouncilDepartmentSelect)
        let departmentId = templateDraft?.DEPARTMENT_ID as string | undefined;

        // Auto-detect department ID from authority name if user typed council name without selecting from dropdown
        // This works for ANY council, not just Westminster
        if (!departmentId && templateDraft?.AUTHORITY_NAME && definition?.category) {
          const authorityName = String(templateDraft.AUTHORITY_NAME).trim();
          const departmentType = getDepartmentTypeForCategory(definition.category);

          console.log('[NewPublishFlow] 🔍 Auto-detecting department from authority name...');
          console.log('[NewPublishFlow] Authority Name:', authorityName);
          console.log('[NewPublishFlow] Notice Category:', definition.category);
          console.log('[NewPublishFlow] Expected Department Type:', departmentType);

          try {
            // Search for council by name, filtering to the correct department type for this notice category
            const { data, error } = await supabase
              .from('organizations')
              .select('id, name, departments!inner(id, type, name)')
              .ilike('name', `%${authorityName}%`)
              .eq('departments.type', departmentType)
              .eq('type', 'council')
              .limit(1)
              .single();

            console.log('[NewPublishFlow] Council lookup result:', { data, error });

            if (error) {
              console.log('[NewPublishFlow] Council lookup returned no exact match, trying broader search...');
              // Try a broader search - maybe user typed partial name like "Westminster" instead of "Westminster City Council"
              // Extract key words from the authority name (remove common words like "City", "Council", "Borough")
              const keyWords = authorityName
                .replace(/\b(city|council|borough|of|the|metropolitan|district|county)\b/gi, '')
                .trim()
                .split(/\s+/)
                .filter(w => w.length > 2)
                .join('%');

              if (keyWords) {
                const { data: broaderData, error: broaderError } = await supabase
                  .from('organizations')
                  .select('id, name, departments!inner(id, type, name)')
                  .ilike('name', `%${keyWords}%`)
                  .eq('departments.type', departmentType)
                  .eq('type', 'council')
                  .limit(1)
                  .single();

                if (!broaderError && broaderData?.departments && Array.isArray(broaderData.departments) && broaderData.departments.length > 0) {
                  departmentId = broaderData.departments[0].id;
                  console.log('[NewPublishFlow] ✅ Auto-detected department ID from broader search:', departmentId);
                  console.log('[NewPublishFlow] Matched council:', broaderData.name);
                  console.log('[NewPublishFlow] Matched department:', broaderData.departments[0].name);
                } else {
                  // Task 7.1: Inform user that council-specific template couldn't be found
                  console.warn('[NewPublishFlow] ⚠️ No council found matching:', authorityName);
                  // Note: We don't show a toast here since this is a common scenario when user
                  // types a council name not in the database - they'll still get the default template
                }
              }
            } else if (data?.departments && Array.isArray(data.departments) && data.departments.length > 0) {
              departmentId = data.departments[0].id;
              console.log('[NewPublishFlow] ✅ Auto-detected department ID:', departmentId);
              console.log('[NewPublishFlow] Matched council:', data.name);
              console.log('[NewPublishFlow] Matched department:', data.departments[0].name);
            } else {
              console.warn('[NewPublishFlow] ⚠️ Council found but no', departmentType, 'department');
            }
          } catch (err) {
            // Task 7.1: Handle council lookup exceptions gracefully
            console.error('[NewPublishFlow] ❌ Exception during council lookup:', err);
            // Don't crash - will use default template instead
          }
        } else if (departmentId) {
          console.log('[NewPublishFlow] Using department ID from dropdown selection:', departmentId);
        } else {
          console.log('[NewPublishFlow] Auto-detection skipped (no authority name or category):', {
            hasDepartmentId: !!departmentId,
            hasAuthorityName: !!templateDraft?.AUTHORITY_NAME,
            hasCategory: !!definition?.category
          });
        }

        // CRITICAL FIX: Use definition.id (e.g. 'licensing-premises-new') instead of templateNotice.noticeType
        // templateNotice.noticeType contains the display name like "Premises Licence — New"
        // but the database stores the ID like "licensing-premises-new"
        const noticeTypeId = definition?.id || 'licensing-premises-new';

        console.log('[NewPublishFlow] Rendering notice with custom template service');
        console.log('[NewPublishFlow] Department ID:', departmentId);
        console.log('[NewPublishFlow] Notice Type ID:', noticeTypeId);
        console.log('[NewPublishFlow] Authority Name:', templateDraft?.AUTHORITY_NAME);

        // Use the template service which handles custom templates and fallback
        const result = await renderNoticeWithTemplateInfo(templateNotice, departmentId, noticeTypeId);

        if (!cancelled) {
          setTemplateText(result.text);
          setTemplateInfo(result);
          console.log('[NewPublishFlow] Template info:', {
            isCustomTemplate: result.isCustomTemplate,
            templateName: result.templateName,
          });
        }
      } catch (err) {
        console.error('[NewPublishFlow] Error rendering template text:', err);
        if (!cancelled) {
          // Fallback to default renderer with user notification
          // Task 7.1: Notify user of template rendering issue
          toast("Using default template format. Custom template could not be loaded.");
          if (templateRenderer) {
            try {
              setTemplateText(templateRenderer.renderText(templateNotice) ?? "");
              setTemplateInfo({ text: '', isCustomTemplate: false });
            } catch {
              setTemplateText("");
              setTemplateInfo(null);
            }
          } else {
            setTemplateText("");
            setTemplateInfo(null);
          }
        }
      }
    };

    renderText();

    return () => {
      cancelled = true;
    };
  }, [templateNotice, templateRenderer, templateDraft, definition]);

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
      // Callbacks for Load Sample Data button to populate legalDetails
      onDetailChange: handleDetailChange,
      onCouncilSelect: handleCouncilSelect,
      setLegalDetails,
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
      handleDetailChange,
      handleCouncilSelect,
      setLegalDetails,
    ]
  );

  // Calculate missing mandatory fields for blueprint-driven forms (both notice and template)
  const blueprintMissingCount = React.useMemo(() => {
    if (!uploadMethod || !definition) return 0;
    const blueprint = getMandatoryFieldsForOCR(definition);
    let count = 0;

    // Flatten all fields from all sections
    const allFields = blueprint.sections?.flatMap(section => section.fields) || [];

    for (const field of allFields) {
      if (field.required) {
        const raw = templateDraft?.[field.token];
        const value = typeof raw === "string" ? raw : typeof raw === "number" ? String(raw) : "";
        const fieldErrors = (templateFieldErrors as Record<string, string[] | undefined>)[field.token];
        const hasError = fieldErrors && fieldErrors.length > 0;
        if (!value || hasError) {
          count++;
        }
      }
    }

    console.log('[NewPublishFlow] blueprintMissingCount:', count, 'for', definition.id);
    return count;
  }, [uploadMethod, definition, templateDraft, templateFieldErrors]);

  const isValidEmail = (email: string) => {
    return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const continueDisabledStep2 =
    uploadMethod === "notice"
      ? blueprintMissingCount > 0 || !hasDraft || !isValidEmail(contactEmail)
      : uploadMethod === "template"
      ? blueprintMissingCount > 0 || !isValidEmail(contactEmail) || !templateNotice  // Enable only when schema validation passes and email is valid
      : true;

  const formatRelativeTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  // Create a setValue function for the template form to enable auto-population
  const setTemplateValue = React.useCallback((token: string, value: string) => {
    updateTemplateDraftPath([token], value);
  }, [updateTemplateDraftPath]);

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
          setValue={setTemplateValue}
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
    console.log('[NewPublishFlow] UPDATED - rightRail - definition:', definition?.id, 'uploadMethod:', uploadMethod);
    if (!definition) {
      console.log('[NewPublishFlow] rightRail returning null - no definition');
      return null;
    }

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

    // Get extracted OCR text for display
    const extractedOcrText = String((templateDraft as any)?.ocrText ?? "");
    const hasExtractedText = extractedOcrText.trim().length > 0;

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
          ) : hasExtractedText ? (
            <LazyNoticePreview
              text={extractedOcrText}
              highlights={undefined}
              activeHighlight={null}
              onHighlightClick={undefined}
            />
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-medium text-amber-900 mb-1">⚠️ No text extracted</p>
              <p className="text-xs text-amber-700">
                The document was uploaded but text extraction failed or returned empty. Please complete the form fields manually below.
              </p>
            </div>
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
          <div className="space-y-3">
            {/* Template indicator - shows whether using custom council template or default */}
            {templateInfo && (
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                  templateInfo.isCustomTemplate
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                {templateInfo.isCustomTemplate ? (
                  <>
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Using council template: <strong>{templateInfo.templateName}</strong></span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Using default template</span>
                  </>
                )}
              </div>
            )}
            <LazyNoticePreview text={templateText} />
          </div>
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

    // Transform compliance items for ReviewCard (OCR mode only)
    const reviewComplianceItems = uploadMethod === "notice"
      ? legalValidation.statuses.map((status) => ({
          key: status.key,
          label: status.label,
          status: status.status,
        }))
      : [];

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
            <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
              {uploadMethod === "notice" && hasExtractedText ? "Extracted Text" : "Preview"}
            </h3>
            {uploadMethod === "notice" && <PreviewTabs source={previewSource} onSource={setPreviewSource} />}
          </div>
          <div className="rounded-xl border border-slate-200/30 bg-slate-50/50 p-3 shadow-inner transition-opacity duration-200">
            {previewContent}
          </div>
        </section>

        {uploadMethod === "notice" ? (
          <ReviewCard
            complianceItems={reviewComplianceItems}
            keyDates={reviewKeyDates}
            detections={reviewDetections}
            onItemClick={(key) => focusField(key as RequiredFieldKey | RecommendedFieldKey)}
            recommendedWarnings={legalValidation.recommendedWarnings}
          />
        ) : uploadMethod === "template" && definition ? (
          (() => {
            console.log('[NewPublishFlow] RENDERING CHECKLIST - uploadMethod:', uploadMethod, 'definition:', definition?.id);
            return (
          <section className="rounded-2xl border border-slate-200/40 bg-white/50 p-4 shadow-none backdrop-blur-sm md:p-5">
            <div className="mb-3">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Template Fields</h3>
            </div>
            <div className="space-y-2">
              {(() => {
                const blueprint = getMandatoryFieldsForOCR(definition);
                // Flatten all fields from all sections
                const fields = blueprint?.sections?.flatMap(section => section.fields) || [];
                console.log('[NewPublishFlow] Rendering template checklist - fields:', fields.length, 'definition:', definition.id);

                // Create array with contact email as first item, then all template fields
                const allItems = [
                  // Contact email field (always first)
                  {
                    isEmail: true,
                    label: 'Confirmation email',
                    required: true,
                    hasValue: isValidEmail(contactEmail),
                    hasError: false,
                  },
                  // Then all template fields
                  ...fields.map(field => ({
                    isEmail: false,
                    field,
                    label: field.label,
                    required: field.required,
                    hasValue: (() => {
                      const value = templateDraft?.[field.token];
                      return value && String(value).trim().length > 0;
                    })(),
                    hasError: (() => {
                      const fieldErrors = (templateFieldErrors as Record<string, string[] | undefined>)[field.token];
                      return fieldErrors && fieldErrors.length > 0;
                    })(),
                  }))
                ];

                return allItems.map((item, idx) => {
                  const { hasValue, hasError, label, required } = item;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 rounded-lg border p-2 text-xs transition-colors ${
                        hasValue && !hasError
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-red-200 bg-red-50/50'
                      }`}
                    >
                      {hasValue && !hasError ? (
                        <svg className="h-4 w-4 flex-shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 flex-shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={hasValue && !hasError ? 'text-emerald-800 font-medium' : 'text-red-800'}>
                        {label}
                        {required && <span className="ml-1 text-red-500">*</span>}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </section>
            );
          })()
        ) : (
          (() => {
            console.log('[NewPublishFlow] NOT RENDERING CHECKLIST - uploadMethod:', uploadMethod, 'definition:', definition?.id);
            return null;
          })()
        )}
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
    templateParse,
    templateFieldErrors,
    contactEmail,
  ]);

  const { run: handleSubmit, pending: paymentPending } = useSafeTransition(async () => {
    try {
      // Check if user is authenticated (for Phase 5 firm publishing)
      const { data: { session } } = await supabase.auth.getSession();

      // Use Phase 5 flow when:
      // 1. User is in a portal context (/f/ or /c/) OR
      // 2. User is authenticated (logged in firm/council)
      // Anonymous public users at /publish will use legacy flow
      const usePhase5Flow = !!session;

      let noticeData: any;

      console.log('[🔥 NewPublishFlow PUBLISH DEBUG] uploadMethod:', uploadMethod);
      console.log('[🔥 NewPublishFlow PUBLISH DEBUG] templateNotice:', templateNotice ? 'EXISTS' : 'NULL');
      console.log('[🔥 NewPublishFlow PUBLISH DEBUG] templateDraft keys:', templateDraft ? Object.keys(templateDraft) : 'NULL');
      console.log('[🔥 NewPublishFlow PUBLISH DEBUG] templateDraft sample:', templateDraft ? {
        APPLICANT_NAME: templateDraft.APPLICANT_NAME,
        PREMISES_NAME: templateDraft.PREMISES_NAME,
        PREMISES_ADDRESS: templateDraft.PREMISES_ADDRESS,
        AUTHORITY_NAME: templateDraft.AUTHORITY_NAME,
        DEPARTMENT_ID: templateDraft.DEPARTMENT_ID,
      } : 'NULL');

      if (uploadMethod === "template" && templateNotice) {
        // Publishing from template builder
        // IMPORTANT: Pass raw template draft as extras.tokens so generateNoticeText() can use it
        console.log('[🔥 NewPublishFlow PUBLISH DEBUG] ✅ Using template branch - tokens will be:', templateDraft);
        noticeData = {
          premises: templateNotice.premises || {},
          applicant: templateNotice.applicant || {},
          consultation: templateNotice.consultation || {},
          extras: {
            ...(templateNotice.extras || {}),
            tokens: templateDraft || {}, // Raw template fields (PREMISES_NAME, APPLICANT_NAME, etc.)
          },
        };
      } else if (uploadMethod === "notice") {
        // Publishing from OCR upload
        const fullAddress = [
          legalDetails.premisesLine1,
          legalDetails.premisesLine2,
          legalDetails.premisesCity,
          legalDetails.premisesPostcode
        ].filter(Boolean).join(", ");

        // Build template tokens from structured form data for custom template rendering
        const templateTokens = {
          APPLICANT_NAME: legalDetails.applicantName || "",
          APPLICANT_ADDRESS: "", // TODO: Add if available
          PREMISES_NAME: legalDetails.premisesName || "",
          PREMISES_ADDRESS: fullAddress || "",
          APPLICATION_DATE: new Date().toISOString().split('T')[0],
          DEADLINE_DATE: legalDetails.representationDeadline || "",
          PUBLICATION_DATE: new Date().toISOString().split('T')[0],
          LICENSABLE_ACTIVITIES: legalDetails.activities?.join(', ') || "Not specified",
          ACTIVITY_SCHEDULE: "Not specified", // TODO: Add if available
          OPERATING_HOURS: "Not specified", // TODO: Add if available
          DPS_NAME: "", // TODO: Add if available
          DPS_LICENSING_AUTHORITY: "", // TODO: Add if available
          REPRESENTATION_ADDRESS: "", // TODO: Add if available
          INSPECTION_LOCATION: "", // TODO: Add if available
          INSPECTION_HOURS: "", // TODO: Add if available
          ONLINE_REGISTER_URL: "", // TODO: Add if available
          RESPONSIBLE_AUTHORITIES_LIST_URL: "", // TODO: Add if available
          ...templateDraft, // Merge with any existing template tokens
        };

        noticeData = {
          premises: {
            name: legalDetails.premisesName || "",
            address: fullAddress,
          },
          applicant: {
            name: legalDetails.applicantName || "",
            email: legalDetails.contactEmail || "",
          },
          consultation: {
            repsDeadline: legalDetails.representationDeadline || null,
          },
          extras: {
            ocrText: ocrText || "",
            applicationType: legalDetails.applicationType || null,
            activities: legalDetails.activities || [],
            tokens: templateTokens, // Include mapped template tokens for custom template rendering
          },
        };
      } else {
        console.log('[🔥 NewPublishFlow PUBLISH DEBUG] ❌ ELSE BRANCH - neither template nor notice upload!');
        console.log('[🔥 NewPublishFlow PUBLISH DEBUG] uploadMethod:', uploadMethod);
        console.log('[🔥 NewPublishFlow PUBLISH DEBUG] templateNotice:', templateNotice);
        console.log('[🔥 NewPublishFlow PUBLISH DEBUG] templateDraft:', templateDraft);
        toast("Please complete the form before submitting");
        return;
      }

      if (usePhase5Flow && session) {
        // Phase 5: Authenticated firm publishing (goes live immediately with billing)
        const { publishNotice } = await import("@/lib/notices");

        // Prefer organization context from UnifiedAuth if available, otherwise use draft
        let councilId: string | null = null;
        let departmentId: string | null = null;
        let councilName = "Unknown Council";

        // First try to use context from UnifiedAuth (for logged-in firms)
        if (organization?.id && department?.id) {
          console.log("[NewPublishFlow] Using organization context from UnifiedAuth");
          councilId = organization.id;
          departmentId = department.id;
          councilName = organization.name || "Unknown Council";
        } else {
          // Fallback to draft department ID (from dropdown selection)
          const draftDepartmentId = templateDraft?.DEPARTMENT_ID;

          if (!draftDepartmentId) {
            toast("Please select a licensing authority (e.g., Westminster City Council)");
            return;
          }

          console.log("[NewPublishFlow] Looking up department and council for:", draftDepartmentId);

          // Query Supabase to get both department and its organization (council)
          const { data: deptData, error: deptError } = await supabase
            .from('departments')
            .select('id, organization_id, organizations(id, name)')
            .eq('id', draftDepartmentId)
            .single();

          if (deptError || !deptData) {
            console.error("[NewPublishFlow] Department lookup failed:", deptError);
            toast("Failed to find licensing authority. Please try selecting it again from the dropdown.");
            return;
          }

          councilId = deptData.organization_id;
          departmentId = deptData.id;
          councilName = (deptData as any).organizations?.name || "Unknown Council";
        }

        console.log("[NewPublishFlow] Publishing to:", { councilName, councilId, departmentId });

        const result = await publishNotice(
          {
            target_council_id: councilId,
            target_department_id: departmentId,
            notice_data: noticeData,
            notice_type: definition?.id || "premises-licence",
            title: legalDetails.premisesName || "Licensing Application",
            // billing_amount calculated automatically by database trigger based on subscription tier
          },
          session.access_token
        );

        console.info("✓ Notice published with ID:", result.notice.id);

        // Show Phase 5 success modal
        setPublishResult(result);
        setShowSuccessModal(true);
      } else {
        // Legacy flow: Direct database insert (for testing/councils)
        const { submitNotice } = await import("@/lib/notices");

        console.log("[NewPublishFlow] Publishing via legacy endpoint (no auth)...");

        // Determine department and organization IDs
        // Priority: 1) UnifiedAuth context, 2) templateDraft.DEPARTMENT_ID from dropdown selection
        let legacyDepartmentId: string | null = department?.id || null;
        let legacyOrganizationId: string | null = organization?.id || null;

        // If no context IDs but user selected a council from dropdown, use that
        const draftDeptId = templateDraft?.DEPARTMENT_ID as string | undefined;
        if (!legacyDepartmentId && draftDeptId) {
          legacyDepartmentId = draftDeptId;
          console.log("[NewPublishFlow] Using department_id from template dropdown:", legacyDepartmentId);

          // Look up the organization_id for this department
          const { data: deptData } = await supabase
            .from('departments')
            .select('organization_id')
            .eq('id', legacyDepartmentId)
            .single();

          if (deptData?.organization_id) {
            legacyOrganizationId = deptData.organization_id;
            console.log("[NewPublishFlow] Resolved organization_id:", legacyOrganizationId);
          }
        }

        // Transform data to match submitNotice payload
        const payload = {
          notice_type: definition?.id || "premises-licence",
          status: "published",
          contact_email: contactEmail, // Email for confirmation (from Step 2)
          applicant: noticeData.applicant || {},
          premises: noticeData.premises || {},
          consultation: noticeData.consultation || {},
          extras: noticeData.extras || {},
          // Include organization context - from auth context or template dropdown
          organization_id: legacyOrganizationId,
          department_id: legacyDepartmentId,
        };

        console.log("[NewPublishFlow] Legacy publish payload department_id:", payload.department_id);

        const result = await submitNotice(payload);

        console.info("✓ Notice submitted with ID:", result.id);

        // Show simple success message (no magic link or billing for legacy flow)
        toast("✓ Notice published successfully!");

        // Navigate to confirmation page
        if (result.id) {
          navigate(`/notices/${result.id}/confirmation?published=true`);
        } else {
          navigate("/dashboard");
        }
      }

    } catch (error: any) {
      console.error("✗ Failed to publish notice:", error);

      // Provide specific error messages based on error type
      let errorMsg: string;

      // Check for specific error scenarios
      if (error.message?.includes('Stripe') || error.message?.includes('payment')) {
        errorMsg = "Payment configuration error. Please contact support to complete your submission.";
      } else if (error.message?.includes('validation')) {
        errorMsg = "Some required fields are missing or invalid. Please check your details and try again.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMsg = "Network error. Please check your connection and try again.";
      } else if (error.status === 400) {
        errorMsg = "Invalid submission data. Please review your information and try again.";
      } else if (error.status === 500) {
        errorMsg = "Server error. Our team has been notified. Please try again later.";
      } else if (error.message?.includes('Supabase configuration')) {
        errorMsg = "Database configuration error. Please contact support.";
      } else {
        // Fallback to original error message or generic
        errorMsg = error.message || "Failed to publish notice. Please try again.";
      }

      toast("✗ " + errorMsg);
    }
  });

  // Assign handleSubmit to ref so handleContinueToPayment can call it for portal users
  React.useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

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
        {/* Hero Band with Integrated Stepper - Only show in public context */}
        {!isPortalContext && (
          <section className="relative overflow-hidden pb-8 pt-12 md:pb-12 md:pt-16">
            <div className="absolute -right-16 -top-16 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-300/10 blur-3xl" />

            <div className={`${UI.container} relative z-10`}>
              <div className="mx-auto max-w-4xl text-center">
                <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)] md:text-5xl lg:text-6xl">
                  Publish with calm,
                  <br />
                  compliant confidence
                </h1>
                <p className="mt-6 text-base leading-relaxed text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.12)] md:text-lg">
                  Start by choosing your notice type. We'll tailor everything automatically.
                </p>

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
        )}

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
              practiceAreas={firmPracticeAreas}
              settingsUrl={firmSlug ? `/f/${firmSlug}/settings` : undefined}
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
                  email={contactEmail}
                  onEmailChange={setContactEmail}
                />
              </div>
              {uploadMethod === "notice" && shouldShowRequiredDetails && (
                <ProgressBar
                  completed={legalValidation.statuses.filter((s) => s.status === 'found').length}
                  total={legalValidation.statuses.length}
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
              onContinue={handleContinueToPayment}
              continueDisabled={(uploadMethod === "template" && !templateNotice) || !hasDraft}
              continuePending={step3Pending}
              ocrText={uploadMethod === "notice" ? ocrText : undefined}
              onOcrTextChange={uploadMethod === "notice" ? handleOcrTextChange : undefined}
              isPortalContext={isPortalContext}
              legalDetails={uploadMethod === "notice" ? legalDetails as Record<string, unknown> : undefined}
              onGenerateDraft={uploadMethod === "template" ? handleGenerateDraft : undefined}
              draftGenerating={draftGenerating}
              draftSuggestions={draftSuggestions}
              preview={
                <div className="rounded-xl border border-slate-200 p-3 space-y-3">
                  {/* Template indicator for Step 3 - only show when using template mode */}
                  {uploadMethod === "template" && templateInfo && (
                    <div
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                        templateInfo.isCustomTemplate
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {templateInfo.isCustomTemplate ? (
                        <>
                          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Using council template: <strong>{templateInfo.templateName}</strong></span>
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Using default template</span>
                        </>
                      )}
                    </div>
                  )}
                  <React.Suspense
                    fallback={
                      <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                        Loading preview…
                      </div>
                    }
                  >
                    <LazyEditableNoticePreview
                      text={
                        uploadMethod === "template"
                          ? templateText
                          : String((templateDraft as any)?.ocrText ?? "")
                      }
                      onTextChange={(newText) => {
                        if (uploadMethod === "notice") {
                          handleOcrTextChange(newText);
                        } else if (uploadMethod === "template" && templateDraft) {
                          // Update template text - you may need to add this handler
                          setTemplateText(newText);
                        }
                      }}
                      editable={true}
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
              firmSlug={firmSlug}
            />
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Phase 5: Success Modal */}
      {showSuccessModal && publishResult && (
        <PublishSuccessModal
          notice={publishResult.notice}
          magicLink={publishResult.magicLink}
          onClose={() => {
            setShowSuccessModal(false);
            navigate("/dashboard");
          }}
        />
      )}
    </WizardBoundary>
  );
}

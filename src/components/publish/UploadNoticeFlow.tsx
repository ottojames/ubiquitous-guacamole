import React, { useEffect, useState } from 'react';
import ProgressBar from './ProgressBar';
import FileDropOCR from '@/components/upload/FileDropOCR';
import CouncilSelect, { type Council } from '@/components/CouncilSelect';
// {/* CN:LICENSING-FINAL-START */}
import PreviewNotice from '@/features/publish/PreviewNotice';
import ComplianceCard from '@/components/publish/RightRail/ComplianceCard';
import KeyDatesCard from '@/components/publish/RightRail/KeyDatesCard';
import CostCard from '@/components/publish/RightRail/CostCard';
import AddressSearch from '@/components/address/AddressSearch';
import { lookupCouncilByPostcode } from '@/lib/councilLookup';
import { runMandatoryChecks, calcRepsDeadline } from '@/lib/licensing/checks';
/* CN:STEP2-START */
import { calculateRepresentationDeadline } from '@/lib/dates/licensing';
/* CN:STEP2-COMPLIANCE-START */
import { formatDisplayDate } from '@/lib/format';
import { getAuthorityByName, emailDomainMatchesAuthority } from '@/lib/authorities';
/* CN:OFFICER-FINAL-START */
import { extractDeadlineFromOcr, normalizeUKPostcode } from '@/lib/text/extract';
import { buildPremisesNotice, buildVariationNotice, buildReviewNotice } from '@/features/publish/previewBuilders';
/* CN:OFFICER-FINAL-END */
// {/* CN:LICENSING-FINAL-END */}
/* CN:STEP2-COMPLIANCE-END */
/* CN:STEP2-END */
import * as UI from '@/styles/ui';
import type { NoticeDraft, NoticeType } from '@/types/notice';
import { sha256Hex } from '@/lib/hash';
import ConfirmNotice from '@/components/publish/ConfirmNotice';
/* CN:STEP1-START */
import NoticeTypeStep, { isLicensingNoticeType } from './sections/NoticeTypeStep';
/* CN:STEP1-END */

/* CN:STEP2-START */
type NoticeFieldRefs = {
  applicant?: React.RefObject<HTMLInputElement>;
  premisesAddress?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  councilName?: React.RefObject<HTMLInputElement>;
  councilEmail?: React.RefObject<HTMLInputElement>;
  councilAddress?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  applicationDate?: React.RefObject<HTMLInputElement>;
};
/* CN:STEP2-END */

/* CN:STEP2-LAYOUT-START */
function focusAndFlash(id: string) {
  const el = document.getElementById(id) as HTMLElement | null;
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  (el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).focus?.();
  el.classList.add('outline', 'outline-2', 'outline-blue-300');
  setTimeout(() => {
    el.classList.remove('outline', 'outline-2', 'outline-blue-300');
  }, 700);
}
/* CN:STEP2-LAYOUT-END */

function toMultilineAddress(parts: Array<string | undefined | null>): string {
  return parts
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join('\n');
}

async function resolveAddressById(id: string) {
  const response = await fetch(`/api/address/resolve?id=${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(`resolve failed: ${response.status}`);
  const payload = await response.json();
  if (!payload?.ok || !payload?.result) {
    throw new Error(payload?.error || 'bad resolve payload');
  }
  return payload.result as {
    id: string;
    label: string;
    line1: string;
    line2: string;
    line3: string;
    city: string;
    postcode: string;
  };
}

export default function UploadNoticeFlow() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  // {/* CN:LICENSING-FINAL-START */}
  const [ocrText, setOcrText] = useState('');
  // {/* CN:LICENSING-FINAL-END */}
  const [draft, setDraft] = useState<NoticeDraft>({
    id: '',
    createdAt: '',
    noticeType: undefined,
    applicantName: '',
    applicantEmail: '',
    /* CN:STEP2-START */
    urn: '',
    /* CN:STEP2-END */
    premisesAddress: '',
    postcode: '',
    councilName: '',
    councilEmail: '',
    councilAddress: '',
    isCouncilEmailLocked: false,
    blueNoticeUploads: [],
    status: 'Draft',
    applicationDate: '',
    /* CN:TEMPLATES-PREVIEW-START */
    /* CN:LICENSING-TEMPLATES-START */
    applicationSummary: '',
    variationSummary: '',
    reviewGrounds: '',
    finalText: '',
    /* CN:LICENSING-TEMPLATES-END */
    /* CN:TEMPLATES-PREVIEW-END */
  });
  const [hasConfirmedNotice, setHasConfirmedNotice] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const applicantRef = React.useRef<HTMLInputElement>(null);
  /* CN:STEP2-START */
  const premisesAddressRef = React.useRef<HTMLTextAreaElement | null>(null);
  const councilNameRef = React.useRef<HTMLInputElement>(null);
  const councilEmailRef = React.useRef<HTMLInputElement>(null);
  const councilAddressRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const applicationDateRef = React.useRef<HTMLInputElement>(null);
  const focusPremisesTextarea = React.useCallback(() => {
    const el = premisesAddressRef.current;
    if (!el) return;
    el.focus();
    const end = el.value.length;
    try {
      el.setSelectionRange(end, end);
    } catch {
      /* noop for unsupported UAs */
    }
  }, []);
  const refs: NoticeFieldRefs = {
    applicant: applicantRef,
    premisesAddress: premisesAddressRef,
    councilName: councilNameRef,
    councilEmail: councilEmailRef,
    councilAddress: councilAddressRef,
    applicationDate: applicationDateRef,
  };
  /* CN:STEP2-END */
  /* CN:TEMPLATES-PREVIEW-START */
  /* CN:LICENSING-TEMPLATES-START */
  // {/* CN:LICENSING-FINAL-START */}
  const hasOcrText = ocrText.trim().length > 0;
  const needsApplicationSummary =
    !hasOcrText && (draft.noticeType === 'premises' || draft.noticeType === 'variation');
  const needsVariationSummary = !hasOcrText && draft.noticeType === 'variation';
  const needsReviewGrounds = !hasOcrText && draft.noticeType === 'review';
  // {/* CN:LICENSING-FINAL-END */}
  /* CN:OFFICER-FINAL-START */
  const [ignoreOcrDeadlineConflict, setIgnoreOcrDeadlineConflict] = React.useState(false);
  const previewAuthority = React.useMemo(() => getAuthorityByName(draft.councilName), [draft.councilName]);
  const representationDeadlineDate = React.useMemo(() => {
    if (draft.repsDeadline) {
      const parsed = new Date(draft.repsDeadline);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    if (!draft.applicationDate) return null;
    const computed = calculateRepresentationDeadline(draft.applicationDate);
    return Number.isNaN(computed.getTime()) ? null : computed;
  }, [draft.applicationDate, draft.repsDeadline]);
  const ocrDeadline = React.useMemo(() => extractDeadlineFromOcr(ocrText), [ocrText]);
  const deadlinesConflict = React.useMemo(() => {
    if (!ocrDeadline || !representationDeadlineDate) return false;
    const key = (value: Date) => new Date(value).toISOString().slice(0, 10);
    return key(ocrDeadline) !== key(representationDeadlineDate);
  }, [ocrDeadline, representationDeadlineDate]);
  const showDeadlineWarning = deadlinesConflict && !ignoreOcrDeadlineConflict;
  React.useEffect(() => {
    setIgnoreOcrDeadlineConflict(false);
  }, [ocrText, draft.applicationDate]);
  const structuredReplacement = React.useMemo(() => {
    if (!draft.noticeType) return '';
    const representationIso = representationDeadlineDate ? representationDeadlineDate.toISOString() : '';
    const builderState = { ...draft, representationDeadline: representationIso };
    if (draft.noticeType === 'variation') {
      return buildVariationNotice(builderState, previewAuthority, { includeSummaries: true });
    }
    if (draft.noticeType === 'review') {
      return buildReviewNotice(builderState, previewAuthority, { includeSummaries: true });
    }
    return buildPremisesNotice(builderState, previewAuthority, { includeSummaries: true });
  }, [draft, previewAuthority, representationDeadlineDate]);

  const confirmNoticeText = React.useMemo(() => {
    const trimmedFinal = (draft.finalText || '').trim();
    if (trimmedFinal) return trimmedFinal;
    return structuredReplacement.trim();
  }, [draft.finalText, structuredReplacement]);

  const previousConfirmNoticeText = React.useRef(confirmNoticeText);

  useEffect(() => {
    if (step !== 3) {
      setHasConfirmedNotice(false);
      previousConfirmNoticeText.current = confirmNoticeText;
      return;
    }
    if (previousConfirmNoticeText.current !== confirmNoticeText) {
      setHasConfirmedNotice(false);
      previousConfirmNoticeText.current = confirmNoticeText;
    }
  }, [step, confirmNoticeText]);
  const handleUseCalculatedDeadline = React.useCallback(() => {
    const replacement = structuredReplacement.trim();
    if (replacement) {
      setOcrText(replacement);
      setDraft((prev) => ({ ...prev, finalText: replacement }));
    }
    setIgnoreOcrDeadlineConflict(true);
  }, [setDraft, setIgnoreOcrDeadlineConflict, setOcrText, structuredReplacement]);
  const handleKeepOcrDeadline = React.useCallback(() => {
    setIgnoreOcrDeadlineConflict(true);
  }, [setIgnoreOcrDeadlineConflict]);
  const handleViewOcrDeadline = React.useCallback(() => {
    const preview = document.getElementById('notice-preview');
    if (!preview) return;
    preview.scrollIntoView({ behavior: 'smooth', block: 'center' });
    preview.classList.add('outline', 'outline-2', 'outline-amber-400');
    setTimeout(() => {
      preview.classList.remove('outline', 'outline-2', 'outline-amber-400');
    }, 700);
  }, []);
  /* CN:OFFICER-FINAL-END */

  const summariesOk =
    (!needsApplicationSummary || !!draft.applicationSummary?.trim()) &&
    (!needsVariationSummary || !!draft.variationSummary?.trim()) &&
    (!needsReviewGrounds || !!draft.reviewGrounds?.trim());
  /* CN:LICENSING-TEMPLATES-END */
  /* CN:TEMPLATES-PREVIEW-END */

  const requiredOk =
    draft.applicantName.trim() &&
    draft.premisesAddress.trim() &&
    draft.postcode.trim() &&
    draft.councilName.trim() &&
    draft.councilEmail.trim() &&
    draft.councilAddress.trim() &&
    draft.applicationDate.trim() &&
    /* CN:TEMPLATES-PREVIEW-START */
    /* CN:LICENSING-TEMPLATES-START */
    summariesOk;
    /* CN:LICENSING-TEMPLATES-END */
    /* CN:TEMPLATES-PREVIEW-END */
  /* CN:STEP2-LAYOUT-START */
  const requiredFields = [
    draft.applicantName,
    draft.premisesAddress,
    draft.postcode,
    draft.councilName,
    draft.councilEmail,
    draft.councilAddress,
    draft.applicationDate,
  ];
  /* CN:TEMPLATES-PREVIEW-START */
  /* CN:LICENSING-TEMPLATES-START */
  if (needsApplicationSummary) requiredFields.push(draft.applicationSummary);
  if (needsVariationSummary) requiredFields.push(draft.variationSummary);
  if (needsReviewGrounds) requiredFields.push(draft.reviewGrounds);
  /* CN:LICENSING-TEMPLATES-END */
  /* CN:TEMPLATES-PREVIEW-END */
  const validCount = requiredFields.filter((value) => !!value?.toString().trim()).length;
  const requiredTotal = requiredFields.length;
  /* CN:STEP2-LAYOUT-END */
  /* CN:STEP2-END */
  const detailsComplete = requiredOk;
  const readyForPayment = detailsComplete && hasConfirmedNotice;
  const canProceedFromStep2 = hasOcrText || detailsComplete;

  useEffect(() => {
    if (detailsComplete) {
      setShowValidationErrors(false);
    }
  }, [detailsComplete]);

  const handleBack = () => setStep((prev) => Math.max(1, (prev as number) - 1) as 1 | 2 | 3 | 4);

  /* CN:STEP2-START */
  const makeReference = React.useCallback(() => {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `CN-${stamp}-${random}`;
  }, []);

  const hasAutoUrn = React.useRef(false);

  const updateDraft = React.useCallback(
    (patch: Partial<NoticeDraft>, options?: { ensureUrn?: boolean }) => {
      setDraft((prev) => {
        const next = { ...prev, ...patch };
        if (typeof patch.urn !== 'undefined') {
          hasAutoUrn.current = hasAutoUrn.current || !!patch.urn;
        }
        if (
          options?.ensureUrn &&
          !prev.urn &&
          !patch.urn &&
          !hasAutoUrn.current
        ) {
          const generated = makeReference();
          hasAutoUrn.current = true;
          next.urn = generated;
        }
        return next;
      });
    },
    [makeReference]
  );
  /* CN:STEP2-END */

  /* CN:STEP1-START */
  // On mount: read ?type= and set draft.noticeType if valid
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('type') ?? undefined;
    if (isLicensingNoticeType(t)) {
      setDraft((d) => ({ ...d, noticeType: t as NoticeType }));
    }
  }, []);
  /* CN:STEP1-END */

  // Auto-lookup council when postcode changes (defensive)
  useEffect(() => {
    const pc = draft.postcode?.trim();
    if (!pc) return;
    const res = lookupCouncilByPostcode(pc);
    if (!res) return;
    setDraft((d) => ({
      ...d,
      councilName: res.councilName || d.councilName,
      councilEmail:
        typeof res.councilEmail === 'string' ? res.councilEmail : d.councilEmail,
      councilAddress:
        typeof res.councilAddress === 'string' ? res.councilAddress : d.councilAddress,
      isCouncilEmailLocked:
        typeof res.councilEmail === 'string' ? !!res.councilEmail : d.isCouncilEmailLocked,
    }));
  }, [draft.postcode]);

  // Keep reps deadline in sync with application date (28 days)
  useEffect(() => {
    /* CN:STEP2-START */
    if (!draft.applicationDate) {
      if (draft.repsDeadline) {
        setDraft((d) => ({ ...d, repsDeadline: '' }));
      }
      return;
    }
    const expected = calcRepsDeadline(draft.applicationDate);
    if (expected && draft.repsDeadline !== expected) {
      setDraft((d) => ({ ...d, repsDeadline: expected }));
    }
    /* CN:STEP2-END */
  }, [draft.applicationDate, draft.repsDeadline]);

  const handleFix = (target?: string) => {
    if (!target) return;
    /* CN:STEP2-LAYOUT-START */
    const map: Record<string, string> = {
      applicant: 'applicantName',
      applicantName: 'applicantName',
      addr: 'premisesAddress',
      'premises-address': 'premisesAddress',
      councilName: 'councilName',
      councilEmail: 'councilEmail',
      /* CN:STEP2-COMPLIANCE-START */
      repsContact: 'councilEmail',
      /* CN:STEP2-COMPLIANCE-END */
      councilAddr: 'councilAddress',
      councilAddress: 'councilAddress',
      /* CN:TEMPLATES-PREVIEW-START */
      /* CN:LICENSING-TEMPLATES-START */
      applicationSummary: 'applicationSummary',
      variationSummary: 'variationSummary',
      reviewGrounds: 'reviewGrounds',
      /* CN:LICENSING-TEMPLATES-END */
      /* CN:TEMPLATES-PREVIEW-END */
      appDate: 'submissionDate',
      applicationDate: 'submissionDate',
      submissionDate: 'submissionDate',
      repsMissing: 'submissionDate',
    };
    const fieldId = map[target] || target;
    focusAndFlash(fieldId);
    /* CN:STEP2-LAYOUT-END */
  };

  return (
    <div data-testid="notice-flow-root">
      <div className="grid md:grid-cols-3 gap-8">
        <main className="md:col-span-2 space-y-6">
          <ProgressBar
            step={step}
            totalSteps={4}
            labels={['Confirm Notice Type','Upload your Notice','Confirm your Notice','Pay']}
          />
          {/* CN:STEP1-START */}
          {step === 1 && (
            <NoticeTypeStep
              value={draft.noticeType}
              onChange={(t) => {
                setDraft((d) => ({ ...d, noticeType: t }));
                const params = new URLSearchParams(window.location.search);
                params.set('type', t);
                window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
              }}
              onContinue={() => setStep(2)}
            />
          )}
          {/* CN:STEP1-END */}
          {step === 2 && (
            <>
              {/* CN:STEP2-LAYOUT-START */}
              <div className="[&>div]:p-6 [&>div]:md:p-6">
                <FileDropOCR
                  onText={(t) => {
                    // {/* CN:LICENSING-FINAL-START */}
                    setOcrText(t);
                    setDraft((d) => ({ ...d, finalText: t }));
                    // {/* CN:LICENSING-FINAL-END */}
                  }}
                  onMeta={(m) => setDraft((d) => ({ ...d, originalFileMeta: m }))}
                />
              </div>
              <section className={`${UI.section} space-y-6 p-6`} data-testid="required-inline">
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-brand-navy">Licensing Act 2003 details</h3>
                    <p className="mt-1 text-xs text-neutral-600">Complete each section to continue.</p>
                  </div>
                  <span
                    className="rounded-full bg-neutral-100 px-2.5 py-1 pt-0.5 text-xs text-neutral-600"
                    data-testid="required-inline-counter"
                  >
                    {/* CN:TEMPLATES-PREVIEW-START */}
                    {/* CN:LICENSING-TEMPLATES-START */}
                    {`Required: ${validCount}/${requiredTotal}`}
                    {/* CN:LICENSING-TEMPLATES-END */}
                    {/* CN:TEMPLATES-PREVIEW-END */}
                  </span>
                </div>
                {/* CN:STEP2-LAYOUT-END */}
                {/* CN:STEP2-START */}
                <NoticeDetailsSections
                  draft={draft}
                  onChange={updateDraft}
                  refs={refs}
                  showValidationErrors={showValidationErrors}
                  // {/* CN:LICENSING-FINAL-START */}
                  hasOcrText={hasOcrText}
                  // {/* CN:LICENSING-FINAL-END */}
                  /* CN:OFFICER-FINAL-START */
                  ocrDeadline={ocrDeadline}
                  showDeadlineWarning={showDeadlineWarning}
                  onUseCalculatedDeadline={handleUseCalculatedDeadline}
                  onKeepOcrDeadline={handleKeepOcrDeadline}
                  onViewOcrDeadline={handleViewOcrDeadline}
                  representationDeadlineDate={representationDeadlineDate}
                  focusPremisesTextarea={focusPremisesTextarea}
                  /* CN:OFFICER-FINAL-END */
                />
                {/* CN:STEP2-END */}
              </section>
            </>
          )}
          {step === 3 && (
            <div className="space-y-6">
              <ConfirmNotice
                noticeText={confirmNoticeText}
                confirmed={hasConfirmedNotice}
                onConfirmedChange={setHasConfirmedNotice}
                ready={detailsComplete}
                onConfirmAndContinue={async () => {
                  if (!detailsComplete) {
                    setShowValidationErrors(true);
                    return;
                  }
                  const textForHash = draft.finalText || confirmNoticeText || '';
                  const hash = await sha256Hex((draft.originalFileMeta?.sha256 || '') + textForHash);
                  setDraft((d) => ({ ...d, proofHash: hash }));
                  setStep(4);
                }}
              />
              <div className="flex items-center justify-between">
                <button className={UI.btnSecondary} onClick={handleBack} data-testid="btn-back">
                  Back
                </button>
                <span />
              </div>
            </div>
          )}
          {step === 4 && (
            <div>
              Pay step.
              <div className="mt-4 flex items-center justify-between">
                <button className={UI.btnSecondary} onClick={handleBack} data-testid="btn-back">Back</button>
                <span />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="mt-4">
              <div className="text-sm text-brand-navy mb-2">
                To continue, upload your notice or complete the required details.
              </div>
              {/* CN:STEP2-LAYOUT-START */}
              <div className="mt-4 flex items-center justify-end gap-3">
                <button className={`${UI.btnSecondary} h-11 px-5 text-sm`} onClick={handleBack} data-testid="btn-back">
                  Back
                </button>
                <button
                  type="button"
                  className={`${UI.btnSecondary} h-11 px-5 text-sm ${
                    !canProceedFromStep2 ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                  data-testid="link-skip-ocr"
                  aria-disabled={!canProceedFromStep2}
                  onClick={() => {
                    if (!canProceedFromStep2) {
                      setShowValidationErrors(true);
                      return;
                    }
                    setShowValidationErrors(false);
                    setHasConfirmedNotice(false);
                    setStep(3);
                  }}
                >
                  {/* CN:STEP2-START */}Enter details manually{/* CN:STEP2-END */}
                </button>
                <button
                  className={`${UI.btnPrimary} h-11 px-5 text-sm ${
                    !canProceedFromStep2 ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                  aria-disabled={!canProceedFromStep2}
                  onClick={() => {
                    if (!canProceedFromStep2) {
                      setShowValidationErrors(true);
                      return;
                    }
                    setShowValidationErrors(false);
                    setHasConfirmedNotice(false);
                    setStep(3);
                  }}
                  data-testid="btn-continue"
                >
                  Continue
                </button>
              </div>
              {/* CN:STEP2-LAYOUT-END */}
            </div>
          )}
        </main>
        {/* CN:STEP2-LAYOUT-START */}
        <aside className="md:col-span-1 md:sticky md:top-[var(--headerH)] space-y-4 md:space-y-5">
          {/* CN:STEP1-START */}
          {step === 1 ? (
            <>
              <div className={`${UI.card} p-4 md:p-5`}>
                <h3 className={UI.cardHeader}>Preview</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Preview appears after you upload or complete details in Step 2.
                </p>
              </div>
              <div className={`${UI.card} p-4 md:p-5`}>
                <h3 className={UI.cardHeader}>Compliance checklist</h3>
                <p className="mt-1 text-sm text-slate-600">
                  We’ll run compliance checks once details are entered.
                </p>
              </div>
              <div className={`${UI.card} p-4 md:p-5`}>
                <h3 className={UI.cardHeader}>Key dates</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Dates will be calculated after you set your submission date in Step 2.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* CN:STEP2-COMPLIANCE-START */}
              {(() => {
                // {/* CN:LICENSING-FINAL-START */}
                /* CN:OFFICER-FINAL-START */
                const representationIso = representationDeadlineDate ? representationDeadlineDate.toISOString() : '';
                const builderState = { ...draft, representationDeadline: representationIso, ocrText };
                return (
                  <PreviewNotice
                    draft={builderState}
                    authority={previewAuthority}
                    ocrText={ocrText}
                    onReplaceOcr={(next) => {
                      setOcrText(next);
                      setDraft((d) => ({ ...d, finalText: next }));
                    }}
                  />
                );
                /* CN:OFFICER-FINAL-END */
                // {/* CN:LICENSING-FINAL-END */}
              })()}
              {/* CN:STEP2-COMPLIANCE-END */}
              <ComplianceCard items={runMandatoryChecks(draft)} onFix={handleFix} />
              <KeyDatesCard
                applicationDate={draft.applicationDate}
                representationDeadline={draft.repsDeadline || ''}
                consultationDays={28}
              />
              {/* CN:STEP2-COMPLIANCE-START */}
              {step !== 2 && (
                <CostCard
                  cost={0}
                  canSubmit={step === 3 && readyForPayment}
                  label={step === 3 ? 'Continue to payment' : undefined}
                />
              )}
              {/* CN:STEP2-COMPLIANCE-END */}
            </>
          )}
          {/* CN:STEP1-END */}
        </aside>
        {/* CN:STEP2-LAYOUT-END */}
      </div>
    </div>
  );
}

/* CN:STEP2-START */
type NoticeDetailsSectionsProps = {
  draft: NoticeDraft;
  onChange: (patch: Partial<NoticeDraft>, options?: { ensureUrn?: boolean }) => void;
  refs: NoticeFieldRefs;
  focusPremisesTextarea: () => void;
  showValidationErrors: boolean;
  // {/* CN:LICENSING-FINAL-START */}
  hasOcrText: boolean;
  // {/* CN:LICENSING-FINAL-END */}
  /* CN:OFFICER-FINAL-START */
  ocrDeadline: Date | null;
  showDeadlineWarning: boolean;
  onUseCalculatedDeadline: () => void;
  onKeepOcrDeadline: () => void;
  onViewOcrDeadline: () => void;
  representationDeadlineDate: Date | null;
  /* CN:OFFICER-FINAL-END */
};

function NoticeDetailsSections(props: NoticeDetailsSectionsProps) {
  const {
    draft,
    onChange,
    refs,
    focusPremisesTextarea,
    showValidationErrors,
    hasOcrText,
    /* CN:OFFICER-FINAL-START */
    ocrDeadline,
    showDeadlineWarning,
    onUseCalculatedDeadline,
    onKeepOcrDeadline,
    onViewOcrDeadline,
    representationDeadlineDate,
    /* CN:OFFICER-FINAL-END */
  } = props;
  /* CN:STEP2-COMPLIANCE-START */
  const [ignoreDomainWarning, setIgnoreDomainWarning] = React.useState(false);
  /* CN:STEP2-COMPLIANCE-END */
  /* CN:STEP2-LAYOUT-START */
  const applicantHelpId = React.useId();
  const referenceHelpId = React.useId();
  const manualAddressHelpId = React.useId();
  const postcodeHelpId = React.useId();
  const councilEmailHelpId = React.useId();
  const councilEmailErrorId = React.useId();
  const councilAddressHelpId = React.useId();
  const councilAddressErrorId = React.useId();
  const submissionHelpId = React.useId();
  const deadlineHelpId = React.useId();
  /* CN:OFFICER-FINAL-START */
  const submissionTooltipId = React.useId();
  const [showSubmissionTooltip, setShowSubmissionTooltip] = React.useState(false);
  const [postcodeNormalizedAt, setPostcodeNormalizedAt] = React.useState<number>(0);
  React.useEffect(() => {
    if (!postcodeNormalizedAt) return;
    /* CN:GUARDRAIL-FINAL-START */
    const timer = setTimeout(() => setPostcodeNormalizedAt(0), 1500);
    /* CN:GUARDRAIL-FINAL-END */
    return () => clearTimeout(timer);
  }, [postcodeNormalizedAt]);
  const showPostcodeNormalised = postcodeNormalizedAt > 0;
  const formattedOcrDeadline = ocrDeadline ? formatDisplayDate(ocrDeadline) : '';
  const formattedCalculatedDeadline = representationDeadlineDate ? formatDisplayDate(representationDeadlineDate) : '';
  /* CN:OFFICER-FINAL-END */
  /* CN:TEMPLATES-PREVIEW-START */
  /* CN:LICENSING-TEMPLATES-START */
  const applicationSummaryHelpId = React.useId();
  const applicationSummaryErrorId = React.useId();
  const variationSummaryHelpId = React.useId();
  const variationSummaryErrorId = React.useId();
  const reviewGroundsHelpId = React.useId();
  const reviewGroundsErrorId = React.useId();
  /* CN:LICENSING-TEMPLATES-END */
  /* CN:TEMPLATES-PREVIEW-END */
  /* CN:STEP2-LAYOUT-END */
  const lookedUpEmail = React.useRef('');
  const lookedUpName = React.useRef('');
  const lookedUpAddress = React.useRef('');
  const [councilNameTouched, setCouncilNameTouched] = React.useState(false);
  const [councilEmailTouched, setCouncilEmailTouched] = React.useState(false);
  const [councilAddressTouched, setCouncilAddressTouched] = React.useState(false);
  const emailLocked = !!draft.isCouncilEmailLocked;
  const trimmedEmail = draft.councilEmail.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hasEmail = trimmedEmail.length > 0;
  const emailValid = !hasEmail || emailPattern.test(trimmedEmail);
  const showCouncilNameError = (showValidationErrors || councilNameTouched) && !draft.councilName.trim();
  const showCouncilEmailError =
    (showValidationErrors || councilEmailTouched) && (!hasEmail || !emailValid);
  const councilEmailErrorMessage = !hasEmail ? 'Council email is required.' : 'Enter a valid email address.';
  const showCouncilAddressError =
    (showValidationErrors || councilAddressTouched) && !draft.councilAddress.trim();
  const showNoDefaultEmail = !showCouncilEmailError && !!draft.councilName.trim() && !hasEmail;
  const councilEmailDescribedBy = [
    councilEmailHelpId,
    showCouncilEmailError ? councilEmailErrorId : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  const councilAddressDescribedBy = [
    councilAddressHelpId,
    showCouncilAddressError ? councilAddressErrorId : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  const premisesAddressRef = refs.premisesAddress as React.RefObject<HTMLTextAreaElement>;

  /* CN:TEMPLATES-PREVIEW-START */
  /* CN:LICENSING-TEMPLATES-START */
  const authority = React.useMemo(() => getAuthorityByName(draft.councilName), [draft.councilName]);
  // {/* CN:LICENSING-FINAL-START */}
  const needsAppSummary = !hasOcrText && (draft.noticeType === 'premises' || draft.noticeType === 'variation');
  const needsVariationSummary = !hasOcrText && draft.noticeType === 'variation';
  const needsReviewGrounds = !hasOcrText && draft.noticeType === 'review';
  // {/* CN:LICENSING-FINAL-END */}

  const applicationSummaryError = needsAppSummary && !draft.applicationSummary?.trim();
  const variationSummaryError = needsVariationSummary && !draft.variationSummary?.trim();
  const reviewGroundsError = needsReviewGrounds && !draft.reviewGrounds?.trim();

  const applicationSummaryDescribedBy = [
    applicationSummaryHelpId,
    applicationSummaryError ? applicationSummaryErrorId : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  const variationSummaryDescribedBy = [
    variationSummaryHelpId,
    variationSummaryError ? variationSummaryErrorId : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  const reviewGroundsDescribedBy = [reviewGroundsHelpId, reviewGroundsError ? reviewGroundsErrorId : undefined]
    .filter(Boolean)
    .join(' ');

  const showDomainWarning = !!draft.councilEmail && !emailDomainMatchesAuthority(draft.councilEmail, authority);
  const canonicalAuthorityEmail = authority?.canonicalEmail || authority?.repsEmail || '';
  // {/* CN:LICENSING-FINAL-START */}
  const authorityRepsEmail = authority?.repsEmail || draft.councilEmail || '';
  const authorityRepsUrl = authority?.repsUrl || '';
  const authorityPostalAddress = authority?.postalAddress || draft.councilAddress || '';
  const representationContactsIncomplete = !(authorityRepsEmail || authorityRepsUrl || authorityPostalAddress);
  // {/* CN:LICENSING-FINAL-END */}
  /* CN:LICENSING-TEMPLATES-END */
  /* CN:TEMPLATES-PREVIEW-END */

  /* CN:STEP2-LAYOUT-START */
  /* CN:STEP2-LAYOUT-END */

  /* CN:TEMPLATES-PREVIEW-START */
  /* CN:LICENSING-TEMPLATES-START */
  React.useEffect(() => {
    setIgnoreDomainWarning((prev) => (prev ? false : prev));
  }, [draft.councilEmail, draft.councilName]);
  /* CN:LICENSING-TEMPLATES-END */
  /* CN:TEMPLATES-PREVIEW-END */

  /* CN:OFFICER-FINAL-START */
  const representationIso = React.useMemo(() => {
    if (representationDeadlineDate) return representationDeadlineDate.toISOString();
    if (draft.repsDeadline) return draft.repsDeadline;
    if (!draft.applicationDate) return '';
    const computed = calculateRepresentationDeadline(draft.applicationDate);
    return Number.isNaN(computed.getTime()) ? '' : computed.toISOString();
  }, [representationDeadlineDate, draft.applicationDate, draft.repsDeadline]);

  /* CN:STEP2-COMPLIANCE-START */
  const representationDisplay = representationDeadlineDate
    ? formatDisplayDate(representationDeadlineDate)
    : representationIso
    ? formatDisplayDate(representationIso)
    : '';
  /* CN:STEP2-COMPLIANCE-END */
  /* CN:OFFICER-FINAL-END */

  const extractPostcodeFromAddress = React.useCallback((input: string): string | null => {
    if (!input) return null;
    const matches = input.toUpperCase().match(/([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/g);
    if (!matches || matches.length === 0) return null;
    return normalizeUKPostcode(matches[matches.length - 1]);
  }, []);

  const toMultiline = (label: string) =>
    label
      .split(',')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .join('\n');

  const handlePremisesAddressCommit = React.useCallback(
    (rawAddress: string, opts?: { updatePremises?: boolean }) => {
      const trimmed = rawAddress.trim();
      if (opts?.updatePremises ?? true) {
        const multiline = toMultiline(trimmed);
        onChange({ premisesAddress: multiline || trimmed }, { ensureUrn: true });
      }
      if (!trimmed) {
        lookedUpEmail.current = '';
        lookedUpName.current = '';
        lookedUpAddress.current = '';
        return;
      }

      const postcode = extractPostcodeFromAddress(trimmed);
      if (!postcode) return;

      onChange({ postcode }, { ensureUrn: true });
      const res = lookupCouncilByPostcode(postcode);
      if (!res) return;

      lookedUpEmail.current = res.councilEmail || '';
      lookedUpName.current = res.councilName || '';
      lookedUpAddress.current = res.councilAddress || '';
      onChange(
        {
          councilName: res.councilName || draft.councilName,
          councilEmail:
            typeof res.councilEmail === 'string' ? res.councilEmail : draft.councilEmail,
          councilAddress:
            typeof res.councilAddress === 'string' ? res.councilAddress : draft.councilAddress,
          isCouncilEmailLocked:
            typeof res.councilEmail === 'string'
              ? !!res.councilEmail
              : draft.isCouncilEmailLocked,
        },
        { ensureUrn: true }
      );
    },
    [onChange, extractPostcodeFromAddress, draft.councilAddress, draft.councilEmail, draft.councilName, toMultiline]
  );

  const handlePremisesPick = React.useCallback(
    async (item: { id: string; label: string }) => {
      try {
        const resolved = await resolveAddressById(item.id);

        const normalizedPostcode = (resolved.postcode || '').trim();
        const multiline =
          toMultilineAddress([resolved.line1, resolved.line2, resolved.line3, resolved.city]) ||
          resolved.label ||
          item.label;

        onChange(
          {
            premisesAddress: multiline,
            postcode: normalizedPostcode,
          },
          { ensureUrn: true }
        );

        if (normalizedPostcode) {
          const council = lookupCouncilByPostcode(normalizedPostcode);
          if (council) {
            lookedUpEmail.current = council.councilEmail || '';
            lookedUpName.current = council.councilName || '';
            lookedUpAddress.current = council.councilAddress || '';
            onChange(
              {
                councilName: council.councilName || draft.councilName,
                councilEmail:
                  typeof council.councilEmail === 'string'
                    ? council.councilEmail
                    : draft.councilEmail,
                councilAddress:
                  typeof council.councilAddress === 'string'
                    ? council.councilAddress
                    : draft.councilAddress,
                isCouncilEmailLocked:
                  typeof council.councilEmail === 'string'
                    ? !!council.councilEmail
                    : draft.isCouncilEmailLocked,
              },
              { ensureUrn: true }
            );
          } else {
            lookedUpEmail.current = '';
            lookedUpName.current = '';
            lookedUpAddress.current = '';
          }
        } else {
          lookedUpEmail.current = '';
          lookedUpName.current = '';
          lookedUpAddress.current = '';
        }

        focusPremisesTextarea();
      } catch (error) {
        console.error('handlePremisesPick failed', error);
        onChange(
          { premisesAddress: item.label, postcode: '' },
          { ensureUrn: true }
        );
        lookedUpEmail.current = '';
        lookedUpName.current = '';
        lookedUpAddress.current = '';
        focusPremisesTextarea();
      }
    },
    [onChange, focusPremisesTextarea, draft.councilAddress, draft.councilEmail, draft.councilName]
  );

  const handleSubmissionDate = (value: string) => {
    if (!value) {
      onChange({ applicationDate: '', repsDeadline: '' }, { ensureUrn: true });
      return;
    }
    const computed = calculateRepresentationDeadline(value);
    const iso = Number.isNaN(computed.getTime()) ? '' : computed.toISOString();
    onChange({ applicationDate: value, repsDeadline: iso }, { ensureUrn: true });
  };

  return (
    <div>
      {/* CN:STEP2-LAYOUT-START */}
      <fieldset>
        <legend className="sr-only">Licensing Act 2003 details</legend>
        <div className="grid grid-cols-12 gap-4 md:gap-5">
          <div className="col-span-12">
            <h3 className="text-sm font-semibold text-brand-navy">Applicant details</h3>
          </div>
          <div className="col-span-12 md:col-span-8">
            <label htmlFor="applicantName" className={UI.label}>
              Applicant name<span className="text-rose-600">*</span>
            </label>
            <input
              id="applicantName"
              ref={refs.applicant}
              className={`${UI.input} h-11 w-full rounded-xl px-3 text-sm`}
              data-testid="input-applicant-name"
              value={draft.applicantName}
              onChange={(e) => onChange({ applicantName: e.target.value }, { ensureUrn: true })}
              aria-describedby={applicantHelpId}
            />
            <p id={applicantHelpId} className="mt-1 min-h-5 text-xs text-neutral-500">
              The person or organisation applying for the licence.
            </p>
          </div>
          <div className="col-span-12 md:col-span-4">
            <label htmlFor="urn" className={UI.label}>
              URN / Reference <span className="text-xs font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="urn"
              className={`${UI.input} h-11 w-full rounded-xl px-3 text-sm`}
              value={draft.urn || ''}
              onChange={(e) => onChange({ urn: e.target.value })}
              aria-describedby={referenceHelpId}
            />
            <p id={referenceHelpId} className="mt-1 min-h-5 text-xs text-neutral-500">
              Auto-generated when you start editing; update if your authority provided a specific reference.
            </p>
          </div>
          <div className="col-span-12 border-t border-slate-200/80 pt-6">
            <h3 className="text-sm font-semibold text-brand-navy">Premises &amp; Council details</h3>
          </div>
          <div
            className="col-span-12 [&_label]:mb-1 [&_label]:text-sm [&_label]:font-medium [&_label]:text-slate-800 [&_input]:h-11 [&_input]:text-sm [&_input]:rounded-xl [&_input]:w-full"
          >
            <label htmlFor="premisesSearch" className={UI.label}>
              Premises address (search)<span className="text-rose-600">*</span>
            </label>
            <AddressSearch
              name="premisesSearch"
              required
              inputTestId="input-premises-address"
              onChange={handlePremisesAddressCommit}
              onPick={handlePremisesPick}
            />
          </div>
          <div className="col-span-12 md:col-span-8">
            <label htmlFor="premisesAddress" className={UI.label}>
              Premises address<span className="text-rose-600">*</span>
            </label>
            <textarea
              id="premisesAddress"
              ref={premisesAddressRef}
              className={`${UI.input} min-h-[96px] w-full rounded-xl px-3 text-sm`}
              value={draft.premisesAddress ?? ''}
              onChange={(e) => onChange({ premisesAddress: e.target.value }, { ensureUrn: true })}
              aria-describedby={manualAddressHelpId}
            />
            <p id={manualAddressHelpId} className="mt-1 min-h-5 text-xs text-neutral-500">
              Search above, then adjust the address exactly as it should appear on the notice.
            </p>
          </div>
          <div className="col-span-12 md:col-span-4">
            <label htmlFor="postcode" className={UI.label}>
              Postcode<span className="text-rose-600">*</span>
            </label>
            <input
              id="postcode"
              className={`${UI.input} h-11 w-full rounded-xl px-3 text-sm`}
              value={draft.postcode}
              onChange={(e) => onChange({ postcode: e.target.value }, { ensureUrn: true })}
              /* CN:OFFICER-FINAL-START */
              onBlur={(event) => {
                const normalized = normalizeUKPostcode(event.currentTarget.value);
                if (normalized !== event.currentTarget.value) {
                  event.currentTarget.value = normalized;
                }
                onChange({ postcode: normalized }, { ensureUrn: true });
                if (normalized && normalized !== draft.postcode) {
                  setPostcodeNormalizedAt(Date.now());
                }
                if (!normalized) {
                  setPostcodeNormalizedAt(0);
                }
              }}
              /* CN:OFFICER-FINAL-END */
              aria-describedby={postcodeHelpId}
            />
            <p id={postcodeHelpId} className="mt-1 min-h-5 text-xs text-neutral-500">
              Matches the final notice address.
            </p>
            {/* CN:OFFICER-FINAL-START */}
            {showPostcodeNormalised && (
              <p className="mt-1 text-xs text-neutral-500">Normalised</p>
            )}
            {/* CN:OFFICER-FINAL-END */}
          </div>
          <div className="col-span-12 md:col-span-6">
            <CouncilSelect
              id="councilName"
              value={draft.councilName}
              inputRef={refs.councilName}
              onChangeText={(name) => {
                setCouncilNameTouched(true);
                lookedUpName.current = '';
                lookedUpEmail.current = '';
                lookedUpAddress.current = '';
                onChange(
                  {
                    councilName: name,
                    isCouncilEmailLocked: false,
                  },
                  { ensureUrn: true }
                );
              }}
              onBlur={() => setCouncilNameTouched(true)}
              onSelect={(council: Council) => {
                lookedUpName.current = council.name;
                lookedUpEmail.current = council.email || '';
                lookedUpAddress.current = council.address || '';
                onChange(
                  {
                    councilName: council.name,
                    councilEmail: council.email || '',
                    councilAddress:
                      typeof council.address === 'string' ? council.address : draft.councilAddress,
                    isCouncilEmailLocked: !!council.email,
                  },
                  { ensureUrn: true }
                );
                setCouncilNameTouched(true);
                if (!council.email) setCouncilEmailTouched(true);
                if (typeof council.address === 'string' && !council.address) {
                  setCouncilAddressTouched(true);
                }
              }}
              error={showCouncilNameError ? 'Council name is required.' : undefined}
            />
            {lookedUpName.current && draft.councilName && draft.councilName !== lookedUpName.current && (
              <span className="mt-1 inline-block rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                Value differs from council directory
              </span>
            )}
          </div>
          <div className="col-span-12 md:col-span-6">
            <label htmlFor="councilEmail" className={UI.label}>
              Council email<span className="text-rose-600">*</span>
            </label>
            <div className="relative mt-1">
              <input
                id="councilEmail"
                type="email"
                ref={refs.councilEmail}
                className={`${UI.input} h-11 w-full rounded-xl px-3 text-sm ${
                  showCouncilEmailError ? 'border-red-500 focus:ring-red-500 focus:ring-offset-white' : ''
                } ${emailLocked ? 'bg-neutral-50' : ''}`}
                data-testid="input-council-email"
                value={draft.councilEmail}
                onChange={(e) => {
                  setCouncilEmailTouched(true);
                  onChange(
                    { councilEmail: e.target.value, isCouncilEmailLocked: false },
                    { ensureUrn: true }
                  );
                }}
                onBlur={() => setCouncilEmailTouched(true)}
                readOnly={emailLocked}
                aria-readonly={emailLocked ? 'true' : undefined}
                aria-invalid={showCouncilEmailError ? 'true' : undefined}
                aria-describedby={councilEmailDescribedBy}
              />
              <button
                type="button"
                className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-slate-300 px-2 py-1 text-xs font-medium text-[#192650] transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  !hasEmail && !emailLocked ? 'cursor-not-allowed opacity-50' : 'hover:bg-slate-50'
                }`}
                onClick={() => {
                  if (!hasEmail && !emailLocked) return;
                  onChange(
                    { isCouncilEmailLocked: !emailLocked },
                    { ensureUrn: true }
                  );
                }}
                aria-label={emailLocked ? 'Enable editing email' : 'Lock email'}
              >
                {emailLocked ? 'Edit' : 'Lock'}
              </button>
            </div>
            {showCouncilEmailError && (
              <p id={councilEmailErrorId} className="mt-1 text-xs text-red-600">
                {councilEmailErrorMessage}
              </p>
            )}
            {showNoDefaultEmail && (
              <p className="mt-1 text-xs text-amber-600">No default email found — please enter manually.</p>
            )}
            <p id={councilEmailHelpId} className="mt-1 min-h-5 text-xs text-neutral-500">
              Official inbox for licensing representations.
            </p>
            {lookedUpEmail.current && draft.councilEmail && draft.councilEmail !== lookedUpEmail.current && (
              <span className="mt-1 inline-block rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                Value differs from council directory
              </span>
            )}
            {/* CN:TEMPLATES-PREVIEW-START */}
            {/* CN:LICENSING-TEMPLATES-START */}
            {!ignoreDomainWarning && showDomainWarning && (
              <div
                role="status"
                className="mt-2 space-y-2 rounded border border-amber-200 bg-amber-50 p-2 text-[12px] text-amber-800"
              >
                <div>
                  Email domain doesn’t match {authority?.displayName || 'the selected authority'}.
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canonicalAuthorityEmail && (
                    <button
                      type="button"
                      className={`${UI.btnSecondary} py-1 px-2 text-xs`}
                      onClick={() => {
                        onChange({ councilEmail: canonicalAuthorityEmail }, { ensureUrn: true });
                      }}
                    >
                      Use authority email
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${UI.btnSecondary} py-1 px-2 text-xs`}
                    onClick={() => focusAndFlash('councilEmail')}
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    className={`${UI.btnSecondary} py-1 px-2 text-xs`}
                    onClick={() => setIgnoreDomainWarning(true)}
                  >
                    Use anyway
                  </button>
                </div>
              </div>
            )}
            {/* CN:LICENSING-TEMPLATES-END */}
            {/* CN:TEMPLATES-PREVIEW-END */}
          </div>
          <div className="col-span-12">
            <label htmlFor="councilAddress" className={UI.label}>
              Council address<span className="text-rose-600">*</span>
            </label>
            <textarea
              id="councilAddress"
              ref={refs.councilAddress as React.RefObject<HTMLTextAreaElement>}
              className={`${UI.input} min-h-[96px] w-full rounded-xl px-3 text-sm ${
                showCouncilAddressError ? 'border-red-500 focus:ring-red-500 focus:ring-offset-white' : ''
              }`}
              data-testid="input-council-address"
              value={draft.councilAddress}
              onChange={(e) => {
                setCouncilAddressTouched(true);
                onChange({ councilAddress: e.target.value }, { ensureUrn: true });
              }}
              onBlur={() => setCouncilAddressTouched(true)}
              aria-invalid={showCouncilAddressError ? 'true' : undefined}
              aria-describedby={councilAddressDescribedBy}
            />
            {showCouncilAddressError && (
              <p id={councilAddressErrorId} className="mt-1 text-xs text-red-600">
                Council address is required.
              </p>
            )}
            <p id={councilAddressHelpId} className="mt-1 min-h-5 text-xs text-neutral-500">
              Required by many authorities for written representations.
            </p>
            {lookedUpAddress.current && draft.councilAddress && draft.councilAddress !== lookedUpAddress.current && (
              <span className="mt-1 inline-block rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                Value differs from council directory
              </span>
            )}
          </div>
          {/* CN:TEMPLATES-PREVIEW-START */}
          {/* CN:LICENSING-TEMPLATES-START */}
          {(draft.noticeType === 'premises' || draft.noticeType === 'variation' || draft.noticeType === 'review') && (
            <>
              <div className="col-span-12 border-t border-slate-200/80 pt-6">
                <h3 className="text-sm font-semibold text-brand-navy">Application summary</h3>
              </div>
              {(draft.noticeType === 'premises' || draft.noticeType === 'variation') && (
                <div className="col-span-12">
                  <label htmlFor="applicationSummary" className={UI.label}>
                    Application summary
                    {needsAppSummary ? (
                      <span className="text-rose-600">*</span>
                    ) : (
                      <span className="text-xs font-normal text-slate-500"> (optional when notice text uploaded)</span>
                    )}
                  </label>
                  <textarea
                    id="applicationSummary"
                    className={`${UI.input} min-h-[96px] w-full rounded-xl px-3 text-sm`}
                    value={draft.applicationSummary || ''}
                    onChange={(e) => onChange({ applicationSummary: e.target.value })}
                    /* CN:OFFICER-FINAL-START */
                    required={needsAppSummary}
                    /* CN:OFFICER-FINAL-END */
                    aria-invalid={applicationSummaryError ? 'true' : undefined}
                    aria-describedby={applicationSummaryDescribedBy || undefined}
                  />
                  <p id={applicationSummaryHelpId} className="mt-1 min-h-5 text-xs text-neutral-500">
                    Describe licensable activities and hours (e.g., Sale of alcohol 10:00–23:00).
                  </p>
                  {applicationSummaryError && (
                    <p id={applicationSummaryErrorId} className="mt-1 text-xs text-rose-600" role="alert">
                      Provide an application summary or upload the notice text.
                    </p>
                  )}
                </div>
              )}
              {draft.noticeType === 'variation' && (
                <div className="col-span-12">
                  <label htmlFor="variationSummary" className={UI.label}>
                    Nature of the proposed variation
                    {needsVariationSummary ? (
                      <span className="text-rose-600">*</span>
                    ) : (
                      <span className="text-xs font-normal text-slate-500"> (optional when notice text uploaded)</span>
                    )}
                  </label>
                  <textarea
                    id="variationSummary"
                    className={`${UI.input} min-h-[96px] w-full rounded-xl px-3 text-sm`}
                    value={draft.variationSummary || ''}
                    onChange={(e) => onChange({ variationSummary: e.target.value })}
                    /* CN:OFFICER-FINAL-START */
                    required={needsVariationSummary}
                    /* CN:OFFICER-FINAL-END */
                    aria-invalid={variationSummaryError ? 'true' : undefined}
                    aria-describedby={variationSummaryDescribedBy || undefined}
                  />
                  <p id={variationSummaryHelpId} className="mt-1 min-h-5 text-xs text-neutral-500">
                    Summarise the proposed changes (e.g., Extend alcohol sales to 01:00).
                  </p>
                  {variationSummaryError && (
                    <p id={variationSummaryErrorId} className="mt-1 text-xs text-rose-600" role="alert">
                      Provide the nature of the proposed variation or upload the notice text.
                    </p>
                  )}
                </div>
              )}
              {draft.noticeType === 'review' && (
                <div className="col-span-12">
                  <label htmlFor="reviewGrounds" className={UI.label}>
                    Grounds for review
                    {needsReviewGrounds ? (
                      <span className="text-rose-600">*</span>
                    ) : (
                      <span className="text-xs font-normal text-slate-500"> (optional when notice text uploaded)</span>
                    )}
                  </label>
                  <textarea
                    id="reviewGrounds"
                    className={`${UI.input} min-h-[96px] w-full rounded-xl px-3 text-sm`}
                    value={draft.reviewGrounds || ''}
                    onChange={(e) => onChange({ reviewGrounds: e.target.value })}
                    /* CN:OFFICER-FINAL-START */
                    required={needsReviewGrounds}
                    /* CN:OFFICER-FINAL-END */
                    aria-invalid={reviewGroundsError ? 'true' : undefined}
                    aria-describedby={reviewGroundsDescribedBy || undefined}
                  />
                  <p id={reviewGroundsHelpId} className="mt-1 min-h-5 text-xs text-neutral-500">
                    Explain the grounds for the review (e.g., Prevention of crime and disorder).
                  </p>
                  {reviewGroundsError && (
                    <p id={reviewGroundsErrorId} className="mt-1 text-xs text-rose-600" role="alert">
                      Provide the grounds for review or upload the notice text.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
          {/* CN:LICENSING-TEMPLATES-END */}
          {/* CN:TEMPLATES-PREVIEW-END */}
          <div className="col-span-12 border-t border-slate-200/80 pt-6">
            <h3 className="text-sm font-semibold text-brand-navy">Dates &amp; declarations</h3>
          </div>
          <div className="col-span-12 md:col-span-6">
            {/* CN:OFFICER-FINAL-START */}
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="submissionDate" className={UI.label}>
                Date of submission<span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  aria-label="Submission date guidance"
                  aria-describedby={submissionTooltipId}
                  aria-expanded={showSubmissionTooltip}
                  onFocus={() => setShowSubmissionTooltip(true)}
                  onBlur={() => setShowSubmissionTooltip(false)}
                  onMouseEnter={() => setShowSubmissionTooltip(true)}
                  onMouseLeave={() => setShowSubmissionTooltip(false)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-[11px] text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white"
                >
                  i
                </button>
                {showSubmissionTooltip && (
                  <div
                    id={submissionTooltipId}
                    role="tooltip"
                    className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-lg"
                  >
                    Enter the date the application was submitted to the licensing authority.
                  </div>
                )}
              </div>
            </div>
            {/* CN:OFFICER-FINAL-END */}
            <input
              id="submissionDate"
              type="date"
              ref={refs.applicationDate}
              className={`${UI.input} h-11 w-full rounded-xl px-3 text-sm`}
              data-testid="input-application-date"
              value={draft.applicationDate}
              onChange={(e) => handleSubmissionDate(e.target.value)}
              aria-describedby={submissionHelpId}
            />
            {/* CN:OFFICER-FINAL-START */}
            <p id={submissionHelpId} className="mt-1 min-h-5 text-xs text-neutral-500">
              Used to calculate the 28-day representation deadline.
            </p>
            {/* CN:OFFICER-FINAL-END */}
          </div>
          <div className="col-span-12 md:col-span-6">
            <label htmlFor="representationDeadline" className={UI.label}>
              Representation deadline
            </label>
            <input
              id="representationDeadline"
              /* CN:OFFICER-FINAL-START */
              className="h-11 w-full rounded-xl border border-slate-200 bg-neutral-50 px-3 text-sm text-neutral-700"
              /* CN:OFFICER-FINAL-END */
              value={representationDisplay}
              readOnly
              aria-readonly="true"
              aria-describedby={deadlineHelpId}
              data-testid="input-representation-deadline"
              aria-live="polite"
            />
            <p id={deadlineHelpId} className="mt-1 min-h-5 text-xs text-neutral-500">
              Auto-calculated <strong>28 calendar days</strong> after submission.
            </p>
          </div>
          {/* CN:OFFICER-FINAL-START */}
          {showDeadlineWarning && (
            <div className="col-span-12">
              <div className="flex flex-wrap items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                <span className="font-medium">OCR deadline differs from the calculated deadline.</span>
                {(formattedOcrDeadline || formattedCalculatedDeadline) && (
                  <span className="text-[11px] text-amber-800">
                    OCR: {formattedOcrDeadline || '—'} · Calculated: {formattedCalculatedDeadline || '—'}
                  </span>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`${UI.btnSecondary} py-1 px-2 text-xs`}
                    onClick={onUseCalculatedDeadline}
                  >
                    Use calculated
                  </button>
                  <button
                    type="button"
                    className={`${UI.btnSecondary} py-1 px-2 text-xs`}
                    onClick={onKeepOcrDeadline}
                  >
                    Keep OCR
                  </button>
                  <button
                    type="button"
                    className={`${UI.btnSecondary} py-1 px-2 text-xs`}
                    onClick={onViewOcrDeadline}
                  >
                    View in OCR
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* CN:OFFICER-FINAL-END */}
          {/* CN:STEP2-COMPLIANCE-START */}
          {/* How to make representations (read-only) */}
          <div className="col-span-12">
            <div className="rounded-xl border border-slate-200/80 bg-neutral-50 p-3 md:p-4">
              <h4 className="mb-2 text-sm font-medium text-[#192650]">How to make representations</h4>
              <div className="space-y-1 text-sm text-[#192650]">
                <div>
                  <span className="font-medium">Email:</span> {authorityRepsEmail || '—'}
                </div>
                <div>
                  <span className="font-medium">Online form:</span>{' '}
                  {authorityRepsUrl ? (
                    <a href={authorityRepsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
                      {authorityRepsUrl}
                    </a>
                  ) : (
                    '—'
                  )}
                </div>
                <div>
                  <span className="font-medium">Postal address:</span> {authorityPostalAddress || '—'}
                </div>
                {representationContactsIncomplete && (
                  <div className="mt-2 inline-block rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                    Representation contact details for this council are incomplete. Please verify before continuing.
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* CN:STEP2-COMPLIANCE-END */}
        </div>
      </fieldset>
      {/* CN:STEP2-LAYOUT-END */}
    </div>
  );
}
/* CN:STEP2-END */

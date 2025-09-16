import React, { useEffect, useState } from 'react';
import ProgressBar from './ProgressBar';
import FileDropOCR from '@/components/upload/FileDropOCR';
import PreviewCard from '@/components/publish/RightRail/PreviewCard';
import ComplianceCard from '@/components/publish/RightRail/ComplianceCard';
import KeyDatesCard from '@/components/publish/RightRail/KeyDatesCard';
import CostCard from '@/components/publish/RightRail/CostCard';
import AddressAutocomplete, { type AddressOption } from '@/components/AddressAutocomplete';
import { lookupCouncilByPostcode } from '@/lib/councilLookup';
import { runMandatoryChecks, calcRepsDeadline } from '@/lib/licensing/checks';
/* CN:STEP2-START */
import { calculateRepresentationDeadline } from '@/lib/dates/licensing';
/* CN:STEP2-COMPLIANCE-START */
import { formatDisplayDate } from '@/lib/format';
import { getAuthorityByName, emailDomainMatchesAuthority } from '@/lib/authorities';
import { buildPremisesNotice, buildVariationNotice, buildReviewNotice } from '@/features/publish/previewBuilders';
/* CN:STEP2-COMPLIANCE-END */
/* CN:STEP2-END */
import * as UI from '@/styles/ui';
import type { NoticeDraft, NoticeType } from '@/types/notice';
import { sha256Hex } from '@/lib/hash';
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

export default function UploadNoticeFlow() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [text, setText] = useState('');
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
  const [confirmA, setConfirmA] = useState(false);
  const [confirmB, setConfirmB] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const refs: NoticeFieldRefs = {
    applicant: React.useRef<HTMLInputElement>(null),
    /* CN:STEP2-START */
    premisesAddress: React.useRef<HTMLInputElement | HTMLTextAreaElement>(null),
    councilName: React.useRef<HTMLInputElement>(null),
    councilEmail: React.useRef<HTMLInputElement>(null),
    councilAddress: React.useRef<HTMLInputElement | HTMLTextAreaElement>(null),
    applicationDate: React.useRef<HTMLInputElement>(null),
    /* CN:STEP2-END */
  };
  /* CN:STEP2-START */
  /* CN:TEMPLATES-PREVIEW-START */
  /* CN:LICENSING-TEMPLATES-START */
  const hasNoticeText = text.trim().length > 0;
  const needsApplicationSummary =
    !hasNoticeText && (draft.noticeType === 'premises' || draft.noticeType === 'variation');
  const needsVariationSummary = !hasNoticeText && draft.noticeType === 'variation';
  const needsReviewGrounds = !hasNoticeText && draft.noticeType === 'review';

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
  const canContinue = requiredOk && confirmA && confirmB;

  const handleBack = () => setStep((prev) => Math.max(1, (prev as number) - 1) as 1 | 2 | 3 | 4);
  const handleNext = () => setStep((prev) => Math.min(4, (prev as number) + 1) as 1 | 2 | 3 | 4);

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
      councilEmail: res.councilEmail || d.councilEmail,
      councilAddress: res.councilAddress || d.councilAddress,
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

  const toErrorKey = (target: string) => (target === 'premises-address' ? 'premisesAddress' : target);
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
    setErrors((er) => ({ ...er, [toErrorKey(target)]: 'This field is required' }));
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
                    setText(t);
                    setDraft((d) => ({ ...d, finalText: t }));
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
                  confirmA={confirmA}
                  confirmB={confirmB}
                  onConfirmAChange={setConfirmA}
                  onConfirmBChange={setConfirmB}
                />
                {/* CN:STEP2-END */}
              </section>
            </>
          )}
          {step === 3 && (
            <div className="space-y-6">
              <section className={UI.section}>
                <div>
                  <label htmlFor="noticeText" className={UI.label}>Notice text</label>
                  <textarea
                    id="noticeText"
                    className={UI.input + ' h-40'}
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setDraft((d) => ({ ...d, finalText: e.target.value }));
                    }}
                  />
                </div>
                {/* CN:STEP2-START */}
                <NoticeDetailsSections
                  draft={draft}
                  onChange={updateDraft}
                  refs={refs}
                  confirmA={confirmA}
                  confirmB={confirmB}
                  onConfirmAChange={setConfirmA}
                  onConfirmBChange={setConfirmB}
                />
                {/* CN:STEP2-END */}
                <div className="mt-4 flex items-center justify-between">
                  <button
                    className={UI.btnSecondary}
                    onClick={handleBack}
                    data-testid="btn-back"
                  >
                    Back
                  </button>
                  <button
                    className={UI.btnPrimary}
                    disabled={!canContinue}
                    data-testid="btn-continue"
                    onClick={async () => {
                      const hash = await sha256Hex((draft.originalFileMeta?.sha256 || '') + (draft.finalText || ''));
                      setDraft((d) => ({ ...d, proofHash: hash }));
                      setStep(4);
                    }}
                  >
                    Continue to Pay
                  </button>
                </div>
              </section>
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
                  className={`${UI.btnSecondary} h-11 px-5 text-sm`}
                  data-testid="link-skip-ocr"
                  onClick={() => setStep(3)}
                >
                  {/* CN:STEP2-START */}Enter details manually{/* CN:STEP2-END */}
                </button>
                <button
                  className={`${UI.btnPrimary} h-11 px-5 text-sm`}
                  disabled={!text && !(requiredOk && confirmA && confirmB)}
                  onClick={() => setStep(3)}
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
                const auth = getAuthorityByName(draft.councilName);
                const representationIso = draft.repsDeadline || (draft.applicationDate ? calculateRepresentationDeadline(draft.applicationDate).toISOString() : '');
                const builderState = { ...draft, representationDeadline: representationIso };
                /* CN:TEMPLATES-PREVIEW-START */
                /* CN:LICENSING-TEMPLATES-START */
                const built =
                  draft.noticeType === 'variation'
                    ? buildVariationNotice(builderState, auth)
                    : draft.noticeType === 'review'
                      ? buildReviewNotice(builderState, auth)
                      : buildPremisesNotice(builderState, auth);
                /* CN:LICENSING-TEMPLATES-END */
                /* CN:TEMPLATES-PREVIEW-END */
                const useText = (text ?? '').trim().length > 0 ? text : built;
                /* CN:TEMPLATES-PREVIEW-START */
                /* CN:LICENSING-TEMPLATES-START */
                const summaryMissing =
                  !hasNoticeText &&
                  ((needsApplicationSummary && !draft.applicationSummary?.trim()) ||
                    (needsVariationSummary && !draft.variationSummary?.trim()) ||
                    (needsReviewGrounds && !draft.reviewGrounds?.trim()));
                const showBanner = useText.includes('—') || summaryMissing;
                /* CN:LICENSING-TEMPLATES-END */
                /* CN:TEMPLATES-PREVIEW-END */
                return (
                  <PreviewCard
                    text={useText}
                    statusMessage={showBanner ? 'Some fields are missing — the notice text will update as you complete the form.' : undefined}
                  />
                );
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
                <CostCard cost={0} canSubmit={canContinue && step === 3} label={step === 3 ? 'Submit' : undefined} />
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
  confirmA: boolean;
  confirmB: boolean;
  onConfirmAChange: (next: boolean) => void;
  onConfirmBChange: (next: boolean) => void;
};

function NoticeDetailsSections(props: NoticeDetailsSectionsProps) {
  const { draft, onChange, refs, confirmA, confirmB, onConfirmAChange, onConfirmBChange } = props;
  /* CN:STEP2-COMPLIANCE-START */
  const [ignoreDomainWarning, setIgnoreDomainWarning] = React.useState(false);
  /* CN:STEP2-COMPLIANCE-END */
  /* CN:STEP2-LAYOUT-START */
  const applicantHelpId = React.useId();
  const referenceHelpId = React.useId();
  const manualAddressHelpId = React.useId();
  const searchHelpId = React.useId();
  const postcodeHelpId = React.useId();
  const councilNameHelpId = React.useId();
  const councilEmailHelpId = React.useId();
  const councilAddressHelpId = React.useId();
  const submissionHelpId = React.useId();
  const deadlineHelpId = React.useId();
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

  /* CN:TEMPLATES-PREVIEW-START */
  /* CN:LICENSING-TEMPLATES-START */
  const authority = React.useMemo(() => getAuthorityByName(draft.councilName), [draft.councilName]);
  const hasGeneratedNoticeText = !!draft.finalText?.trim();
  const needsAppSummary =
    !hasGeneratedNoticeText && (draft.noticeType === 'premises' || draft.noticeType === 'variation');
  const needsVariationSummary = !hasGeneratedNoticeText && draft.noticeType === 'variation';
  const needsReviewGrounds = !hasGeneratedNoticeText && draft.noticeType === 'review';

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
  const authorityRepsEmail = authority?.repsEmail || '';
  const authorityRepsUrl = authority?.repsUrl || '';
  const authorityPostalAddress = authority?.postalAddress || '';
  const representationContactsIncomplete = !(authorityRepsEmail || authorityRepsUrl || authorityPostalAddress);
  /* CN:LICENSING-TEMPLATES-END */
  /* CN:TEMPLATES-PREVIEW-END */

  /* CN:STEP2-LAYOUT-START */
  React.useEffect(() => {
    const el = document.querySelector<HTMLInputElement>('[data-testid="input-premises-address"]');
    if (!el) return;
    if (!el.id) {
      /* CN:STEP2-LAYOUT-START */
      el.id = 'premisesSearch';
      /* CN:STEP2-LAYOUT-END */
    }
    el.setAttribute('aria-describedby', searchHelpId);
  }, [searchHelpId]);
  /* CN:STEP2-LAYOUT-END */

  /* CN:TEMPLATES-PREVIEW-START */
  /* CN:LICENSING-TEMPLATES-START */
  React.useEffect(() => {
    setIgnoreDomainWarning((prev) => (prev ? false : prev));
  }, [draft.councilEmail, draft.councilName]);
  /* CN:LICENSING-TEMPLATES-END */
  /* CN:TEMPLATES-PREVIEW-END */

  const representationIso = React.useMemo(() => {
    if (draft.repsDeadline) return draft.repsDeadline;
    if (!draft.applicationDate) return '';
    const computed = calculateRepresentationDeadline(draft.applicationDate);
    return Number.isNaN(computed.getTime()) ? '' : computed.toISOString();
  }, [draft.applicationDate, draft.repsDeadline]);

  /* CN:STEP2-COMPLIANCE-START */
  const representationDisplay = representationIso ? formatDisplayDate(representationIso) : '—';
  /* CN:STEP2-COMPLIANCE-END */

  const handleAddressSelect = (option: AddressOption) => {
    const composed = option.label || [option.line1, option.city ?? option.town, option.postcode].filter(Boolean).join(', ');
    const postcode = option.postcode || '';
    onChange({ premisesAddress: composed, postcode }, { ensureUrn: true });
    if (!postcode) return;
    const res = lookupCouncilByPostcode(postcode);
    if (!res) return;
    lookedUpEmail.current = res.councilEmail || '';
    lookedUpName.current = res.councilName || '';
    lookedUpAddress.current = res.councilAddress || '';
    onChange(
      {
        councilName: res.councilName || draft.councilName,
        councilEmail: res.councilEmail || draft.councilEmail,
        councilAddress: res.councilAddress || draft.councilAddress,
      },
      { ensureUrn: true }
    );
  };

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
            <AddressAutocomplete
              label="Premises address (search)"
              onSelect={handleAddressSelect}
              inputTestId="input-premises-address"
            />
            <p id={searchHelpId} className="mt-1 min-h-5 text-xs text-neutral-500">
              Start typing to look up the premises and pre-fill council details.
            </p>
          </div>
          <div className="col-span-12 md:col-span-8">
            <label htmlFor="premisesAddress" className={UI.label}>
              Premises address<span className="text-rose-600">*</span>
            </label>
            <textarea
              id="premisesAddress"
              ref={refs.premisesAddress as React.RefObject<HTMLTextAreaElement>}
              className={`${UI.input} min-h-[96px] w-full rounded-xl px-3 text-sm`}
              value={draft.premisesAddress}
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
              aria-describedby={postcodeHelpId}
            />
            <p id={postcodeHelpId} className="mt-1 min-h-5 text-xs text-neutral-500">
              Matches the final notice address.
            </p>
          </div>
          <div className="col-span-12 md:col-span-6">
            <label htmlFor="councilName" className={UI.label}>
              Council name<span className="text-rose-600">*</span>
            </label>
            <input
              id="councilName"
              ref={refs.councilName}
              className={`${UI.input} h-11 w-full rounded-xl px-3 text-sm`}
              data-testid="input-council-name"
              value={draft.councilName}
              onChange={(e) => onChange({ councilName: e.target.value }, { ensureUrn: true })}
              aria-describedby={councilNameHelpId}
            />
            <p id={councilNameHelpId} className="mt-1 min-h-5 text-xs text-neutral-500">
              Licensing authority responsible for this notice.
            </p>
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
            <input
              id="councilEmail"
              type="email"
              ref={refs.councilEmail}
              className={`${UI.input} h-11 w-full rounded-xl px-3 text-sm`}
              data-testid="input-council-email"
              value={draft.councilEmail}
              onChange={(e) => onChange({ councilEmail: e.target.value }, { ensureUrn: true })}
              aria-describedby={councilEmailHelpId}
            />
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
              Council address <span className="text-xs font-normal text-slate-500">(optional)</span>
            </label>
            <textarea
              id="councilAddress"
              ref={refs.councilAddress as React.RefObject<HTMLTextAreaElement>}
              className={`${UI.input} min-h-[96px] w-full rounded-xl px-3 text-sm`}
              data-testid="input-council-address"
              value={draft.councilAddress}
              onChange={(e) => onChange({ councilAddress: e.target.value }, { ensureUrn: true })}
              aria-describedby={councilAddressHelpId}
            />
            <p id={councilAddressHelpId} className="mt-1 min-h-5 text-xs text-neutral-500">
              Provide if the council requests a postal address for representations.
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
            <label htmlFor="submissionDate" className={UI.label}>
              Date of submission<span className="text-rose-600">*</span>
            </label>
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
            <p id={submissionHelpId} className="mt-1 min-h-5 text-xs text-neutral-500">
              When you submitted the application to the licensing authority.
            </p>
          </div>
          <div className="col-span-12 md:col-span-6">
            <label htmlFor="representationDeadline" className={UI.label}>
              Representation deadline
            </label>
            <input
              id="representationDeadline"
              className="h-11 w-full rounded-xl border border-[rgba(25,38,80,0.12)] bg-neutral-50 px-3 text-sm text-neutral-700"
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
          <div className="col-span-12 space-y-3">
            <div className="flex items-start gap-3">
              <input
                id="confirm-a"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                checked={confirmA}
                onChange={(e) => onConfirmAChange(e.target.checked)}
              />
              <label htmlFor="confirm-a" className="text-sm leading-5 text-slate-800">
                I confirm the above text is a true and accurate copy of the notice published/displayed.
              </label>
            </div>
            <div className="flex items-start gap-3">
              <input
                id="confirm-b"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                checked={confirmB}
                onChange={(e) => onConfirmBChange(e.target.checked)}
              />
              <label htmlFor="confirm-b" className="text-sm leading-5 text-slate-800">
                I understand that supplying false information is an offence.
              </label>
            </div>
          </div>
        </div>
      </fieldset>
      {/* CN:STEP2-LAYOUT-END */}
    </div>
  );
}
/* CN:STEP2-END */

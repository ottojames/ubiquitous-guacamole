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
import { calculateRepresentationDeadline, formatLicensingDate } from '@/lib/dates/licensing';
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
  const requiredOk =
    draft.applicantName.trim() &&
    draft.premisesAddress.trim() &&
    draft.postcode.trim() &&
    draft.councilName.trim() &&
    draft.councilEmail.trim() &&
    draft.applicationDate.trim();
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
    // When on Step 2, prefer focusing inline Required details inputs via refs
    if (step === 2) {
      const map: Record<string, React.RefObject<HTMLInputElement | HTMLTextAreaElement> | undefined> = {
        applicant: refs.applicant,
        applicantName: refs.applicant,
        addr: refs.premisesAddress,
        'premises-address': refs.premisesAddress,
        councilName: refs.councilName,
        councilEmail: refs.councilEmail,
        councilAddr: refs.councilAddress,
        councilAddress: refs.councilAddress,
        appDate: refs.applicationDate,
        applicationDate: refs.applicationDate,
        repsMissing: refs.applicationDate,
      };
      const r = map[target];
      if (r?.current) {
        r.current.focus();
        r.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setErrors((er) => ({ ...er, [toErrorKey(target)]: 'This field is required' }));
        return;
      }
    }
    // Fallback: focus element by id
    const el = document.getElementById(target) as HTMLElement | null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (el?.querySelector('input,select,textarea,button,[tabindex]') as HTMLElement | null)?.focus?.();
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
              <FileDropOCR
                onText={(t) => {
                  setText(t);
                  setDraft((d) => ({ ...d, finalText: t }));
                }}
                onMeta={(m) => setDraft((d) => ({ ...d, originalFileMeta: m }))}
              />
              <section className={UI.section} data-testid="required-inline">
                {/* CN:STEP2-START */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-brand-navy">Licensing Act 2003 details</h3>
                    <p className="mt-1 text-xs text-slate-600">Complete each section to continue.</p>
                  </div>
                  <span
                    className="inline-block rounded bg-brand-lilac text-brand-navy ring-1 ring-brand-blue/20 px-2 py-0.5 text-xs"
                    data-testid="required-inline-counter"
                  >
                    {(() => {
                      const checks = [
                        !!draft.applicantName?.trim(),
                        !!draft.premisesAddress?.trim(),
                        !!draft.postcode?.trim(),
                        !!draft.councilName?.trim(),
                        !!draft.councilEmail?.trim(),
                        !!draft.applicationDate?.trim(),
                      ].filter(Boolean).length;
                      return `Required: ${checks}/6`;
                    })()}
                  </span>
                </div>
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
              <div className="flex items-center justify-between">
                <button
                  className={UI.btnSecondary}
                  onClick={handleBack}
                  data-testid="btn-back"
                >
                  Back
                </button>
                <div className="flex gap-2">
                  <button
                    className={UI.btnPrimary}
                    disabled={!text && !(requiredOk && confirmA && confirmB)}
                    onClick={() => setStep(3)}
                    data-testid="btn-continue"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    className="rounded-md border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-white"
                    data-testid="link-skip-ocr"
                    onClick={() => setStep(3)}
                  >
                    {/* CN:STEP2-START */}Enter details manually{/* CN:STEP2-END */}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
        <aside className="md:col-span-1 md:sticky md:top-[var(--headerH)] space-y-4">
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
              <PreviewCard text={text} />
              <ComplianceCard items={runMandatoryChecks(draft)} onFix={handleFix} />
              <KeyDatesCard
                applicationDate={draft.applicationDate}
                representationDeadline={draft.repsDeadline || ''}
                consultationDays={28}
              />
              <CostCard cost={0} canSubmit={canContinue && step === 3} />
            </>
          )}
          {/* CN:STEP1-END */}
        </aside>
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
  const manualAddressHelpId = React.useId();
  const referenceHelpId = React.useId();
  const deadlineHelpId = React.useId();
  const lookedUpEmail = React.useRef('');
  const lookedUpName = React.useRef('');
  const lookedUpAddress = React.useRef('');

  const representationIso = React.useMemo(() => {
    if (draft.repsDeadline) return draft.repsDeadline;
    if (!draft.applicationDate) return '';
    const computed = calculateRepresentationDeadline(draft.applicationDate);
    return Number.isNaN(computed.getTime()) ? '' : computed.toISOString();
  }, [draft.applicationDate, draft.repsDeadline]);

  const representationDisplay = representationIso ? formatLicensingDate(representationIso) : '—';

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
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-brand-navy">Applicant details</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="applicantName" className={UI.label}>
              Applicant name<span className="text-rose-600">*</span>
            </label>
            <input
              id="applicantName"
              ref={refs.applicant}
              className={UI.input}
              data-testid="input-applicant-name"
              value={draft.applicantName}
              onChange={(e) => onChange({ applicantName: e.target.value }, { ensureUrn: true })}
            />
          </div>
          <div>
            <label htmlFor="urn" className={UI.label}>
              URN / Reference <span className="text-xs font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="urn"
              className={UI.input}
              value={draft.urn || ''}
              onChange={(e) => onChange({ urn: e.target.value })}
              aria-describedby={referenceHelpId}
            />
            <p id={referenceHelpId} className="mt-1 text-xs text-slate-600">
              Auto-generated when you start editing; update if your authority provided a specific reference.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/80 pt-6">
        <h3 className="text-sm font-semibold text-brand-navy">Premises &amp; Council details</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div id="premises-address" className="md:col-span-2">
            <AddressAutocomplete
              label="Premises address (search)"
              onSelect={handleAddressSelect}
              inputTestId="input-premises-address"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="premisesAddressManual" className={UI.label}>
              Premises address<span className="text-rose-600">*</span>
            </label>
            <textarea
              id="premisesAddressManual"
              ref={refs.premisesAddress as React.RefObject<HTMLTextAreaElement>}
              className={`${UI.input} min-h-[96px]`}
              value={draft.premisesAddress}
              onChange={(e) => onChange({ premisesAddress: e.target.value }, { ensureUrn: true })}
              aria-describedby={manualAddressHelpId}
            />
            <p id={manualAddressHelpId} className="mt-1 text-xs text-slate-600">
              Search above, then adjust the address exactly as it should appear on the notice.
            </p>
          </div>
          <div>
            <label htmlFor="postcode" className={UI.label}>
              Postcode<span className="text-rose-600">*</span>
            </label>
            <input
              id="postcode"
              className={UI.input}
              value={draft.postcode}
              onChange={(e) => onChange({ postcode: e.target.value }, { ensureUrn: true })}
            />
          </div>
          <div>
            <label htmlFor="councilName" className={UI.label}>
              Council name<span className="text-rose-600">*</span>
            </label>
            <input
              id="councilName"
              ref={refs.councilName}
              className={UI.input}
              data-testid="input-council-name"
              value={draft.councilName}
              onChange={(e) => onChange({ councilName: e.target.value }, { ensureUrn: true })}
            />
            {lookedUpName.current && draft.councilName && draft.councilName !== lookedUpName.current && (
              <span className="mt-1 inline-block rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                Value differs from council directory
              </span>
            )}
          </div>
          <div>
            <label htmlFor="councilEmail" className={UI.label}>
              Council email<span className="text-rose-600">*</span>
            </label>
            <input
              id="councilEmail"
              type="email"
              ref={refs.councilEmail}
              className={UI.input}
              data-testid="input-council-email"
              value={draft.councilEmail}
              onChange={(e) => onChange({ councilEmail: e.target.value }, { ensureUrn: true })}
            />
            {lookedUpEmail.current && draft.councilEmail && draft.councilEmail !== lookedUpEmail.current && (
              <span className="mt-1 inline-block rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                Value differs from council directory
              </span>
            )}
          </div>
          <div className="md:col-span-2">
            <label htmlFor="councilAddress" className={UI.label}>
              Council address <span className="text-xs font-normal text-slate-500">(optional)</span>
            </label>
            <textarea
              id="councilAddress"
              ref={refs.councilAddress as React.RefObject<HTMLTextAreaElement>}
              className={`${UI.input} min-h-[96px]`}
              data-testid="input-council-address"
              value={draft.councilAddress}
              onChange={(e) => onChange({ councilAddress: e.target.value }, { ensureUrn: true })}
            />
            {lookedUpAddress.current && draft.councilAddress && draft.councilAddress !== lookedUpAddress.current && (
              <span className="mt-1 inline-block rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                Value differs from council directory
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/80 pt-6">
        <h3 className="text-sm font-semibold text-brand-navy">Dates &amp; declarations</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="applicationDate" className={UI.label}>
              Date of submission<span className="text-rose-600">*</span>
            </label>
            <input
              id="applicationDate"
              type="date"
              ref={refs.applicationDate}
              className={UI.input}
              data-testid="input-application-date"
              value={draft.applicationDate}
              onChange={(e) => handleSubmissionDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="representationDeadline" className={UI.label}>
              Representation deadline
            </label>
            <input
              id="representationDeadline"
              className={`${UI.input} bg-slate-50 text-slate-700`}
              value={representationDisplay}
              readOnly
              aria-readonly="true"
              aria-describedby={deadlineHelpId}
              data-testid="input-representation-deadline"
              aria-live="polite"
            />
            <p id={deadlineHelpId} className="mt-1 text-xs text-slate-600">
              Auto-calculated as 28 calendar days after the submission date.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
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
    </div>
  );
}
/* CN:STEP2-END */

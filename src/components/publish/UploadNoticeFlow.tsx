import React, { useEffect, useState } from 'react';
import ProgressBar from './ProgressBar';
import FileDropOCR from '@/components/upload/FileDropOCR';
import PreviewCard from '@/components/publish/RightRail/PreviewCard';
import ComplianceCard from '@/components/publish/RightRail/ComplianceCard';
import KeyDatesCard from '@/components/publish/RightRail/KeyDatesCard';
import CostCard from '@/components/publish/RightRail/CostCard';
import { lookupCouncilByPostcode } from '@/lib/councilLookup';
import { runMandatoryChecks, calcRepsDeadline } from '@/lib/licensing/checks';
import * as UI from '@/styles/ui';
import type { NoticeDraft, NoticeType } from '@/types/notice';
import { sha256Hex } from '@/lib/hash';
import ApplicantCouncilSection from './sections/ApplicantCouncilSection';
import ApplicationBasicsSection from './sections/ApplicationBasicsSection';
// CN:STEP1-START
import NoticeTypeStep, { isLicensingNoticeType } from './sections/NoticeTypeStep';
// CN:STEP1-END

export default function UploadNoticeFlow() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<NoticeDraft>({
    id: '',
    createdAt: '',
    noticeType: undefined,
    applicantName: '',
    applicantEmail: '',
    premisesAddress: '',
    postcode: '',
    councilName: '',
    councilEmail: '',
    councilAddress: '',
    blueNoticeUploads: [],
    status: 'Draft',
    applicationDate: '',
  });
  // CN:STEP1-START
  const noticeTypeRef = React.useRef<HTMLSelectElement>(null);
  const [noticeTypeError, setNoticeTypeError] = useState('');
  // CN:STEP1-END
  const [confirmA, setConfirmA] = useState(false);
  const [confirmB, setConfirmB] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const refs = {
    applicant: React.useRef<HTMLInputElement>(null),
    premisesAddress: React.useRef<HTMLInputElement>(null),
    councilName: React.useRef<HTMLInputElement>(null),
    councilEmail: React.useRef<HTMLInputElement>(null),
    councilAddress: React.useRef<HTMLInputElement>(null),
    applicationDate: React.useRef<HTMLInputElement>(null),
  } as const;
  const requiredOk =
    draft.applicantName.trim() &&
    draft.postcode.trim() &&
    draft.councilName.trim() &&
    draft.councilEmail.trim() &&
    draft.councilAddress.trim() &&
    draft.applicationDate.trim();
  const canContinue = requiredOk && confirmA && confirmB;

  const handleBack = () => setStep((prev) => Math.max(1, (prev as number) - 1) as 1 | 2 | 3 | 4);
  const handleNext = () => setStep((prev) => Math.min(4, (prev as number) + 1) as 1 | 2 | 3 | 4);
  // CN:STEP1-START
  const handleContinueFromStep1 = () => {
    if (!isLicensingNoticeType(draft.noticeType)) {
      setNoticeTypeError('Select a notice type to continue.');
      noticeTypeRef.current?.focus();
      return;
    }
    setNoticeTypeError('');
    setStep(2);
  };
  const canContinueFromStep1 = isLicensingNoticeType(draft.noticeType);
  // CN:STEP1-END

  // CN:STEP1-START
  // On mount: read ?type= and set draft.noticeType if valid
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('type') ?? undefined;
    if (isLicensingNoticeType(t)) {
      setDraft((d) => ({ ...d, noticeType: t as NoticeType }));
    }
  }, []);
  // CN:STEP1-END

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
    if (!draft.applicationDate) return;
    const expected = calcRepsDeadline(draft.applicationDate);
    if (draft.repsDeadline !== expected) {
      setDraft((d) => ({ ...d, repsDeadline: expected }));
    }
  }, [draft.applicationDate]);

  const toErrorKey = (target: string) => (target === 'premises-address' ? 'premisesAddress' : target);
  const handleFix = (target?: string) => {
    if (!target) return;
    // When on Step 2, prefer focusing inline Required details inputs via refs
    if (step === 2) {
      const map: Record<string, React.RefObject<HTMLInputElement> | undefined> = {
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
          // CN:STEP1-START
          {step === 1 && (
            <>
              <NoticeTypeStep
                ref={noticeTypeRef}
                value={draft.noticeType}
                error={noticeTypeError}
                onResetError={() => setNoticeTypeError('')}
                onChange={(t) => {
                  setDraft((d) => ({ ...d, noticeType: t }));
                  const params = new URLSearchParams(window.location.search);
                  params.set('type', t);
                  window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
                }}
              />
              <div className="mt-4">
                <button
                  type="button"
                  className={`${UI.btnPrimary} ${!canContinueFromStep1 ? 'cursor-not-allowed opacity-60' : ''}`}
                  data-testid="btn-continue-step1"
                  onClick={handleContinueFromStep1}
                  aria-disabled={!canContinueFromStep1}
                >
                  Continue
                </button>
              </div>
            </>
          )}
          // CN:STEP1-END
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
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-brand-navy">Required details (Licensing Act 2003)</h3>
                  <span
                    className="inline-block rounded bg-brand-lilac text-brand-navy ring-1 ring-brand-blue/20 px-2 py-0.5 text-xs"
                    data-testid="required-inline-counter"
                  >
                    {(() => {
                      const c = [
                        !!draft.applicantName?.trim(),
                        !!draft.postcode?.trim(),
                        !!draft.councilName?.trim(),
                        !!draft.councilEmail?.trim(),
                        !!draft.councilAddress?.trim(),
                        !!draft.applicationDate?.trim(),
                      ].filter(Boolean).length;
                      return `Required: ${c}/6`;
                    })()}
                  </span>
                </div>
                <ApplicantCouncilSection
                  draft={draft}
                  onChange={(p) => setDraft((d) => ({ ...d, ...p }))}
                  refs={refs}
                />
                <ApplicationBasicsSection
                  draft={draft}
                  onChange={(p) => setDraft((d) => ({ ...d, ...p }))}
                  refs={refs}
                />
                <div className="mt-4 flex items-center gap-2">
                  <input
                    id="confirm-a"
                    type="checkbox"
                    checked={confirmA}
                    onChange={(e) => setConfirmA(e.target.checked)}
                  />
                  <label htmlFor="confirm-a" className="text-sm">
                    I confirm the above text is a true and accurate copy of the notice published/displayed.
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="confirm-b"
                    type="checkbox"
                    checked={confirmB}
                    onChange={(e) => setConfirmB(e.target.checked)}
                  />
                  <label htmlFor="confirm-b" className="text-sm">
                    I understand that supplying false information is an offence.
                  </label>
                </div>
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
                <ApplicantCouncilSection
                  draft={draft}
                  onChange={(p) => setDraft((d) => ({ ...d, ...p }))}
                  refs={refs}
                />
                <ApplicationBasicsSection
                  draft={draft}
                  onChange={(p) => setDraft((d) => ({ ...d, ...p }))}
                  refs={refs}
                />
                <div className="mt-4 flex items-center gap-2">
                  <input
                    id="confirm-a"
                    type="checkbox"
                    checked={confirmA}
                    onChange={(e) => setConfirmA(e.target.checked)}
                  />
                  <label htmlFor="confirm-a" className="text-sm">
                    I confirm the above text is a true and accurate copy of the notice published/displayed.
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="confirm-b"
                    type="checkbox"
                    checked={confirmB}
                    onChange={(e) => setConfirmB(e.target.checked)}
                  />
                  <label htmlFor="confirm-b" className="text-sm">
                    I understand that supplying false information is an offence.
                  </label>
                </div>
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
                    Skip OCR for now
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
        <aside className="md:col-span-1 md:sticky md:top-[var(--headerH)] space-y-4">
          <PreviewCard text={text} />
          <ComplianceCard items={runMandatoryChecks(draft)} onFix={handleFix} />
          <KeyDatesCard
            applicationDate={draft.applicationDate}
            representationDeadline={draft.repsDeadline || ''}
            consultationDays={28}
          />
          <CostCard cost={0} canSubmit={canContinue && step === 3} />
        </aside>
      </div>
    </div>
  );
}

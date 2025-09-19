import React from 'react';
import * as UI from '@/styles/ui';
import NoticePreview from '@/components/publish/NoticePreview';
import ComplianceCard from '@/components/publish/RightRail/ComplianceCard';
import { buildChecklist } from '../checks';
import { buildNoticeText } from '../noticeRenderer';
import { useTemplateBuilder, useTemplateNotice, useTemplateStep } from '../TemplateBuilderProvider';

export default function StepConfirm() {
  const notice = useTemplateNotice();
  const [, setStep] = useTemplateStep();
  const { patchNotice } = useTemplateBuilder();
  const [confirmed, setConfirmed] = React.useState(false);
  const preview = React.useMemo(() => buildNoticeText(notice), [notice]);
  const checklist = React.useMemo(() => buildChecklist(notice), [notice]);

  const handleContinue = () => {
    if (!confirmed) return;
    patchNotice({});
    setStep(4);
  };

  return (
    <div className="space-y-6">
      <section className={`${UI.card} p-5 md:p-6 space-y-4`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-blue-900">Confirm your notice</h2>
            <p className="mt-1 text-sm text-slate-600">
              Review the generated text. Use the buttons below to copy or download a proof.
            </p>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-blue-700 underline underline-offset-2"
            onClick={() => setStep(2)}
          >
            Edit details
          </button>
        </div>
        <NoticePreview text={preview} />
        <div className="flex items-start gap-3 border-t border-slate-200 pt-4">
          <input
            id="confirm-notice"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <label htmlFor="confirm-notice" className="text-sm text-slate-700">
            I confirm the notice text is complete and accurate.
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <button type="button" className={`${UI.btnSecondary} h-11 px-6 text-sm`} onClick={() => setStep(2)}>
            Back
          </button>
          <button
            type="button"
            className={`${UI.btnPrimary} h-11 px-6 text-sm ${!confirmed ? 'cursor-not-allowed opacity-50' : ''}`}
            aria-disabled={!confirmed}
            onClick={handleContinue}
          >
            Continue to payment
          </button>
        </div>
      </section>
      <ComplianceCard items={checklist} onFix={() => setStep(2)} />
    </div>
  );
}

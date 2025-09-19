import React from 'react';
import ProgressBar from '@/components/publish/ProgressBar';
import * as UI from '@/styles/ui';
import { TemplateBuilderProvider, useTemplateBuilder, useTemplateStep } from './TemplateBuilderProvider';
import StepType from './steps/StepType';
import StepBuild from './steps/StepBuild';
import StepConfirm from './steps/StepConfirm';
import StepPay from './steps/StepPay';
import TemplatePreviewRail from './TemplatePreviewRail';

const labels = ['Confirm Notice Type', 'Build Your Notice', 'Confirm Your Notice', 'Pay'];

function FlowContent() {
  const { state } = useTemplateBuilder();
  const [step] = useTemplateStep();
  const [showToast, setShowToast] = React.useState(false);

  React.useEffect(() => {
    if (state.restoredFromDraft) {
      setShowToast(true);
      const timer = window.setTimeout(() => setShowToast(false), 3000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [state.restoredFromDraft]);

  return (
    <div className="space-y-6">
      {showToast && (
        <div className="rounded-xl bg-blue-600/90 px-4 py-3 text-sm text-white shadow-lg" role="status">
          Draft restored
        </div>
      )}
      <div className={`grid gap-8 md:grid-cols-3 ${showToast ? 'pt-2' : ''}`}>
        <main className="md:col-span-2 space-y-6">
          <ProgressBar step={step as 1 | 2 | 3 | 4} totalSteps={4} labels={labels} />
          {step === 1 && <StepType />}
          {step === 2 && <StepBuild />}
          {step === 3 && <StepConfirm />}
          {step === 4 && <StepPay />}
        </main>
        <aside className="md:col-span-1 md:sticky md:top-[var(--headerH)]">
          <TemplatePreviewRail />
        </aside>
      </div>
    </div>
  );
}

export default function TemplateUploadFlow() {
  return (
    <TemplateBuilderProvider>
      <div data-testid="template-flow-root" className={`${UI.sectionY}`}>
        <FlowContent />
      </div>
    </TemplateBuilderProvider>
  );
}

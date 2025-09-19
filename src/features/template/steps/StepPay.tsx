import React from 'react';
import * as UI from '@/styles/ui';
import { useTemplateStep } from '../TemplateBuilderProvider';

export default function StepPay() {
  const [, setStep] = useTemplateStep();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Placeholder for payment integration
    alert('Payment processing not yet implemented.');
  };

  return (
    <section className={`${UI.card} p-5 md:p-6 space-y-4`}>
      <div>
        <h2 className="text-base font-semibold text-blue-900">Payment details</h2>
        <p className="mt-1 text-sm text-slate-600">Complete your payment to submit this notice.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Payment integration coming soon.
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <button type="button" className={`${UI.btnSecondary} h-11 px-6 text-sm`} onClick={() => setStep(3)}>
            Back
          </button>
          <button type="submit" className={`${UI.btnPrimary} h-11 px-6 text-sm`}>
            Pay now
          </button>
        </div>
      </form>
    </section>
  );
}

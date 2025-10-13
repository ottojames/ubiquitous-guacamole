import React from "react";
import * as UI from "@/styles/ui";
import type { NoticeDefinition } from "@/next/publish/config/noticeTypes";
import type { NoticeBase } from "@/types/notice";

export type PaymentStepProps = {
  definition: NoticeDefinition;
  notice: NoticeBase | null;
  onBack: () => void;
  onSubmit: () => void;
  submitting?: boolean;
};

export default function PaymentStep({ definition, notice, onBack, onSubmit, submitting }: PaymentStepProps) {
  return (
    <section
      className={`${UI.wizardCard} space-y-12 p-0`}
      data-testid="payment-step"
      aria-busy={submitting ? "true" : undefined}
    >
      <header className="space-y-6 px-8 pb-0 pt-10 sm:px-12">
        <span className={UI.wizardPill}>Step 4</span>
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-[34px]">Complete payment to submit</h2>
          <p className="max-w-3xl text-base leading-7 text-slate-600">
            Capture payment securely and issue proof instantly once the transaction succeeds.
          </p>
        </div>
      </header>

      <div className="space-y-6 px-6 pb-10 sm:px-12">
        <div className="rounded-2xl border border-slate-200/70 bg-white/85 p-5 text-sm text-slate-700 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <p><strong className="text-slate-900">Notice type:</strong> {definition.label}</p>
          {notice?.publication?.newspaper ? (
            <p><strong className="text-slate-900">Newspaper:</strong> {notice.publication.newspaper}</p>
          ) : null}
          {notice?.publication?.targetDate ? (
            <p><strong className="text-slate-900">Target publication date:</strong> {notice.publication.targetDate}</p>
          ) : null}
          {notice?.publication?.priceExVat ? (
            <p>
              <strong className="text-slate-900">Quoted price:</strong> £{notice.publication.priceExVat.toFixed(2)} + VAT
            </p>
          ) : null}
        </div>

        <div className="space-y-3 rounded-2xl border border-dashed border-slate-300/70 bg-slate-50/80 p-5 text-sm text-slate-600 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <p className="font-semibold text-slate-700">Payment integration placeholder</p>
          <p>Connect Stripe checkout or Supabase functions here. We surface a final summary before charging the card.</p>
        </div>

        <footer className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-5 py-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <button type="button" className={UI.btnSecondary} onClick={onBack} data-testid="payment-step-back">
            Back
          </button>
          <button
            type="button"
            className={`${UI.btnPrimary} min-w-[200px]`}
            onClick={onSubmit}
            disabled={submitting}
            data-testid="payment-step-confirm"
          >
            {submitting ? "Processing…" : "Submit notice"}
          </button>
        </footer>
      </div>
    </section>
  );
}

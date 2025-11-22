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
      className="mx-auto max-w-6xl space-y-10"
      data-testid="payment-step"
      aria-busy={submitting ? "true" : undefined}
    >
      {/* Glass Section Header Card */}
      <header className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/95 p-4 sm:p-8 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-12">
        <div className="space-y-4 text-center">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
            Review & pay
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600">
            Capture payment securely and issue proof instantly once the transaction succeeds.
          </p>
        </div>
      </header>

      <div className="space-y-8">
        {/* Notice Summary Card */}
        <div className="rounded-3xl border border-slate-200/60 bg-white/95 p-4 sm:p-8 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm">
          <h3 className="mb-6 text-lg font-bold text-slate-900">Notice summary</h3>
          <dl className="grid gap-4 text-base sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-900">Notice type</dt>
              <dd className="mt-1 text-slate-600">{definition.label}</dd>
            </div>
            {notice?.publication?.newspaper && (
              <div>
                <dt className="font-semibold text-slate-900">Newspaper</dt>
                <dd className="mt-1 text-slate-600">{notice.publication.newspaper}</dd>
              </div>
            )}
            {notice?.publication?.targetDate && (
              <div>
                <dt className="font-semibold text-slate-900">Target publication date</dt>
                <dd className="mt-1 text-slate-600">{notice.publication.targetDate}</dd>
              </div>
            )}
            {notice?.publication?.priceExVat && (
              <div>
                <dt className="font-semibold text-slate-900">Quoted price</dt>
                <dd className="mt-1 text-slate-600">£{notice.publication.priceExVat.toFixed(2)} + VAT</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Payment Integration Placeholder */}
        <div className="space-y-4 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/80 p-4 sm:p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-200">
            <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">Payment integration</p>
            <p className="mt-2 text-base text-slate-600">Connect Stripe checkout or Supabase functions here. We surface a final summary before charging the card.</p>
          </div>
        </div>

        {/* Premium Sticky Action Bar */}
        <div className="sticky bottom-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/95 shadow-[0_16px_48px_rgba(15,23,42,0.15)] backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-6 px-8 py-6">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
                data-testid="payment-step-back"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div className="flex flex-1 items-center justify-end gap-6">
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">
                    {submitting ? "Processing payment..." : "Ready to submit"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Your notice will be published after successful payment.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={submitting}
                  className={`inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                    submitting
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-blue-600 text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:bg-blue-700 hover:shadow-[0_12px_32px_rgba(37,99,235,0.45)] hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                  data-testid="payment-step-confirm"
                >
                  {submitting ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Submit notice
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

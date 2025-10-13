import React from "react";
import * as UI from "@/styles/ui";
import type { NoticeDefinition } from "@/next/publish/config/noticeTypes";
import type { NoticeBase } from "@/types/notice";
import type { UploadMethod } from "./UploadMethodStep";

export type ConfirmStepProps = {
  definition: NoticeDefinition;
  notice: NoticeBase | null;
  uploadMethod: UploadMethod;
  onBack: () => void;
  onContinue: () => void;
  preview: React.ReactNode;
  metadata?: React.ReactNode;
  continueDisabled?: boolean;
  continuePending?: boolean;
};

export default function ConfirmStep({
  definition,
  notice,
  uploadMethod,
  onBack,
  onContinue,
  preview,
  metadata,
  continueDisabled,
  continuePending,
}: ConfirmStepProps) {
  return (
    <section
      className="mx-auto max-w-6xl space-y-10"
      data-testid="confirm-step"
      aria-busy={continuePending ? "true" : undefined}
    >
      {/* Glass Section Header Card */}
      <header className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/95 p-8 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-12">
        <div className="space-y-4 text-center">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
            Confirm your notice
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600">
            Review the generated notice and verify statutory details before continuing to payment.
          </p>
        </div>
      </header>

      <div className="grid gap-8 sm:grid-cols-12">
        <div className="space-y-4 sm:col-span-7">
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_20px_48px_rgba(15,23,42,0.12)]">
            {preview}
          </div>
        </div>

        <aside className="space-y-5 sm:col-span-5">
          <dl className="grid gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 text-sm text-slate-700 shadow-[0_12px_36px_rgba(15,23,42,0.08)] sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-900">Notice type</dt>
              <dd className="mt-1 text-slate-600">{definition.label}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Mode</dt>
              <dd className="mt-1 text-slate-600">
                {uploadMethod === "notice" ? "Uploaded notice" : "Template builder"}
              </dd>
            </div>
            {notice?.consultation?.applicationDate ? (
              <div>
                <dt className="font-semibold text-slate-900">Application date</dt>
                <dd className="mt-1 text-slate-600">{notice.consultation.applicationDate}</dd>
              </div>
            ) : null}
            {notice?.consultation?.repsDeadline ? (
              <div>
                <dt className="font-semibold text-slate-900">Representations deadline</dt>
                <dd className="mt-1 text-slate-600">{notice.consultation.repsDeadline}</dd>
              </div>
            ) : null}
          </dl>

          {metadata ? (
            <div className="rounded-2xl border border-dashed border-slate-300/70 bg-white/80 p-5 text-sm text-slate-600 shadow-[0_12px_32px_rgba(15,23,42,0.06)]" role="note">
              {metadata}
            </div>
          ) : null}
        </aside>
      </div>

      {/* Premium Sticky Action Bar */}
      <div className="sticky bottom-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/95 shadow-[0_16px_48px_rgba(15,23,42,0.15)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-6 px-8 py-6">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
              data-testid="confirm-step-back"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="flex flex-1 items-center justify-end gap-6">
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">
                  {continueDisabled ? "Review required" : "Ready to publish"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {continueDisabled
                    ? "Please verify all details are correct."
                    : "Proceed to payment to publish your notice."}
                </p>
              </div>
              <button
                type="button"
                onClick={onContinue}
                disabled={(continueDisabled ?? !notice) || continuePending}
                className={`inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                  (continueDisabled ?? !notice)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:bg-blue-700 hover:shadow-[0_12px_32px_rgba(37,99,235,0.45)] hover:scale-[1.02] active:scale-[0.98]'
                }`}
                data-testid="confirm-step-continue"
              >
                {continuePending ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Working...
                  </>
                ) : (
                  <>
                    Continue to payment
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

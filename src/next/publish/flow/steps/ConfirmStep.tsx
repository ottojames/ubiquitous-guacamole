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
      className={`${UI.wizardCard} space-y-8 p-0`}
      data-testid="confirm-step"
      aria-busy={continuePending ? "true" : undefined}
    >
      <header className="space-y-8 px-8 pb-0 pt-12 sm:px-12">
        <span className={UI.wizardPill}>Step 3</span>
        <div className="space-y-4">
          <h2 className="text-4xl font-bold leading-tight text-slate-900 sm:text-[40px] lg:text-5xl">Confirm your notice</h2>
          <p className="max-w-3xl text-lg leading-relaxed text-slate-600">
            Review the generated notice and verify statutory details before continuing to payment.
          </p>
        </div>
      </header>

      <div className="grid gap-8 px-6 pb-10 sm:grid-cols-12 sm:px-12">
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

      <div className="space-y-8 px-6 pb-12 sm:px-12">
        <footer className="sticky bottom-8 flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/95 px-6 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className={`${UI.btnSecondary} transition-all duration-200 hover:scale-[1.02]`}
            onClick={onBack}
            data-testid="confirm-step-back"
          >
            Back
          </button>
          <button
            type="button"
            className={`${UI.btnPrimary} min-w-[190px] transition-all duration-200 hover:scale-[1.02]`}
            onClick={onContinue}
            disabled={(continueDisabled ?? !notice) || continuePending}
            data-testid="confirm-step-continue"
          >
            {continuePending ? "Working…" : "Continue to payment"}
          </button>
        </footer>
      </div>
    </section>
  );
}

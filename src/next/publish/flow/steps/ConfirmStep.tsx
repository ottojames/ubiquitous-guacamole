import React from 'react';
import * as UI from '@/styles/ui';
import type { NoticeDefinition } from '@/next/publish/config/noticeTypes';
import type { NoticeBase } from '@/types/notice';
import type { UploadMethod } from './UploadMethodStep';

export type ConfirmStepProps = {
  definition: NoticeDefinition;
  notice: NoticeBase | null;
  uploadMethod: UploadMethod;
  onBack: () => void;
  onContinue: () => void;
  preview: React.ReactNode;
  metadata?: React.ReactNode;
  continueDisabled?: boolean;
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
}: ConfirmStepProps) {
  return (
    <section className={`${UI.card} p-6 space-y-6`} data-testid="confirm-step">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue/80">Step 3 · Confirm your notice</p>
        <h2 className="text-base font-semibold text-brand-navy">Review and finish</h2>
        <p className="text-sm text-neutral-600">
          Check the live preview, ensure the statutory wording reads correctly, and confirm deadlines before continuing to payment.
        </p>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white/70">
        {preview}
      </div>
      {metadata && (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 p-4 text-sm text-neutral-600">
          {metadata}
        </div>
      )}
      <div className="flex items-center justify-between">
        <button type="button" className={UI.btnSecondary} onClick={onBack} data-testid="confirm-step-back">
          Back
        </button>
        <button
          type="button"
          className={`${UI.btnPrimary} min-w-[180px]`}
          onClick={onContinue}
          disabled={continueDisabled ?? !notice}
          data-testid="confirm-step-continue"
        >
          Continue to payment
        </button>
      </div>
      <dl className="grid gap-4 rounded-xl border border-neutral-200 bg-white/80 p-4 text-sm text-neutral-700 md:grid-cols-2">
        <div>
          <dt className="font-semibold text-neutral-900">Notice type</dt>
          <dd className="mt-1 text-neutral-600">{definition.label}</dd>
        </div>
        <div>
          <dt className="font-semibold text-neutral-900">Upload method</dt>
          <dd className="mt-1 text-neutral-600">{uploadMethod === 'notice' ? 'Uploaded notice' : 'Template builder'}</dd>
        </div>
        {notice?.consultation?.applicationDate && (
          <div>
            <dt className="font-semibold text-neutral-900">Application date</dt>
            <dd className="mt-1 text-neutral-600">{notice.consultation.applicationDate}</dd>
          </div>
        )}
        {notice?.consultation?.repsDeadline && (
          <div>
            <dt className="font-semibold text-neutral-900">Representations deadline</dt>
            <dd className="mt-1 text-neutral-600">{notice.consultation.repsDeadline}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

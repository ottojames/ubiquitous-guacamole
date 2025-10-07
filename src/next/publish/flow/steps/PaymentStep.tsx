import React from 'react';
import * as UI from '@/styles/ui';
import type { NoticeDefinition } from '@/next/publish/config/noticeTypes';
import type { NoticeBase } from '@/types/notice';

export type PaymentStepProps = {
  definition: NoticeDefinition;
  notice: NoticeBase | null;
  onBack: () => void;
  onSubmit: () => void;
  submitting?: boolean;
};

export default function PaymentStep({ definition, notice, onBack, onSubmit, submitting }: PaymentStepProps) {
  return (
    <section className={`${UI.card} p-6 space-y-6`} data-testid="payment-step">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue/80">Step 4 · Pay</p>
        <h2 className="text-base font-semibold text-brand-navy">Complete your payment to submit this notice</h2>
        <p className="text-sm text-neutral-600">
          Payment details will be captured securely. Once payment succeeds we issue proof and schedule publication.
        </p>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white/70 p-4 text-sm text-neutral-700 space-y-2">
        <p><strong>Notice type:</strong> {definition.label}</p>
        {notice?.publication?.newspaper && <p><strong>Newspaper:</strong> {notice.publication.newspaper}</p>}
        {notice?.publication?.targetDate && <p><strong>Target publication date:</strong> {notice.publication.targetDate}</p>}
        {notice?.publication?.priceExVat && (
          <p><strong>Quoted price:</strong> £{notice.publication.priceExVat.toFixed(2)} + VAT</p>
        )}
      </div>
      <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 text-sm text-neutral-600 space-y-2">
        <p>Payment integration placeholder — connect to Stripe/Supabase functions in later phase.</p>
        <p>We will take payment details here and show a final summary before submission.</p>
      </div>
      <div className="flex items-center justify-between">
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
          {submitting ? 'Processing…' : 'Submit notice'}
        </button>
      </div>
    </section>
  );
}

import React, { useEffect, useState } from "react";
import * as UI from "@/styles/ui";
import type { NoticeDefinition } from "@/next/publish/config/noticeTypes";
import type { NoticeBase } from "@/types/notice";
import { useStripePayment } from "@/hooks/useStripePayment";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/UnifiedAuthContext";

export type PaymentStepProps = {
  definition: NoticeDefinition;
  notice: NoticeBase | null;
  onBack: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  firmSlug?: string | null;
};

interface AllowanceInfo {
  can_publish: boolean;
  reason: string;
  notices_remaining: number;
  overage_cost_gbp: number;
}

interface SubscriptionInfo {
  id: string;
  status: string;
  tier: {
    name: string;
    notices_per_month: number;
    additional_notice_price_gbp: number;
  };
}

export default function PaymentStep({ definition, notice, onBack, onSubmit, submitting, firmSlug }: PaymentStepProps) {
  const { createCheckoutSession, isProcessing, error: paymentError, isConfigured } = useStripePayment();
  const { organization, department } = useAuth(); // Get organization context from UnifiedAuth
  const [allowanceInfo, setAllowanceInfo] = useState<AllowanceInfo | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loadingAllowance, setLoadingAllowance] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Check if firm has allowance
  useEffect(() => {
    const checkAllowance = async () => {
      if (!firmSlug) {
        setLoadingAllowance(false);
        return;
      }

      try {
        // Get organization ID from slug
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', firmSlug)
          .eq('type', 'firm')
          .single();

        if (orgError || !orgData) {
          console.error('Failed to fetch organization:', orgError);
          setLoadingAllowance(false);
          return;
        }

        setOrganizationId(orgData.id);

        // Fetch subscription info
        const subResponse = await fetch(`/api/firm-subscriptions/organization/${orgData.id}`);
        if (!subResponse.ok) {
          setLoadingAllowance(false);
          return;
        }

        const subData = await subResponse.json();
        setSubscription(subData);

        // Check allowance via RPC function
        const { data: allowance, error: allowanceError } = await supabase
          .rpc('can_publish_notice', { p_organization_id: orgData.id });

        if (allowanceError) {
          console.error('Failed to check allowance:', allowanceError);
        } else if (allowance && allowance.length > 0) {
          setAllowanceInfo(allowance[0]);
        }
      } catch (error) {
        console.error('Error checking allowance:', error);
      } finally {
        setLoadingAllowance(false);
      }
    };

    checkAllowance();
  }, [firmSlug]);

  const handlePayment = async () => {
    console.log('[PaymentStep] handlePayment called');
    console.log('[PaymentStep] notice:', notice ? 'EXISTS' : 'NULL');
    console.log('[PaymentStep] isConfigured:', isConfigured);
    console.log('[PaymentStep] allowanceInfo:', allowanceInfo);
    console.log('[PaymentStep] organizationId:', organizationId);

    if (!notice) {
      console.error('[PaymentStep] Cannot submit: notice is null. This usually means form validation failed.');
      console.error('[PaymentStep] This indicates required fields are missing or invalid in the template form.');
      // Call onSubmit which will detect the validation failure and show specific field errors
      onSubmit();
      return;
    }

    // If firm has allowance, skip payment and directly submit
    if (allowanceInfo?.can_publish && allowanceInfo.reason === 'Within allowance' && organizationId) {
      try {
        // Record usage first
        const { error: usageError } = await supabase.rpc('record_notice_usage', {
          p_organization_id: organizationId,
          p_notice_id: notice.id || crypto.randomUUID()
        });

        if (usageError) {
          console.error('Failed to record usage:', usageError);
        }

        // Submit without payment
        onSubmit();
      } catch (error) {
        console.error('Error recording usage:', error);
        // Still submit even if usage recording fails
        onSubmit();
      }
      return;
    }

    // Otherwise, proceed with payment
    if (isConfigured) {
      console.log('[PaymentStep] Stripe configured - creating checkout session');
      await createCheckoutSession({
        noticeId: notice.id || crypto.randomUUID(),
        noticeType: definition.label,
        applicantEmail: notice.applicant.contactEmail,
      });
    } else {
      console.log('[PaymentStep] Stripe NOT configured - calling onSubmit directly');
      onSubmit();
    }
    console.log('[PaymentStep] handlePayment completed');
  };

  useEffect(() => {
    if (paymentError) {
      console.error('Payment error:', paymentError);
    }
  }, [paymentError]);

  // Show loading state while checking allowance
  if (loadingAllowance) {
    return (
      <section className="mx-auto max-w-6xl space-y-10" data-testid="payment-step">
        <header className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/95 p-4 sm:p-8 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-12">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
              Review & pay
            </h2>
            <div className="flex items-center justify-center gap-3 text-slate-600">
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Checking allowance...
            </div>
          </div>
        </header>
      </section>
    );
  }

  // Determine if using allowance
  const usingAllowance = allowanceInfo?.can_publish && allowanceInfo.reason === 'Within allowance';
  const hasOverage = allowanceInfo?.can_publish && allowanceInfo.reason === 'Overage charge will apply';

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
            {usingAllowance ? 'Review & submit' : 'Review & pay'}
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600">
            {usingAllowance
              ? 'This notice will be published using your subscription allowance.'
              : 'Capture payment securely and issue proof instantly once the transaction succeeds.'
            }
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

        {/* Allowance Status or Payment Section */}
        {usingAllowance && subscription ? (
          <div className="rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 sm:p-8 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-2">Using subscription allowance</h3>
                <p className="text-green-800 mb-4">
                  This notice will be published using your {subscription.tier.name} plan allowance. No additional charge will be applied.
                </p>
                <div className="grid grid-cols-2 gap-4 p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                  <div>
                    <p className="text-sm font-semibold text-green-900">Notices remaining</p>
                    <p className="text-2xl font-bold text-green-700">{allowanceInfo.notices_remaining}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-900">Monthly allowance</p>
                    <p className="text-2xl font-bold text-green-700">{subscription.tier.notices_per_month}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : hasOverage && subscription ? (
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 sm:p-8 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-900 mb-2">Overage charge applies</h3>
                <p className="text-amber-800 mb-4">
                  You've used all {subscription.tier.notices_per_month} notices in your monthly allowance. This notice will incur an overage charge.
                </p>
                <div className="p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-amber-900">£{allowanceInfo.overage_cost_gbp.toFixed(2)}</p>
                    <p className="text-amber-700">overage fee</p>
                  </div>
                  <p className="text-sm text-amber-700 mt-2">
                    This will be added to your next monthly invoice. Consider upgrading your plan for more included notices.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200/60 bg-white/95 p-4 sm:p-8 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm">
            <h3 className="mb-6 text-lg font-bold text-slate-900">Payment details</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-900">Public Notice Publication</p>
                  <p className="text-sm text-slate-600 mt-1">One-time publication fee</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">£50</p>
              </div>

              {paymentError && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                  <p className="font-semibold">Payment error</p>
                  <p className="text-sm mt-1">{paymentError}</p>
                </div>
              )}

              {!isConfigured && (
                <div className="p-4 bg-amber-50 text-amber-700 rounded-lg">
                  <p className="font-semibold">Test mode</p>
                  <p className="text-sm mt-1">Payment processing is not configured. In production, this will redirect to Stripe checkout.</p>
                </div>
              )}
            </div>
          </div>
        )}

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
                    {submitting ? "Processing..." : usingAllowance ? "Ready to submit" : "Ready to pay"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {usingAllowance
                      ? `Using ${allowanceInfo?.notices_remaining} of ${subscription?.tier.notices_per_month} remaining notices`
                      : hasOverage
                      ? 'Overage charge will be added to your next invoice'
                      : 'Your notice will be published after successful payment.'
                    }
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={submitting || isProcessing}
                  className={`inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                    submitting || isProcessing
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : usingAllowance
                      ? 'bg-green-600 text-white shadow-[0_8px_24px_rgba(22,163,74,0.35)] hover:bg-green-700 hover:shadow-[0_12px_32px_rgba(22,163,74,0.45)] hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-blue-600 text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:bg-blue-700 hover:shadow-[0_12px_32px_rgba(37,99,235,0.45)] hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                  data-testid="payment-step-confirm"
                >
                  {submitting || isProcessing ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      {usingAllowance ? 'Submit notice' : hasOverage ? 'Submit (overage applies)' : isConfigured ? 'Proceed to payment' : 'Submit notice'}
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

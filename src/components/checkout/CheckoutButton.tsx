import { Loader2, CreditCard } from 'lucide-react';
import * as UI from '@/styles/ui';
import { useStripePayment, type CreateCheckoutSessionParams } from '@/hooks/useStripePayment';

export type CheckoutButtonProps = {
  noticeId: string;
  noticeType: string;
  applicantEmail: string;
  /** Button text, defaults to "Pay £50" */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
};

export function CheckoutButton({
  noticeId,
  noticeType,
  applicantEmail,
  label = 'Pay £50',
  className = '',
  disabled = false,
}: CheckoutButtonProps) {
  const { createCheckoutSession, isProcessing, error, isConfigured } = useStripePayment();

  const handleClick = async () => {
    const params: CreateCheckoutSessionParams = {
      noticeId,
      noticeType,
      applicantEmail,
    };
    await createCheckoutSession(params);
  };

  const isDisabled = disabled || isProcessing || !isConfigured;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={`${UI.btnPrimary} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
        ) : (
          <CreditCard className="h-5 w-5 mr-2" />
        )}
        {isProcessing ? 'Processing...' : label}
      </button>
      {error && (
        <p className="mt-2 text-sm text-rose-600">{error}</p>
      )}
      {!isConfigured && (
        <p className="mt-2 text-sm text-amber-600">
          Payment system not available. Please contact support.
        </p>
      )}
    </div>
  );
}

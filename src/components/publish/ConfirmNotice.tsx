import React from 'react';

export type ConfirmNoticeProps = {
  noticeText: string;
  confirmed: boolean;
  onConfirmedChange: (next: boolean) => void;
  onConfirmAndContinue: () => void;
  isSubmitting?: boolean;
  ready?: boolean;
};

export default function ConfirmNotice({
  noticeText,
  confirmed,
  onConfirmedChange,
  onConfirmAndContinue,
  isSubmitting = false,
  ready = true,
}: ConfirmNoticeProps) {
  const disabled = !confirmed || !ready || isSubmitting;
  const showMissingDetails = !ready;
  const displayText = noticeText.trim();

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Confirm your notice</h1>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <div className="notice-preview whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-gray-900">
          {displayText || 'Notice content will appear here once generated.'}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <input
          id="confirm-notice"
          type="checkbox"
          className="mt-1 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          checked={confirmed}
          onChange={(event) => onConfirmedChange(event.target.checked)}
        />
        <label htmlFor="confirm-notice" className="text-sm text-gray-700">
          I confirm the above notice text is correct and ready to be published.
        </label>
      </div>

      {showMissingDetails && (
        <p className="mt-2 text-sm text-amber-600">
          Complete all required licensing details before continuing to payment.
        </p>
      )}

      <div className="mt-6">
        <button
          type="button"
          disabled={disabled}
          onClick={onConfirmAndContinue}
          data-testid="btn-continue"
          className={`w-full rounded-2xl px-4 py-2 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-auto ${
            disabled ? 'cursor-not-allowed bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
          aria-disabled={disabled}
        >
          {isSubmitting ? 'Processing…' : 'Continue to payment'}
        </button>
      </div>
    </div>
  );
}

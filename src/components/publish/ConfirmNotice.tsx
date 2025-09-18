import React from 'react';
import { sanitiseNoticeText } from '@/lib/text/sanitiseNotice';
import { canContinueFromConfirm, hasNoticeText } from '@/features/publish/confirmReady';

export type ConfirmNoticeProps = {
  noticeText: string;
  confirmed: boolean;
  onConfirmedChange: (next: boolean) => void;
  onConfirmAndContinue: () => void;
  onNoticeTextChange: (value: string) => void;
  isSubmitting?: boolean;
  detailsReady?: boolean;
  onReturnToDetails?: () => void;
};

export default function ConfirmNotice({
  noticeText,
  confirmed,
  onConfirmedChange,
  onConfirmAndContinue,
  onNoticeTextChange,
  isSubmitting = false,
  detailsReady = true,
  onReturnToDetails,
}: ConfirmNoticeProps) {
  const [editMode, setEditMode] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const ready = canContinueFromConfirm({ noticeText, confirmed });
  const disabled = !ready || isSubmitting;
  const noticeHasContent = hasNoticeText(noticeText);
  const readinessMessage = !noticeHasContent
    ? 'Add or paste your notice text before continuing.'
    : !confirmed
    ? 'Please confirm the notice text is correct before continuing.'
    : null;
  const displayText = sanitiseNoticeText(noticeText);

  React.useEffect(() => {
    if (!editMode) return;
    const node = textareaRef.current;
    if (!node) return;
    node.focus();
    const end = node.value.length;
    try {
      node.setSelectionRange(end, end);
    } catch {
      /* ignore */
    }
  }, [editMode]);

  const handleToggleEdit = () => {
    setEditMode((prev) => !prev);
    onConfirmedChange(false);
  };

  const handleNoticeChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onNoticeTextChange(event.target.value);
  };

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-white">Confirm your notice</h1>
        <button
          type="button"
          className="rounded-xl border px-3 py-1 text-sm font-medium text-indigo-600 border-indigo-200 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/90"
          onClick={handleToggleEdit}
        >
          {editMode ? 'Done editing' : 'Edit notice text'}
        </button>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-base font-medium text-gray-900">Final notice</div>
          <button
            type="button"
            onClick={handleToggleEdit}
            className="rounded-xl border px-3 py-1 text-sm font-medium text-indigo-600 border-indigo-200 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={editMode ? 'Finish editing notice text' : 'Edit notice text'}
          >
            {editMode ? 'Done' : 'Edit notice text'}
          </button>
        </div>
        {!editMode ? (
          <div className="notice-preview whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-gray-900">
            {displayText || 'Your preview will appear here after you upload or type your notice text.'}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={noticeText}
            onChange={handleNoticeChange}
            className="notice-preview mt-2 w-full min-h-[320px] rounded-2xl border border-slate-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            aria-label="Edit notice text"
          />
        )}
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

      {!ready && readinessMessage && (
        <p className="mt-2 text-sm text-amber-700">{readinessMessage}</p>
      )}

      {!detailsReady && onReturnToDetails && (
        <button
          type="button"
          onClick={onReturnToDetails}
          className="mt-3 text-sm font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Review licensing details in Step 2
        </button>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={onConfirmAndContinue}
        data-testid="btn-continue"
        className={`mt-4 w-full rounded-2xl px-4 py-2 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-auto ${
          disabled ? 'cursor-not-allowed bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
        aria-disabled={disabled}
      >
        {isSubmitting ? 'Processing…' : 'Continue to payment'}
      </button>
    </div>
  );
}

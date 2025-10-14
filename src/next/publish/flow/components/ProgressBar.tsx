import React from "react";

type ProgressBarProps = {
  completed: number;
  total: number;
  /** Optional message to display */
  message?: string;
  /** If true, shows success state */
  isComplete?: boolean;
};

/**
 * Persistent bottom progress bar
 * Appears once first required field is touched
 * Shows progress: "X of Y required fields completed"
 * Stripe-level microinteractions
 */
export default function ProgressBar({ completed, total, message, isComplete }: ProgressBarProps) {
  const percentage = Math.min(100, Math.round((completed / total) * 100));
  const remaining = total - completed;

  // Don't show if nothing started yet
  if (completed === 0 && !isComplete) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[200] animate-in slide-in-from-bottom-2 fade-in duration-300"
      role="status"
      aria-live="polite"
      aria-label={`${completed} of ${total} required fields completed`}
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 to-transparent backdrop-blur-sm" />

      {/* Container */}
      <div className="relative mx-auto max-w-4xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/95 shadow-[0_-4px_24px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-200">
          {/* Progress fill */}
          <div className="relative h-1.5 bg-slate-100">
            <div
              className={`absolute inset-y-0 left-0 rounded-r-full transition-all duration-500 ease-out ${
                isComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                  : 'bg-gradient-to-r from-blue-600 to-blue-500'
              }`}
              style={{ width: `${percentage}%` }}
            >
              {/* Animated shimmer on progress bar */}
              {!isComplete && percentage < 100 && (
                <div className="absolute inset-0 animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                  isComplete
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                {isComplete ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {isComplete ? (
                    <span className="flex items-center gap-2">
                      All required fields completed
                      <span className="inline-flex h-5 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <span className="inline-block h-1 w-1 rounded-full bg-emerald-500" />
                        Ready
                      </span>
                    </span>
                  ) : (
                    `${completed} of ${total} required fields completed`
                  )}
                </p>
                {message && !isComplete && (
                  <p className="mt-0.5 text-xs text-slate-500">{message}</p>
                )}
                {!isComplete && remaining > 0 && !message && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {remaining} field{remaining === 1 ? '' : 's'} remaining
                  </p>
                )}
              </div>
            </div>

            {/* Percentage badge */}
            <div className="hidden sm:block">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold transition-all duration-300 ${
                  isComplete
                    ? 'bg-emerald-50 text-emerald-700'
                    : percentage >= 75
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span className="text-sm">{percentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add shimmer keyframe to tailwind config or use inline animation
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }

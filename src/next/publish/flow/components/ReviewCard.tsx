import React, { useState } from "react";

type ReviewTab = "issues" | "dates" | "detections";

export type ComplianceItem = {
  key: string;
  label: string;
  status: 'found' | 'missing' | 'review';
};

export type KeyDate = {
  label: string;
  value: string;
  variant?: 'default' | 'warning' | 'error';
};

export type Detection = {
  field: string;
  value: string;
  confidence: number;
};

type ReviewCardProps = {
  complianceItems: ComplianceItem[];
  keyDates: KeyDate[];
  detections?: Detection[];
  onItemClick?: (key: string) => void;
  recommendedWarnings?: string[];
};

/**
 * Consolidated Review card with tabs
 * Tabs: Issues (n) | Key dates | Detections
 * Stripe-level polish with smooth transitions
 */
export default function ReviewCard({
  complianceItems,
  keyDates,
  detections = [],
  onItemClick,
  recommendedWarnings = [],
}: ReviewCardProps) {
  const [activeTab, setActiveTab] = useState<ReviewTab>("issues");

  const issueCount = complianceItems.filter(
    (item) => item.status === 'missing' || item.status === 'review'
  ).length;

  const tabs: Array<{ key: ReviewTab; label: string; badge?: number }> = [
    { key: "issues", label: "Issues", badge: issueCount },
    { key: "dates", label: "Key dates" },
    ...(detections.length > 0 ? [{ key: "detections" as ReviewTab, label: "Detections" }] : []),
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* Header with tabs */}
      <div className="border-b border-slate-200/60 bg-slate-50/50 px-5 py-4">
        <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
          Review
        </h3>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold transition-colors duration-150 ${
                    activeTab === tab.key
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
              {/* Active indicator */}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-5">
        {/* Issues tab */}
        {activeTab === "issues" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {issueCount === 0 ? (
              <div className="rounded-xl bg-emerald-50/80 p-4 text-center">
                <svg
                  className="mx-auto h-8 w-8 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="mt-2 text-sm font-medium text-emerald-900">All required fields complete</p>
                <p className="mt-1 text-xs text-emerald-700">Ready to proceed</p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {complianceItems.map((item) => {
                  const iconColor =
                    item.status === 'found'
                      ? 'text-emerald-500'
                      : item.status === 'review'
                      ? 'text-amber-500'
                      : 'text-rose-500';
                  const bgColor =
                    item.status === 'found'
                      ? 'bg-emerald-50/50'
                      : item.status === 'review'
                      ? 'bg-amber-50/50'
                      : 'bg-rose-50/50';
                  const textColor =
                    item.status === 'found'
                      ? 'text-slate-700'
                      : item.status === 'review'
                      ? 'text-amber-900'
                      : 'text-rose-900';

                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => onItemClick?.(item.key)}
                        className={`group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-all duration-150 hover:scale-[1.01] hover:shadow-sm ${bgColor} ${textColor}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${iconColor.replace('text-', 'bg-')}`} />
                          {item.label}
                          {item.status === 'missing' && ' (required)'}
                          {item.status === 'review' && ' (needs review)'}
                        </span>
                        <svg
                          className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Recommended warnings */}
            {recommendedWarnings.length > 0 && (
              <div className="mt-4 space-y-2 rounded-xl border border-amber-200/70 bg-amber-50/80 p-3">
                <p className="text-xs font-semibold text-amber-900">Recommended</p>
                <ul className="space-y-1.5 text-xs text-amber-800">
                  {recommendedWarnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-0.5 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-amber-500" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Key dates tab */}
        {activeTab === "dates" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <dl className="space-y-3">
              {keyDates.map((date, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg bg-slate-50/50 px-3 py-2.5">
                  <dt className="text-xs font-medium text-slate-600">{date.label}</dt>
                  <dd
                    className={`text-sm font-semibold ${
                      date.variant === 'error'
                        ? 'text-rose-700'
                        : date.variant === 'warning'
                        ? 'text-amber-700'
                        : 'text-slate-900'
                    }`}
                  >
                    {date.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Detections tab */}
        {activeTab === "detections" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <p className="text-xs text-slate-500">Auto-detected fields from your uploaded document</p>
            <ul className="space-y-2">
              {detections.map((detection, index) => (
                <li key={index} className="rounded-lg border border-slate-200/60 bg-slate-50/50 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">{detection.field}</span>
                    <span
                      className={`text-[10px] font-semibold ${
                        detection.confidence >= 0.8
                          ? 'text-emerald-600'
                          : detection.confidence >= 0.5
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {Math.round(detection.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{detection.value}</p>
                  {/* Confidence bar */}
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        detection.confidence >= 0.8
                          ? 'bg-emerald-500'
                          : detection.confidence >= 0.5
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${detection.confidence * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

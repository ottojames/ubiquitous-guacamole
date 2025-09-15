import React from 'react';
import * as UI from '@/styles/ui';

export default function KeyDatesCard({
  applicationDate,
  representationDeadline,
}: {
  applicationDate: string;
  representationDeadline: string;
  consultationDays: number;
}) {
  return (
    <div className={`${UI.card} ${UI.cardHover} p-4 md:p-5`} aria-label="Key dates">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-blue-900">Key dates</h3>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          title="Per Licensing Act 2003"
          aria-label="Why these dates?"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-4 w-4"
          >
            <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 9v4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 6h.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="text-sm text-[#192650]">Application date: {applicationDate || '—'}</div>
      <div className="text-sm mt-1 text-[#192650]">Representation deadline (per Licensing Act 2003): {representationDeadline}</div>
    </div>
  );
}

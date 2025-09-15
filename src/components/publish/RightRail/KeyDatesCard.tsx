import React, { useState } from 'react';
import * as UI from '@/styles/ui';

export default function KeyDatesCard({ applicationDate, representationDeadline, consultationDays }: { applicationDate: string; representationDeadline: string; consultationDays: number }) {
  const [why, setWhy] = useState(false);
  return (
    <div className={`${UI.card} ${UI.cardHover} p-4 md:p-5`} aria-label="Key dates">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-blue-900">Key dates</h3>
        <button
          type="button"
          onClick={() => setWhy(!why)}
          className="text-xs underline transition-all duration-200 ease-[cubic-bezier(.2,.8,.2,1)] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-white"
          aria-expanded={why}
        >
          Why?
        </button>
      </div>
      <div className="text-sm text-[#192650]">Application date: {applicationDate || '—'}</div>
      <div className="text-sm mt-1 text-[#192650]">Representation deadline (per Licensing Act 2003): {representationDeadline}</div>
      {why && (
        <p className="mt-2 text-xs text-slate-700">
          Deadline is the day after application plus {consultationDays} days, skipping weekends and bank holidays.
        </p>
      )}
    </div>
  );
}

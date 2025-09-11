import React, { useState } from 'react';
import * as UI from '@/styles/ui';

export default function KeyDatesCard({ applicationDate, representationDeadline, consultationDays }: { applicationDate: string; representationDeadline: string; consultationDays: number }) {
  const [why, setWhy] = useState(false);
  return (
    <div className={UI.card + ' p-4'} aria-label="Key dates">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-brand-navy">Key dates</h3>
        <button
          type="button"
          onClick={() => setWhy(!why)}
          className="text-xs underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          aria-expanded={why}
        >
          Why?
        </button>
      </div>
      <div className="text-sm text-brand-navy">Application date: {applicationDate || '—'}</div>
      <div className="text-sm mt-1 text-brand-navy">Representation deadline (per Licensing Act 2003): {representationDeadline}</div>
      {why && (
        <p className="mt-2 text-xs text-brand-slate">
          Deadline is the day after application plus {consultationDays} days, skipping weekends and bank holidays.
        </p>
      )}
    </div>
  );
}

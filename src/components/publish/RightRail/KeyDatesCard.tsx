import React, { useState } from 'react';

export default function KeyDatesCard({ applicationDate, representationDeadline, consultationDays }: { applicationDate: string; representationDeadline: string; consultationDays: number }) {
  const [why, setWhy] = useState(false);
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm mt-4" aria-label="Key dates">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium">Key dates</h3>
        <button type="button" onClick={() => setWhy(!why)} className="text-xs underline" aria-expanded={why}>Why?</button>
      </div>
      <div className="text-sm">Application date: {applicationDate || '—'}</div>
      <div className="text-sm mt-1">Representation deadline (per Licensing Act 2003): {representationDeadline}</div>
      {why && (
        <p className="mt-2 text-xs text-slate-600">
          Deadline is the day after application plus {consultationDays} days, skipping weekends and bank holidays.
        </p>
      )}
    </div>
  );
}

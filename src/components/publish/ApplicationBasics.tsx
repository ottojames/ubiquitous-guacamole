import React, { useState } from 'react';
import { calcRepDeadline } from '@/lib/date';

export type ApplicationBasicsValue = {
  applicationType: 'grant' | 'variation' | 'review';
  premisesTradingName: string;
  applicationDate: string; // ISO yyyy-mm-dd
  representationDeadline: string; // ISO yyyy-mm-dd
  variationSummary?: string;
  region: 'EW' | 'SC' | 'NI';
};

export default function ApplicationBasics({ value, onChange }: { value: ApplicationBasicsValue; onChange: (v: ApplicationBasicsValue) => void }) {
  function set<K extends keyof ApplicationBasicsValue>(k: K, v: ApplicationBasicsValue[K]) {
    onChange({ ...value, [k]: v });
  }
  const [editDeadline, setEditDeadline] = useState(false);

  const onAppDate = (iso: string) => {
    const region = value.region === 'SC' ? 'scotland' : 'england_wales';
    const deadline = calcRepDeadline(iso, region);
    onChange({ ...value, applicationDate: iso, representationDeadline: deadline });
  };

  return (
    <div className="rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-lg font-medium text-slate-900">Application basics</h2>
        <p className="text-sm text-slate-500 mt-1">Calculated per Licensing Act (+28 days from the day after your application date). Change only if your council instructs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="applicationType" className="block text-sm font-medium">Application type<span className="text-rose-600">*</span></label>
          <select
            id="applicationType"
            className="w-full rounded-lg border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/30"
            value={value.applicationType}
            onChange={(e) => set('applicationType', e.target.value as any)}
          >
            <option value="grant">Grant</option>
            <option value="variation">Full Variation</option>
            <option value="review">Review</option>
          </select>
          {value.applicationType === 'variation' && (
            <p className="text-xs text-slate-500 mt-1">Briefly describe the changes sought (e.g., extend alcohol hours to 01:00 Fri–Sat; add Late Night Refreshment 23:00–02:00).</p>
          )}
        </div>
        <div data-error={!value.premisesTradingName.trim()}>
          <label htmlFor="premisesTradingName" className="block text-sm font-medium">Premises trading name<span className="text-rose-600">*</span></label>
          <input
            id="premisesTradingName"
            className="w-full rounded-lg border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/30"
            value={value.premisesTradingName}
            onChange={(e) => set('premisesTradingName', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="applicationDate" className="block text-sm font-medium">Application date<span className="text-rose-600">*</span></label>
          <input
            id="applicationDate"
            type="date"
            className="w-full rounded-lg border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/30"
            value={value.applicationDate}
            onChange={(e) => onAppDate(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="representationDeadline" className="block text-sm font-medium">Representation deadline<span className="text-rose-600">*</span></label>
            <button type="button" className="text-xs underline" onClick={() => setEditDeadline((v) => !v)}>{editDeadline ? 'Lock' : 'Edit'}</button>
          </div>
          <input
            id="representationDeadline"
            type="date"
            className="w-full rounded-lg border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-60"
            value={value.representationDeadline}
            onChange={(e) => set('representationDeadline', e.target.value)}
            disabled={!editDeadline}
            aria-describedby="deadline-help"
          />
          <p id="deadline-help" className="text-xs text-slate-500 mt-1">Calculated per Licensing Act (+28 days from the day after your application date). Change only if your council instructs.</p>
        </div>
        <div>
          <label htmlFor="region" className="block text-sm font-medium">Region wording</label>
          <select
            id="region"
            className="w-full rounded-lg border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/30"
            value={value.region}
            onChange={(e) => {
              const region = e.target.value as any;
              const deadline = calcRepDeadline(value.applicationDate, region === 'SC' ? 'scotland' : 'england_wales');
              onChange({ ...value, region, representationDeadline: deadline });
            }}
          >
            <option value="EW">England & Wales</option>
            <option value="SC">Scotland</option>
            <option value="NI">Northern Ireland</option>
          </select>
        </div>
      </div>

      {value.applicationType === 'variation' && (
        <div data-error={!value.variationSummary?.trim()}>
          <label className="block text-sm font-medium">Variation details</label>
          <textarea
            className="w-full rounded-lg border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/30"
            rows={2}
            value={value.variationSummary || ''}
            onChange={(e) => set('variationSummary', e.target.value)}
            placeholder="e.g. Extend alcohol hours to 01:00 Fri–Sat; add Late Night Refreshment 23:00–02:00"
          />
        </div>
      )}
    </div>
  );
}

import React, { useMemo } from 'react';
import { Activity as ActivitySchema } from '@/schemas/premises';

export type ActivityForm = {
  kind: 'alcohol' | 'late_night_refreshment' | 'recorded_music' | 'live_music' | 'films';
  days: 'everyday' | 'mon_thu' | 'fri_sat' | 'sun' | string[];
  start: string;
  end: string;
  alcoholOnOff?: 'on' | 'off' | 'on_off';
};

export type DetailsState = {
  applicationType: 'grant' | 'variation' | 'review';
  premisesTradingName: string;
  applicationDate: string; // ISO
  representationDeadline: string; // ISO
  variationSummary?: string;
  activities: ActivityForm[];
};

export default function ApplicationDetails({
  value,
  onChange,
}: {
  value: DetailsState;
  onChange: (next: DetailsState) => void;
}) {
  function set<K extends keyof DetailsState>(k: K, v: DetailsState[K]) {
    onChange({ ...value, [k]: v });
  }

  function addActivity() {
    onChange({
      ...value,
      activities: [
        ...value.activities,
        { kind: 'alcohol', days: 'everyday', start: '09:00', end: '23:00', alcoholOnOff: 'on_off' },
      ],
    });
  }

  function setActivity(i: number, next: ActivityForm) {
    const arr = value.activities.slice();
    arr[i] = next;
    onChange({ ...value, activities: arr });
  }

  function removeActivity(i: number) {
    const arr = value.activities.slice();
    arr.splice(i, 1);
    onChange({ ...value, activities: arr });
  }

  const deadlineHelper = 'We\'ve calculated 28 days from the day after your application date. Change if instructed by your council.';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Application type</label>
          <select
            className="w-full border rounded p-2"
            value={value.applicationType}
            onChange={(e) => set('applicationType', e.target.value as any)}
          >
            <option value="grant">Grant</option>
            <option value="variation">Full Variation</option>
            <option value="review">Review</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Premises trading name</label>
          <input
            className="w-full border rounded p-2"
            value={value.premisesTradingName}
            onChange={(e) => set('premisesTradingName', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Application date</label>
          <input
            type="date"
            className="w-full border rounded p-2"
            value={value.applicationDate}
            onChange={(e) => {
              const iso = e.target.value;
              const d = new Date(iso);
              const deadline = new Date(d.getTime() + 29 * 24 * 60 * 60 * 1000); // day after + 28
              const isoDeadline = deadline.toISOString().slice(0, 10);
              onChange({ ...value, applicationDate: iso, representationDeadline: isoDeadline });
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Representation deadline</label>
          <input
            type="date"
            title={deadlineHelper}
            className="w-full border rounded p-2"
            value={value.representationDeadline}
            onChange={(e) => set('representationDeadline', e.target.value)}
          />
          <p className="text-xs text-slate-600 mt-1">{deadlineHelper}</p>
        </div>
      </div>

      {value.applicationType === 'variation' && (
        <div>
          <label className="block text-sm font-medium">Variation summary</label>
          <textarea
            className="w-full border rounded p-2"
            value={value.variationSummary || ''}
            onChange={(e) => set('variationSummary', e.target.value)}
            rows={2}
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">Activities & hours</label>
          <button type="button" className="text-sm underline" onClick={addActivity}>+ Add activity</button>
        </div>
        <p className="text-xs text-slate-600">Add each licensable activity and its hours. For alcohol, choose On, Off, or On & Off.</p>
        <div className="space-y-3">
          {value.activities.map((a, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-600">Activity</label>
                <select
                  className="w-full border rounded p-2"
                  value={a.kind}
                  onChange={(e) => setActivity(i, { ...a, kind: e.target.value as any })}
                >
                  <option value="alcohol">Supply of alcohol</option>
                  <option value="late_night_refreshment">Late night refreshment</option>
                  <option value="recorded_music">Recorded music</option>
                  <option value="live_music">Live music</option>
                  <option value="films">Films</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600">Days</label>
                <select
                  className="w-full border rounded p-2"
                  value={typeof a.days === 'string' ? a.days : 'custom'}
                  onChange={(e) => {
                    const v = e.target.value as any;
                    setActivity(i, { ...a, days: v === 'custom' ? ['Mon'] : v });
                  }}
                >
                  <option value="everyday">Every day</option>
                  <option value="mon_thu">Mon–Thu</option>
                  <option value="fri_sat">Fri–Sat</option>
                  <option value="sun">Sun</option>
                  <option value="custom">Custom…</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600">Start</label>
                <input className="w-full border rounded p-2" value={a.start} onChange={(e) => setActivity(i, { ...a, start: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-slate-600">End</label>
                <input className="w-full border rounded p-2" value={a.end} onChange={(e) => setActivity(i, { ...a, end: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-slate-600">Alcohol</label>
                <select
                  className="w-full border rounded p-2"
                  disabled={a.kind !== 'alcohol'}
                  value={a.alcoholOnOff || 'on_off'}
                  onChange={(e) => setActivity(i, { ...a, alcoholOnOff: e.target.value as any })}
                >
                  <option value="on_off">On & Off</option>
                  <option value="on">On</option>
                  <option value="off">Off</option>
                </select>
              </div>
              <div className="text-right">
                <button type="button" className="text-xs text-red-700 underline" onClick={() => removeActivity(i)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


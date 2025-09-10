import React from 'react';

export type ActivityRow = {
  kind: 'alcohol' | 'late_night_refreshment' | 'recorded_music' | 'live_music' | 'films';
  days: 'everyday' | 'mon_thu' | 'fri_sat' | 'sun' | string[];
  start: string;
  end: string;
  alcoholOnOff?: 'on' | 'off' | 'on_off';
};

export default function ActivitiesTable({ rows, onChange }: { rows: ActivityRow[]; onChange: (rows: ActivityRow[]) => void }) {
  const setAt = (i: number, next: ActivityRow) => {
    const arr = rows.slice();
    arr[i] = next;
    onChange(arr);
  };
  const add = () => onChange([...rows, { kind: 'alcohol', days: 'everyday', start: '09:00', end: '23:00', alcoholOnOff: 'on_off' }]);
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  const warning = (r: ActivityRow): string | null => {
    // Basic heuristics for UX hints
    if (r.kind === 'late_night_refreshment') {
      if (!(r.start >= '23:00' || r.end <= '05:00')) return 'LNR should be within 23:00–05:00';
    }
    if (r.end < r.start) return 'End earlier than start: treated as past midnight';
    return null;
  };

  const rowsInvalid = rows.length === 0 || rows.some((r) => !/^\d{2}:\d{2}$/.test(r.start) || !/^\d{2}:\d{2}$/.test(r.end));
  return (
    <div className="rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-4" data-error={rowsInvalid}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Activities & hours</h2>
        <button type="button" className="text-sm underline" onClick={add}>Add activity</button>
      </div>
      <p className="text-sm text-slate-500">Add each licensable activity separately. For alcohol, choose On, Off, or On & Off.</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-slate-600">
            <tr>
              <th className="py-2 pr-3">Activity</th>
              <th className="py-2 pr-3">Days</th>
              <th className="py-2 pr-3">Start</th>
              <th className="py-2 pr-3">End</th>
              <th className="py-2 pr-3">Alcohol</th>
              <th className="py-2 pr-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="align-top border-t">
                <td className="py-2 pr-3 w-[220px]">
                  <select className="w-full rounded-lg border-slate-300" value={r.kind} onChange={(e) => setAt(i, { ...r, kind: e.target.value as any })}>
                    <option value="alcohol">Supply of alcohol</option>
                    <option value="late_night_refreshment">Late night refreshment</option>
                    <option value="recorded_music">Recorded music</option>
                    <option value="live_music">Live music</option>
                    <option value="films">Films</option>
                  </select>
                </td>
                <td className="py-2 pr-3 w-[180px]">
                  <select className="w-full rounded-lg border-slate-300" value={typeof r.days === 'string' ? r.days : 'custom'} onChange={(e) => setAt(i, { ...r, days: e.target.value === 'custom' ? ['Mon'] : (e.target.value as any) })}>
                    <option value="everyday">Every day</option>
                    <option value="mon_thu">Mon–Thu</option>
                    <option value="fri_sat">Fri–Sat</option>
                    <option value="sun">Sun</option>
                    <option value="custom">Custom…</option>
                  </select>
                </td>
                <td className="py-2 pr-3 w-[120px]"><input className="w-full rounded-lg border-slate-300" value={r.start} onChange={(e) => setAt(i, { ...r, start: e.target.value })} /></td>
                <td className="py-2 pr-3 w-[120px]"><input className="w-full rounded-lg border-slate-300" value={r.end} onChange={(e) => setAt(i, { ...r, end: e.target.value })} /></td>
                <td className="py-2 pr-3 w-[180px]">
                  <select className="w-full rounded-lg border-slate-300 disabled:opacity-60" disabled={r.kind !== 'alcohol'} value={r.alcoholOnOff || 'on_off'} onChange={(e) => setAt(i, { ...r, alcoholOnOff: e.target.value as any })}>
                    <option value="on_off">On & Off</option>
                    <option value="on">On</option>
                    <option value="off">Off</option>
                  </select>
                </td>
                <td className="py-2 pr-3 text-right">
                  <button type="button" className="text-xs text-red-700 underline" onClick={() => remove(i)}>Remove</button>
                  {warning(r) && <div className="text-xs text-amber-700 mt-1">{warning(r)}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

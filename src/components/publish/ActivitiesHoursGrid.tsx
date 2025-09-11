import React from 'react';
import * as UI from '@/styles/ui';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] as const;
const ACTIVITIES: {key: ActivityKey; label: string; tip?: string}[] = [
  { key: 'alcohol_on', label: 'Alcohol (on sales)', tip: 'Consumption on the premises' },
  { key: 'alcohol_off', label: 'Alcohol (off sales)', tip: 'Takeaway or delivery' },
  { key: 'alcohol_on_off', label: 'Alcohol (on & off)' },
  { key: 'late_night_refreshment', label: 'Late night refreshment', tip: 'Hot food/drink 23:00–05:00' },
  { key: 'live_music', label: 'Live music' },
  { key: 'recorded_music', label: 'Recorded music' },
];

export type ActivityKey =
  | 'alcohol_on'
  | 'alcohol_off'
  | 'alcohol_on_off'
  | 'late_night_refreshment'
  | 'live_music'
  | 'recorded_music';

export type GridRow = {
  activity: ActivityKey;
  hours: Record<typeof DAYS[number], { start: string; end: string } | null>;
};

export interface ActivitiesHoursGridProps {
  value: GridRow[];
  onChange: (value: GridRow[]) => void;
}

function emptyRow(activity: ActivityKey): GridRow {
  const hours: GridRow['hours'] = {
    Mon: null, Tue: null, Wed: null, Thu: null, Fri: null, Sat: null, Sun: null,
  };
  return { activity, hours };
}

export function defaultGrid(): GridRow[] {
  return ACTIVITIES.map((a) => emptyRow(a.key));
}

export default function ActivitiesHoursGrid({ value, onChange }: ActivitiesHoursGridProps) {
  const setCell = (rowIdx: number, day: typeof DAYS[number], next: { start: string; end: string } | null) => {
    const nextRows = value.map((r, i) => i === rowIdx ? { ...r, hours: { ...r.hours, [day]: next } } : r);
    onChange(nextRows);
  };

  const copyMonToThu = (rowIdx: number) => {
    const mon = value[rowIdx].hours.Mon;
    if (!mon) return;
    const nextRows = value.map((r, i) => {
      if (i !== rowIdx) return r;
      return {
        ...r,
        hours: { ...r.hours, Tue: mon, Wed: mon, Thu: mon },
      };
    });
    onChange(nextRows);
  };

  const closeAll = (rowIdx: number) => {
    const nextRows = value.map((r, i) => i === rowIdx ? emptyRow(r.activity) : r);
    onChange(nextRows);
  };

  const cellWarning = (h: { start: string; end: string } | null) => {
    if (!h) return null;
    if (h.end && h.start && h.end <= h.start) return 'End is before start – crosses midnight';
    return null;
  };

  return (
    <div className="space-y-4" data-testid="activities-grid" id="activities-grid" tabIndex={-1}>
      <h2 className={UI.h2}>Activities & hours</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-card">
      <table className="w-full min-w-[600px] text-sm">
        <thead className="sticky top-0 bg-white z-10 text-left text-slate-600">
          <tr>
            <th className="py-2 pr-3">Activity</th>
            {DAYS.map((d) => (
              <th key={d} className="py-2 px-2 text-center">{d}</th>
            ))}
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {value.map((row, i) => (
            <tr key={row.activity} className="border-t align-top">
              <td className="py-2 pr-3 font-medium">
                {ACTIVITIES.find(a => a.key===row.activity)?.label}
                {ACTIVITIES.find(a => a.key===row.activity)?.tip && (
                  <span className="ml-1 text-slate-500" title={ACTIVITIES.find(a => a.key===row.activity)!.tip}>i</span>
                )}
              </td>
              {DAYS.map((d) => {
                const h = row.hours[d];
                return (
                  <td key={d} className="py-2 px-2">
                    <div className="flex flex-col items-center gap-1">
                      <input
                        type="time"
                        aria-label={`${d} start`}
                        value={h?.start || ''}
                        className={UI.input + ' w-24 text-sm'}
                        onChange={(e) => setCell(i, d, { start: e.target.value, end: h?.end || '' })}
                      />
                      <input
                        type="time"
                        aria-label={`${d} end`}
                        value={h?.end || ''}
                        className={UI.input + ' w-24 text-sm'}
                        onChange={(e) => setCell(i, d, { start: h?.start || '', end: e.target.value })}
                      />
                      {cellWarning(h) && (
                        <div className="text-[10px] text-amber-700" data-testid="midnight-warning">{cellWarning(h)}</div>
                      )}
                    </div>
                  </td>
                );
              })}
              <td className="py-2 px-2">
                <div className="flex flex-col gap-1">
                  <button type="button" className={UI.ghostPill + ' text-xs'} onClick={() => copyMonToThu(i)}>
                    Copy Mon→Thu
                  </button>
                  <button type="button" className={UI.ghostPill + ' text-xs'} onClick={() => closeAll(i)}>
                    Closed all day
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

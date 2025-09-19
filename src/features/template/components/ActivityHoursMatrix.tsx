import React from 'react';
import * as UI from '@/styles/ui';
import type { Activities, ActivityKey, WeekHours } from '../types';
import { DefaultWeekHours } from '../schema';

const activityDefinitions: Array<{
  key: ActivityKey;
  label: string;
  helper?: string;
}> = [
  { key: 'alcoholOn', label: 'Sale of alcohol (on the premises)' },
  { key: 'alcoholOff', label: 'Sale of alcohol (off the premises)' },
  { key: 'lateRefreshment', label: 'Late night refreshment', helper: 'Hot food or drink between 23:00 and 05:00.' },
  { key: 'liveMusic', label: 'Live music' },
  { key: 'recordedMusic', label: 'Recorded music' },
  { key: 'dance', label: 'Performance of dance' },
  { key: 'similar', label: 'Anything of a similar description' },
];

const days = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
] as const;

type Props = {
  value?: Activities;
  onChange: (next: Activities) => void;
};

function cloneWeekHours(week?: WeekHours | null): WeekHours {
  const source = week ?? DefaultWeekHours();
  return {
    mon: { ...source.mon },
    tue: { ...source.tue },
    wed: { ...source.wed },
    thu: { ...source.thu },
    fri: { ...source.fri },
    sat: { ...source.sat },
    sun: { ...source.sun },
  };
}

function activityEnabled(week?: WeekHours | null): boolean {
  if (!week) return false;
  return days.some((day) => week[day.id].enabled);
}

export default function ActivityHoursMatrix({ value, onChange }: Props) {
  const setActivity = (key: ActivityKey, updater: (current: WeekHours | undefined) => WeekHours) => {
    const baseValue = value ?? {};
    const next: Activities = { ...baseValue };
    next[key] = updater(baseValue[key]);
    onChange(next);
  };

  const toggleActivity = (key: ActivityKey, enable: boolean) => {
    if (!enable) {
      setActivity(key, (current) => {
        const base = cloneWeekHours(current);
        days.forEach((day) => {
          base[day.id].enabled = false;
        });
        return base;
      });
      return;
    }
    setActivity(key, (current) => {
      const base = cloneWeekHours(current);
      days.forEach((day) => {
        base[day.id].enabled = true;
        base[day.id].start = base[day.id].start || '09:00';
        base[day.id].end = base[day.id].end || '17:00';
      });
      return base;
    });
  };

  const setDayRange = (key: ActivityKey, day: typeof days[number]['id'], field: 'start' | 'end', valueForField: string) => {
    setActivity(key, (current) => {
      const base = cloneWeekHours(current);
      base[day].enabled = true;
      base[day][field] = valueForField;
      if (!base[day].start) base[day].start = '09:00';
      if (!base[day].end) base[day].end = '17:00';
      return base;
    });
  };

  const toggleDay = (key: ActivityKey, day: typeof days[number]['id'], enabled: boolean) => {
    setActivity(key, (current) => {
      const base = cloneWeekHours(current);
      base[day].enabled = enabled;
      if (enabled) {
        base[day].start = base[day].start || '09:00';
        base[day].end = base[day].end || '17:00';
      }
      return base;
    });
  };

  const copyToAllDays = (key: ActivityKey, from: typeof days[number]['id']) => {
    setActivity(key, (current) => {
      const base = cloneWeekHours(current);
      const source = base[from];
      days.forEach((day) => {
        base[day.id] = { ...source };
      });
      return base;
    });
  };

  return (
    <section className={`${UI.card} p-5 md:p-6 space-y-4`} aria-label="Licensable activities">
      <div>
        <h2 className="text-base font-semibold text-blue-900">Activities & hours</h2>
        <p className="mt-1 text-sm text-slate-600">Enable each activity and enter hours for the relevant days. Use 24-hour time.</p>
      </div>
      <div className="space-y-6">
        {activityDefinitions.map((activity) => {
          const week = value?.[activity.key];
          const enabled = activityEnabled(week);
          return (
            <div key={activity.key} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold text-blue-900">{activity.label}</h3>
                  {activity.helper && <p className="mt-1 text-sm text-slate-600">{activity.helper}</p>}
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-blue-900">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-blue-400 text-blue-600 focus:ring-blue-500"
                    checked={enabled}
                    onChange={(event) => toggleActivity(activity.key, event.target.checked)}
                  />
                  Enable
                </label>
              </div>
              {enabled && (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-600">
                      <tr>
                        <th className="py-2 pr-3">Day</th>
                        <th className="py-2 pr-3">Open</th>
                        <th className="py-2 pr-3">Start</th>
                        <th className="py-2 pr-3">End</th>
                        <th className="py-2 pr-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {days.map((day) => {
                        const range = week?.[day.id] ?? { enabled: false, start: '', end: '' };
                        return (
                          <tr key={day.id} className="border-t">
                            <td className="py-2 pr-3 font-medium text-slate-700">{day.label}</td>
                            <td className="py-2 pr-3">
                              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  checked={range.enabled}
                                  onChange={(event) => toggleDay(activity.key, day.id, event.target.checked)}
                                />
                                Open
                              </label>
                            </td>
                            <td className="py-2 pr-3">
                              <input
                                type="time"
                                className={`${UI.input} h-9 w-28 text-sm`}
                                value={range.start || ''}
                                disabled={!range.enabled}
                                onChange={(event) => setDayRange(activity.key, day.id, 'start', event.target.value)}
                              />
                            </td>
                            <td className="py-2 pr-3">
                              <input
                                type="time"
                                className={`${UI.input} h-9 w-28 text-sm`}
                                value={range.end || ''}
                                disabled={!range.enabled}
                                onChange={(event) => setDayRange(activity.key, day.id, 'end', event.target.value)}
                              />
                            </td>
                            <td className="py-2 pr-3 text-right">
                              <button
                                type="button"
                                className="text-xs font-medium text-blue-700 underline underline-offset-2"
                                onClick={() => copyToAllDays(activity.key, day.id)}
                              >
                                Copy to all
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

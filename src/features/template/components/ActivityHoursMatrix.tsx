import React from 'react';
import * as UI from '@/styles/ui';
import type { Activities, ActivityKey, WeekHours } from '../types';
import { DefaultWeekHours } from '../schema';
import InfoTooltip from './InfoTooltip';

const activityDefinitions: Array<{
  key: ActivityKey;
  label: string;
  description: React.ReactNode;
}> = [
  {
    key: 'alcoholOn',
    label: 'Sale of alcohol (on-sales)',
    description: 'Alcohol supplied for consumption on the premises.',
  },
  {
    key: 'alcoholOff',
    label: 'Sale of alcohol (off-sales)',
    description: 'Alcohol supplied for consumption away from the premises.',
  },
  {
    key: 'lateRefreshment',
    label: 'Late night refreshment',
    description: 'Hot food or drink served between 23:00 and 05:00.',
  },
  {
    key: 'liveMusic',
    label: 'Live music',
    description: 'Performances of live music to the public.',
  },
  {
    key: 'recordedMusic',
    label: 'Recorded music',
    description: 'Playing of recorded music to the public.',
  },
  {
    key: 'dance',
    label: 'Performance of dance',
    description: 'Any performance of dance for an audience.',
  },
  {
    key: 'similar',
    label: 'Anything of a similar description',
    description: (
      <span>
        Captures entertainment similar to live/recorded music or dance.{' '}
        <a
          href="https://www.gov.uk/guidance/alcohol-licensing"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-blue-700 underline"
        >
          Read guidance
        </a>
        .
      </span>
    ),
  },
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

const presets = [
  { label: '10:00–23:00', start: '10:00', end: '23:00' },
  { label: '12:00–00:00', start: '12:00', end: '00:00' },
];

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

  const setDayRange = (
    key: ActivityKey,
    day: (typeof days)[number]['id'],
    field: 'start' | 'end',
    valueForField: string
  ) => {
    setActivity(key, (current) => {
      const base = cloneWeekHours(current);
      base[day].enabled = true;
      base[day][field] = valueForField;
      if (!base[day].start) base[day].start = '09:00';
      if (!base[day].end) base[day].end = '17:00';
      return base;
    });
  };

  const toggleDayClosed = (key: ActivityKey, day: (typeof days)[number]['id'], closed: boolean) => {
    setActivity(key, (current) => {
      const base = cloneWeekHours(current);
      base[day].enabled = !closed;
      if (!closed) {
        base[day].start = base[day].start || '09:00';
        base[day].end = base[day].end || '17:00';
      }
      return base;
    });
  };

  const copyToAllDays = (key: ActivityKey, from: (typeof days)[number]['id']) => {
    setActivity(key, (current) => {
      const base = cloneWeekHours(current);
      const source = base[from];
      days.forEach((day) => {
        base[day.id] = { ...source };
      });
      return base;
    });
  };

  const applyPreset = (key: ActivityKey, start: string, end: string) => {
    setActivity(key, (current) => {
      const base = cloneWeekHours(current);
      days.forEach((day) => {
        base[day.id].enabled = true;
        base[day.id].start = start;
        base[day.id].end = end;
      });
      return base;
    });
  };

  const clearActivity = (key: ActivityKey) => {
    setActivity(key, (current) => {
      const base = cloneWeekHours(current);
      days.forEach((day) => {
        base[day.id].enabled = false;
      });
      return base;
    });
  };

  return (
    <section className={`${UI.card} p-5 md:p-6 space-y-4`} aria-label="Licensable activities" id="activities-grid">
      <div>
        <h2 className="text-base font-semibold text-blue-900">Activities &amp; hours</h2>
        <p className="mt-1 text-sm text-slate-600">
          Use 24-hour time. Mark days as closed where the activity is not authorised.
        </p>
      </div>
      <div className="space-y-6">
        {activityDefinitions.map((activity) => {
          const week = value?.[activity.key];
          const anyOpen = activityEnabled(week);
          return (
            <div
              key={activity.key}
              className={`rounded-2xl border p-4 transition ${
                anyOpen ? 'border-slate-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-semibold text-blue-900">{activity.label}</h3>
                  <InfoTooltip content={activity.description} label={`About ${activity.label}`} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {presets.map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => applyPreset(activity.key, preset.start, preset.end)}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={() => copyToAllDays(activity.key, 'mon')}
                  >
                    Copy Mon → all days
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={() => clearActivity(activity.key)}
                  >
                    Mark all closed
                  </button>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-slate-600">
                    <tr>
                      <th className="py-2 pr-3">Day</th>
                      <th className="py-2 pr-3">Closed</th>
                      <th className="py-2 pr-3">Start</th>
                      <th className="py-2 pr-3">End</th>
                      <th className="py-2 pr-3 text-right">Copy</th>
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
                                checked={!range.enabled}
                                onChange={(event) => toggleDayClosed(activity.key, day.id, event.target.checked)}
                              />
                              Closed
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
                              Copy to all days
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

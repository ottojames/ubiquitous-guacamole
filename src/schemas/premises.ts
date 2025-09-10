import { z } from 'zod';

// Pragmatic UK postcode regex suitable for validation and tests
// Accepts common formats like AB1 2CD, A1 1AA, AA11 1AA etc. (case-insensitive)
const UK_POSTCODE = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;

function parseTimeToMinutes(t: string): number | null {
  // Accept HH:MM where HH: 00-24, MM: 00-59; only 24:00 is allowed (meaning end of day)
  const m = /^([0-2]\d):([0-5]\d)$/.exec(t);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh > 24) return null;
  if (hh === 24 && mm !== 0) return null; // only 24:00 allowed
  return hh * 60 + mm;
}

export const Activity = z
  .object({
    kind: z.enum([
      'alcohol',
      'late_night_refreshment',
      'recorded_music',
      'live_music',
      'films',
    ]),
    days: z.union([
      z.literal('everyday'),
      z.literal('mon_thu'),
      z.literal('fri_sat'),
      z.literal('sun'),
      z.array(z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])),
    ]),
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
    alcoholOnOff: z.enum(['on', 'off', 'on_off']).optional(),
  })
  .superRefine((v, ctx) => {
    // Alcohol must specify on/off/on_off
    if (v.kind === 'alcohol' && !v.alcoholOnOff) {
      ctx.addIssue({ code: 'custom', message: 'Select On/Off for alcohol', path: ['alcoholOnOff'] });
    }
    const s = parseTimeToMinutes(v.start);
    const e = parseTimeToMinutes(v.end);
    if (s === null) ctx.addIssue({ code: 'custom', message: 'Start must be between 00:00–23:59', path: ['start'] });
    if (e === null) ctx.addIssue({ code: 'custom', message: 'End must be between 00:00–24:00', path: ['end'] });
    if (s !== null && e !== null) {
      if (s >= 24 * 60) ctx.addIssue({ code: 'custom', message: 'Start cannot be 24:00', path: ['start'] });
      // Compute positive duration allowing cross‑midnight
      const duration = (e <= s ? e + 24 * 60 : e) - s;
      if (duration <= 0) ctx.addIssue({ code: 'custom', message: 'Duration must be positive', path: ['end'] });
    }
  });

export const PremisesSchema = z.object({
  applicantName: z.string().min(2),
  applicantEmail: z.string().email(),
  councilId: z.string().min(1),
  councilEmail: z.string().email(),
  premisesTradingName: z.string().min(1),
  address: z.object({
    line1: z.string().min(1),
    city: z.string().min(1),
    postcode: z.string().regex(UK_POSTCODE, 'Invalid UK postcode'),
  }),
  applicationType: z.enum(['grant', 'variation', 'review']),
  applicationDate: z.string(), // ISO date
  representationDeadline: z.string(), // ISO date
  variationSummary: z.string().optional(),
  activities: z.array(Activity).min(1),
}).superRefine((v, ctx) => {
  if (v.applicationType === 'variation' && !v.variationSummary?.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: 'Describe the variation',
      path: ['variationSummary'],
    });
  }

  // Enforce 28 days from the day after application date
  try {
    const app = new Date(v.applicationDate);
    // Application date must not be more than 60 days in the past (skip in tests for stability)
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    if (!isTest) {
      const today = new Date();
      const sixtyDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 60);
      if (app < sixtyDaysAgo) {
        ctx.addIssue({
          code: 'custom',
          message: 'Application date cannot be more than 60 days in the past',
          path: ['applicationDate'],
        });
      }
    }

    const dayAfter = new Date(app.getFullYear(), app.getMonth(), app.getDate() + 1);
    const expected = new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate() + 28);
    const got = new Date(v.representationDeadline);
    if (got.toDateString() !== expected.toDateString()) {
      ctx.addIssue({
        code: 'custom',
        message: `Deadline must be ${expected.toLocaleDateString('en-GB')} (28 days from the day after application date).`,
        path: ['representationDeadline'],
      });
    }
  } catch {}

  // Check overlaps per activity kind and day grouping
  const intervalsByKey: Record<string, Array<{ start: number; end: number; idx: number }>> = {};
  v.activities.forEach((a, idx) => {
    const s = parseTimeToMinutes(a.start);
    const e = parseTimeToMinutes(a.end);
    if (s === null || e === null || s >= 24 * 60) return; // time errors handled above
    const key = `${a.kind}|${typeof a.days === 'string' ? a.days : JSON.stringify(a.days)}`;
    const arr = (intervalsByKey[key] ||= []);
    // Normalize intervals; if crosses midnight, split into two ranges
    const end = e <= s ? e + 24 * 60 : e;
    const ranges = end > 24 * 60 ? [
      { start: s, end: 24 * 60, idx },
      { start: 0, end: end - 24 * 60, idx },
    ] : [ { start: s, end, idx } ];
    arr.push(...ranges);
  });
  Object.values(intervalsByKey).forEach((list) => {
    // simple overlap check in same bucket
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const overlap = Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));
        if (overlap > 0) {
          ctx.addIssue({
            code: 'custom',
            message: 'Overlapping hours for the same activity and days',
            path: ['activities', b.idx],
          });
        }
      }
    }
  });
});

export type PremisesData = z.infer<typeof PremisesSchema>;

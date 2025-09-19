import dayjs from 'dayjs';
import { z } from 'zod';
import type { Activities, ActivityKey, HoursRange, TemplateNotice, TemplateNoticeType, WeekHours } from './types';

export const ukPostcode = /^(GIR 0AA|(?:(?:[A-Z]{1,2}\d{1,2}|[A-Z]{1,2}\d[A-Z]|[A-Z]{1,2}\d{1,2}[A-Z])\s?\d[ABD-HJLNP-UW-Z]{2}))$/i;

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const HoursRangeSchema = z
  .object({
    enabled: z.boolean(),
    start: z.string().regex(timeRegex, 'Use HH:MM 24h time'),
    end: z.string().regex(timeRegex, 'Use HH:MM 24h time'),
  })
  .superRefine((value, ctx) => {
    if (!value.enabled) return;
    if (value.start >= value.end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End must be after start',
        path: ['end'],
      });
    }
  });

export const WeekHoursSchema: z.ZodType<WeekHours> = z.object({
  mon: HoursRangeSchema,
  tue: HoursRangeSchema,
  wed: HoursRangeSchema,
  thu: HoursRangeSchema,
  fri: HoursRangeSchema,
  sat: HoursRangeSchema,
  sun: HoursRangeSchema,
});

const ActivitiesShape: Record<ActivityKey, z.ZodOptional<z.ZodType<WeekHours>>> = {
  alcoholOn: WeekHoursSchema.optional(),
  alcoholOff: WeekHoursSchema.optional(),
  lateRefreshment: WeekHoursSchema.optional(),
  liveMusic: WeekHoursSchema.optional(),
  recordedMusic: WeekHoursSchema.optional(),
  dance: WeekHoursSchema.optional(),
  similar: WeekHoursSchema.optional(),
};

export const ActivitiesSchema: z.ZodType<Activities> = z.object(ActivitiesShape).partial();

const AddressSchema = z.object({
  line1: z.string().min(2, 'Address line required'),
  line2: z.string().optional(),
  town: z.string().optional(),
  postcode: z.string().regex(ukPostcode, 'Postcode must be UK format'),
});

const CouncilSchema = z.object({
  name: z.string().min(2, 'Council required'),
  repEmail: z.string().email('Use a valid email'),
  repPostal: z.string().min(5, 'Postal address required'),
  officeAddress: z.string().optional(),
  website: z.string().url('Must be a valid URL').optional(),
  policy: z
    .object({
      shiftWeekendDeadline: z.boolean().optional(),
      bankHolidayPolicy: z.enum(['shift', 'allow']).optional(),
    })
    .optional(),
});

const SharedSchema = z.object({
  noticeType: z.enum(['new', 'variation', 'review']).nullable(),
  applicantName: z.string().min(2).max(100),
  applicantAddress: z.string().min(5).max(400),
  contactEmail: z.string().email(),
  contactPhone: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || (value.length >= 7 && value.length <= 20), {
      message: 'Phone must be 7–20 characters',
    })
    .optional(),
  premisesName: z.string().max(100).optional(),
  tradingName: z.string().max(100).optional(),
  premisesAddress: AddressSchema.nullable(),
  council: CouncilSchema.nullable(),
  intendedPublicationDate: z.string(),
  representationDeadline: z.string(),
  representationChannel: z
    .object({
      email: z.string().email().optional(),
      postal: z.string().min(5).optional(),
      notes: z.string().max(300).optional(),
    })
    .optional(),
  activities: ActivitiesSchema,
  conditionsSummary: z.string().max(400).optional(),
  variationDescription: z.string().max(500).optional(),
  reviewApplicant: z.string().max(100).optional(),
  reviewGrounds: z.string().max(500).optional(),
  autosaveVersion: z.number().optional(),
});

const NewNoticeSchema = SharedSchema.extend({
  noticeType: z.literal('new'),
  activities: ActivitiesSchema.superRefine((value, ctx) => {
    const hasEnabled = Object.values(value || {}).some((week) =>
      week ? Object.values(week).some((day) => day?.enabled) : false
    );
    if (!hasEnabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: 'Select at least one licensable activity and provide hours',
      });
    }
  }),
  conditionsSummary: z.string().max(400).optional(),
});

const VariationNoticeSchema = SharedSchema.extend({
  noticeType: z.literal('variation'),
  variationDescription: z.string().min(20).max(500),
  activities: ActivitiesSchema.optional(),
}).superRefine((value, ctx) => {
  if (value.activities) {
    const hasEnabled = Object.values(value.activities).some((week) =>
      week ? Object.values(week).some((day) => day?.enabled) : false
    );
    if (!hasEnabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['activities'],
        message: 'Any listed activity must include enabled hours',
      });
    }
  }
});

const ReviewNoticeSchema = SharedSchema.extend({
  noticeType: z.literal('review'),
  reviewApplicant: z.string().max(100).optional(),
  reviewGrounds: z.string().min(20).max(500),
});

const NullNoticeSchema = SharedSchema.extend({
  noticeType: z.null(),
});

export const TemplateNoticeSchema: z.ZodType<TemplateNotice> = z.union([
  NewNoticeSchema,
  VariationNoticeSchema,
  ReviewNoticeSchema,
  NullNoticeSchema,
]);

export type TemplateNoticeInput = z.input<typeof TemplateNoticeSchema>;
export type TemplateNoticeOutput = z.output<typeof TemplateNoticeSchema>;

export const DefaultHoursRange = (): HoursRange => ({
  enabled: false,
  start: '09:00',
  end: '17:00',
});

export const DefaultWeekHours = (): WeekHours => ({
  mon: DefaultHoursRange(),
  tue: DefaultHoursRange(),
  wed: DefaultHoursRange(),
  thu: DefaultHoursRange(),
  fri: DefaultHoursRange(),
  sat: DefaultHoursRange(),
  sun: DefaultHoursRange(),
});

export const DefaultActivities = (): Activities => ({
  alcoholOn: DefaultWeekHours(),
  alcoholOff: DefaultWeekHours(),
  lateRefreshment: DefaultWeekHours(),
  liveMusic: DefaultWeekHours(),
  recordedMusic: DefaultWeekHours(),
  dance: DefaultWeekHours(),
  similar: DefaultWeekHours(),
});

export const createEmptyNotice = (): TemplateNotice => ({
  noticeType: null,
  applicantName: '',
  applicantAddress: '',
  contactEmail: '',
  contactPhone: '',
  premisesName: '',
  tradingName: '',
  premisesAddress: null,
  council: null,
  intendedPublicationDate: dayjs().format('YYYY-MM-DD'),
  representationDeadline: '',
  representationChannel: undefined,
  activities: DefaultActivities(),
  conditionsSummary: '',
  variationDescription: '',
  reviewApplicant: '',
  reviewGrounds: '',
  autosaveVersion: 1,
});

export const calculateRepresentationDeadline = (
  publicationDateIso: string,
  options: { shiftWeekend?: boolean; bankHolidays?: string[] } = {}
): string => {
  if (!publicationDateIso) return '';
  let cursor = dayjs(publicationDateIso).add(28, 'day');
  if (!cursor.isValid()) return '';
  if (options.shiftWeekend) {
    while (cursor.day() === 0 || cursor.day() === 6) {
      cursor = cursor.add(1, 'day');
    }
  }
  if (options.bankHolidays && options.bankHolidays.length > 0) {
    const set = new Set(options.bankHolidays.map((d) => dayjs(d).format('YYYY-MM-DD')));
    while (set.has(cursor.format('YYYY-MM-DD'))) {
      cursor = cursor.add(1, 'day');
      if (options.shiftWeekend) {
        while (cursor.day() === 0 || cursor.day() === 6) {
          cursor = cursor.add(1, 'day');
        }
      }
    }
  }
  return cursor.format('YYYY-MM-DD');
};

export const coerceNoticeForType = (
  notice: TemplateNotice,
  type: TemplateNoticeType | null
): TemplateNotice => {
  if (type === 'new') {
    return {
      ...notice,
      noticeType: type,
      reviewApplicant: '',
      reviewGrounds: '',
      variationDescription: '',
    };
  }
  if (type === 'variation') {
    return {
      ...notice,
      noticeType: type,
      reviewApplicant: '',
      reviewGrounds: '',
    };
  }
  if (type === 'review') {
    return {
      ...notice,
      noticeType: type,
      conditionsSummary: '',
      variationDescription: '',
    };
  }
  return { ...notice, noticeType: null };
};

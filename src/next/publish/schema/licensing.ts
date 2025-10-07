import { z } from 'zod';
import type { NoticeBase } from '@/types/notice';
import {
  addressSchema,
  applicantSchema,
  consultationSchema,
  isoDateSchema,
  premisesSchema,
  publicationPlanSchema,
} from './shared';

export const LICENSING_VARIANTS = [
  'licensing-premises-new',
  'licensing-premises-variation',
  'licensing-premises-review',
  'licensing-club-new',
  'licensing-club-variation',
  'licensing-club-review',
] as const;

export type LicensingVariant = (typeof LICENSING_VARIANTS)[number];

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dayEnum = z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

export const licensingActivitySchema = z
  .object({
    code: z.enum([
      'alcohol_on',
      'alcohol_off',
      'alcohol_on_off',
      'late_night_refreshment',
      'live_music',
      'recorded_music',
      'dance',
      'other',
    ]),
    label: z.string().min(2),
    enabled: z.boolean().default(false),
    days: z.array(dayEnum).default([]),
    startTime: z.string().regex(timeRegex).optional(),
    endTime: z.string().regex(timeRegex).optional(),
    notes: z.string().max(240).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.enabled) return;
    if (!value.days || value.days.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['days'],
        message: 'Select at least one day.',
      });
    }
    if (!value.startTime || !value.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startTime'],
        message: 'Provide start and end times.',
      });
      return;
    }
    if (value.endTime <= value.startTime && value.endTime !== '00:00') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'End time must be after start time (or set to 00:00 for midnight).',
      });
    }
  });

export const licensingRepresentationsSchema = z
  .object({
    email: z.string().email().optional(),
    website: z.string().url().optional(),
    postal: z.string().min(5).optional(),
  })
  .refine(
    (value) => value.email || value.website || value.postal,
    'Provide an email, website, or postal address for representations.'
  );

const licensingAuthoritySchema = z.object({
  name: z.string().min(2, 'Licensing authority name is required'),
  address: z.string().min(5, 'Authority address is required'),
  email: z.string().email().optional(),
});

const dpsSchema = z.object({
  fullName: z.string().min(3, 'DPS full name is required'),
  issuingAuthority: z.string().min(3, 'Issuing authority is required'),
  licenceNumber: z.string().min(3, 'Personal licence number is required'),
});

export const licensingNoticeSchema = z
  .object({
    variant: z.enum(LICENSING_VARIANTS),
    applicant: applicantSchema,
    premises: premisesSchema,
    consultation: consultationSchema,
    publication: publicationPlanSchema,
    licensingAuthority: licensingAuthoritySchema,
    inspectionAddressOrURL: z.string().min(5, 'Provide inspection address or URL'),
    representations: licensingRepresentationsSchema,
    siteNoticeDate: isoDateSchema,
    newspaperPublicationDate: isoDateSchema,
    activities: z.array(licensingActivitySchema).max(12),
    alcoholService: z.enum(['on', 'off', 'both']).optional(),
    dps: dpsSchema.optional(),
    variationSummary: z.string().min(10).max(400).optional(),
    reviewGrounds: z.string().min(10).max(400).optional(),
    additionalNotes: z.string().max(400).optional(),
    newspaperOverrideReason: z.string().max(300).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.variant.includes('variation') && !value.variationSummary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['variationSummary'],
        message: 'Provide a summary of the proposed variation.',
      });
    }
    if (value.variant.includes('review') && !value.reviewGrounds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reviewGrounds'],
        message: 'Provide the grounds for review.',
      });
    }

    if (value.variant.includes('premises') && !value.dps) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dps'],
        message: 'Premises licences require DPS details.',
      });
    }

    const enabledActivities = value.activities.filter((activity) => activity.enabled);
    if (enabledActivities.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['activities'],
        message: 'Enable at least one licensable activity.',
      });
    }
  });

export type LicensingNoticeInput = z.infer<typeof licensingNoticeSchema>;

export function mapLicensingToNoticeBase(input: LicensingNoticeInput): NoticeBase {
  const noticeTypeLabel = (() => {
    switch (input.variant) {
      case 'licensing-premises-new':
        return 'Licensing: Premises - New';
      case 'licensing-premises-variation':
        return 'Licensing: Premises - Variation';
      case 'licensing-premises-review':
        return 'Licensing: Premises - Review';
      case 'licensing-club-new':
        return 'Licensing: Club Premises Certificate - New';
      case 'licensing-club-variation':
        return 'Licensing: Club Premises Certificate - Variation';
      case 'licensing-club-review':
        return 'Licensing: Club Premises Certificate - Review';
      default:
        return 'Licensing';
    }
  })();

  const applicantDisplayName = input.applicant.type === 'company'
    ? input.applicant.companyName ?? ''
    : input.applicant.fullName ?? '';

  return {
    noticeType: noticeTypeLabel,
    applicant: {
      ...input.applicant,
    },
    premises: input.premises,
    publication: {
      ...input.publication,
    },
    consultation: {
      ...input.consultation,
      windowRule: 'LA2003_28D',
    },
    extras: {
      category: 'licensing',
      variant: input.variant,
      authority: input.licensingAuthority,
      inspectionAddressOrURL: input.inspectionAddressOrURL,
      representations: input.representations,
      siteNoticeDate: input.siteNoticeDate,
      newspaperPublicationDate: input.newspaperPublicationDate,
      activities: input.activities,
      alcoholService: input.alcoholService,
      dps: input.dps || null,
      variationSummary: input.variationSummary,
      reviewGrounds: input.reviewGrounds,
      applicantDisplayName,
      applicantServiceAddress: input.applicant.serviceAddress ?? input.applicant.registeredOffice,
      additionalNotes: input.additionalNotes,
      newspaperOverrideReason: input.newspaperOverrideReason,
    },
  } satisfies NoticeBase;
}

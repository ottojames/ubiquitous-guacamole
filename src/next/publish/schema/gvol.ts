import { z } from 'zod';
import type { NoticeBase } from '@/types/notice';
import { addressSchema, applicantSchema, consultationSchema, isoDateSchema, publicationPlanSchema } from './shared';
import { lookupTrafficArea } from '@/next/publish/config/trafficAreas';

export const GVOL_VARIANTS = ['gvol-new', 'gvol-variation'] as const;
export type GvolVariant = (typeof GVOL_VARIANTS)[number];

const vehiclesSchema = z.object({
  maxVehicles: z.number().int().nonnegative(),
  maxTrailers: z.number().int().nonnegative(),
});

export const gvolNoticeSchema = z
  .object({
    variant: z.enum(GVOL_VARIANTS),
    applicant: applicantSchema,
    operatingCentreAddress: addressSchema,
    consultation: consultationSchema,
    publication: publicationPlanSchema,
    vehicles: vehiclesSchema,
    trafficAreaOverride: z
      .object({
        id: z.string(),
        name: z.string(),
        address: z.string(),
      })
      .optional(),
    siteNoticeDate: isoDateSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const area = lookupTrafficArea(value.operatingCentreAddress.postcode) || value.trafficAreaOverride;
    if (!area) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['operatingCentreAddress', 'postcode'],
        message: 'Unable to map postcode to a traffic area. Provide an override.',
      });
    }
  });

export type GvolNoticeInput = z.infer<typeof gvolNoticeSchema>;

export function mapGvolToNoticeBase(input: GvolNoticeInput): NoticeBase {
  const area = lookupTrafficArea(input.operatingCentreAddress.postcode) || input.trafficAreaOverride;
  const applicationType = input.variant === 'gvol-new' ? 'new' : 'variation';

  return {
    noticeType: input.variant === 'gvol-new' ? "GVOL: Operating Centre - New" : "GVOL: Operating Centre - Variation",
    applicant: { ...input.applicant },
    publication: { ...input.publication },
    consultation: { ...input.consultation, windowRule: 'GVOL_-21_TO_+21' },
    premises: {
      name: input.operatingCentreAddress.line1,
      address: input.operatingCentreAddress,
    },
    extras: {
      category: 'gvol',
      variant: input.variant,
      trafficArea: area || null,
      applicationType,
      vehicles: input.vehicles,
      siteNoticeDate: input.siteNoticeDate ?? input.consultation.applicationDate,
    },
  } satisfies NoticeBase;
}

import { z } from 'zod';
import type { NoticeBase } from '@/types/notice';
import { applicantSchema, consultationSchema, premisesSchema, publicationPlanSchema } from './shared';

export const PLANNING_VARIANTS = [
  'planning-major',
  'planning-eia',
  'planning-listed',
  'planning-conservation',
  'planning-prow',
  'planning-departure',
] as const;

export type PlanningVariant = (typeof PLANNING_VARIANTS)[number];

const planningAuthoritySchema = z.object({
  name: z.string().min(3, 'Local planning authority name required'),
  address: z.string().min(5, 'Authority address required'),
  contactEmail: z.string().email().optional(),
  portalUrl: z.string().url('Provide a valid LPA portal URL'),
  inspectionAddressOrURL: z.string().min(5, 'Provide inspection address or URL'),
});

export const planningNoticeSchema = z.object({
  variant: z.enum(PLANNING_VARIANTS),
  applicant: applicantSchema,
  premises: premisesSchema,
  consultation: consultationSchema,
  publication: publicationPlanSchema,
  planningAuthority: planningAuthoritySchema,
  applicationReference: z.string().min(3, 'Application reference required').max(80),
  proposal: z.string().min(10, 'Describe the proposal').max(600),
  triggers: z.array(z.string().min(3)).min(1, 'Select at least one reason for press notice'),
  overrideReason: z.string().max(300).optional(),
});

export type PlanningNoticeInput = z.infer<typeof planningNoticeSchema>;

function labelFromVariant(variant: PlanningVariant): string {
  switch (variant) {
    case 'planning-major':
      return 'Planning: Major Development';
    case 'planning-eia':
      return 'Planning: EIA Development';
    case 'planning-listed':
      return 'Planning: Listed Building';
    case 'planning-conservation':
      return 'Planning: Conservation Area';
    case 'planning-prow':
      return 'Planning: Public Right of Way';
    case 'planning-departure':
      return 'Planning: Departure';
    default:
      return 'Planning';
  }
}

export function mapPlanningToNoticeBase(input: PlanningNoticeInput): NoticeBase {
  return {
    noticeType: labelFromVariant(input.variant),
    applicant: { ...input.applicant },
    premises: input.premises,
    publication: { ...input.publication },
    consultation: { ...input.consultation, windowRule: 'PLANNING_21D_MIN' },
    extras: {
      category: 'planning',
      variant: input.variant,
      planningAuthority: input.planningAuthority,
      applicationReference: input.applicationReference,
      proposal: input.proposal,
      triggers: input.triggers,
      overrideReason: input.overrideReason || null,
    },
  } satisfies NoticeBase;
}

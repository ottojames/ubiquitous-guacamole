import { z } from 'zod';
import type { NoticeBase } from '@/types/notice';
import {
  applicantSchema,
  consultationSchema,
  isoDateSchema,
  premisesSchema,
  publicationPlanSchema,
} from './shared';
import { licensingRepresentationsSchema } from './licensing';

export const GAMBLING_VARIANTS = [
  'gambling-betting-new',
  'gambling-betting-variation',
  'gambling-betting-review',
  'gambling-betting-transfer',
  'gambling-bingo-new',
  'gambling-bingo-variation',
  'gambling-bingo-review',
  'gambling-bingo-transfer',
  'gambling-agc-new',
  'gambling-agc-variation',
  'gambling-agc-review',
  'gambling-agc-transfer',
  'gambling-fec-new',
  'gambling-fec-variation',
  'gambling-fec-review',
  'gambling-fec-transfer',
] as const;

export type GamblingVariant = (typeof GAMBLING_VARIANTS)[number];

const gamblingAuthoritySchema = z.object({
  name: z.string().min(2, 'Licensing authority name is required'),
  address: z.string().min(5, 'Authority address is required'),
  email: z.string().email().optional(),
});

export const gamblingNoticeSchema = z.object({
  variant: z.enum(GAMBLING_VARIANTS),
  applicant: applicantSchema,
  premises: premisesSchema,
  consultation: consultationSchema,
  publication: publicationPlanSchema,
  licensingAuthority: gamblingAuthoritySchema,
  activities: z.array(z.string().min(3, 'Describe the gambling activities')).min(1),
  representations: licensingRepresentationsSchema,
  siteNoticeDate: isoDateSchema,
});

export type GamblingNoticeInput = z.infer<typeof gamblingNoticeSchema>;

function labelFromVariant(variant: GamblingVariant): { noticeType: string; premisesType: string; applicationVariant: string } {
  const [_, type, action] = variant.split('-');
  const premisesType = (() => {
    switch (type) {
      case 'betting':
        return 'betting';
      case 'bingo':
        return 'bingo';
      case 'agc':
        return 'adult gaming centre';
      case 'fec':
        return 'family entertainment centre';
      default:
        return type;
    }
  })();
  const variantLabel = (() => {
    switch (action) {
      case 'new':
        return 'new';
      case 'variation':
        return 'variation';
      case 'review':
        return 'review';
      case 'transfer':
        return 'transfer';
      default:
        return action;
    }
  })();

  const noticeType = `Gambling: ${premisesType.replace(/\b\w/g, (c) => c.toUpperCase())} - ${variantLabel.replace(/\b\w/g, (c) => c.toUpperCase())}`;

  return {
    noticeType,
    premisesType: premisesType.toUpperCase(),
    applicationVariant: variantLabel.toUpperCase(),
  };
}

export function mapGamblingToNoticeBase(input: GamblingNoticeInput): NoticeBase {
  const labels = labelFromVariant(input.variant);
  return {
    noticeType: labels.noticeType,
    applicant: { ...input.applicant },
    premises: input.premises,
    publication: { ...input.publication },
    consultation: { ...input.consultation, windowRule: 'GAMBLING_28D' },
    extras: {
      category: 'gambling',
      variant: input.variant,
      authority: input.licensingAuthority,
      activities: input.activities,
      representations: input.representations,
      siteNoticeDate: input.siteNoticeDate,
      premisesType: labels.premisesType,
      applicationVariant: labels.applicationVariant,
    },
  } satisfies NoticeBase;
}

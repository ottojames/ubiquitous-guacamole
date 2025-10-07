import { z } from 'zod';
import type { NoticeBase } from '@/types/notice';
import { addressSchema, applicantSchema, consultationSchema, isoDateSchema, publicationPlanSchema } from './shared';

export const probateNoticeSchema = z.object({
  applicant: applicantSchema,
  consultation: consultationSchema,
  publication: publicationPlanSchema,
  deceased: z.object({
    fullName: z.string().min(3, 'Deceased name required'),
    lastAddress: addressSchema,
    dateOfDeath: isoDateSchema,
  }),
  solicitorOrPR: z.object({
    name: z.string().min(3, 'Personal representative or solicitor name required'),
    address: addressSchema,
  }),
  claimsDeadline: isoDateSchema,
});

export type ProbateNoticeInput = z.infer<typeof probateNoticeSchema>;

export function mapProbateToNoticeBase(input: ProbateNoticeInput): NoticeBase {
  return {
    noticeType: 'Probate: Trustee Act 1925 s.27',
    applicant: { ...input.applicant },
    publication: { ...input.publication },
    consultation: { ...input.consultation, repsDeadline: input.claimsDeadline, windowRule: 'TRUSTEE_S27_2MONTHS' },
    extras: {
      category: 'probate',
      deceased: input.deceased,
      solicitorOrPR: input.solicitorOrPR,
      claimsDeadline: input.claimsDeadline,
    },
  } satisfies NoticeBase;
}

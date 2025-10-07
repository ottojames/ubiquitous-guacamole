import { z } from 'zod';

export const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const isoDateSchema = z
  .string()
  .regex(ISO_DATE_REGEX, { message: 'Must be an ISO date (YYYY-MM-DD).' });

export const addressSchema = z.object({
  uprn: z.string().optional(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  town: z.string().min(1, 'Town or city is required'),
  postcode: z
    .string()
    .regex(UK_POSTCODE_REGEX, { message: 'Enter a valid UK postcode' })
    .transform((value) => value.toUpperCase().replace(/\s+/, ' ').trim()),
  country: z.literal('UK').optional(),
});

export const applicantSchema = z
  .object({
    type: z.enum(['individual', 'company']),
    fullName: z.string().optional(),
    companyName: z.string().optional(),
    companyNumber: z.string().optional(),
    registeredOffice: addressSchema.optional(),
    serviceAddress: addressSchema.optional(),
    contactEmail: z.string().email(),
    contactPhone: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'individual' && !value.fullName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fullName'],
        message: 'Full name is required for an individual applicant.',
      });
    }
    if (value.type === 'company' && !value.companyName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyName'],
        message: 'Company name is required for a company applicant.',
      });
    }
    if (value.type === 'company' && value.companyNumber && !/^\w{1,40}$/i.test(value.companyNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyNumber'],
        message: 'Company number must be alphanumeric.',
      });
    }
  });

export const consultationSchema = z.object({
  applicationDate: isoDateSchema,
  repsDeadline: isoDateSchema,
  windowRule: z
    .enum([
      'LA2003_28D',
      'LA2003_NEWS_10WD',
      'GAMBLING_28D',
      'GVOL_-21_TO_+21',
      'PLANNING_21D_MIN',
      'TRUSTEE_S27_2MONTHS',
    ])
    .optional(),
});

export const publicationPlanSchema = z.object({
  newspaper: z.string().min(1, 'Newspaper is required'),
  targetDate: isoDateSchema,
  priceExVat: z.number().nonnegative().optional(),
  urn: z.string().optional(),
});

export const premisesSchema = z.object({
  name: z.string().optional(),
  address: addressSchema,
});

export type AddressSchema = z.infer<typeof addressSchema>;
export type ApplicantSchema = z.infer<typeof applicantSchema>;
export type ConsultationSchema = z.infer<typeof consultationSchema>;
export type PublicationPlanSchema = z.infer<typeof publicationPlanSchema>;
export type PremisesSchema = z.infer<typeof premisesSchema>;

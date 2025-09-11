import { z } from 'zod';

// Days of week
const DAY = z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

// Activities that require hours
export const Activity = z.object({
  type: z.enum([
    'alcohol_on',
    'alcohol_off',
    'alcohol_on_off',
    'late_night_refreshment',
    'live_music',
    'recorded_music',
  ]),
  days: z.array(DAY).nonempty(),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export const Activities = z.array(Activity).min(1);

const POSTCODE = /[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}/i;

export const Address = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  postcode: z.string().regex(POSTCODE),
  uprn: z.string().optional(),
});

export const Representation = z.object({
  method: z.enum(['email', 'portal', 'post']),
  value: z.string().min(1),
});

export const PremisesLicenceSchema = z.object({
  applicant: z.string().min(1),
  applicantAddress: Address,
  premises: z.string().min(1),
  address: Address,
  activities: Activities,
  applicationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // ISO date
  council: z.string().min(1),
  region: z.enum(['england_wales', 'scotland', 'northern_ireland']),
  representation: Representation,
});

export type PremisesLicence = z.infer<typeof PremisesLicenceSchema>;

import { z } from 'zod';

export const Address = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  postcode: z.string().min(1),
  uprn: z.string().optional(),
});

export const GVOLSchema = z.object({
  operator: z.string().min(1),
  address: Address,
  vehicles: z.number().int().nonnegative(),
  trailers: z.number().int().nonnegative(),
  applicationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  council: z.string().min(1),
  region: z.enum(['england_wales', 'scotland', 'northern_ireland']),
});

export type GVOL = z.infer<typeof GVOLSchema>;

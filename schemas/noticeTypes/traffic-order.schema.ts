import { z } from 'zod';

export const TrafficOrderSchema = z.object({
  roadName: z.string().min(1),
  restriction: z.string().min(1),
  duration: z.string().min(1),
  applicationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  council: z.string().min(1),
  region: z.enum(['england_wales', 'scotland', 'northern_ireland']),
});

export type TrafficOrder = z.infer<typeof TrafficOrderSchema>;

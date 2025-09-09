import { z } from "zod";

// UK postcode (broad but practical)
export const UKPostcode = z
  .string()
  .regex(/^[A-Z]{1,2}\d[A-Z0-9]?\s?\d[A-Z]{2}$/i, "Invalid UK postcode");

// Base schema
const BasePremisesAddressSchema = z.object({
  lines: z.array(z.string()).min(1),
  town: z.string().optional(),
  county: z.string().optional(),
  postcode: UKPostcode,
  uprn: z.string().optional(),
  udprn: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  formatted_single_line: z.string().min(5),
  source: z.enum(["lookup", "manual", "ocr-suggested"]),
  confidence: z.enum(["high", "manual", "low"]),
});

// Add PO Box rule with superRefine (avoids implicit-any)
export const PremisesAddressSchema = BasePremisesAddressSchema.superRefine((a, ctx) => {
  const hasPoBox = a.lines.some((l) => /\bP\.?\s*O\.?\s*BOX\b/i.test(l));
  if (hasPoBox) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "PO Boxes are not accepted",
      path: ["lines"],
    });
  }
});

export type PremisesAddress = z.infer<typeof PremisesAddressSchema>;

import { z } from "zod";
import type { NoticeBase } from "@/types/notice";
import { ISO_DATE_REGEX } from "./shared";

export const probateNoticeSchema = z
  .object({
    NOTICE_TYPE: z.string().trim().min(1, "Notice type is required"),
    DECEASED_NAME: z.string().trim().min(1, "Deceased name is required"),
    DECEASED_ALIAS: z
      .string()
      .optional()
      .transform((value) => (typeof value === "string" ? value.trim() : value)),
    DECEASED_LAST_ADDRESS: z.string().trim().min(1, "Last known address is required"),
    DATE_OF_DEATH: z
      .string()
      .trim()
      .regex(ISO_DATE_REGEX, { message: "Date of death must be in YYYY-MM-DD format" }),
    PERSONAL_REPRESENTATIVE: z
      .string()
      .optional()
      .transform((value) => (typeof value === "string" ? value.trim() : value)),
    SOLICITOR_NAME: z
      .string()
      .optional()
      .transform((value) => (typeof value === "string" ? value.trim() : value)),
    SOLICITOR_ADDRESS: z.string().trim().min(1, "Service address is required"),
    CLAIM_REFERENCE: z
      .string()
      .optional()
      .transform((value) => (typeof value === "string" ? value.trim() : value)),
    PUBLICATION_DATE: z
      .string()
      .trim()
      .regex(ISO_DATE_REGEX, { message: "Publication date must be in YYYY-MM-DD format" }),
    DEADLINE_DATE: z
      .string()
      .trim()
      .regex(ISO_DATE_REGEX, { message: "Claims deadline must be in YYYY-MM-DD format" }),
  })
  .superRefine((value, ctx) => {
    const hasRepresentative = Boolean(value.PERSONAL_REPRESENTATIVE && value.PERSONAL_REPRESENTATIVE.trim().length);
    const hasSolicitor = Boolean(value.SOLICITOR_NAME && value.SOLICITOR_NAME.trim().length);
    if (!hasRepresentative && !hasSolicitor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["PERSONAL_REPRESENTATIVE"],
        message: "Provide the personal representative or solicitor responsible for the estate.",
      });
    }
  });

export type ProbateNoticeInput = z.infer<typeof probateNoticeSchema>;

function valueOrEmpty(value?: string | null): string {
  return typeof value === "string" ? value.trim() : value ?? "";
}

export function mapProbateToNoticeBase(input: ProbateNoticeInput): NoticeBase {
  const tokens: Record<string, string> = {
    NOTICE_TYPE: valueOrEmpty(input.NOTICE_TYPE),
    DECEASED_NAME: valueOrEmpty(input.DECEASED_NAME),
    DECEASED_ALIAS: valueOrEmpty(input.DECEASED_ALIAS),
    DECEASED_LAST_ADDRESS: valueOrEmpty(input.DECEASED_LAST_ADDRESS),
    DATE_OF_DEATH: valueOrEmpty(input.DATE_OF_DEATH),
    PERSONAL_REPRESENTATIVE: valueOrEmpty(input.PERSONAL_REPRESENTATIVE),
    SOLICITOR_NAME: valueOrEmpty(input.SOLICITOR_NAME),
    SOLICITOR_ADDRESS: valueOrEmpty(input.SOLICITOR_ADDRESS),
    CLAIM_REFERENCE: valueOrEmpty(input.CLAIM_REFERENCE),
    PUBLICATION_DATE: valueOrEmpty(input.PUBLICATION_DATE),
    DEADLINE_DATE: valueOrEmpty(input.DEADLINE_DATE),
  };

  return {
    noticeType: tokens.NOTICE_TYPE || "Probate Notice",
    applicant: {
      type: "company",
      fullName: tokens.SOLICITOR_NAME || tokens.PERSONAL_REPRESENTATIVE || "Representative",
      contactEmail: "",
    },
    premises: {
      name: tokens.DECEASED_NAME,
      address: {
        line1: tokens.SOLICITOR_ADDRESS || "Address not supplied",
        town: "",
        postcode: "",
      },
    },
    publication: {
      newspaper: "",
      targetDate: tokens.PUBLICATION_DATE,
    },
    consultation: {
      applicationDate: tokens.PUBLICATION_DATE,
      repsDeadline: tokens.DEADLINE_DATE,
      windowRule: "TRUSTEE_S27_2MONTHS",
    },
    extras: {
      category: "probate",
      tokens,
    },
  } satisfies NoticeBase;
}

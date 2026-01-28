import { z } from "zod";
import type { NoticeBase } from "@/types/notice";
import { ISO_DATE_REGEX } from "./shared";

export const PLANNING_VARIANTS = [
  "planning-major",
  "planning-eia",
  "planning-listed",
  "planning-conservation",
  "planning-prow",
  "planning-departure",
] as const;

export type PlanningVariant = (typeof PLANNING_VARIANTS)[number];

const requiredString = (label: string) =>
  z.preprocess(
    (val) => (val === undefined || val === null ? "" : val),
    z.string().trim().min(1, `${label} is required`)
  );

const optionalString = () =>
  z.preprocess(
    (value) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : undefined;
      }
      return value;
    },
    z.string().trim().optional()
  );

const optionalEmail = () =>
  z.preprocess(
    (value) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : undefined;
      }
      return value;
    },
    z.string().email("Enter a valid email address").optional()
  );

const optionalUrl = () =>
  z.preprocess(
    (value) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : undefined;
      }
      return value;
    },
    z
      .string()
      .url("Enter a valid URL starting with http or https")
      .optional()
  );

const isoDateField = (label: string) =>
  z.preprocess(
    (val) => (val === undefined || val === null ? "" : val),
    z
      .string()
      .trim()
      .min(1, `${label} is required`)
      .regex(ISO_DATE_REGEX, { message: `${label} must be in YYYY-MM-DD format` })
  );

export const planningNoticeSchema = z
  .object({
    variant: z.enum(PLANNING_VARIANTS),
    NOTICE_TYPE: requiredString("Notice type"),
    ACT_TITLE: requiredString("Act title"),
    APPLICANT_NAME: requiredString("Applicant name"),
    APPLICANT_STATUS: optionalString(),
    APPLICANT_TRADING_AS: optionalString(),
    APPLICANT_ADDRESS: optionalString(),
    SITE_NAME: optionalString(),
    SITE_ADDRESS: requiredString("Site address"),
    APPLICATION_REFERENCE: requiredString("Application reference"),
    PLANNING_REASON: optionalString(),
    PROPOSAL_DESCRIPTION: requiredString("Proposal description"),
    COMMENT_METHOD: requiredString("Comment method"),
    COMMENT_EMAIL: optionalEmail(),
    COMMENT_URL: optionalUrl(),
    REPRESENTATION_ADDRESS: optionalString(),
    INSPECTION_LOCATION: optionalString(),
    ONLINE_REGISTER_URL: optionalUrl(),
    AUTHORITY_NAME: requiredString("Authority name"),
    AUTHORITY_ADDRESS: optionalString(),
    AUTHORITY_EMAIL: optionalEmail(),
    PUBLICATION_DATE: isoDateField("Publication date"),
    DEADLINE_DATE: isoDateField("Comment deadline"),
  })
  .superRefine((value, ctx) => {
    if (!value.COMMENT_EMAIL && !value.COMMENT_URL && !value.REPRESENTATION_ADDRESS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["COMMENT_METHOD"],
        message: "Provide at least one method for comments (email, URL, or postal address).",
      });
    }
  });

export type PlanningNoticeInput = z.infer<typeof planningNoticeSchema>;

function valueOrEmpty(value?: string | null): string {
  return typeof value === "string" ? value.trim() : value ?? "";
}

function valueOrUndefined(value?: string | null): string | undefined {
  const trimmed = typeof value === "string" ? value.trim() : value ?? "";
  return trimmed.length ? trimmed : undefined;
}

export function mapPlanningToNoticeBase(input: PlanningNoticeInput): NoticeBase {
  const tokens: Record<string, string> = {
    NOTICE_TYPE: valueOrEmpty(input.NOTICE_TYPE),
    ACT_TITLE: valueOrEmpty(input.ACT_TITLE),
    APPLICANT_NAME: valueOrEmpty(input.APPLICANT_NAME),
    APPLICANT_STATUS: valueOrEmpty(input.APPLICANT_STATUS),
    APPLICANT_TRADING_AS: valueOrEmpty(input.APPLICANT_TRADING_AS),
    APPLICANT_ADDRESS: valueOrEmpty(input.APPLICANT_ADDRESS),
    SITE_NAME: valueOrEmpty(input.SITE_NAME),
    SITE_ADDRESS: valueOrEmpty(input.SITE_ADDRESS),
    APPLICATION_REFERENCE: valueOrEmpty(input.APPLICATION_REFERENCE),
    PLANNING_REASON: valueOrEmpty(input.PLANNING_REASON).toUpperCase(),
    PROPOSAL_DESCRIPTION: valueOrEmpty(input.PROPOSAL_DESCRIPTION),
    COMMENT_METHOD: valueOrEmpty(input.COMMENT_METHOD),
    COMMENT_EMAIL: valueOrEmpty(input.COMMENT_EMAIL),
    COMMENT_URL: valueOrEmpty(input.COMMENT_URL),
    REPRESENTATION_ADDRESS: valueOrEmpty(input.REPRESENTATION_ADDRESS),
    INSPECTION_LOCATION: valueOrEmpty(input.INSPECTION_LOCATION),
    ONLINE_REGISTER_URL: valueOrEmpty(input.ONLINE_REGISTER_URL),
    AUTHORITY_NAME: valueOrEmpty(input.AUTHORITY_NAME),
    AUTHORITY_ADDRESS: valueOrEmpty(input.AUTHORITY_ADDRESS),
    AUTHORITY_EMAIL: valueOrEmpty(input.AUTHORITY_EMAIL),
    PUBLICATION_DATE: valueOrEmpty(input.PUBLICATION_DATE),
    DEADLINE_DATE: valueOrEmpty(input.DEADLINE_DATE),
  };

  return {
    noticeType: tokens.NOTICE_TYPE || "Planning Notice",
    applicant: {
      type: "company",
      fullName: tokens.APPLICANT_NAME || "Applicant",
      contactEmail: valueOrEmpty(input.COMMENT_EMAIL),
    },
    premises: {
      name: valueOrUndefined(input.SITE_NAME),
      address: {
        line1: tokens.SITE_ADDRESS || "Site address not supplied",
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
      windowRule: "PLANNING_21D_MIN",
    },
    extras: {
      category: "planning",
      variant: input.variant,
      tokens,
    },
  } satisfies NoticeBase;
}

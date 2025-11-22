import { z } from "zod";
import type { NoticeBase } from "@/types/notice";
import { ISO_DATE_REGEX } from "./shared";

export const GAMBLING_VARIANTS = [
  "gambling-betting-new",
  "gambling-betting-variation",
  "gambling-betting-review",
  "gambling-betting-transfer",
  "gambling-bingo-new",
  "gambling-bingo-variation",
  "gambling-bingo-review",
  "gambling-bingo-transfer",
  "gambling-agc-new",
  "gambling-agc-variation",
  "gambling-agc-review",
  "gambling-agc-transfer",
  "gambling-fec-new",
  "gambling-fec-variation",
  "gambling-fec-review",
  "gambling-fec-transfer",
] as const;

export type GamblingVariant = (typeof GAMBLING_VARIANTS)[number];

const requiredString = (label: string) => z.string().trim().min(1, `${label} is required`);

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

const isoDateField = (label: string) =>
  z
    .string()
    .trim()
    .regex(ISO_DATE_REGEX, { message: `${label} must be in YYYY-MM-DD format` });

const gamblingBaseSchema = z
  .object({
    variant: z.enum(GAMBLING_VARIANTS),
    NOTICE_TYPE: requiredString("Notice type"),
    ACT_TITLE: requiredString("Act title"),
    GAMBLING_PREMISES_TYPE: requiredString("Premises type"),
    APPLICANT_NAME: requiredString("Applicant name"),
    APPLICANT_STATUS: optionalString(),
    APPLICANT_TRADING_AS: optionalString(),
    APPLICANT_ADDRESS: optionalString(),
    PREMISES_NAME: optionalString(),
    SITE_NAME: optionalString(),
    CENTRE_NAME: optionalString(),
    PREMISES_ADDRESS: requiredString("Premises address"),
    LICENSABLE_ACTIVITIES: optionalString(),
    OPENING_HOURS: optionalString(),
    NATURE_OF_VARIATION: optionalString(),
    REVIEW_APPLICANT_NAME: optionalString(),
    REVIEW_GROUNDS: optionalString(),
    TRANSFER_FROM_NAME: optionalString(),
    TRANSFER_TO_NAME: optionalString(),
    APPLICATION_DATE: isoDateField("Application date"),
    PUBLICATION_DATE: z.preprocess(
      (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
      isoDateField("Publication date").optional()
    ),
    DEADLINE_DATE: isoDateField("Representation deadline"),
    INSPECTION_LOCATION: optionalString(),
    INSPECTION_TIMES: requiredString("Inspection times"),
    REPRESENTATION_METHOD: requiredString("Representation method"),
    REPRESENTATION_ADDRESS: optionalString(),
    REPRESENTATION_EMAIL: optionalEmail(),
    AUTHORITY_NAME: requiredString("Authority name"),
    AUTHORITY_ADDRESS: optionalString(),
    AUTHORITY_EMAIL: optionalEmail(),
  })
  .superRefine((value, ctx) => {
    const isVariation = value.variant.includes("variation");
    const isReview = value.variant.includes("review");
    const isTransfer = value.variant.includes("transfer");
    const requiresHours = !isReview && !isTransfer;

    if (!value.REPRESENTATION_ADDRESS && !value.REPRESENTATION_EMAIL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["REPRESENTATION_ADDRESS"],
        message: "Provide a postal or email contact for representations.",
      });
    }

    if (requiresHours && !value.LICENSABLE_ACTIVITIES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["LICENSABLE_ACTIVITIES"],
        message: "Select at least one gambling activity.",
      });
    }

    if (requiresHours && !value.OPENING_HOURS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["OPENING_HOURS"],
        message: "Provide proposed opening hours.",
      });
    }

    if (isVariation && !value.NATURE_OF_VARIATION) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NATURE_OF_VARIATION"],
        message: "Describe the nature of the variation.",
      });
    }

    if (isReview) {
      if (!value.REVIEW_APPLICANT_NAME) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["REVIEW_APPLICANT_NAME"],
          message: "Provide the name of the review applicant.",
        });
      }
      if (!value.REVIEW_GROUNDS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["REVIEW_GROUNDS"],
          message: "Provide the grounds for review.",
        });
      }
    }

    if (isTransfer) {
      if (!value.TRANSFER_FROM_NAME) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["TRANSFER_FROM_NAME"],
          message: "Provide the current licence holder.",
        });
      }
      if (!value.TRANSFER_TO_NAME) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["TRANSFER_TO_NAME"],
          message: "Provide the proposed licence holder.",
        });
      }
    }
  });

export const gamblingNoticeSchema = gamblingBaseSchema;

export type GamblingNoticeInput = z.infer<typeof gamblingNoticeSchema>;

function valueOrEmpty(value?: string | null): string {
  return typeof value === "string" ? value.trim() : value ?? "";
}

function valueOrUndefined(value?: string | null): string | undefined {
  const trimmed = typeof value === "string" ? value.trim() : value ?? "";
  return trimmed.length ? trimmed : undefined;
}

export function mapGamblingToNoticeBase(input: GamblingNoticeInput): NoticeBase {
  const tokens: Record<string, string> = {
    NOTICE_TYPE: valueOrEmpty(input.NOTICE_TYPE),
    ACT_TITLE: valueOrEmpty(input.ACT_TITLE),
    GAMBLING_PREMISES_TYPE: valueOrEmpty(input.GAMBLING_PREMISES_TYPE).toUpperCase(),
    APPLICANT_NAME: valueOrEmpty(input.APPLICANT_NAME),
    APPLICANT_STATUS: valueOrEmpty(input.APPLICANT_STATUS),
    APPLICANT_TRADING_AS: valueOrEmpty(input.APPLICANT_TRADING_AS),
    APPLICANT_ADDRESS: valueOrEmpty(input.APPLICANT_ADDRESS),
    PREMISES_NAME: valueOrEmpty(input.PREMISES_NAME),
    SITE_NAME: valueOrEmpty(input.SITE_NAME),
    CENTRE_NAME: valueOrEmpty(input.CENTRE_NAME),
    PREMISES_ADDRESS: valueOrEmpty(input.PREMISES_ADDRESS),
    LICENSABLE_ACTIVITIES: valueOrEmpty(input.LICENSABLE_ACTIVITIES),
    OPENING_HOURS: valueOrEmpty(input.OPENING_HOURS),
    NATURE_OF_VARIATION: valueOrEmpty(input.NATURE_OF_VARIATION),
    REVIEW_APPLICANT_NAME: valueOrEmpty(input.REVIEW_APPLICANT_NAME),
    REVIEW_GROUNDS: valueOrEmpty(input.REVIEW_GROUNDS),
    TRANSFER_FROM_NAME: valueOrEmpty(input.TRANSFER_FROM_NAME),
    TRANSFER_TO_NAME: valueOrEmpty(input.TRANSFER_TO_NAME),
    APPLICATION_DATE: valueOrEmpty(input.APPLICATION_DATE),
    PUBLICATION_DATE: valueOrEmpty(input.PUBLICATION_DATE),
    DEADLINE_DATE: valueOrEmpty(input.DEADLINE_DATE),
    INSPECTION_LOCATION: valueOrEmpty(input.INSPECTION_LOCATION),
    INSPECTION_TIMES: valueOrEmpty(input.INSPECTION_TIMES),
    REPRESENTATION_METHOD: valueOrEmpty(input.REPRESENTATION_METHOD),
    REPRESENTATION_ADDRESS: valueOrEmpty(input.REPRESENTATION_ADDRESS),
    REPRESENTATION_EMAIL: valueOrEmpty(input.REPRESENTATION_EMAIL),
    AUTHORITY_NAME: valueOrEmpty(input.AUTHORITY_NAME),
    AUTHORITY_ADDRESS: valueOrEmpty(input.AUTHORITY_ADDRESS),
    AUTHORITY_EMAIL: valueOrEmpty(input.AUTHORITY_EMAIL),
  };

  return {
    noticeType: tokens.NOTICE_TYPE || "Gambling Notice",
    applicant: {
      type: "company",
      fullName: tokens.APPLICANT_NAME || "Applicant",
      contactEmail: valueOrEmpty(input.REPRESENTATION_EMAIL),
    },
    premises: {
      name: valueOrUndefined(input.PREMISES_NAME),
      address: {
        line1: tokens.PREMISES_ADDRESS || "Address not supplied",
        town: "",
        postcode: "",
      },
    },
    publication: {
      newspaper: "",
      targetDate: valueOrEmpty(input.PUBLICATION_DATE || input.APPLICATION_DATE),
    },
    consultation: {
      applicationDate: tokens.APPLICATION_DATE,
      repsDeadline: tokens.DEADLINE_DATE,
      windowRule: "GAMBLING_28D",
    },
    extras: {
      category: "gambling",
      variant: input.variant,
      tokens,
    },
  } satisfies NoticeBase;
}

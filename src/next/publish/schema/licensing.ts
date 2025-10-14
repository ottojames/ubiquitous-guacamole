import { z } from "zod";
import type { NoticeBase } from "@/types/notice";
import { ISO_DATE_REGEX } from "./shared";

export const LICENSING_VARIANTS = [
  "licensing-premises-new",
  "licensing-premises-variation",
  "licensing-premises-review",
  "licensing-club-new",
  "licensing-club-variation",
  "licensing-club-review",
] as const;

export type LicensingVariant = (typeof LICENSING_VARIANTS)[number];

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
  z
    .string()
    .trim()
    .regex(ISO_DATE_REGEX, { message: `${label} must be in YYYY-MM-DD format` });

const licensingBaseSchema = z
  .object({
    variant: z.enum(LICENSING_VARIANTS),
    NOTICE_TYPE: requiredString("Notice type"),
    ACT_TITLE: requiredString("Act title"),
    APPLICANT_NAME: requiredString("Applicant name"),
    APPLICANT_STATUS: optionalString(),
    APPLICANT_TRADING_AS: optionalString(),
    APPLICANT_ADDRESS: optionalString(),
    APPLICANT_COMPANY_NUMBER: optionalString(),
    PREMISES_NAME: optionalString(),
    SITE_NAME: optionalString(),
    CENTRE_NAME: optionalString(),
    PREMISES_ADDRESS: requiredString("Premises address"),
    LICENSABLE_ACTIVITIES: requiredString("Licensable activities"),
    ACTIVITY_SCHEDULE: requiredString("Activity schedule"),
    OPENING_HOURS: optionalString(),
    DPS_NAME: optionalString(),
    DPS_LICENSING_AUTHORITY: optionalString(),
    NATURE_OF_VARIATION: optionalString(),
    REVIEW_APPLICANT_NAME: optionalString(),
    REVIEW_GROUNDS: optionalString(),
    LICENSING_OBJECTIVES: optionalString(),
    APPLICATION_DATE: isoDateField("Application date"),
    PUBLICATION_DATE: z.preprocess(
      (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
      isoDateField("Publication date").optional()
    ),
    DEADLINE_DATE: isoDateField("Representation deadline"),
    INSPECTION_LOCATION: requiredString("Inspection location"),
    INSPECTION_TIMES: requiredString("Inspection times"),
    REPRESENTATION_METHOD: requiredString("Representation method"),
    REPRESENTATION_ADDRESS: optionalString(),
    REPRESENTATION_EMAIL: optionalEmail(),
    AUTHORITY_NAME: requiredString("Authority name"),
    AUTHORITY_ADDRESS: optionalString(),
    AUTHORITY_EMAIL: optionalEmail(),
    AUTHORITY_PHONE: optionalString(),
    ONLINE_REGISTER_URL: optionalUrl(),
    REFERENCE: optionalString(),
  })
  .superRefine((value, ctx) => {
    const isPremises = value.variant.includes("premises");
    const isVariation = value.variant.includes("variation");
    const isReview = value.variant.includes("review");
    const activities = value.LICENSABLE_ACTIVITIES?.toLowerCase() ?? "";

    if (!value.REPRESENTATION_ADDRESS && !value.REPRESENTATION_EMAIL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["REPRESENTATION_ADDRESS"],
        message: "Provide a postal or email contact for representations.",
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

    if (isPremises && activities.includes("alcohol") && !value.DPS_NAME) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DPS_NAME"],
        message: "Designated premises supervisor details are required when alcohol is supplied.",
      });
    }
  });

export const licensingNoticeSchema = licensingBaseSchema;

export type LicensingNoticeInput = z.infer<typeof licensingNoticeSchema>;

function valueOrEmpty(value?: string | null): string {
  return typeof value === "string" ? value.trim() : value ?? "";
}

function valueOrUndefined(value?: string | null): string | undefined {
  const trimmed = typeof value === "string" ? value.trim() : value ?? "";
  return trimmed.length ? trimmed : undefined;
}

export function mapLicensingToNoticeBase(input: LicensingNoticeInput): NoticeBase {
  const tokens: Record<string, string> = {
    NOTICE_TYPE: valueOrEmpty(input.NOTICE_TYPE),
    ACT_TITLE: valueOrEmpty(input.ACT_TITLE),
    APPLICANT_NAME: valueOrEmpty(input.APPLICANT_NAME),
    APPLICANT_STATUS: valueOrEmpty(input.APPLICANT_STATUS),
    APPLICANT_TRADING_AS: valueOrEmpty(input.APPLICANT_TRADING_AS),
    APPLICANT_ADDRESS: valueOrEmpty(input.APPLICANT_ADDRESS),
    APPLICANT_COMPANY_NUMBER: valueOrEmpty(input.APPLICANT_COMPANY_NUMBER),
    PREMISES_NAME: valueOrEmpty(input.PREMISES_NAME),
    SITE_NAME: valueOrEmpty(input.SITE_NAME),
    CENTRE_NAME: valueOrEmpty(input.CENTRE_NAME),
    PREMISES_ADDRESS: valueOrEmpty(input.PREMISES_ADDRESS),
    LICENSABLE_ACTIVITIES: valueOrEmpty(input.LICENSABLE_ACTIVITIES),
    ACTIVITY_SCHEDULE: valueOrEmpty(input.ACTIVITY_SCHEDULE),
    OPENING_HOURS: valueOrEmpty(input.OPENING_HOURS),
    DPS_NAME: valueOrEmpty(input.DPS_NAME),
    DPS_LICENSING_AUTHORITY: valueOrEmpty(input.DPS_LICENSING_AUTHORITY),
    NATURE_OF_VARIATION: valueOrEmpty(input.NATURE_OF_VARIATION),
    REVIEW_APPLICANT_NAME: valueOrEmpty(input.REVIEW_APPLICANT_NAME),
    REVIEW_GROUNDS: valueOrEmpty(input.REVIEW_GROUNDS),
    LICENSING_OBJECTIVES: valueOrEmpty(input.LICENSING_OBJECTIVES),
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
    AUTHORITY_PHONE: valueOrEmpty(input.AUTHORITY_PHONE),
    ONLINE_REGISTER_URL: valueOrEmpty(input.ONLINE_REGISTER_URL),
    REFERENCE: valueOrEmpty(input.REFERENCE),
  };

  const applicantName = tokens.APPLICANT_NAME || "Applicant";
  const premisesAddressBlock = tokens.PREMISES_ADDRESS || "Address not supplied";

  return {
    noticeType: tokens.NOTICE_TYPE || "Licensing Notice",
    applicant: {
      type: "company",
      fullName: applicantName,
      contactEmail: valueOrEmpty(input.REPRESENTATION_EMAIL),
    },
    premises: {
      name: valueOrUndefined(input.PREMISES_NAME),
      address: {
        line1: premisesAddressBlock,
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
      windowRule: "LA2003_28D",
    },
    extras: {
      category: "licensing",
      variant: input.variant,
      tokens,
    },
  } satisfies NoticeBase;
}

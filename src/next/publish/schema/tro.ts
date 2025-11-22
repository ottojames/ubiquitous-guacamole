import { z } from "zod";
import type { NoticeBase } from "@/types/notice";
import { ISO_DATE_REGEX } from "./shared";

export const TRO_VARIANTS = ["tro-permanent", "tro-temporary", "tro-experimental"] as const;

export type TroVariant = (typeof TRO_VARIANTS)[number];

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

const isoDateField = (label: string) =>
  z
    .string()
    .trim()
    .regex(ISO_DATE_REGEX, { message: `${label} must be in YYYY-MM-DD format` });

export const troNoticeSchema = z
  .object({
    variant: z.enum(TRO_VARIANTS),
    NOTICE_TYPE: requiredString("Notice type"),
    AUTHORITY_NAME: requiredString("Authority name"),
    AUTHORITY_EMAIL: optionalString(),
    ORDER_TITLE: requiredString("Order title"),
    ORDER_DESCRIPTION: requiredString("Order description"),
    ROADS_AFFECTED: requiredString("Roads affected"),
    NATURE_OF_ORDER: requiredString("Nature of order"),
    REASON_FOR_ORDER: optionalString(),
    EFFECTIVE_DATE: isoDateField("Effective date"),
    EXPIRY_DATE: optionalString(), // Only for temporary orders
    EXPERIMENTAL_PERIOD: optionalString(), // Only for experimental orders
    INSPECTION_LOCATION: requiredString("Inspection location"),
    INSPECTION_HOURS: optionalString(),
    OBJECTION_DEADLINE: isoDateField("Objection deadline"),
    OBJECTION_METHOD: requiredString("Objection method"),
    OBJECTION_ADDRESS: optionalString(),
    PUBLICATION_DATE: isoDateField("Publication date"),
  })
  .superRefine((value, ctx) => {
    const isTemporary = value.variant === "tro-temporary";
    const isExperimental = value.variant === "tro-experimental";

    if (isTemporary && !value.EXPIRY_DATE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["EXPIRY_DATE"],
        message: "Temporary orders require an expiry date.",
      });
    }

    if (isExperimental && !value.EXPERIMENTAL_PERIOD) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["EXPERIMENTAL_PERIOD"],
        message: "Experimental orders require a specified period.",
      });
    }
  });

export type TroNoticeInput = z.infer<typeof troNoticeSchema>;

function valueOrEmpty(value?: string | null): string {
  return typeof value === "string" ? value.trim() : value ?? "";
}

function valueOrUndefined(value?: string | null): string | undefined {
  const trimmed = typeof value === "string" ? value.trim() : value ?? "";
  return trimmed.length ? trimmed : undefined;
}

export function mapTroToNoticeBase(input: TroNoticeInput): NoticeBase {
  const tokens: Record<string, string> = {
    NOTICE_TYPE: valueOrEmpty(input.NOTICE_TYPE),
    AUTHORITY_NAME: valueOrEmpty(input.AUTHORITY_NAME),
    AUTHORITY_EMAIL: valueOrEmpty(input.AUTHORITY_EMAIL),
    ORDER_TITLE: valueOrEmpty(input.ORDER_TITLE),
    ORDER_DESCRIPTION: valueOrEmpty(input.ORDER_DESCRIPTION),
    ROADS_AFFECTED: valueOrEmpty(input.ROADS_AFFECTED),
    NATURE_OF_ORDER: valueOrEmpty(input.NATURE_OF_ORDER),
    REASON_FOR_ORDER: valueOrEmpty(input.REASON_FOR_ORDER),
    EFFECTIVE_DATE: valueOrEmpty(input.EFFECTIVE_DATE),
    EXPIRY_DATE: valueOrEmpty(input.EXPIRY_DATE),
    EXPERIMENTAL_PERIOD: valueOrEmpty(input.EXPERIMENTAL_PERIOD),
    INSPECTION_LOCATION: valueOrEmpty(input.INSPECTION_LOCATION),
    INSPECTION_HOURS: valueOrEmpty(input.INSPECTION_HOURS),
    OBJECTION_DEADLINE: valueOrEmpty(input.OBJECTION_DEADLINE),
    OBJECTION_METHOD: valueOrEmpty(input.OBJECTION_METHOD),
    OBJECTION_ADDRESS: valueOrEmpty(input.OBJECTION_ADDRESS),
    PUBLICATION_DATE: valueOrEmpty(input.PUBLICATION_DATE),
  };

  return {
    noticeType: tokens.NOTICE_TYPE || "Traffic Regulation Order",
    applicant: {
      type: "company",
      companyName: tokens.AUTHORITY_NAME || "Local Authority",
      contactEmail: tokens.AUTHORITY_EMAIL || "traffic@authority.gov.uk",
    },
    premises: {
      name: valueOrUndefined(input.ROADS_AFFECTED),
      address: {
        line1: tokens.ROADS_AFFECTED || "Location not specified",
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
      repsDeadline: tokens.OBJECTION_DEADLINE,
    },
    extras: {
      category: "tro",
      variant: input.variant,
      tokens,
    },
  } satisfies NoticeBase;
}

import { z } from "zod";
import type { NoticeBase } from "@/types/notice";
import { ISO_DATE_REGEX } from "./shared";

export const GVOL_VARIANTS = ["gvol-new", "gvol-variation"] as const;

export type GvolVariant = (typeof GVOL_VARIANTS)[number];

// UK Traffic Areas under Goods Vehicles (Licensing of Operators) Act 1995
export const TRAFFIC_AREAS = [
  "Eastern",
  "North Eastern",
  "North Western",
  "Scottish",
  "South Eastern & Metropolitan",
  "Wales & Western",
  "West Midlands",
  "Yorkshire",
] as const;

export type TrafficArea = (typeof TRAFFIC_AREAS)[number];

// Traffic Commissioner office addresses by area
const TRAFFIC_COMMISSIONER_OFFICES: Record<TrafficArea, { address: string; email: string }> = {
  "Eastern": {
    address: "Eastbrook, Shaftesbury Road, Cambridge CB2 8DR",
    email: "eastern@otc.gov.uk",
  },
  "North Eastern": {
    address: "Hillcrest House, 386 Harehills Lane, Leeds LS9 6NF",
    email: "north.eastern@otc.gov.uk",
  },
  "North Western": {
    address: "Suite 4, Stone Cross Place, Stone Cross Lane North, Golborne, Warrington WA3 2SH",
    email: "north.western@otc.gov.uk",
  },
  "Scottish": {
    address: "Level 6, The Stamp Office, 10 Waterloo Place, Edinburgh EH1 3EG",
    email: "scottish@otc.gov.uk",
  },
  "South Eastern & Metropolitan": {
    address: "Ivy House, 3 Ivy Terrace, Eastbourne BN21 4QT",
    email: "south.eastern@otc.gov.uk",
  },
  "Wales & Western": {
    address: "38 George Road, Edgbaston, Birmingham B15 1PL",
    email: "wales.western@otc.gov.uk",
  },
  "West Midlands": {
    address: "38 George Road, Edgbaston, Birmingham B15 1PL",
    email: "west.midlands@otc.gov.uk",
  },
  "Yorkshire": {
    address: "Hillcrest House, 386 Harehills Lane, Leeds LS9 6NF",
    email: "yorkshire@otc.gov.uk",
  },
};

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

const isoDateField = (label: string) =>
  z.preprocess(
    (val) => (val === undefined || val === null ? "" : val),
    z
      .string()
      .trim()
      .min(1, `${label} is required`)
      .regex(ISO_DATE_REGEX, { message: `${label} must be in YYYY-MM-DD format` })
  );

const digitsOnly = (label: string) =>
  z.preprocess(
    (val) => (val === undefined || val === null ? "" : val),
    z
      .string()
      .trim()
      .min(1, `${label} is required`)
      .regex(/^\d+$/, { message: `${label} must be a whole number` })
  );

export const gvolNoticeSchema = z
  .object({
    variant: z.enum(GVOL_VARIANTS),
    NOTICE_TYPE: requiredString("Notice type"),
    APPLICANT_NAME: requiredString("Applicant name"),
    APPLICANT_STATUS: optionalString(),
    APPLICANT_TRADING_AS: optionalString(),
    APPLICANT_ADDRESS: requiredString("Applicant address"),
    LICENCE_CATEGORY: requiredString("Licence category"),
    TRAFFIC_AREA: z.enum(TRAFFIC_AREAS, {
      message: "Select a valid Traffic Area",
    }),
    OPERATING_CENTRE_ADDRESS: requiredString("Operating centre address"),
    NUMBER_OF_VEHICLES: digitsOnly("Number of vehicles"),
    NUMBER_OF_TRAILERS: digitsOnly("Number of trailers"),
    GVOL_VARIATION_DETAILS: optionalString(),
    PUBLICATION_DATE: isoDateField("Publication date"),
    DEADLINE_DATE: isoDateField("Objection deadline"),
    REPRESENTATION_METHOD: requiredString("Representation method"),
  })
  .superRefine((value, ctx) => {
    const isVariation = value.variant.includes("variation");
    if (isVariation && !value.GVOL_VARIATION_DETAILS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GVOL_VARIATION_DETAILS"],
        message: "Describe the variation requested.",
      });
    }
  });

export type GvolNoticeInput = z.infer<typeof gvolNoticeSchema>;

function valueOrEmpty(value?: string | null): string {
  return typeof value === "string" ? value.trim() : value ?? "";
}

function valueOrUndefined(value?: string | null): string | undefined {
  const trimmed = typeof value === "string" ? value.trim() : value ?? "";
  return trimmed.length ? trimmed : undefined;
}

export function mapGvolToNoticeBase(input: GvolNoticeInput): NoticeBase {
  // Derive Traffic Commissioner office details from TRAFFIC_AREA enum
  const trafficArea = input.TRAFFIC_AREA;
  const commissionerOffice = TRAFFIC_COMMISSIONER_OFFICES[trafficArea];

  const tokens: Record<string, string> = {
    NOTICE_TYPE: valueOrEmpty(input.NOTICE_TYPE),
    APPLICANT_NAME: valueOrEmpty(input.APPLICANT_NAME),
    APPLICANT_STATUS: valueOrEmpty(input.APPLICANT_STATUS),
    APPLICANT_TRADING_AS: valueOrEmpty(input.APPLICANT_TRADING_AS),
    APPLICANT_ADDRESS: valueOrEmpty(input.APPLICANT_ADDRESS),
    LICENCE_CATEGORY: valueOrEmpty(input.LICENCE_CATEGORY),
    TRAFFIC_AREA: trafficArea,
    TRAFFIC_COMMISSIONER_OFFICE: commissionerOffice.address,
    TRAFFIC_COMMISSIONER_EMAIL: commissionerOffice.email,
    OPERATING_CENTRE_ADDRESS: valueOrEmpty(input.OPERATING_CENTRE_ADDRESS),
    NUMBER_OF_VEHICLES: valueOrEmpty(input.NUMBER_OF_VEHICLES),
    NUMBER_OF_TRAILERS: valueOrEmpty(input.NUMBER_OF_TRAILERS),
    GVOL_VARIATION_DETAILS: valueOrEmpty(input.GVOL_VARIATION_DETAILS),
    PUBLICATION_DATE: valueOrEmpty(input.PUBLICATION_DATE),
    DEADLINE_DATE: valueOrEmpty(input.DEADLINE_DATE),
    REPRESENTATION_METHOD: valueOrEmpty(input.REPRESENTATION_METHOD),
  };

  return {
    noticeType: tokens.NOTICE_TYPE || "GVOL Notice",
    applicant: {
      type: "company",
      fullName: tokens.APPLICANT_NAME || "Applicant",
      contactEmail: "",
    },
    premises: {
      name: valueOrUndefined(input.OPERATING_CENTRE_ADDRESS),
      address: {
        line1: tokens.OPERATING_CENTRE_ADDRESS || "Operating centre not supplied",
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
      windowRule: "GVOL_-21_TO_+21",
    },
    extras: {
      category: "gvol",
      variant: input.variant,
      tokens,
    },
  } satisfies NoticeBase;
}

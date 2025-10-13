import councils from "@/data/councils.json";
import type { Council } from "@/components/CouncilSelect";
import { normalizeUKPostcode } from "@/lib/text/extract";

export type UploadMethod = "notice" | "template";

export type RequiredFieldKey =
  | "applicationType"
  | "applicantName"
  | "premisesLine1"
  | "premisesCity"
  | "premisesPostcode"
  | "council";

export const REQUIRED_FIELD_LABELS: Record<RequiredFieldKey, string> = {
  applicationType: "Application type",
  applicantName: "Applicant legal name",
  premisesLine1: "Premises address",
  premisesCity: "Town / city",
  premisesPostcode: "Postcode",
  council: "Licensing authority",
};

export type RecommendedFieldKey =
  | "tradingName"
  | "premisesName"
  | "applicationSummary"
  | "representationDeadline"
  | "viewingInformation"
  | "representationContact"
  | "contactEmail"
  | "contactPhone";

export const APPLICATION_TYPE_OPTIONS = [
  { value: "premises-licence-new", label: "Premises Licence — New" },
  { value: "premises-licence-variation", label: "Premises Licence — Variation" },
  { value: "club-certificate", label: "Club Premises Certificate" },
  { value: "review", label: "Review" },
  { value: "other", label: "Other licensing application" },
];

export type LegalDetails = {
  applicationType: string;
  applicantName: string;
  premisesLine1: string;
  premisesLine2: string;
  premisesCity: string;
  premisesPostcode: string;
  councilName: string;
  tradingName: string;
  premisesName: string;
  applicationSummary: string;
  representationDeadline: string;
  viewingInformation: string;
  representationContact: string;
  contactEmail: string;
  contactPhone: string;
};

export type LegalMetaEntry = {
  confidence?: number | null;
  range?: { start: number; end: number };
  sourceText?: string;
  label?: string;
};

export type LegalMetaMap = Partial<Record<RequiredFieldKey | RecommendedFieldKey, LegalMetaEntry>>;

export type OCRHighlight = {
  key: RequiredFieldKey | RecommendedFieldKey;
  label: string;
  start: number;
  end: number;
  confidence?: number | null;
};

export function createInitialLegalDetails(): LegalDetails {
  return {
    applicationType: "",
    applicantName: "",
    premisesLine1: "",
    premisesLine2: "",
    premisesCity: "",
    premisesPostcode: "",
    councilName: "",
    tradingName: "",
    premisesName: "",
    applicationSummary: "",
    representationDeadline: "",
    viewingInformation: "",
    representationContact: "",
    contactEmail: "",
    contactPhone: "",
  };
}

type ExtractResult = {
  details: Partial<LegalDetails>;
  meta: LegalMetaMap;
  highlights: OCRHighlight[];
  inferredCouncil?: Council | null;
};

const POSTCODE_REGEX =
  /\b([A-Z]{1,2}\d{1,2}[A-Z]?)(?:\s*)(\d[A-Z]{2})\b/i;

const councilIndex = (councils as Council[]).map((council) => ({
  source: council,
  normalized: normalizeToken(council.name),
  aliases: (council.aliases ?? []).map((alias) => normalizeToken(alias)),
}));

function normalizeToken(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
}

function findCouncilByName(value: string | null | undefined): Council | null {
  if (!value) return null;
  const target = normalizeToken(value);
  if (!target) return null;
  for (const entry of councilIndex) {
    if (entry.normalized === target) return entry.source;
    if (entry.normalized.includes(target)) return entry.source;
    if (target.includes(entry.normalized)) return entry.source;
    for (const alias of entry.aliases) {
      if (alias === target) return entry.source;
      if (alias.includes(target)) return entry.source;
      if (target.includes(alias)) return entry.source;
    }
  }
  return null;
}

function lookupApplicationType(ocr: string): string | undefined {
  const lower = ocr.toLowerCase();
  if (lower.includes("variation")) return "premises-licence-variation";
  if (lower.includes("club premises")) return "club-certificate";
  if (lower.includes("review")) return "review";
  if (lower.includes("premises licence")) return "premises-licence-new";
  return undefined;
}

function extractApplicant(text: string): { value?: string; range?: { start: number; end: number }; confidence?: number } {
  const match = text.match(/applicant(?: name)?[:\-\s]+(.+?)(?:\n|$)/i);
  if (match && match[1]) {
    const value = match[1].trim();
    const idx = text.toLowerCase().indexOf(value.toLowerCase());
    return {
      value,
      range: idx >= 0 ? { start: idx, end: idx + value.length } : undefined,
      confidence: 0.9,
    };
  }
  return {};
}

function extractCouncil(text: string): {
  value?: string;
  council?: Council | null;
  range?: { start: number; end: number };
  confidence?: number;
} {
  const match = text.match(/(?:licensing authority|licensing act|council)[:\-\s]+(.+?)(?:\n|$)/i);
  if (match && match[1]) {
    const raw = match[1].trim();
    const council = findCouncilByName(raw);
    const idx = text.toLowerCase().indexOf(raw.toLowerCase());
    return {
      value: council?.name ?? raw,
      council,
      range: idx >= 0 ? { start: idx, end: idx + raw.length } : undefined,
      confidence: council ? 0.92 : 0.75,
    };
  }
  return {};
}

function extractAddress(text: string): {
  line1?: string;
  line2?: string;
  city?: string;
  postcode?: string;
  range?: { start: number; end: number };
  confidence?: number;
} {
  const match = text.match(/premises(?: address)?[:\-\s]+(.+?)(?:\n|$)/i);
  if (!match || !match[1]) return {};
  const raw = match[1].trim();
  const postcodeMatch = raw.match(POSTCODE_REGEX);
  let postcode = "";
  let before = raw;
  if (postcodeMatch && postcodeMatch[0]) {
    postcode = normalizeUKPostcode(postcodeMatch[0]);
    before = raw.slice(0, postcodeMatch.index ?? raw.length);
  }
  const segments = before
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const line1 = segments.shift() ?? "";
  const city = segments.pop() ?? "";
  const line2 = segments.join(", ");
  const idx = text.toLowerCase().indexOf(raw.toLowerCase());
  return {
    line1,
    line2,
    city,
    postcode,
    range: idx >= 0 ? { start: idx, end: idx + raw.length } : undefined,
    confidence: postcode ? 0.9 : 0.7,
  };
}

function extractSummary(text: string): { value?: string; range?: { start: number; end: number }; confidence?: number } {
  const match = text.match(/(?:summary|proposal|intends to)[:\-\s]+(.+?)(?:\n\n|\n$)/i);
  if (match && match[1]) {
    const raw = match[1].trim();
    const idx = text.toLowerCase().indexOf(raw.toLowerCase());
    return {
      value: raw,
      range: idx >= 0 ? { start: idx, end: idx + raw.length } : undefined,
      confidence: 0.6,
    };
  }
  return {};
}

export function extractLegalDetailsFromOcr(text: string): ExtractResult {
  const details: Partial<LegalDetails> = {};
  const meta: LegalMetaMap = {};
  const highlights: OCRHighlight[] = [];

  const applicationType = lookupApplicationType(text);
  if (applicationType) {
    details.applicationType = applicationType;
    meta.applicationType = { confidence: 0.6 };
  }

  const applicant = extractApplicant(text);
  if (applicant.value) {
    details.applicantName = applicant.value;
    meta.applicantName = {
      confidence: applicant.confidence,
      range: applicant.range,
      sourceText: applicant.value,
    };
    if (applicant.range) {
      highlights.push({
        key: "applicantName",
        label: "Applicant",
        start: applicant.range.start,
        end: applicant.range.end,
        confidence: applicant.confidence,
      });
    }
  }

  const council = extractCouncil(text);
  if (council.value) {
    details.councilName = council.council?.name ?? council.value;
    meta.council = {
      confidence: council.confidence,
      range: council.range,
      sourceText: council.value,
    };
    if (council.range) {
      highlights.push({
        key: "council",
        label: "Licensing authority",
        start: council.range.start,
        end: council.range.end,
        confidence: council.confidence,
      });
    }
  }

  const addr = extractAddress(text);
  if (addr.line1) {
    details.premisesLine1 = addr.line1;
  }
  if (addr.line2) {
    details.premisesLine2 = addr.line2;
  }
  if (addr.city) {
    details.premisesCity = addr.city;
  }
  if (addr.postcode) {
    details.premisesPostcode = addr.postcode;
  }
  if (addr.line1 || addr.city || addr.postcode) {
    meta.premisesLine1 = {
      confidence: addr.confidence,
      range: addr.range,
      sourceText: [addr.line1, addr.line2, addr.city, addr.postcode].filter(Boolean).join(", "),
    };
    meta.premisesCity = meta.premisesCity ?? { confidence: addr.confidence };
    meta.premisesPostcode = meta.premisesPostcode ?? { confidence: addr.confidence };
    if (addr.range) {
      highlights.push({
        key: "premisesLine1",
        label: "Premises",
        start: addr.range.start,
        end: addr.range.end,
        confidence: addr.confidence,
      });
    }
  }

  const summary = extractSummary(text);
  if (summary.value) {
    details.applicationSummary = summary.value;
    meta.applicationSummary = {
      confidence: summary.confidence,
      range: summary.range,
      sourceText: summary.value,
    };
    if (summary.range) {
      highlights.push({
        key: "applicationSummary",
        label: "Summary",
        start: summary.range.start,
        end: summary.range.end,
        confidence: summary.confidence,
      });
    }
  }

  return {
    details,
    meta,
    highlights,
    inferredCouncil: council.council ?? null,
  };
}

export type FieldStatus = "found" | "review" | "missing";

export type RequiredFieldStatus = {
  key: RequiredFieldKey;
  label: string;
  status: FieldStatus;
  message?: string;
  confidence?: number | null;
};

export type LegalValidationResult = {
  statuses: RequiredFieldStatus[];
  errors: Partial<Record<RequiredFieldKey, string | null>>;
  missingCount: number;
  recommendedWarnings: string[];
};

function postcodeIsValid(value: string): boolean {
  if (!value) return false;
  return POSTCODE_REGEX.test(value.toUpperCase());
}

export function validateLegalDetails(
  details: LegalDetails,
  meta: LegalMetaMap,
  options: { selectedCouncil: Council | null }
): LegalValidationResult {
  const errors: Partial<Record<RequiredFieldKey, string | null>> = {};
  const statuses: RequiredFieldStatus[] = [];

  const applicationTypeValid = APPLICATION_TYPE_OPTIONS.some((opt) => opt.value === details.applicationType);
  errors.applicationType = applicationTypeValid ? null : "Select an application type.";
  statuses.push(buildStatus("applicationType", applicationTypeValid, meta.applicationType));

  const applicantValid = details.applicantName.trim().length >= 2;
  errors.applicantName = applicantValid ? null : "Applicant name is required.";
  statuses.push(buildStatus("applicantName", applicantValid, meta.applicantName));

  const line1Valid = details.premisesLine1.trim().length > 0;
  errors.premisesLine1 = line1Valid ? null : "Enter the premises address.";
  statuses.push(buildStatus("premisesLine1", line1Valid, meta.premisesLine1));

  const cityValid = details.premisesCity.trim().length > 0;
  errors.premisesCity = cityValid ? null : "Enter the town or city.";
  statuses.push(buildStatus("premisesCity", cityValid, meta.premisesLine1 ?? meta.premisesCity));

  const postcodeValid = postcodeIsValid(details.premisesPostcode);
  errors.premisesPostcode = postcodeValid ? null : "Enter a UK postcode.";
  statuses.push(buildStatus("premisesPostcode", postcodeValid, meta.premisesPostcode ?? meta.premisesLine1));

  const councilValid = Boolean(options.selectedCouncil);
  errors.council = councilValid ? null : "Select a licensing authority.";
  statuses.push(buildStatus("council", councilValid, meta.council));

  const recommendedWarnings: string[] = [];
  if (!details.tradingName.trim()) recommendedWarnings.push("Trading name is missing.");
  if (!details.premisesName.trim()) recommendedWarnings.push("Premises name is missing.");
  if (!details.applicationSummary.trim()) recommendedWarnings.push("Summary of the application is missing.");
  if (!details.representationDeadline.trim()) recommendedWarnings.push("Representation deadline not set.");
  if (!details.viewingInformation.trim()) recommendedWarnings.push("Viewing information is missing.");
  if (!details.representationContact.trim()) recommendedWarnings.push("Representation contact details missing.");
  if (!details.contactEmail.trim() && !details.contactPhone.trim())
    recommendedWarnings.push("Contact email or phone is missing.");

  const missingCount = statuses.filter((status) => status.status === "missing").length;

  return { statuses, errors, missingCount, recommendedWarnings };
}

function buildStatus(
  key: RequiredFieldKey,
  isValid: boolean,
  meta?: LegalMetaEntry
): RequiredFieldStatus {
  let status: FieldStatus = isValid ? "found" : "missing";
  if (isValid && meta?.confidence != null && meta.confidence < 0.8) {
    status = "review";
  }
  return {
    key,
    label: REQUIRED_FIELD_LABELS[key],
    status,
    confidence: meta?.confidence ?? null,
    message: isValid ? undefined : REQUIRED_FIELD_LABELS[key] + " is required.",
  };
}

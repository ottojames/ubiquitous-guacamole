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
  | "council"
  | "contactEmail"
  | "activities";

export const REQUIRED_FIELD_LABELS: Record<RequiredFieldKey, string> = {
  applicationType: "Application type",
  applicantName: "Applicant legal name",
  premisesLine1: "Premises address",
  premisesCity: "Town / city",
  premisesPostcode: "Postcode",
  council: "Licensing authority",
  contactEmail: "Contact email",
  activities: "Licensable activities",
};

export type RecommendedFieldKey =
  | "tradingName"
  | "premisesName"
  | "applicationSummary"
  | "representationDeadline"
  | "viewingInformation"
  | "representationContact"
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
  councilEmail: string;
  councilAddress: string;
  councilWebsite: string;
  tradingName: string;
  premisesName: string;
  aiGeneratedSummary: string;
  applicationSummary: string;
  representationDeadline: string;
  viewingInformation: string;
  representationContact: string;
  contactEmail: string;
  contactPhone: string;
  activities: string[];
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

export const LICENSABLE_ACTIVITIES = [
  { value: "alcohol-on", label: "Sale of alcohol for consumption on the premises" },
  { value: "alcohol-off", label: "Sale of alcohol for consumption off the premises" },
  { value: "alcohol-both", label: "Sale of alcohol for consumption on and off the premises" },
  { value: "late-night-refreshment", label: "Provision of late night refreshment" },
  { value: "regulated-entertainment", label: "Provision of regulated entertainment" },
] as const;

export function createInitialLegalDetails(): LegalDetails {
  return {
    applicationType: "",
    applicantName: "",
    premisesLine1: "",
    premisesLine2: "",
    premisesCity: "",
    premisesPostcode: "",
    councilName: "",
    councilEmail: "",
    councilAddress: "",
    councilWebsite: "",
    tradingName: "",
    premisesName: "",
    aiGeneratedSummary: "",
    applicationSummary: "",
    representationDeadline: "",
    viewingInformation: "",
    representationContact: "",
    contactEmail: "",
    contactPhone: "",
    activities: [],
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
  const match = text.match(/(?:licensing authority|council)[:\-\s]+(.+?)(?:\n|$)/i);
  if (match && match[1]) {
    let raw = match[1].trim();
    // Remove common suffixes that aren't part of the council name
    raw = raw.replace(/\s*(?:licensing act|2003|act)\s*$/i, '').trim();
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
  let raw = match[1].trim();
  // Remove common prefixes that aren't part of the address
  raw = raw.replace(/^(?:for\s+a\s+)?premises\s+licen[cs]e\s*/i, '').trim();
  raw = raw.replace(/^licen[cs]e\s+/i, '').trim();

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

/**
 * Extract DPS name from licensing notices
 */
function extractDPSName(text: string): { value?: string; range?: { start: number; end: number }; confidence?: number } {
  const patterns = [
    /designated premises supervisor[:\-\s]+(.+?)(?:\n|$)/i,
    /dps[:\-\s]+(.+?)(?:\n|$)/i,
    /supervisor[:\-\s]+(.+?)(?:\n|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = match[1].trim();
      const idx = text.toLowerCase().indexOf(value.toLowerCase());
      return {
        value,
        range: idx >= 0 ? { start: idx, end: idx + value.length } : undefined,
        confidence: 0.85,
      };
    }
  }
  return {};
}

/**
 * Extract licensable activities from licensing notices
 */
function extractLicensableActivities(text: string): { value?: string; confidence?: number } {
  const lower = text.toLowerCase();
  const activities: string[] = [];

  if (lower.includes('sale of alcohol') || lower.includes('supply of alcohol')) {
    if (lower.includes('on and off') || lower.includes('on & off')) {
      activities.push('Sale of alcohol for consumption on and off the premises');
    } else if (lower.includes('off premises') || lower.includes('off the premises')) {
      activities.push('Sale of alcohol for consumption off the premises');
    } else if (lower.includes('on premises') || lower.includes('on the premises')) {
      activities.push('Sale of alcohol for consumption on the premises');
    } else {
      activities.push('Sale of alcohol');
    }
  }

  if (lower.includes('late night refreshment')) {
    activities.push('Provision of late night refreshment');
  }

  if (lower.includes('regulated entertainment') || lower.includes('live music') || lower.includes('recorded music')) {
    activities.push('Provision of regulated entertainment');
  }

  if (activities.length > 0) {
    return { value: activities.join('\n'), confidence: 0.8 };
  }
  return {};
}

/**
 * Extract opening hours from notices
 */
function extractOpeningHours(text: string): { value?: string; confidence?: number } {
  const patterns = [
    /opening hours[:\-\s]+(.+?)(?:\n\n|\n[A-Z])/is,
    /hours of operation[:\-\s]+(.+?)(?:\n\n|\n[A-Z])/is,
    /hours[:\-\s]+((?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun).+?)(?:\n\n|\n[A-Z])/is,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = match[1].trim().replace(/\s+/g, ' ');
      if (value.length > 10) {
        return { value, confidence: 0.75 };
      }
    }
  }
  return {};
}

/**
 * Extract variation details
 */
function extractVariationDetails(text: string): { value?: string; confidence?: number } {
  const patterns = [
    /nature of variation[:\-\s]+(.+?)(?:\n\n|\n[A-Z]{3,})/is,
    /variation[:\-\s]+(.+?)(?:\n\n|\n[A-Z]{3,})/is,
    /proposed changes?[:\-\s]+(.+?)(?:\n\n|\n[A-Z]{3,})/is,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = match[1].trim();
      if (value.length > 20) {
        return { value, confidence: 0.7 };
      }
    }
  }
  return {};
}

/**
 * Extract review grounds
 */
function extractReviewGrounds(text: string): { value?: string; confidence?: number } {
  const patterns = [
    /review grounds?[:\-\s]+(.+?)(?:\n\n|\n[A-Z]{3,})/is,
    /grounds? for review[:\-\s]+(.+?)(?:\n\n|\n[A-Z]{3,})/is,
    /grounds?[:\-\s]+(.+?)(?:\n\n|\n[A-Z]{3,})/is,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = match[1].trim();
      if (value.length > 20) {
        return { value, confidence: 0.7 };
      }
    }
  }
  return {};
}

/**
 * Extract gambling premises type
 */
function extractGamblingPremisesType(text: string): { value?: string; confidence?: number } {
  const lower = text.toLowerCase();

  if (lower.includes('family entertainment centre') || lower.includes('fec')) {
    return { value: 'fec', confidence: 0.9 };
  }
  if (lower.includes('adult gaming centre') || lower.includes('agc')) {
    return { value: 'agc', confidence: 0.9 };
  }
  if (lower.includes('bingo')) {
    return { value: 'bingo', confidence: 0.9 };
  }
  if (lower.includes('betting')) {
    return { value: 'betting', confidence: 0.9 };
  }

  return {};
}

/**
 * Extract transfer details (current and new holder)
 */
function extractTransferDetails(text: string): {
  currentHolder?: string;
  newHolder?: string;
  transferDate?: string;
  confidence?: number;
} {
  const currentHolderMatch = text.match(/current (?:licence )?holder[:\-\s]+(.+?)(?:\n|$)/i);
  const newHolderMatch = text.match(/(?:new|proposed) (?:licence )?holder[:\-\s]+(.+?)(?:\n|$)/i);
  const transferDateMatch = text.match(/transfer date[:\-\s]+(.+?)(?:\n|$)/i);

  const result: {
    currentHolder?: string;
    newHolder?: string;
    transferDate?: string;
    confidence?: number;
  } = {};

  if (currentHolderMatch && currentHolderMatch[1]) {
    result.currentHolder = currentHolderMatch[1].trim();
  }
  if (newHolderMatch && newHolderMatch[1]) {
    result.newHolder = newHolderMatch[1].trim();
  }
  if (transferDateMatch && transferDateMatch[1]) {
    result.transferDate = transferDateMatch[1].trim();
  }

  if (result.currentHolder || result.newHolder) {
    result.confidence = 0.8;
  }

  return result;
}

/**
 * Extract GVOL traffic area
 */
function extractTrafficArea(text: string): { value?: string; confidence?: number } {
  const patterns = [
    /traffic commissioner for the (eastern and wales|north[- ]eastern|north[- ]western|scottish|south[- ]eastern[- ]metropolitan|western|west[- ]midland) traffic area/i,
    /traffic area[:\-\s]+(eastern and wales|north[- ]eastern|north[- ]western|scottish|south[- ]eastern[- ]metropolitan|western|west[- ]midland)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const raw = match[1].toLowerCase().replace(/[- ]/g, '-');
      return { value: raw, confidence: 0.9 };
    }
  }
  return {};
}

/**
 * Extract operating centre address for GVOL
 */
function extractOperatingCentre(text: string): { value?: string; confidence?: number } {
  const match = text.match(/operating centre[:\-\s]+(.+?)(?:\n\n|\n[A-Z]{3,})/is);
  if (match && match[1]) {
    const value = match[1].trim();
    if (value.length > 10) {
      return { value, confidence: 0.85 };
    }
  }
  return {};
}

/**
 * Extract planning-specific fields
 */
function extractPlanningReason(text: string): { value?: string; confidence?: number } {
  const patterns = [
    /reason for (?:classification|advertisement)[:\-\s]+(.+?)(?:\n\n|\n[A-Z]{3,})/is,
    /classified as[:\-\s]+(.+?)(?:\n|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = match[1].trim();
      if (value.length > 5) {
        return { value, confidence: 0.75 };
      }
    }
  }
  return {};
}

/**
 * Extract comment submission methods for planning
 */
function extractCommentMethods(text: string): {
  url?: string;
  email?: string;
  postal?: string;
  confidence?: number;
} {
  const result: {
    url?: string;
    email?: string;
    postal?: string;
    confidence?: number;
  } = {};

  // Extract URL
  const urlMatch = text.match(/(?:comments? (?:can be )?submitted (?:online )?at|view (?:and comment )?online at)[:\-\s]+(https?:\/\/[^\s]+)/i);
  if (urlMatch && urlMatch[1]) {
    result.url = urlMatch[1].trim();
  }

  // Extract email
  const emailMatch = text.match(/(?:comments? (?:to|by email)|email comments? to)[:\-\s]+([^\s@]+@[^\s@]+\.[^\s@]+)/i);
  if (emailMatch && emailMatch[1]) {
    result.email = emailMatch[1].trim();
  }

  // Extract postal address
  const postalMatch = text.match(/(?:write to|postal address)[:\-\s]+(.+?)(?:\n\n|\n[A-Z]{3,})/is);
  if (postalMatch && postalMatch[1]) {
    result.postal = postalMatch[1].trim();
  }

  if (result.url || result.email || result.postal) {
    result.confidence = 0.8;
  }

  return result;
}

/**
 * Generate a concise, grammatically correct summary of what is being applied for.
 * Maximum 10 words, proper capitalization, focusing on application type and activities.
 */
export function generateNoticeSummary(text: string): string {
  if (!text || text.trim().length < 50) {
    return "";
  }

  const lower = text.toLowerCase();

  // 1. Determine APPLICATION TYPE with proper capitalization
  let applicationType = "Premises licence";
  let isVariation = false;

  if (lower.includes("vary") || lower.includes("variation")) {
    applicationType = "Variation";
    isVariation = true;
  } else if (lower.includes("review")) {
    applicationType = "Review";
  } else if (lower.includes("club premises certificate") || lower.includes("club certificate")) {
    applicationType = "Club premises certificate";
  } else if (lower.includes("premises licence") || lower.includes("premises license")) {
    applicationType = "Premises licence";
  }

  // 2. Identify LICENSABLE ACTIVITIES with smart detection
  const activities: string[] = [];

  // Alcohol detection (check for all variations)
  const hasAlcohol = lower.includes("sale of alcohol") ||
                     lower.includes("supply of alcohol") ||
                     lower.includes("sale by retail of alcohol") ||
                     lower.includes("retail sale of alcohol") ||
                     (lower.includes("alcohol") && (lower.includes("sale") || lower.includes("supply") || lower.includes("retail")));

  if (hasAlcohol) {
    // Determine alcohol type - check for multiple variations
    const hasOnAndOff = lower.includes("on and off") ||
                        lower.includes("on & off") ||
                        lower.includes("on/off") ||
                        (lower.includes("on premises") && lower.includes("off premises")) ||
                        (lower.includes("on the premises") && lower.includes("off the premises"));

    const hasOffOnly = !hasOnAndOff && (
      lower.includes("off premises") ||
      lower.includes("off the premises") ||
      lower.includes("off-premises") ||
      lower.includes("off sales") ||
      lower.includes("off-sales") ||
      (lower.includes("alcohol") && lower.includes("off") && !lower.includes("on"))
    );

    if (hasOffOnly) {
      activities.push("off-premises alcohol sales");
    } else if (hasOnAndOff) {
      activities.push("on and off-premises alcohol sales");
    } else {
      // Default to on-premises or general
      activities.push("alcohol sales");
    }
  }

  // Late night refreshment (handle singular and plural)
  if (lower.includes("late night refreshment") ||
      lower.includes("late-night refreshment") ||
      lower.includes("late night refreshments")) {
    activities.push("late night refreshment");
  }

  // Entertainment detection
  const hasLiveMusic = lower.includes("live music");
  const hasRecordedMusic = lower.includes("recorded music");
  const hasEntertainment = lower.includes("regulated entertainment") || lower.includes("provision of entertainment");

  if (hasLiveMusic || hasRecordedMusic || hasEntertainment) {
    if (hasLiveMusic && hasRecordedMusic) {
      activities.push("live and recorded music");
    } else if (hasLiveMusic) {
      activities.push("live music");
    } else if (hasRecordedMusic) {
      activities.push("recorded music");
    } else {
      activities.push("entertainment");
    }
  }

  // 3. BUILD SUMMARY with proper grammar
  if (activities.length === 0) {
    return applicationType;
  }

  // Format activities list with proper grammar
  let activityPhrase = "";
  if (activities.length === 1) {
    activityPhrase = activities[0];
  } else if (activities.length === 2) {
    activityPhrase = `${activities[0]} and ${activities[1]}`;
  } else {
    // 3+ activities: use Oxford comma
    const last = activities[activities.length - 1];
    const rest = activities.slice(0, -1);
    activityPhrase = `${rest.join(', ')}, and ${last}`;
  }

  // Construct final summary
  let summary = "";
  if (isVariation) {
    summary = `Variation for ${activityPhrase}`;
  } else {
    summary = `${applicationType} for ${activityPhrase}`;
  }

  // 4. ENSURE 10-WORD LIMIT with smart truncation
  const words = summary.split(/\s+/);
  if (words.length <= 10) {
    return summary;
  }

  // If too long, intelligently shorten
  if (isVariation && activities.length > 0) {
    // "Variation for [first activity]"
    return `Variation for ${activities[0]}`;
  }

  if (activities.length >= 2) {
    // Use just first two activities
    const shortened = `${applicationType} for ${activities[0]} and ${activities[1]}`;
    const shortWords = shortened.split(/\s+/);
    if (shortWords.length <= 10) {
      return shortened;
    }
  }

  // Last resort: just first activity
  return `${applicationType} for ${activities[0]}`;
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

  // Note: The following extractions are for enhanced field population but are not
  // part of the legacy LegalDetails type. These would be used in the new publish flow
  // to auto-populate additional fields in the form blueprints.

  // Licensing-specific extractions (stored as extended properties)
  const dpsName = extractDPSName(text);
  if (dpsName.value) {
    // Store in details for potential use (would need type extension)
    (details as any).dpsName = dpsName.value;
  }

  const licensableActivities = extractLicensableActivities(text);
  if (licensableActivities.value) {
    (details as any).licensableActivities = licensableActivities.value;
  }

  const openingHours = extractOpeningHours(text);
  if (openingHours.value) {
    (details as any).openingHours = openingHours.value;
  }

  const variationDetails = extractVariationDetails(text);
  if (variationDetails.value) {
    (details as any).variationDetails = variationDetails.value;
  }

  const reviewGrounds = extractReviewGrounds(text);
  if (reviewGrounds.value) {
    (details as any).reviewGrounds = reviewGrounds.value;
  }

  // Gambling-specific extractions
  const gamblingType = extractGamblingPremisesType(text);
  if (gamblingType.value) {
    (details as any).gamblingPremisesType = gamblingType.value;
  }

  const transferDetails = extractTransferDetails(text);
  if (transferDetails.currentHolder) {
    (details as any).currentHolder = transferDetails.currentHolder;
  }
  if (transferDetails.newHolder) {
    (details as any).newHolder = transferDetails.newHolder;
  }
  if (transferDetails.transferDate) {
    (details as any).transferDate = transferDetails.transferDate;
  }

  // GVOL-specific extractions
  const trafficArea = extractTrafficArea(text);
  if (trafficArea.value) {
    (details as any).trafficArea = trafficArea.value;
  }

  const operatingCentre = extractOperatingCentre(text);
  if (operatingCentre.value) {
    (details as any).operatingCentre = operatingCentre.value;
  }

  // Planning-specific extractions
  const planningReason = extractPlanningReason(text);
  if (planningReason.value) {
    (details as any).planningReason = planningReason.value;
  }

  const commentMethods = extractCommentMethods(text);
  if (commentMethods.url) {
    (details as any).commentUrl = commentMethods.url;
  }
  if (commentMethods.email) {
    (details as any).commentEmail = commentMethods.email;
  }
  if (commentMethods.postal) {
    (details as any).commentPostal = commentMethods.postal;
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
  // Application type is selected manually in step 1, so don't pass meta to avoid "review" status
  statuses.push(buildStatus("applicationType", applicationTypeValid, undefined));

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

  const emailValid = details.contactEmail.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.contactEmail);
  errors.contactEmail = emailValid ? null : "Enter a valid contact email.";
  statuses.push(buildStatus("contactEmail", emailValid, meta.contactEmail));

  const activitiesValid = details.activities && details.activities.length > 0;
  errors.activities = activitiesValid ? null : "Select at least one licensable activity.";
  statuses.push(buildStatus("activities", activitiesValid, undefined));

  const recommendedWarnings: string[] = [];
  if (!details.tradingName.trim()) recommendedWarnings.push("Trading name is missing.");
  if (!details.premisesName.trim()) recommendedWarnings.push("Premises name is missing.");
  if (!details.applicationSummary.trim()) recommendedWarnings.push("Summary of the application is missing.");
  if (!details.representationDeadline.trim()) recommendedWarnings.push("Representation deadline not set.");
  if (!details.viewingInformation.trim()) recommendedWarnings.push("Viewing information is missing.");
  if (!details.representationContact.trim()) recommendedWarnings.push("Representation contact details missing.");
  if (!details.contactPhone.trim())
    recommendedWarnings.push("Contact phone number is missing.");

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

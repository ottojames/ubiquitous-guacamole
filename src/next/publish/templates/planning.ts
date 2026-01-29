import type { NoticeBase } from "@/types/notice";
import { renderNoticeTemplate, renderHtmlFromText } from "./engine";
import { generatePdf, extractPdfOptions } from "./pdfService";

type PlanningExtras = {
  category: "planning";
  variant: string;
  tokens?: Record<string, string>;
};

type PlanningVariant =
  | "planning-major"
  | "planning-eia"
  | "planning-listed"
  | "planning-conservation"
  | "planning-prow"
  | "planning-departure";

function buildCommentDestinations(tokens: Record<string, string>): string {
  const destinations = [tokens.REPRESENTATION_ADDRESS, tokens.COMMENT_EMAIL, tokens.COMMENT_URL]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length);

  if (!destinations.length) {
    return "[[missing:COMMENT_DESTINATIONS]]";
  }
  return `at ${destinations.join(" / ")}`;
}

const TEMPLATES: Record<PlanningVariant, string> = {
  "planning-major": `TOWN AND COUNTRY PLANNING ACT 1990
APPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — MAJOR DEVELOPMENT

{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for planning permission at {{SITE_ADDRESS}} described as: {{PROPOSAL_DESCRIPTION}}.

Details can be viewed at {{INSPECTION_LOCATION}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}. Comments must be submitted {{COMMENT_METHOD}} to {{AUTHORITY_NAME}} {{COMMENT_DESTINATIONS}} by {{DEADLINE_DATE}}.`,

  "planning-eia": `TOWN AND COUNTRY PLANNING (ENVIRONMENTAL IMPACT ASSESSMENT) REGULATIONS
APPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — EIA DEVELOPMENT

An application accompanied by an Environmental Statement has been made by {{APPLICANT_NAME}} to {{AUTHORITY_NAME}} at {{SITE_ADDRESS}}: {{PROPOSAL_DESCRIPTION}}.

The Environmental Statement and application documents may be inspected at {{INSPECTION_LOCATION}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}. Any representations must be submitted {{COMMENT_METHOD}} by {{DEADLINE_DATE}}.`,

  "planning-listed": `PLANNING (LISTED BUILDINGS AND CONSERVATION AREAS) ACT 1990
APPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — LISTED BUILDING

{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for planning permission at {{SITE_ADDRESS}} described as: {{PROPOSAL_DESCRIPTION}}.

This application affects a listed building and has been notified to Historic England and other statutory consultees as required by the Planning (Listed Buildings and Conservation Areas) Act 1990.

Details can be viewed at {{INSPECTION_LOCATION}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}. Comments must be submitted {{COMMENT_METHOD}} to {{AUTHORITY_NAME}} {{COMMENT_DESTINATIONS}} by {{DEADLINE_DATE}}.`,

  "planning-conservation": `PLANNING (LISTED BUILDINGS AND CONSERVATION AREAS) ACT 1990
APPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — CONSERVATION AREA

{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for planning permission at {{SITE_ADDRESS}} described as: {{PROPOSAL_DESCRIPTION}}.

This application affects a conservation area and has been notified to relevant heritage bodies and statutory consultees as required by the Planning (Listed Buildings and Conservation Areas) Act 1990.

Details can be viewed at {{INSPECTION_LOCATION}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}. Comments must be submitted {{COMMENT_METHOD}} to {{AUTHORITY_NAME}} {{COMMENT_DESTINATIONS}} by {{DEADLINE_DATE}}.`,

  "planning-prow": `TOWN AND COUNTRY PLANNING ACT 1990
APPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — PUBLIC RIGHT OF WAY

{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for planning permission at {{SITE_ADDRESS}} described as: {{PROPOSAL_DESCRIPTION}}.

Details can be viewed at {{INSPECTION_LOCATION}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}. Comments must be submitted {{COMMENT_METHOD}} to {{AUTHORITY_NAME}} {{COMMENT_DESTINATIONS}} by {{DEADLINE_DATE}}.`,

  "planning-departure": `TOWN AND COUNTRY PLANNING ACT 1990
APPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — DEPARTURE

{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for planning permission at {{SITE_ADDRESS}} described as: {{PROPOSAL_DESCRIPTION}}.

Details can be viewed at {{INSPECTION_LOCATION}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}. Comments must be submitted {{COMMENT_METHOD}} to {{AUTHORITY_NAME}} {{COMMENT_DESTINATIONS}} by {{DEADLINE_DATE}}.`,
};

function getPlanningContext(notice: NoticeBase): { variant: PlanningVariant; tokens: Record<string, string> } {
  const extras = (notice.extras ?? {}) as PlanningExtras;
  if (extras.category !== "planning") {
    throw new Error("Planning template requires planning extras");
  }
  const variant = extras.variant as PlanningVariant;
  if (!variant || !(variant in TEMPLATES)) {
    throw new Error(`Unsupported planning variant: ${extras.variant}`);
  }
  const tokens = extras.tokens ?? {};
  return { variant, tokens };
}

export function renderPlanningText(notice: NoticeBase): string {
  const { variant, tokens } = getPlanningContext(notice);
  const enrichedTokens = {
    ...tokens,
    COMMENT_DESTINATIONS: buildCommentDestinations(tokens),
  };
  return renderNoticeTemplate(TEMPLATES[variant], enrichedTokens);
}

export function renderPlanningHtml(notice: NoticeBase): string {
  return renderHtmlFromText(renderPlanningText(notice));
}

export async function renderPlanningPdf(notice: NoticeBase): Promise<Uint8Array> {
  const options = extractPdfOptions(notice, 'planning');
  return generatePdf(options);
}

import type { NoticeBase } from "@/types/notice";
import { renderNoticeTemplate, renderHtmlFromText } from "./engine";

type GvolExtras = {
  category: "gvol";
  variant: string;
  tokens?: Record<string, string>;
};

type GvolVariant = "gvol-new" | "gvol-variation";

const TEMPLATES: Record<GvolVariant, string> = {
  "gvol-new": `GOODS VEHICLE (OPERATOR'S) LICENCE

{{APPLICANT_NAME}}{{#if APPLICANT_TRADING_AS}} trading as {{APPLICANT_TRADING_AS}}{{/if}} of {{APPLICANT_ADDRESS}} is applying for a {{LICENCE_CATEGORY}} operator's licence in the {{TRAFFIC_AREA}} Traffic Area.

Proposed operating centre: {{OPERATING_CENTRE_ADDRESS}}.
Authorisation: {{NUMBER_OF_VEHICLES}} goods vehicles and {{NUMBER_OF_TRAILERS}} trailers.

Owners or occupiers of land (including buildings) near the operating centre who believe that their use or enjoyment of that land would be affected may make representations to the Traffic Commissioner at {{TRAFFIC_COMMISSIONER_OFFICE}} by {{DEADLINE_DATE}}.

Representations must be made in writing. Representors must at the same time send a copy to the applicant at the address given above.`,

  "gvol-variation": `GOODS VEHICLE (OPERATOR'S) LICENCE — VARIATION

{{APPLICANT_NAME}}{{#if APPLICANT_TRADING_AS}} trading as {{APPLICANT_TRADING_AS}}{{/if}} of {{APPLICANT_ADDRESS}} has applied to vary the operator's licence in the {{TRAFFIC_AREA}} Traffic Area as follows: {{GVOL_VARIATION_DETAILS}}.

Operating centre: {{OPERATING_CENTRE_ADDRESS}}.
Authorisation after variation: {{NUMBER_OF_VEHICLES}} goods vehicles and {{NUMBER_OF_TRAILERS}} trailers.

Owners or occupiers of land (including buildings) near the operating centre who believe that their use or enjoyment of that land would be affected may make representations to the Traffic Commissioner at {{TRAFFIC_COMMISSIONER_OFFICE}} by {{DEADLINE_DATE}}.

Representations must be made in writing. Representors must at the same time send a copy to the applicant at the address given above.`,
};

function getGvolContext(notice: NoticeBase): { variant: GvolVariant; tokens: Record<string, string> } {
  const extras = (notice.extras ?? {}) as GvolExtras;
  if (extras.category !== "gvol") {
    throw new Error("GVOL template requires GVOL extras");
  }
  const variant = extras.variant as GvolVariant;
  if (!variant || !(variant in TEMPLATES)) {
    throw new Error(`Unsupported GVOL variant: ${extras.variant}`);
  }
  return { variant, tokens: extras.tokens ?? {} };
}

export function renderGvolText(notice: NoticeBase): string {
  const { variant, tokens } = getGvolContext(notice);
  return renderNoticeTemplate(TEMPLATES[variant], tokens);
}

export function renderGvolHtml(notice: NoticeBase): string {
  return renderHtmlFromText(renderGvolText(notice));
}

export async function renderGvolPdf(): Promise<Uint8Array> {
  throw new Error("PDF rendering is server-only. TODO: move GVOL PDF generation to an API endpoint.");
}

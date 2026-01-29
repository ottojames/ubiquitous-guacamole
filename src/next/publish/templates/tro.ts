import type { NoticeBase } from "@/types/notice";
import { renderNoticeTemplate, renderHtmlFromText } from "./engine";
import { generatePdf, extractPdfOptions } from "./pdfService";

type TroExtras = {
  category: "tro";
  variant: string;
  tokens?: Record<string, string>;
};

type TroVariant = "tro-permanent" | "tro-temporary" | "tro-experimental";

const TEMPLATES: Record<TroVariant, string> = {
  "tro-permanent": `ROAD TRAFFIC REGULATION ACT 1984

{{AUTHORITY_NAME}}

{{ORDER_TITLE}}

NOTICE IS HEREBY GIVEN that {{AUTHORITY_NAME}} proposes to make the above Order.

The effect of the Order will be to {{ORDER_DESCRIPTION}}.

Roads affected: {{ROADS_AFFECTED}}.

{{#if REASON_FOR_ORDER}}Reason: {{REASON_FOR_ORDER}}.{{/if}}

A copy of the proposed Order and a map showing the roads to which it relates, together with a statement of the Council's reasons for proposing to make the Order, may be inspected at {{INSPECTION_LOCATION}}{{#if INSPECTION_HOURS}} during {{INSPECTION_HOURS}}{{/if}}.

If you wish to object to the proposed Order you should send the grounds of your objection in writing to {{OBJECTION_METHOD}} by {{OBJECTION_DEADLINE}}.{{#if OBJECTION_ADDRESS}} Address: {{OBJECTION_ADDRESS}}.{{/if}}

If no objections are received, or if objections received are subsequently withdrawn, {{AUTHORITY_NAME}} may make the Order in the form proposed.

Dated {{PUBLICATION_DATE}}`,

  "tro-temporary": `ROAD TRAFFIC REGULATION ACT 1984

{{AUTHORITY_NAME}}

{{ORDER_TITLE}}

TEMPORARY TRAFFIC REGULATION ORDER

NOTICE IS HEREBY GIVEN that {{AUTHORITY_NAME}} has made a Temporary Order.

The effect of the Order is to {{ORDER_DESCRIPTION}}.

Roads affected: {{ROADS_AFFECTED}}.

{{#if REASON_FOR_ORDER}}Reason: {{REASON_FOR_ORDER}}.{{/if}}

The Order will come into effect on {{EFFECTIVE_DATE}}{{#if EXPIRY_DATE}} and will remain in force until {{EXPIRY_DATE}}{{/if}}.

A copy of the Order may be inspected at {{INSPECTION_LOCATION}}{{#if INSPECTION_HOURS}} during {{INSPECTION_HOURS}}{{/if}}.

For further information please contact {{AUTHORITY_NAME}}{{#if AUTHORITY_EMAIL}} at {{AUTHORITY_EMAIL}}{{/if}}.

Dated {{PUBLICATION_DATE}}`,

  "tro-experimental": `ROAD TRAFFIC REGULATION ACT 1984

{{AUTHORITY_NAME}}

{{ORDER_TITLE}}

EXPERIMENTAL TRAFFIC ORDER

NOTICE IS HEREBY GIVEN that {{AUTHORITY_NAME}} has made an Experimental Traffic Order.

The effect of the Order will be to {{ORDER_DESCRIPTION}}.

Roads affected: {{ROADS_AFFECTED}}.

{{#if REASON_FOR_ORDER}}Reason: {{REASON_FOR_ORDER}}.{{/if}}

The Experimental Order will come into effect on {{EFFECTIVE_DATE}}{{#if EXPERIMENTAL_PERIOD}} and will operate for a period of {{EXPERIMENTAL_PERIOD}}{{/if}}.

A copy of the Order and a map showing the roads to which it relates may be inspected at {{INSPECTION_LOCATION}}{{#if INSPECTION_HOURS}} during {{INSPECTION_HOURS}}{{/if}}.

Persons wishing to object to the experimental scheme becoming permanent should send the grounds of their objection in writing to {{OBJECTION_METHOD}} by {{OBJECTION_DEADLINE}}.{{#if OBJECTION_ADDRESS}} Address: {{OBJECTION_ADDRESS}}.{{/if}}

The Council will consider all objections received during the experimental period before deciding whether to make the Order permanent (with or without modification).

Dated {{PUBLICATION_DATE}}`,
};

function getTroContext(notice: NoticeBase): { variant: TroVariant; tokens: Record<string, string> } {
  const extras = (notice.extras ?? {}) as TroExtras;
  if (extras.category !== "tro") {
    throw new Error("TRO template requires TRO extras");
  }
  const variant = extras.variant as TroVariant;
  if (!variant || !(variant in TEMPLATES)) {
    throw new Error(`Unsupported TRO variant: ${extras.variant}`);
  }
  return { variant, tokens: extras.tokens ?? {} };
}

export function renderTroText(notice: NoticeBase): string {
  const { variant, tokens } = getTroContext(notice);
  return renderNoticeTemplate(TEMPLATES[variant], tokens);
}

export function renderTroHtml(notice: NoticeBase): string {
  return renderHtmlFromText(renderTroText(notice));
}

export async function renderTroPdf(notice: NoticeBase): Promise<Uint8Array> {
  const options = extractPdfOptions(notice, 'tro');
  return generatePdf(options);
}

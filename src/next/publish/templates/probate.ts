import type { NoticeBase } from "@/types/notice";
import { renderNoticeTemplate, renderHtmlFromText } from "./engine";

type ProbateExtras = {
  category: "probate";
  tokens?: Record<string, string>;
};

const TEMPLATE = `TRUSTEE ACT 1925, SECTION 27
ESTATE OF {{DECEASED_NAME}}{{#if DECEASED_ALIAS}} (also known as {{DECEASED_ALIAS}}){{/if}}
Last address: {{DECEASED_LAST_ADDRESS}} — Date of death: {{DATE_OF_DEATH}}

NOTICE is hereby given that any persons having claims against or an interest in the estate of the above-named deceased should send particulars of their claims to {{PERSONAL_REPRESENTATIVE}}{{#if SOLICITOR_NAME}} / {{SOLICITOR_NAME}}{{/if}} at {{SOLICITOR_ADDRESS}}{{#if CLAIM_REFERENCE}} quoting reference {{CLAIM_REFERENCE}}{{/if}} not later than {{DEADLINE_DATE}}.

After this date the estate may be distributed having regard only to the claims of which notice has been received.`;

function getProbateTokens(notice: NoticeBase): Record<string, string> {
  const extras = (notice.extras ?? {}) as ProbateExtras;
  if (extras.category !== "probate") {
    throw new Error("Probate template requires probate extras");
  }
  return extras.tokens ?? {};
}

export function renderProbateText(notice: NoticeBase): string {
  return renderNoticeTemplate(TEMPLATE, getProbateTokens(notice));
}

export function renderProbateHtml(notice: NoticeBase): string {
  return renderHtmlFromText(renderProbateText(notice));
}

export async function renderProbatePdf(): Promise<Uint8Array> {
  throw new Error("PDF rendering is server-only. TODO: move probate PDF generation to an API endpoint.");
}

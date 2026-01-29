import type { NoticeBase } from "@/types/notice";
import { renderNoticeTemplate, renderHtmlFromText } from "./engine";
import { generatePdf, extractPdfOptions } from "./pdfService";

type ProbateExtras = {
  category: "probate";
  tokens?: Record<string, string>;
};

const TEMPLATE = `TRUSTEE ACT 1925, SECTION 27
ESTATE OF {{DECEASED_NAME}}{{#if DECEASED_ALIAS}} (also known as {{DECEASED_ALIAS}}){{/if}}
Last address: {{DECEASED_LAST_ADDRESS}} — Date of death: {{DATE_OF_DEATH}}

NOTICE is hereby given pursuant to section 27 of the Trustee Act 1925 that any persons having claims against or an interest in the estate of the above-named deceased should send particulars of their claims to {{PERSONAL_REPRESENTATIVE}}{{#if SOLICITOR_NAME}} / {{SOLICITOR_NAME}}{{/if}} at {{SOLICITOR_ADDRESS}}{{#if CLAIM_REFERENCE}} quoting reference {{CLAIM_REFERENCE}}{{/if}} not later than {{DEADLINE_DATE}}.

After this date the personal representatives will distribute the estate among the persons entitled thereto having regard only to the claims and interests of which they have had notice and will not be liable for the assets of the estate or any part thereof so distributed to any person of whose claims or interests they have not had notice at the time of distribution.`;

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

export async function renderProbatePdf(notice: NoticeBase): Promise<Uint8Array> {
  const options = extractPdfOptions(notice, 'probate');
  return generatePdf(options);
}

import type { NoticeBase } from '@/types/notice';
import { renderLicensingHtml, renderLicensingPdf, renderLicensingText } from './licensing';
import { renderGamblingHtml, renderGamblingPdf, renderGamblingText } from './gambling';
import { renderGvolHtml, renderGvolPdf, renderGvolText } from './gvol';
import { renderPlanningHtml, renderPlanningPdf, renderPlanningText } from './planning';
import { renderProbateHtml, renderProbatePdf, renderProbateText } from './probate';

export type NoticeTemplateRenderer = {
  renderText(notice: NoticeBase): string;
  renderHtml(notice: NoticeBase): string;
  renderPdf(notice: NoticeBase): Promise<Uint8Array>;
};

const licensingRenderer: NoticeTemplateRenderer = {
  renderText: renderLicensingText,
  renderHtml: renderLicensingHtml,
  renderPdf: renderLicensingPdf,
};

const gamblingRenderer: NoticeTemplateRenderer = {
  renderText: renderGamblingText,
  renderHtml: renderGamblingHtml,
  renderPdf: renderGamblingPdf,
};

const gvolRenderer: NoticeTemplateRenderer = {
  renderText: renderGvolText,
  renderHtml: renderGvolHtml,
  renderPdf: renderGvolPdf,
};

const planningRenderer: NoticeTemplateRenderer = {
  renderText: renderPlanningText,
  renderHtml: renderPlanningHtml,
  renderPdf: renderPlanningPdf,
};

const probateRenderer: NoticeTemplateRenderer = {
  renderText: renderProbateText,
  renderHtml: renderProbateHtml,
  renderPdf: renderProbatePdf,
};

const TEMPLATE_RENDERERS: Record<string, NoticeTemplateRenderer> = {
  licensing_premises_new_v1: licensingRenderer,
  licensing_premises_variation_v1: licensingRenderer,
  licensing_premises_review_v1: licensingRenderer,
  licensing_club_new_v1: licensingRenderer,
  licensing_club_variation_v1: licensingRenderer,
  licensing_club_review_v1: licensingRenderer,
  gambling_premises_generic_v1: gamblingRenderer,
  gvol_operating_centre_v1: gvolRenderer,
  planning_press_notice_v1: planningRenderer,
  probate_trustee_s27_v1: probateRenderer,
};

export function getNoticeTemplateRenderer(key: string): NoticeTemplateRenderer | null {
  return TEMPLATE_RENDERERS[key] ?? null;
}

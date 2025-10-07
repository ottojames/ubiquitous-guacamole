import type { NoticeBase } from '@/types/notice';
import { formatAddressInline, formatDateLong, formatBulletList } from './utils';

type PlanningExtras = {
  category: 'planning';
  variant: string;
  planningAuthority: {
    name: string;
    address: string;
    contactEmail?: string;
    portalUrl: string;
    inspectionAddressOrURL: string;
  };
  applicationReference: string;
  proposal: string;
  triggers: string[];
  overrideReason?: string | null;
};

function getExtras(notice: NoticeBase): PlanningExtras {
  const extras = notice.extras as Partial<PlanningExtras>;
  if (!extras || extras.category !== 'planning') {
    throw new Error('Planning template requires planning extras');
  }
  return extras as PlanningExtras;
}

export function renderPlanningText(notice: NoticeBase): string {
  const extras = getExtras(notice);
  const authority = extras.planningAuthority;
  const applicationRef = extras.applicationReference;
  const site = formatAddressInline(notice.premises?.address);
  const proposal = extras.proposal;
  const triggers = formatBulletList(extras.triggers);
  const repsDeadline = formatDateLong(notice.consultation.repsDeadline);
  const applicationDate = formatDateLong(notice.consultation.applicationDate);
  const lines = [
    'TOWN AND COUNTRY PLANNING ACTS',
    '',
    `${authority.name} has received the following application:`,
    `Reference: ${applicationRef}. Site: ${site}.`,
    `Proposal: ${proposal}.`,
    `Reason for press notice:`,
    triggers,
    '',
    `The application and plans may be inspected at ${authority.inspectionAddressOrURL} during normal office hours.`,
    `Representations must be submitted by ${repsDeadline} via ${authority.portalUrl} or in writing to ${authority.address}.`,
    '',
    `Dated: ${applicationDate}.`,
  ];
  return lines.join('\n');
}

export function renderPlanningHtml(notice: NoticeBase): string {
  const text = renderPlanningText(notice).split(/\n+/);
  const parts: string[] = [];
  for (const line of text) {
    if (!line.trim()) continue;
    if (line === 'TOWN AND COUNTRY PLANNING ACTS') {
      parts.push(`<h1>${line}</h1>`);
      continue;
    }
    if (line.startsWith('•')) {
      const items = line
        .split(/\n+/)
        .map((item) => item.replace(/^•\s*/, '').trim())
        .filter(Boolean);
      parts.push(`<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`);
      continue;
    }
    parts.push(`<p>${line}</p>`);
  }
  return parts.join('\n');
}

export async function renderPlanningPdf(_notice: NoticeBase): Promise<Uint8Array> {
  throw new Error('PDF rendering is server-only. TODO: move planning PDF generation to an API endpoint.');
}

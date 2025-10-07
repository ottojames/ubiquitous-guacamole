import type { NoticeBase } from '@/types/notice';
import { formatAddressInline, formatDateLong } from './utils';

type ProbateExtras = {
  category: 'probate';
  deceased: {
    fullName: string;
    lastAddress: { line1: string; line2?: string; town: string; postcode: string };
    dateOfDeath: string;
  };
  solicitorOrPR: {
    name: string;
    address: { line1: string; line2?: string; town: string; postcode: string };
  };
  claimsDeadline: string;
};

function getExtras(notice: NoticeBase): ProbateExtras {
  const extras = notice.extras as Partial<ProbateExtras>;
  if (!extras || extras.category !== 'probate') {
    throw new Error('Probate template requires probate extras');
  }
  return extras as ProbateExtras;
}

export function renderProbateText(notice: NoticeBase): string {
  const extras = getExtras(notice);
  const deceased = extras.deceased;
  const pr = extras.solicitorOrPR;
  const deceasedAddress = formatAddressInline(deceased.lastAddress);
  const prAddress = formatAddressInline(pr.address);
  const dateOfDeath = formatDateLong(deceased.dateOfDeath);
  const claimsDeadline = formatDateLong(extras.claimsDeadline);
  const applicationDate = formatDateLong(notice.consultation.applicationDate);
  const lines = [
    'TRUSTEE ACT 1925, SECTION 27',
    'NOTICE TO CREDITORS AND OTHERS',
    '',
    `Re: ${deceased.fullName} (deceased), late of ${deceasedAddress}, who died on ${dateOfDeath}.`,
    '',
    `Creditors and others having claims against or an interest in the estate of the above named are required to send particulars in writing to ${pr.name} of ${prAddress} on or before ${claimsDeadline}, after which the estate may be distributed having regard only to the claims of which notice has been received.`,
    '',
    `Dated: ${applicationDate}.`,
  ];
  return lines.join('\n');
}

export function renderProbateHtml(notice: NoticeBase): string {
  const lines = renderProbateText(notice).split(/\n+/).filter(Boolean);
  const parts: string[] = [];
  if (lines[0]) parts.push(`<h1>${lines[0]}</h1>`);
  if (lines[1]) parts.push(`<h2>${lines[1]}</h2>`);
  for (let i = 2; i < lines.length; i += 1) {
    parts.push(`<p>${lines[i]}</p>`);
  }
  return parts.join('\n');
}

export async function renderProbatePdf(_notice: NoticeBase): Promise<Uint8Array> {
  throw new Error('PDF rendering is server-only. TODO: move probate PDF generation to an API endpoint.');
}

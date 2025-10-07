import type { NoticeBase } from '@/types/notice';
import { formatAddressInline, formatDateLong, formatBulletList } from './utils';

type GamblingExtras = {
  category: 'gambling';
  variant: string;
  authority: { name: string; address: string; email?: string };
  activities: string[];
  representations: { email?: string; website?: string; postal?: string };
  siteNoticeDate?: string;
  premisesType: string;
  applicationVariant: string;
};

function getExtras(notice: NoticeBase): GamblingExtras {
  const extras = notice.extras as Partial<GamblingExtras>;
  if (!extras || extras.category !== 'gambling') {
    throw new Error('Gambling template requires gambling extras');
  }
  return extras as GamblingExtras;
}

function applicantDisplayName(notice: NoticeBase): string {
  if (notice.applicant.type === 'company') return notice.applicant.companyName ?? '';
  return notice.applicant.fullName ?? '';
}

function applicantAddress(notice: NoticeBase): string {
  return formatAddressInline(notice.applicant.serviceAddress || notice.applicant.registeredOffice || notice.premises?.address);
}

function buildRepresentations(authority: GamblingExtras['authority'], reps: GamblingExtras['representations'], deadline: string): string {
  const fragments: string[] = [];
  if (reps.postal) {
    fragments.push(`the Licensing Authority at ${reps.postal}`);
  } else {
    fragments.push(`the Licensing Authority at ${authority.address}`);
  }
  if (reps.email) {
    fragments.push(`or by email to ${reps.email}`);
  }
  if (reps.website) {
    fragments.push(`or via ${reps.website}`);
  }
  const deadlineText = formatDateLong(deadline);
  return `${fragments.join(' ')} no later than ${deadlineText}.`;
}

function content(notice: NoticeBase) {
  const extras = getExtras(notice);
  const authority = extras.authority;
  const applicantName = applicantDisplayName(notice);
  const applicantAddr = applicantAddress(notice);
  const premisesName = notice.premises?.name || 'the premises';
  const premisesAddress = formatAddressInline(notice.premises?.address);
  const activities = extras.activities.length ? formatBulletList(extras.activities) : 'No activities provided.';
  const repsLine = buildRepresentations(authority, extras.representations, notice.consultation.repsDeadline);
  const applicationDate = formatDateLong(notice.consultation.applicationDate);
  const variant = extras.applicationVariant.toLowerCase();
  const premisesType = extras.premisesType.toLowerCase();

  const lines = [
    `${applicantName} of ${applicantAddr} has applied to ${authority.name} for a ${variant} of a ${premisesType} premises licence at ${premisesName}, ${premisesAddress}.`,
    '',
    'The application seeks authorisation for the following:',
    activities,
    '',
    `Representations may be made in writing to ${repsLine}`,
    'The application may be inspected at the offices of the Licensing Authority during normal working hours.',
    '',
    `Dated: ${applicationDate}.`,
  ];

  return {
    heading: 'GAMBLING ACT 2005',
    subheading: 'Notice of Application for a Premises Licence',
    lines,
  };
}

export function renderGamblingText(notice: NoticeBase): string {
  const ctx = content(notice);
  return [ctx.heading, ctx.subheading, '', ...ctx.lines].join('\n');
}

export function renderGamblingHtml(notice: NoticeBase): string {
  const ctx = content(notice);
  const lines = ['', ...ctx.lines];
  const parts: string[] = [`<h1>${ctx.heading}</h1>`, `<h2>${ctx.subheading}</h2>`];
  for (const line of lines) {
    if (!line || !line.trim()) continue;
    if (line.includes('•')) {
      const items = line.split(/\n+/).map((item) => item.replace(/^•\s*/, '').trim()).filter(Boolean);
      if (items.length) {
        parts.push(`<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`);
      }
    } else {
      parts.push(`<p>${line}</p>`);
    }
  }
  return parts.join('\n');
}

export async function renderGamblingPdf(_notice: NoticeBase): Promise<Uint8Array> {
  throw new Error('PDF rendering is server-only. TODO: move gambling PDF generation to an API endpoint.');
}

import type { NoticeBase } from '@/types/notice';
import { formatAddressInline, formatDateLong } from './utils';

type GvolExtras = {
  category: 'gvol';
  variant: string;
  trafficArea: { id: string; name: string; address: string } | null;
  applicationType: string;
  vehicles: { maxVehicles: number; maxTrailers: number };
  siteNoticeDate?: string;
};

function getExtras(notice: NoticeBase): GvolExtras {
  const extras = notice.extras as Partial<GvolExtras>;
  if (!extras || extras.category !== 'gvol') {
    throw new Error('GVOL template requires GVOL extras');
  }
  return extras as GvolExtras;
}

function applicantName(notice: NoticeBase): string {
  if (notice.applicant.type === 'company') return notice.applicant.companyName ?? '';
  return notice.applicant.fullName ?? '';
}

function applicantServiceAddress(notice: NoticeBase): string {
  return formatAddressInline(notice.applicant.serviceAddress || notice.applicant.registeredOffice || notice.premises?.address);
}

export function renderGvolText(notice: NoticeBase): string {
  const extras = getExtras(notice);
  const applicant = applicantName(notice);
  const applicantAddress = applicantServiceAddress(notice);
  const trafficArea = extras.trafficArea?.name ?? 'the Traffic Commissioner';
  const trafficAreaAddress = extras.trafficArea?.address ?? 'the relevant Traffic Commissioner';
  const operatingCentre = formatAddressInline(notice.premises?.address);
  const vehicles = extras.vehicles;
  const repsDeadline = formatDateLong(notice.consultation.repsDeadline);
  const applicationDate = formatDateLong(notice.consultation.applicationDate);
  const lines = [
    'GOODS VEHICLE OPERATOR’S LICENCE',
    '',
    `${applicant} of ${applicantAddress} is applying to the Traffic Commissioner for ${trafficArea} for a ${extras.applicationType} of an Operator’s Licence at ${operatingCentre} to keep:`,
    `• ${vehicles.maxVehicles} goods vehicles and ${vehicles.maxTrailers} trailers.`,
    '',
    `Owners or occupiers of land (including buildings) near the operating centre who believe that their use or enjoyment of that land would be affected may make representations in writing to: ${trafficAreaAddress}, by ${repsDeadline}.`,
    `A copy of the representations must at the same time be sent to ${applicant} at the address given above.`,
    '',
    `Dated: ${applicationDate}.`,
  ];
  return lines.join('\n');
}

export function renderGvolHtml(notice: NoticeBase): string {
  const text = renderGvolText(notice).split(/\n+/);
  const parts: string[] = [];
  for (const line of text) {
    if (!line.trim()) continue;
    if (line.startsWith('•')) {
      parts.push(`<ul><li>${line.replace(/^•\s*/, '')}</li></ul>`);
    } else if (line === 'GOODS VEHICLE OPERATOR’S LICENCE') {
      parts.push(`<h1>${line}</h1>`);
    } else {
      parts.push(`<p>${line}</p>`);
    }
  }
  return parts.join('\n');
}

export async function renderGvolPdf(_notice: NoticeBase): Promise<Uint8Array> {
  throw new Error('PDF rendering is server-only. TODO: move GVOL PDF generation to an API endpoint.');
}

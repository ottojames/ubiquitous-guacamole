import type { NoticeBase, Address } from '@/types/notice';
import { formatAddressInline, formatDateLong, formatBulletList } from './utils';

type LicensingActivity = {
  code: string;
  label: string;
  enabled: boolean;
  days?: string[];
  startTime?: string;
  endTime?: string;
  notes?: string;
};

type LicensingExtras = {
  category: 'licensing';
  variant: string;
  authority: { name: string; address: string; email?: string };
  inspectionAddressOrURL: string;
  representations: { email?: string; website?: string; postal?: string };
  siteNoticeDate?: string;
  newspaperPublicationDate?: string;
  activities: LicensingActivity[];
  alcoholService?: 'on' | 'off' | 'both';
  dps?: { fullName: string; issuingAuthority: string; licenceNumber: string } | null;
  variationSummary?: string;
  reviewGrounds?: string;
  applicantDisplayName?: string;
  applicantServiceAddress?: Address | null;
  additionalNotes?: string;
};

function getExtras(notice: NoticeBase): LicensingExtras {
  const extras = (notice.extras || {}) as Partial<LicensingExtras>;
  if (extras.category !== 'licensing') {
    throw new Error('Licensing template requires licensing extras');
  }
  return extras as LicensingExtras;
}

function buildActivitiesList(activities: LicensingActivity[]): string[] {
  const enabled = activities.filter((activity) => activity.enabled);
  if (enabled.length === 0) return ['No licensable activities recorded.'];
  return enabled.map((activity) => {
    const label = activity.label;
    const notes = activity.notes ? ` (${activity.notes})` : '';
    return `${label}${notes}`;
  });
}

function buildActivitiesHoursTable(activities: LicensingActivity[]): string[] {
  const enabled = activities.filter((activity) => activity.enabled);
  if (enabled.length === 0) return ['No hours supplied.'];
  return enabled.map((activity) => {
    const days = (activity.days || []).join(', ');
    const hours = activity.startTime && activity.endTime ? `${activity.startTime} to ${activity.endTime}` : 'Hours not provided';
    return `${activity.label}: ${days || 'Days not provided'} — ${hours}`;
  });
}

function alcoholServiceText(service?: 'on' | 'off' | 'both'): string {
  switch (service) {
    case 'on':
      return 'on the premises';
    case 'off':
      return 'off the premises';
    case 'both':
      return 'on and off the premises';
    default:
      return 'as per the application';
  }
}

function buildRepresentationsText(authority: LicensingExtras['authority'], reps: LicensingExtras['representations'], deadline: string): string {
  const fragments: string[] = [];
  if (reps.postal) {
    fragments.push(`representations in writing to ${reps.postal}`);
  } else {
    fragments.push(`representations in writing to ${authority.address}`);
  }
  if (reps.email) {
    fragments.push(`or by email to ${reps.email}`);
  }
  if (reps.website) {
    fragments.push(`or online at ${reps.website}`);
  }
  const joined = fragments.join(' ');
  const deadlineText = formatDateLong(deadline);
  return `${joined} no later than ${deadlineText}.`;
}

function applicantDisplayName(notice: NoticeBase, extras: LicensingExtras): string {
  if (extras.applicantDisplayName) return extras.applicantDisplayName;
  if (notice.applicant.type === 'company') return notice.applicant.companyName ?? '';
  return notice.applicant.fullName ?? '';
}

function applicantServiceAddress(notice: NoticeBase, extras: LicensingExtras): string {
  const address = extras.applicantServiceAddress || notice.applicant.serviceAddress || notice.applicant.registeredOffice || notice.premises?.address;
  return formatAddressInline(address);
}

function contentForVariant(notice: NoticeBase): { heading: string; subheading: string; lines: string[] } {
  const extras = getExtras(notice);
  const authority = extras.authority;
  const applicantName = applicantDisplayName(notice, extras);
  const applicantAddress = applicantServiceAddress(notice, extras);
  const premisesName = notice.premises?.name || 'the premises';
  const premisesAddress = formatAddressInline(notice.premises?.address);
  const deadline = notice.consultation.repsDeadline || '';
  const inspection = extras.inspectionAddressOrURL || 'the licensing authority during normal office hours';
  const representations = buildRepresentationsText(authority, extras.representations, deadline);
  const activitiesList = buildActivitiesList(extras.activities);
  const activitiesTable = buildActivitiesHoursTable(extras.activities);
  const alcoholText = alcoholServiceText(extras.alcoholService);
  const applicationDate = formatDateLong(notice.consultation.applicationDate);

  const commonFooter = [
    `Representations may be made ${representations}`.trim(),
    `The application may be inspected at ${inspection}.`,
    'It is an offence under Section 158 of the Licensing Act 2003 to knowingly or recklessly make a false statement in connection with an application. The maximum fine on summary conviction is unlimited.',
    `Dated: ${applicationDate}.`,
  ];

  if (extras.variant.includes('premises-new')) {
    return {
      heading: 'LICENSING ACT 2003',
      subheading: 'Application for a Premises Licence',
      lines: [
        `Notice is hereby given that ${applicantName} of ${applicantAddress} has applied to ${authority.name} for a Premises Licence in respect of ${premisesName}, ${premisesAddress}.`,
        '',
        'The application seeks authorisation for the following licensable activities:',
        formatBulletList(activitiesList),
        '',
        'Proposed hours of operation are:',
        formatBulletList(activitiesTable),
        '',
        `Alcohol will be supplied: ${alcoholText}.`,
        extras.dps
          ? `Designated Premises Supervisor (DPS): ${extras.dps.fullName}, Personal Licence issued by ${extras.dps.issuingAuthority}, No. ${extras.dps.licenceNumber}.`
          : 'Designated Premises Supervisor (DPS): details as stated in the application.',
        '',
        ...commonFooter,
      ],
    };
  }

  if (extras.variant.includes('premises-variation')) {
    return {
      heading: 'LICENSING ACT 2003',
      subheading: 'Application to Vary a Premises Licence',
      lines: [
        `${applicantName} of ${applicantAddress} has applied to ${authority.name} to vary the Premises Licence for ${premisesName}, ${premisesAddress} as follows:`,
        '',
        extras.variationSummary ?? 'Variation summary not provided.',
        '',
        'Existing permitted activities and hours remain unless varied above.',
        ...commonFooter,
      ],
    };
  }

  if (extras.variant.includes('premises-review')) {
    return {
      heading: 'LICENSING ACT 2003',
      subheading: 'Application for the Review of a Premises Licence',
      lines: [
        `${applicantName} has applied to ${authority.name} for a review of the premises licence for ${premisesName}, ${premisesAddress} on the grounds of:`,
        '',
        extras.reviewGrounds ?? 'Grounds for review not provided.',
        '',
        'Any responsible authority or other person may make representations as detailed below.',
        ...commonFooter,
      ],
    };
  }

  if (extras.variant.includes('club-new')) {
    return {
      heading: 'LICENSING ACT 2003',
      subheading: 'Application for a Club Premises Certificate',
      lines: [
        `${applicantName} of ${applicantAddress} has applied to ${authority.name} for a Club Premises Certificate at ${premisesName}, ${premisesAddress}.`,
        '',
        'The application seeks authorisation for the following qualifying club activities:',
        formatBulletList(activitiesList),
        '',
        'Proposed hours of operation are:',
        formatBulletList(activitiesTable),
        '',
        extras.additionalNotes || 'Qualifying club activities will be carried on in accordance with the club rules.',
        '',
        ...commonFooter,
      ],
    };
  }

  if (extras.variant.includes('club-variation')) {
    return {
      heading: 'LICENSING ACT 2003',
      subheading: 'Application to Vary a Club Premises Certificate',
      lines: [
        `${applicantName} of ${applicantAddress} has applied to ${authority.name} to vary the Club Premises Certificate for ${premisesName}, ${premisesAddress} as follows:`,
        '',
        extras.variationSummary ?? 'Variation summary not provided.',
        '',
        'Existing permitted club activities and hours remain unless varied above.',
        ...commonFooter,
      ],
    };
  }

  if (extras.variant.includes('club-review')) {
    return {
      heading: 'LICENSING ACT 2003',
      subheading: 'Application for the Review of a Club Premises Certificate',
      lines: [
        `${applicantName} has applied to ${authority.name} for a review of the Club Premises Certificate for ${premisesName}, ${premisesAddress} on the grounds of:`,
        '',
        extras.reviewGrounds ?? 'Grounds for review not provided.',
        '',
        'Any responsible authority or other person may make representations as detailed below.',
        ...commonFooter,
      ],
    };
  }

  throw new Error(`Unsupported licensing variant: ${extras.variant}`);
}

export function renderLicensingText(notice: NoticeBase): string {
  const content = contentForVariant(notice);
  const lines = [content.heading, content.subheading, '', ...content.lines];
  return lines.join('\n');
}

export function renderLicensingHtml(notice: NoticeBase): string {
  const content = contentForVariant(notice);
  const lines = [content.subheading, '', ...content.lines];
  const htmlParts: string[] = [`<h1>${content.heading}</h1>`];
  for (const line of lines) {
    if (!line || !line.trim()) continue;
    if (line.includes('•')) {
      const items = line
        .split(/\n+/)
        .map((item) => item.replace(/^•\s*/, '').trim())
        .filter(Boolean);
      if (items.length) {
        htmlParts.push(`<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`);
      }
      continue;
    }
    htmlParts.push(`<p>${line}</p>`);
  }
  return htmlParts.join('\n');
}

export async function renderLicensingPdf(_notice: NoticeBase): Promise<Uint8Array> {
  throw new Error('PDF rendering is server-only. TODO: move licensing PDF generation to an API endpoint.');
}

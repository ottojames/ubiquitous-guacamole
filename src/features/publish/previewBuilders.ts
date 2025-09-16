/* CN:STEP2-COMPLIANCE-START */
import { formatDisplayDate } from '@/lib/format';
import type { Authority } from '@/lib/authorities';
import type { NoticeDraft, NoticeType } from '@/types/notice';

export type PublishState = Partial<NoticeDraft> & {
  representationDeadline?: string | Date | null;
};

/* CN:TEMPLATES-PREVIEW-START */
/* CN:LICENSING-TEMPLATES-START */
const offenceLine =
  'It is an offence to knowingly or recklessly make a false statement in connection with an application; a person guilty of such an offence is liable on summary conviction to a fine.';

const dash = '—';

const trimOrDash = (value?: string | null) => {
  if (typeof value !== 'string') return dash;
  const trimmed = value.trim();
  return trimmed ? trimmed : dash;
};

function formatDeadline(value?: string | Date | null): string {
  if (!value) return dash;
  const formatted = formatDisplayDate(value);
  return formatted || dash;
}

function repsLines(auth: Authority | null, council: string) {
  const lines: string[] = [];
  if (auth?.repsUrl) {
    lines.push(`Online: ${auth.repsUrl}`);
  }
  if (auth?.repsEmail) {
    lines.push(`Email: ${auth.repsEmail}`);
  }
  if (auth?.postalAddress) {
    lines.push(`Postal: ${auth.postalAddress}`);
  }
  if (!lines.length) {
    lines.push(`Contact ${council}`);
  }
  return lines;
}

export function headingForNotice(type: NoticeType | undefined): [string, string] {
  switch (type) {
    case 'variation':
      return ['LICENSING ACT 2003', 'Application to Vary a Premises Licence'];
    case 'review':
      return ['LICENSING ACT 2003', 'Application for Review of a Premises Licence'];
    case 'premises':
    default:
      return ['LICENSING ACT 2003', 'Application for a Premises Licence'];
  }
}

export function buildPremisesNotice(state: PublishState, auth: Authority | null): string {
  const council = trimOrDash(state.councilName);
  const applicant = trimOrDash(state.applicantName);
  const address = trimOrDash(state.premisesAddress);
  const summary = trimOrDash(state.applicationSummary);
  const deadline = formatDeadline(state.representationDeadline);
  const summaryLine = summary !== dash ? `Proposed licensable activities/hours: ${summary}.` : '';

  return [
    ...headingForNotice('premises'),
    `Notice is hereby given that ${applicant} has applied to ${council} for a Premises Licence in respect of:`,
    `${address}.`,
    summaryLine,
    'Any person wishing to make representations regarding this application should write to:',
    ...repsLines(auth, council),
    `Representations must be received by ${deadline}.`,
    offenceLine,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildVariationNotice(state: PublishState, auth: Authority | null): string {
  const council = trimOrDash(state.councilName);
  const applicant = trimOrDash(state.applicantName);
  const address = trimOrDash(state.premisesAddress);
  const summary = trimOrDash(state.variationSummary || state.applicationSummary);
  const deadline = formatDeadline(state.representationDeadline);
  const summaryLine = summary !== dash ? `Nature of the proposed variation: ${summary}.` : '';

  return [
    ...headingForNotice('variation'),
    `Notice is hereby given that ${applicant} has applied to ${council} to vary the Premises Licence at:`,
    `${address}.`,
    summaryLine,
    'Any person wishing to make representations regarding this application should write to:',
    ...repsLines(auth, council),
    `Representations must be received by ${deadline}.`,
    offenceLine,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildReviewNotice(state: PublishState, auth: Authority | null): string {
  const council = trimOrDash(state.councilName);
  const applicant = trimOrDash(state.applicantName);
  const address = trimOrDash(state.premisesAddress);
  const grounds = trimOrDash(state.reviewGrounds);
  const deadline = formatDeadline(state.representationDeadline);
  const groundsLine = grounds !== dash ? `Grounds for the review: ${grounds}.` : '';

  return [
    ...headingForNotice('review'),
    `Notice is hereby given that an application has been made by ${applicant} to ${council} for a review of the Premises Licence at:`,
    `${address}.`,
    groundsLine,
    'Any person wishing to make representations regarding this application should write to:',
    ...repsLines(auth, council),
    `Representations must be received by ${deadline}.`,
    offenceLine,
  ]
    .filter(Boolean)
    .join('\n');
}
/* CN:LICENSING-TEMPLATES-END */
/* CN:TEMPLATES-PREVIEW-END */
/* CN:STEP2-COMPLIANCE-END */


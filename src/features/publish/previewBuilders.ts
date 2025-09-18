/* CN:STEP2-COMPLIANCE-START */
// {/* CN:LICENSING-FINAL-START */}
import { formatDisplayDate } from '@/lib/format';
import type { Authority } from '@/lib/authorities';
import type { NoticeDraft, NoticeType } from '@/types/notice';

export type PublishState = Partial<NoticeDraft> & {
  representationDeadline?: string | Date | null;
  ocrText?: string | null;
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

const ensureSentence = (value?: string | null) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

/* CN:SIGNOFF-START */
const buildRepresentationsSection = (state: PublishState, authority: Authority | null): string[] => {
  const online = (state.representationsUrl || '').trim() || authority?.repsUrl?.trim() || '';
  const email = (state.councilEmail || authority?.repsEmail || '').trim();
  const postal = (state.councilAddress || authority?.postalAddress || '').trim();
  const section = [
    'How to make representations:',
    `Online: ${online || dash}`,
    `Email:  ${email || dash}`,
    `Postal: ${postal || dash}`,
  ];
  if (!online && !email && !postal) {
    section.push('Missing: online form / email / postal address');
  }
  const deadlineValue = state.representationDeadline ?? state.repsDeadline ?? null;
  if (deadlineValue) {
    section.push(`Representations must be received no later than ${formatDisplayDate(deadlineValue)}.`);
  }
  return section;
};
/* CN:SIGNOFF-END */

type BuildOptions = {
  includeSummaries?: boolean;
};

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

export function buildPremisesNotice(
  state: PublishState,
  auth: Authority | null,
  options: BuildOptions = {}
): string {
  const council = trimOrDash(state.councilName);
  const applicant = trimOrDash(state.applicantName);
  const address = trimOrDash(state.premisesAddress);
  const summary = ensureSentence(state.applicationSummary);
  const includeSummaries = options.includeSummaries === true;

  const lines: string[] = [
    ...headingForNotice('premises'),
    '',
    `Notice is hereby given that ${applicant} has applied to ${council} for a Premises Licence for the premises below.`,
    '',
    `Premises address: ${address}`,
  ];

  if (includeSummaries && summary) {
    lines.push('', `Summary of licensable activities/hours: ${summary}`);
  }

  /* CN:SIGNOFF-START */
  lines.push(
    '',
    ...buildRepresentationsSection(state, auth),
    '',
    offenceLine
  );
  /* CN:SIGNOFF-END */

  return lines.join('\n');
}

export function buildVariationNotice(
  state: PublishState,
  auth: Authority | null,
  options: BuildOptions = {}
): string {
  const council = trimOrDash(state.councilName);
  const applicant = trimOrDash(state.applicantName);
  const address = trimOrDash(state.premisesAddress);
  const includeSummaries = options.includeSummaries === true;
  const appSummary = ensureSentence(state.applicationSummary);
  const variationSummary = ensureSentence(state.variationSummary);

  const lines: string[] = [
    ...headingForNotice('variation'),
    '',
    `Notice is hereby given that ${applicant} has applied to ${council} to vary a Premises Licence at the premises below.`,
    '',
    `Premises address: ${address}`,
  ];

  if (includeSummaries) {
    const paragraphs = [
      appSummary ? `Summary of licensable activities/hours: ${appSummary}` : '',
      variationSummary ? `Nature of the proposed variation: ${variationSummary}` : '',
    ].filter(Boolean);
    if (paragraphs.length) {
      lines.push('', ...paragraphs);
    }
  }

  /* CN:SIGNOFF-START */
  lines.push(
    '',
    ...buildRepresentationsSection(state, auth),
    '',
    offenceLine
  );
  /* CN:SIGNOFF-END */

  return lines.join('\n');
}

export function buildReviewNotice(
  state: PublishState,
  auth: Authority | null,
  options: BuildOptions = {}
): string {
  const council = trimOrDash(state.councilName);
  const applicant = trimOrDash(state.applicantName);
  const address = trimOrDash(state.premisesAddress);
  const includeSummaries = options.includeSummaries === true;
  const grounds = ensureSentence(state.reviewGrounds);

  const lines: string[] = [
    ...headingForNotice('review'),
    '',
    `Notice is hereby given that ${applicant} has applied to ${council} for a review of the Premises Licence at the premises below.`,
    '',
    `Premises address: ${address}`,
  ];

  if (includeSummaries && grounds) {
    lines.push('', `Grounds for the review: ${grounds}`);
  }

  /* CN:SIGNOFF-START */
  lines.push(
    '',
    ...buildRepresentationsSection(state, auth),
    '',
    offenceLine
  );
  /* CN:SIGNOFF-END */

  return lines.join('\n');
}
// {/* CN:LICENSING-FINAL-END */}
/* CN:LICENSING-TEMPLATES-END */
/* CN:TEMPLATES-PREVIEW-END */
/* CN:STEP2-COMPLIANCE-END */

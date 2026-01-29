/**
 * Notice Drafter Service
 *
 * Generates draft notice text based on notice type and input data.
 * Pre-fills templates with standard statutory language and user-provided details.
 */

import type { NoticeBase, NoticeDraft, NoticeType } from '../../src/types/notice';

export interface DraftInput {
  noticeType: NoticeType;
  applicantName: string;
  premisesAddress: string;
  postcode: string;
  councilName: string;
  consultationEnd?: string;
  // Optional fields for specific notice types
  activities?: string[];
  variationSummary?: string;
  reviewGrounds?: string;
  premisesName?: string;
}

export interface DraftResult {
  success: boolean;
  draftText: string;
  noticeType: NoticeType;
  generatedAt: string;
  suggestions?: string[];
}

/**
 * Format a date as "DD Month YYYY" for notice text
 */
function formatDateForNotice(dateStr: string | undefined): string {
  if (!dateStr) return '[DEADLINE DATE]';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '[DEADLINE DATE]';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Generate draft text for Licensing Act 2003 premises licence
 */
function draftLicensingPremises(input: DraftInput): string {
  const activities = input.activities?.join(', ') || '[LICENSABLE ACTIVITIES]';
  const deadline = formatDateForNotice(input.consultationEnd);
  const premises = input.premisesName
    ? `${input.premisesName}, ${input.premisesAddress}`
    : input.premisesAddress;

  return `LICENSING ACT 2003
APPLICATION FOR A NEW PREMISES LICENCE

Notice is hereby given that ${input.applicantName} has applied to ${input.councilName} for a new premises licence for ${premises}.

Licensable activities applied for: ${activities}.
Proposed hours: [PROPOSED HOURS].

The application can be inspected at the offices of ${input.councilName} during normal office hours.

Any representations must be made in writing to ${input.councilName} by ${deadline}.

It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`;
}

/**
 * Generate draft text for Licensing Act 2003 variation
 */
function draftLicensingVariation(input: DraftInput): string {
  const deadline = formatDateForNotice(input.consultationEnd);
  const premises = input.premisesName
    ? `${input.premisesName}, ${input.premisesAddress}`
    : input.premisesAddress;
  const variation = input.variationSummary || '[NATURE OF VARIATION]';

  return `LICENSING ACT 2003
APPLICATION TO VARY A PREMISES LICENCE

${input.applicantName} has applied to ${input.councilName} to vary the premises licence at ${premises}.

Nature of variation: ${variation}.

The application can be inspected at the offices of ${input.councilName} during normal office hours.

Any representations must be made in writing to ${input.councilName} by ${deadline}.

It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`;
}

/**
 * Generate draft text for Licensing Act 2003 review
 */
function draftLicensingReview(input: DraftInput): string {
  const deadline = formatDateForNotice(input.consultationEnd);
  const premises = input.premisesName
    ? `${input.premisesName}, ${input.premisesAddress}`
    : input.premisesAddress;
  const grounds = input.reviewGrounds || '[GROUNDS FOR REVIEW]';

  return `LICENSING ACT 2003
APPLICATION FOR REVIEW OF A PREMISES LICENCE

${input.applicantName} has applied to ${input.councilName} for a review of the premises licence for ${premises}.

Grounds for review: ${grounds}.

The application can be inspected at the offices of ${input.councilName} during normal office hours.

Any representations must be made in writing to ${input.councilName} by ${deadline}.

It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`;
}

/**
 * Generate draft text for Gambling Act 2005 notice
 */
function draftGambling(input: DraftInput): string {
  const deadline = formatDateForNotice(input.consultationEnd);
  const premises = input.premisesName
    ? `${input.premisesName}, ${input.premisesAddress}`
    : input.premisesAddress;

  return `GAMBLING ACT 2005
APPLICATION FOR A PREMISES LICENCE

Notice is hereby given that ${input.applicantName} has applied to ${input.councilName} for a premises licence under the Gambling Act 2005 for ${premises}.

Type of gambling activity: [GAMBLING ACTIVITY TYPE].

Any representations must be made in writing to ${input.councilName} by ${deadline}.

The Gambling Commission's Guidance and the Council's Statement of Principles are available for inspection at ${input.councilName}.`;
}

/**
 * Generate draft text for Goods Vehicle Operator's Licence (GVOL)
 */
function draftGvol(input: DraftInput): string {
  const deadline = formatDateForNotice(input.consultationEnd);

  return `GOODS VEHICLES (LICENSING OF OPERATORS) ACT 1995

${input.applicantName} of ${input.premisesAddress}, ${input.postcode} is applying for a licence to use ${input.premisesAddress} as an operating centre for [NUMBER] goods vehicle(s) and [NUMBER] trailer(s).

Owners or occupiers of land (including buildings) near the operating centre(s) who believe that their use or enjoyment of that land would be affected, should make written representations to the Traffic Commissioner at [TRAFFIC AREA OFFICE ADDRESS] stating their reasons, within 21 days of this notice. Representors must at the same time send a copy of their representations to the applicant at the address given at the top of this notice.`;
}

/**
 * Generate draft text for Traffic Regulation Order (TRO)
 */
function draftTro(input: DraftInput): string {
  const deadline = formatDateForNotice(input.consultationEnd);

  return `ROAD TRAFFIC REGULATION ACT 1984

${input.councilName} hereby gives notice that it proposes to make the following Order:

[ORDER TITLE]

The effect of the Order will be to [EFFECT OF ORDER].

Full details of the proposals are available at ${input.councilName} offices during normal office hours.

Any objections to the proposal, together with the grounds on which they are made, should be sent in writing to ${input.councilName} by ${deadline}.`;
}

/**
 * Generate draft text for Planning notice
 */
function draftPlanning(input: DraftInput): string {
  const deadline = formatDateForNotice(input.consultationEnd);
  const premises = input.premisesName
    ? `${input.premisesName}, ${input.premisesAddress}`
    : input.premisesAddress;

  return `TOWN AND COUNTRY PLANNING ACT 1990

Notice is hereby given that ${input.applicantName} has submitted a planning application to ${input.councilName} for development at ${premises}.

Description of development: [DEVELOPMENT DESCRIPTION].

Application reference: [APPLICATION REFERENCE].

The application may be inspected at ${input.councilName} offices during normal office hours or online at [COUNCIL WEBSITE].

Any representations must be made in writing to ${input.councilName} by ${deadline}.`;
}

/**
 * Generate draft text for Probate notice (Trustee Act s.27)
 */
function draftProbate(input: DraftInput): string {
  const deadline = formatDateForNotice(input.consultationEnd);

  return `TRUSTEE ACT 1925, SECTION 27

Notice is hereby given that any persons having a claim against or an interest in the estate of [DECEASED NAME] late of ${input.premisesAddress}, ${input.postcode}, who died on [DATE OF DEATH], are required to send particulars in writing of their claim or interest to the undersigned.

${input.applicantName}
[SOLICITOR ADDRESS]

Any such claims or interests must be received by ${deadline}, after which date the estate will be distributed having regard only to claims and interests of which notice has been received.`;
}

/**
 * Generate draft text for other notice types
 */
function draftOther(input: DraftInput): string {
  const deadline = formatDateForNotice(input.consultationEnd);

  return `PUBLIC NOTICE

Notice is hereby given by ${input.applicantName} regarding ${input.premisesAddress}, ${input.postcode}.

[NOTICE DETAILS]

Any representations must be made in writing to ${input.councilName} by ${deadline}.`;
}

/**
 * Main drafting function - generates notice text based on type
 */
export function generateDraft(input: DraftInput): DraftResult {
  const suggestions: string[] = [];
  let draftText: string;

  switch (input.noticeType) {
    case 'premises':
      draftText = draftLicensingPremises(input);
      if (!input.activities?.length) {
        suggestions.push('Add licensable activities (e.g., sale of alcohol, late night refreshment)');
      }
      break;
    case 'variation':
      draftText = draftLicensingVariation(input);
      if (!input.variationSummary) {
        suggestions.push('Describe the nature of the variation being applied for');
      }
      break;
    case 'review':
      draftText = draftLicensingReview(input);
      if (!input.reviewGrounds) {
        suggestions.push('Specify the grounds for requesting a review');
      }
      break;
    case 'gambling':
      draftText = draftGambling(input);
      suggestions.push('Specify the type of gambling activity (e.g., betting, gaming machines)');
      break;
    case 'gvol':
      draftText = draftGvol(input);
      suggestions.push('Add the number of vehicles and trailers');
      suggestions.push('Include the Traffic Area Office address');
      break;
    case 'tro':
      draftText = draftTro(input);
      suggestions.push('Add the Order title and description of effect');
      break;
    case 'planning':
      draftText = draftPlanning(input);
      suggestions.push('Add the development description and application reference');
      break;
    case 'probate':
      draftText = draftProbate(input);
      suggestions.push('Add deceased name and date of death');
      suggestions.push('Add solicitor address for receiving claims');
      break;
    default:
      draftText = draftOther(input);
      suggestions.push('Customize the notice content for your specific requirements');
  }

  return {
    success: true,
    draftText,
    noticeType: input.noticeType,
    generatedAt: new Date().toISOString(),
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}

/**
 * Generate draft from NoticeBase format (wizard flow)
 */
export function generateDraftFromNoticeBase(notice: NoticeBase): DraftResult {
  const input: DraftInput = {
    noticeType: notice.noticeType as NoticeType,
    applicantName: notice.applicant.fullName || notice.applicant.companyName || '[APPLICANT NAME]',
    premisesAddress: notice.premises?.address?.line1 || '[PREMISES ADDRESS]',
    postcode: notice.premises?.address?.postcode || '[POSTCODE]',
    councilName: '[COUNCIL NAME]', // Not in NoticeBase, will need to be filled
    consultationEnd: notice.consultation.repsDeadline,
    premisesName: notice.premises?.name,
  };

  return generateDraft(input);
}

/**
 * Generate draft from NoticeDraft format (legacy flow)
 */
export function generateDraftFromNoticeDraft(draft: Partial<NoticeDraft>): DraftResult {
  const input: DraftInput = {
    noticeType: draft.noticeType || 'other',
    applicantName: draft.applicantName || '[APPLICANT NAME]',
    premisesAddress: draft.premisesAddress || '[PREMISES ADDRESS]',
    postcode: draft.postcode || '[POSTCODE]',
    councilName: draft.councilName || '[COUNCIL NAME]',
    consultationEnd: draft.consultationEnd,
    premisesName: draft.premisesName,
    activities: draft.activities,
    variationSummary: draft.variationSummary,
    reviewGrounds: draft.reviewGrounds,
  };

  return generateDraft(input);
}

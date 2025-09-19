import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import type { Activities, ActivityKey, AddressValue, TemplateNotice } from './types';

dayjs.extend(advancedFormat);

const activityLabels: Record<ActivityKey, string> = {
  alcoholOn: 'Sale of alcohol (on the premises)',
  alcoholOff: 'Sale of alcohol (off the premises)',
  lateRefreshment: 'Late night refreshment',
  liveMusic: 'Live music',
  recordedMusic: 'Recorded music',
  dance: 'Performance of dance',
  similar: 'Anything of a similar description',
};

const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const dayLabels: Record<typeof dayOrder[number], string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

const missingToken = (field: string): string => `[[missing: ${field}]]`;

const ensureValue = (value: string | null | undefined, field: string): string => {
  const trimmed = value?.trim();
  if (trimmed) return trimmed;
  return missingToken(field);
};

export const hasEnabledHours = (activities: Activities | undefined | null): boolean => {
  if (!activities) return false;
  return Object.values(activities).some((week) => {
    if (!week) return false;
    return dayOrder.some((day) => week[day]?.enabled);
  });
};

const formatTimeRange = (start: string, end: string): string => `${start}–${end === '00:00' ? '00:00' : end}`;

const renderActivityRow = (label: string, hours?: Activities[keyof Activities]): string => {
  if (!hours) return '';
  const enabled = dayOrder.some((day) => hours[day]?.enabled);
  if (!enabled) return '';
  const cells = dayOrder.map((day) => {
    const range = hours[day];
    if (!range?.enabled) return 'Closed';
    return formatTimeRange(range.start, range.end);
  });
  return `${label} | ${cells.join(' | ')}`;
};

const ensureSentence = (value: string, field: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return missingToken(field);
  if (/[.!?]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
};

const addressOrMissing = (address: AddressValue | null | undefined, field: string): string => {
  if (!address) return missingToken(field);
  const line1 = address.line1?.trim();
  const town = address.town?.trim();
  const postcode = address.postcode?.trim();
  if (!line1 || !town || !postcode) return missingToken(field);
  return [line1, address.line2?.trim(), town, postcode].filter(Boolean).join(', ');
};

export const renderActivitiesTable = (activities?: Activities): string => {
  if (!activities || !hasEnabledHours(activities)) {
    return missingToken('activities');
  }
  const header = ['Activity', ...dayOrder.map((day) => dayLabels[day])];
  const rows = [header.join(' | '), header.map(() => '---').join(' | ')];
  (Object.keys(activityLabels) as ActivityKey[]).forEach((key) => {
    const row = renderActivityRow(activityLabels[key], activities[key]);
    if (row) rows.push(row);
  });
  return rows.join('\n');
};

const formatDeadline = (iso: string): string => {
  if (!iso) return '';
  const dt = dayjs(iso);
  if (!dt.isValid()) return '';
  return dt.format('D MMMM YYYY');
};

const fallbackPremisesName = (notice: TemplateNotice): string => {
  const primary = notice.premisesName?.trim();
  if (primary) return primary;
  const trading = notice.tradingName?.trim();
  if (trading) return trading;
  const address = addressOrMissing(notice.premisesAddress, 'premisesAddress');
  if (address.startsWith('[[missing')) return missingToken('premisesName');
  return address;
};

const renderStandardFooter = (notice: TemplateNotice): string[] => {
  const council = notice.council;
  const lines: string[] = [];
  const repEmail = ensureValue(council?.repEmail, 'councilRepEmail');
  const repPostal = ensureValue(council?.repPostal, 'councilRepPostal');
  const deadline = ensureValue(formatDeadline(notice.representationDeadline), 'representationDeadline');

  lines.push(
    `Any person wishing to make representations concerning this application shall give notice in writing to ${repPostal} or by email to ${repEmail} no later than ${deadline}.`
  );

  const office = council?.officeAddress?.trim();
  const website = council?.website?.trim();
  const councilName = council?.name?.trim();

  if (office || website) {
    lines.push(
      `A record of the application may be inspected at ${ensureValue(office, 'councilOfficeAddress')} during normal office hours or via ${ensureValue(website, 'councilWebsite')}.`
    );
  } else {
    lines.push(
      `A record of the application may be inspected at ${ensureValue(councilName, 'councilName')} during normal office hours.`
    );
  }

  lines.push(
    'It is an offence knowingly or recklessly to make a false statement in connection with an application. A person guilty of such an offence is liable on summary conviction to an unlimited fine.'
  );

  return lines;
};

export const buildNoticeText = (notice: TemplateNotice): string => {
  const applicantName = ensureValue(notice.applicantLegalName, 'applicantLegalName');
  const councilName = ensureValue(notice.council?.name, 'councilName');
  const premises = fallbackPremisesName(notice);
  const premisesAddress = addressOrMissing(notice.premisesAddress, 'premisesAddress');
  const activitiesTable = renderActivitiesTable(notice.activities);
  const footer = renderStandardFooter(notice);

  if (notice.noticeType === 'variation') {
    const paragraphs = [
      'LICENSING ACT 2003',
      `NOTICE IS HEREBY GIVEN that ${applicantName} has applied to ${councilName} to vary the premises licence in respect of ${premises}, ${premisesAddress}.`,
      '',
      `The proposed variation is as follows: ${ensureSentence(notice.variationDescription || '', 'variationDescription')}`,
    ];

    if (!activitiesTable.startsWith('[[missing')) {
      paragraphs.push('', 'The application also seeks to permit the following licensable activities and hours:', activitiesTable);
    }

    paragraphs.push('', ...footer);
    return paragraphs.join('\n');
  }

  if (notice.noticeType === 'review') {
    const reviewApplicant = ensureValue(notice.reviewApplicant || notice.applicantLegalName, 'reviewApplicant');
    const reviewGrounds = ensureSentence(notice.reviewGrounds || '', 'reviewGrounds');
    const paragraphs = [
      'LICENSING ACT 2003',
      `NOTICE IS HEREBY GIVEN that an application has been made by ${reviewApplicant} to ${councilName} for a review of the premises licence in respect of ${premises}, ${premisesAddress}.`,
      '',
      `The grounds for the review are as follows: ${reviewGrounds}`,
      '',
      ...footer,
    ];
    return paragraphs.join('\n');
  }

  const paragraphs = [
    'LICENSING ACT 2003',
    `NOTICE IS HEREBY GIVEN that ${applicantName} has applied to ${councilName} for the grant of a premises licence in respect of ${premises}, ${premisesAddress}.`,
    '',
    'The application is to permit the following licensable activities and hours:',
    activitiesTable,
  ];
  const conditionsSentence = ensureSentence(notice.conditionsSummary || '', 'conditionsSummary');
  if (!conditionsSentence.startsWith('[[missing')) {
    paragraphs.push('', `Summary of proposed conditions: ${conditionsSentence}`);
  }
  paragraphs.push('', ...footer);
  return paragraphs.join('\n');
};

export const buildPreviewLines = (notice: TemplateNotice): string[] => buildNoticeText(notice).split('\n');

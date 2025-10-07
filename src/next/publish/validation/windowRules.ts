import type { NoticeBase } from '@/types/notice';

type RuleIssueSeverity = 'error' | 'warning';

export type WindowRuleIssue = {
  code: string;
  message: string;
  severity?: RuleIssueSeverity;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function calendarDaysBetween(start: Date, end: Date): number {
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / DAY_MS);
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function businessDaysBetween(start: Date, end: Date): number {
  if (end < start) return -businessDaysBetween(end, start);
  let count = 0;
  const cursor = new Date(start.getTime());
  cursor.setHours(0, 0, 0, 0);
  const endDate = new Date(end.getTime());
  endDate.setHours(0, 0, 0, 0);
  while (cursor < endDate) {
    cursor.setDate(cursor.getDate() + 1);
    if (!isWeekend(cursor)) {
      count += 1;
    }
  }
  return count;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  next.setMonth(next.getMonth() + months);
  return next;
}

export function validateWindowRules(notice: NoticeBase): WindowRuleIssue[] {
  const issues: WindowRuleIssue[] = [];
  const applicationDate = parseDate(notice.consultation?.applicationDate);
  const repsDeadline = parseDate(notice.consultation?.repsDeadline);
  const publicationDate = parseDate(notice.publication?.targetDate);
  const extras = notice.extras ?? {};

  switch (extras.category) {
    case 'licensing': {
      const siteNoticeDate = parseDate(extras.siteNoticeDate ?? applicationDate);
      const newspaperDate = parseDate(extras.newspaperPublicationDate ?? notice.publication?.targetDate);
      if (siteNoticeDate && repsDeadline) {
        const diff = calendarDaysBetween(siteNoticeDate, repsDeadline);
        if (diff < 28) {
          issues.push({
            code: 'LICENSING_SITE_NOTICE',
            message: 'Representations deadline must be at least 28 days after the site notice was displayed.',
          });
        }
      }
      if (applicationDate && newspaperDate) {
        const workingDays = businessDaysBetween(applicationDate, newspaperDate);
        if (workingDays > 10 && !extras.newspaperOverrideReason) {
          issues.push({
            code: 'LICENSING_NEWS_WINDOW',
            message: 'Newspaper publication must be within 10 working days of the application date or record an override reason.',
          });
        }
      }
      if (!extras.representations) {
        issues.push({
          code: 'LICENSING_REPS_CONTACT',
          message: 'Provide contact details for representations.',
        });
      }
      break;
    }
    case 'gambling': {
      const siteNoticeDate = parseDate(extras.siteNoticeDate ?? applicationDate);
      if (siteNoticeDate && repsDeadline) {
        const diff = calendarDaysBetween(siteNoticeDate, repsDeadline);
        if (diff < 28) {
          issues.push({
            code: 'GAMBLING_SITE_NOTICE',
            message: 'Representations deadline must be at least 28 days after the site notice was displayed.',
          });
        }
      }
      if (!publicationDate) {
        issues.push({
          code: 'GAMBLING_NEWS_PRESENT',
          message: 'Provide a publication date for the newspaper notice.',
        });
      }
      break;
    }
    case 'gvol': {
      if (applicationDate && publicationDate) {
        const diff = calendarDaysBetween(applicationDate, publicationDate);
        if (diff > 21 || diff < -21) {
          issues.push({
            code: 'GVOL_PUBLICATION_WINDOW',
            message: 'Newspaper publication must be within 21 days before or after the application date.',
          });
        }
      }
      break;
    }
    case 'planning': {
      if (applicationDate && repsDeadline) {
        const diff = calendarDaysBetween(applicationDate, repsDeadline);
        if (diff < 21 && !extras.overrideReason) {
          issues.push({
            code: 'PLANNING_CONSULTATION_WINDOW',
            message: 'Representations period must be at least 21 days unless an override reason is recorded.',
          });
        }
      }
      break;
    }
    case 'probate': {
      if (publicationDate && extras.claimsDeadline) {
        const claimsDeadline = parseDate(extras.claimsDeadline);
        if (claimsDeadline) {
          const minimum = addMonths(publicationDate, 2);
          if (claimsDeadline < minimum) {
            issues.push({
              code: 'PROBATE_DEADLINE',
              message: 'Claims deadline must be at least two months after publication.',
            });
          }
        }
      }
      break;
    }
    default:
      break;
  }

  return issues;
}

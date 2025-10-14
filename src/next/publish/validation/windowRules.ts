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
  const extras = notice.extras ?? {};
  const category = typeof extras === 'object' && extras ? (extras as { category?: string }).category : undefined;
  const tokens =
    typeof extras === 'object' && extras && (extras as { tokens?: Record<string, string> }).tokens
      ? ((extras as { tokens?: Record<string, string> }).tokens as Record<string, string>)
      : {};

  const tokenString = (key: string): string => (typeof tokens[key] === 'string' ? tokens[key].trim() : '');
  const tokenDate = (key: string): Date | null => parseDate(tokenString(key));

  const applicationDate = tokenDate('APPLICATION_DATE') ?? parseDate(notice.consultation?.applicationDate);
  const repsDeadline = tokenDate('DEADLINE_DATE') ?? parseDate(notice.consultation?.repsDeadline);
  const publicationDate = tokenDate('PUBLICATION_DATE') ?? parseDate(notice.publication?.targetDate);
  const representationAddress = tokenString('REPRESENTATION_ADDRESS');
  const representationEmail = tokenString('REPRESENTATION_EMAIL');
  const representationMethod = tokenString('REPRESENTATION_METHOD');

  switch (category) {
    case 'licensing': {
      if (applicationDate && repsDeadline) {
        const diff = calendarDaysBetween(applicationDate, repsDeadline);
        if (diff < 28) {
          issues.push({
            code: 'LICENSING_SITE_NOTICE',
            message: 'Representations deadline must be at least 28 days after the application date.',
          });
        }
      }
      if (applicationDate && publicationDate) {
        const workingDays = businessDaysBetween(applicationDate, publicationDate);
        if (workingDays > 10) {
          issues.push({
            code: 'LICENSING_NEWS_WINDOW',
            message: 'Newspaper publication should be within 10 working days of the application date.',
          });
        }
      }
      if (!representationAddress && !representationEmail) {
        issues.push({
          code: 'LICENSING_REPS_CONTACT',
          message: 'Provide contact details for representations.',
        });
      }
      if (!representationMethod) {
        issues.push({
          code: 'LICENSING_REPS_METHOD',
          message: 'Specify the method for making representations.',
        });
      }
      break;
    }
    case 'gambling': {
      if (applicationDate && repsDeadline) {
        const diff = calendarDaysBetween(applicationDate, repsDeadline);
        if (diff < 28) {
          issues.push({
            code: 'GAMBLING_SITE_NOTICE',
            message: 'Representations deadline must be at least 28 days after the application date.',
          });
        }
      }
      if (!publicationDate) {
        issues.push({
          code: 'GAMBLING_NEWS_PRESENT',
          message: 'Provide a publication date for the newspaper notice.',
        });
      }
      if (!representationAddress && !representationEmail) {
        issues.push({
          code: 'GAMBLING_REPS_CONTACT',
          message: 'Provide contact details for representations.',
        });
      }
      break;
    }
    case 'gvol': {
      if (publicationDate && repsDeadline) {
        const diff = calendarDaysBetween(publicationDate, repsDeadline);
        if (diff !== 21) {
          issues.push({
            code: 'GVOL_PUBLICATION_WINDOW',
            message: 'Objection deadline should be exactly 21 days after publication.',
          });
        }
      }
      break;
    }
    case 'planning': {
      if (applicationDate && repsDeadline) {
        const diff = calendarDaysBetween(applicationDate, repsDeadline);
        const minimum = extras && typeof (extras as { variant?: string }).variant === 'string' && (extras as { variant?: string }).variant === 'planning-eia' ? 30 : 21;
        if (diff < minimum) {
          issues.push({
            code: 'PLANNING_CONSULTATION_WINDOW',
            message: `Representations period must be at least ${minimum} days from the application date.`,
          });
        }
      }
      break;
    }
    case 'probate': {
      if (publicationDate && repsDeadline) {
        const claimsDeadline = repsDeadline;
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

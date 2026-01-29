import type { NoticeBase } from '@/types/notice';
import { businessDaysBetween } from '@/lib/bankHolidays';

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
        if (diff < 21) {
          issues.push({
            code: 'GVOL_PUBLICATION_WINDOW',
            message: 'Objection deadline must be at least 21 days after publication.',
          });
        }
      }
      break;
    }
    case 'planning': {
      const isEIA = extras && typeof (extras as { variant?: string }).variant === 'string' && (extras as { variant?: string }).variant === 'planning-eia';
      const eiaPublicisingDate = tokenDate('EIA_PUBLICISING_DATE');

      if (isEIA && eiaPublicisingDate && repsDeadline) {
        // EIA: use EIA_PUBLICISING_DATE as base, 30 days minimum
        const diff = calendarDaysBetween(eiaPublicisingDate, repsDeadline);
        if (diff < 30) {
          issues.push({
            code: 'PLANNING_EIA_CONSULTATION_WINDOW',
            message: 'Representations period must be at least 30 days from the EIA publicising date.',
          });
        }
        // Validate that EIA publicising date is on or after application date
        if (applicationDate && eiaPublicisingDate < applicationDate) {
          issues.push({
            code: 'PLANNING_EIA_PUBLICISING_DATE_INVALID',
            message: 'EIA publicising date cannot be before the application date.',
          });
        }
      } else if (!isEIA && applicationDate && repsDeadline) {
        // Non-EIA: use APPLICATION_DATE as base, 21 days minimum
        const diff = calendarDaysBetween(applicationDate, repsDeadline);
        if (diff < 21) {
          issues.push({
            code: 'PLANNING_CONSULTATION_WINDOW',
            message: 'Representations period must be at least 21 days from the application date.',
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

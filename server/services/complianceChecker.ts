/**
 * Compliance Checker Service
 *
 * Validates notices against UK statutory requirements for public notices.
 * Checks required fields, deadline rules, and format compliance.
 */

import type { NoticeBase, NoticeDraft } from '../../src/types/notice';

export type ComplianceSeverity = 'error' | 'warning' | 'info';

export interface ComplianceIssue {
  code: string;
  message: string;
  severity: ComplianceSeverity;
  field?: string;
  suggestion?: string;
}

export interface ComplianceResult {
  passed: boolean;
  score: number; // 0-100
  issues: ComplianceIssue[];
  checkedAt: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function calendarDaysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS);
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Checks required fields are present for a notice
 */
function checkRequiredFields(notice: Partial<NoticeDraft>): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  if (!notice.applicantName?.trim()) {
    issues.push({
      code: 'MISSING_APPLICANT_NAME',
      message: 'Applicant name is required.',
      severity: 'error',
      field: 'applicantName',
    });
  }

  if (!notice.premisesAddress?.trim()) {
    issues.push({
      code: 'MISSING_PREMISES_ADDRESS',
      message: 'Premises address is required.',
      severity: 'error',
      field: 'premisesAddress',
    });
  }

  if (!notice.postcode?.trim()) {
    issues.push({
      code: 'MISSING_POSTCODE',
      message: 'Postcode is required for geocoding and council matching.',
      severity: 'error',
      field: 'postcode',
    });
  }

  if (!notice.councilName?.trim()) {
    issues.push({
      code: 'MISSING_COUNCIL',
      message: 'Council name is required.',
      severity: 'error',
      field: 'councilName',
    });
  }

  if (!notice.consultationStart) {
    issues.push({
      code: 'MISSING_CONSULTATION_START',
      message: 'Consultation start date is required.',
      severity: 'error',
      field: 'consultationStart',
    });
  }

  if (!notice.consultationEnd) {
    issues.push({
      code: 'MISSING_CONSULTATION_END',
      message: 'Consultation end date (representations deadline) is required.',
      severity: 'error',
      field: 'consultationEnd',
    });
  }

  return issues;
}

/**
 * Checks deadline compliance based on notice type
 */
function checkDeadlines(notice: Partial<NoticeDraft>): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const startDate = parseDate(notice.consultationStart);
  const endDate = parseDate(notice.consultationEnd);

  if (!startDate || !endDate) return issues;

  const daysBetween = calendarDaysBetween(startDate, endDate);
  const noticeType = notice.noticeType;

  // Check consultation period is in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (endDate < today) {
    issues.push({
      code: 'DEADLINE_PASSED',
      message: 'Representations deadline has already passed.',
      severity: 'error',
      field: 'consultationEnd',
    });
  }

  // Type-specific deadline rules
  if (noticeType === 'premises' || noticeType === 'variation' || noticeType === 'review') {
    // Licensing Act 2003: 28 days minimum
    if (daysBetween < 28) {
      issues.push({
        code: 'LICENSING_SHORT_WINDOW',
        message: `Licensing notices require at least 28 days for representations. Current: ${daysBetween} days.`,
        severity: 'error',
        field: 'consultationEnd',
        suggestion: 'Extend the deadline to at least 28 days from the application date.',
      });
    }
  } else if (noticeType === 'gambling') {
    // Gambling Act 2005: 28 days minimum
    if (daysBetween < 28) {
      issues.push({
        code: 'GAMBLING_SHORT_WINDOW',
        message: `Gambling notices require at least 28 days for representations. Current: ${daysBetween} days.`,
        severity: 'error',
        field: 'consultationEnd',
        suggestion: 'Extend the deadline to at least 28 days.',
      });
    }
  } else if (noticeType === 'gvol') {
    // GVOL: 21 days from publication
    if (daysBetween < 21) {
      issues.push({
        code: 'GVOL_SHORT_WINDOW',
        message: `GVOL notices require at least 21 days for objections. Current: ${daysBetween} days.`,
        severity: 'error',
        field: 'consultationEnd',
        suggestion: 'Extend the deadline to at least 21 days from publication.',
      });
    }
  } else if (noticeType === 'planning') {
    // Planning: 21 days minimum
    if (daysBetween < 21) {
      issues.push({
        code: 'PLANNING_SHORT_WINDOW',
        message: `Planning notices require at least 21 days for representations. Current: ${daysBetween} days.`,
        severity: 'error',
        field: 'consultationEnd',
        suggestion: 'Extend the deadline to at least 21 days.',
      });
    }
  } else if (noticeType === 'probate') {
    // Trustee Act s.27: 2 months minimum
    if (daysBetween < 60) {
      issues.push({
        code: 'PROBATE_SHORT_WINDOW',
        message: `Trustee Act s.27 notices require at least 2 months for claims. Current: ${daysBetween} days.`,
        severity: 'error',
        field: 'consultationEnd',
        suggestion: 'Extend the deadline to at least 2 months from publication.',
      });
    }
  }

  return issues;
}

/**
 * Checks format compliance (postcode, phone, etc.)
 */
function checkFormats(notice: Partial<NoticeDraft>): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  // UK postcode format check
  if (notice.postcode) {
    const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
    if (!postcodeRegex.test(notice.postcode.trim())) {
      issues.push({
        code: 'INVALID_POSTCODE_FORMAT',
        message: 'Postcode does not appear to be a valid UK format.',
        severity: 'warning',
        field: 'postcode',
        suggestion: 'Check the postcode format (e.g., SW1A 1AA).',
      });
    }
  }

  // Email format check
  if (notice.applicantEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(notice.applicantEmail.trim())) {
      issues.push({
        code: 'INVALID_EMAIL_FORMAT',
        message: 'Applicant email does not appear to be valid.',
        severity: 'warning',
        field: 'applicantEmail',
      });
    }
  }

  // Phone format warning (not error since formats vary)
  if (notice.applicantPhone && notice.applicantPhone.replace(/\D/g, '').length < 10) {
    issues.push({
      code: 'SHORT_PHONE_NUMBER',
      message: 'Phone number appears to be too short.',
      severity: 'info',
      field: 'applicantPhone',
    });
  }

  return issues;
}

/**
 * Checks for common compliance warnings
 */
function checkWarnings(notice: Partial<NoticeDraft>): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  // Check statutory warning presence for licensing
  if (
    (notice.noticeType === 'premises' ||
      notice.noticeType === 'variation' ||
      notice.noticeType === 'review') &&
    notice.statutoryWarningPresent === false
  ) {
    issues.push({
      code: 'MISSING_STATUTORY_WARNING',
      message: 'Licensing notices should include statutory warning text about making false statements.',
      severity: 'warning',
      suggestion: 'Include the statutory warning as required by the Licensing Act 2003.',
    });
  }

  // Check for blue notice uploads
  if (!notice.blueNoticeUploads || notice.blueNoticeUploads.length === 0) {
    issues.push({
      code: 'NO_BLUE_NOTICE_UPLOADED',
      message: 'No blue notice document has been uploaded.',
      severity: 'info',
      field: 'blueNoticeUploads',
      suggestion: 'Upload the blue notice document for record-keeping.',
    });
  }

  return issues;
}

/**
 * Calculate compliance score (0-100)
 */
function calculateScore(issues: ComplianceIssue[]): number {
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  // Start at 100, deduct for issues
  let score = 100;
  score -= errorCount * 20; // Each error costs 20 points
  score -= warningCount * 5; // Each warning costs 5 points

  return Math.max(0, Math.min(100, score));
}

/**
 * Main compliance check function
 * Validates a notice draft against UK statutory requirements
 */
export function checkCompliance(notice: Partial<NoticeDraft>): ComplianceResult {
  const issues: ComplianceIssue[] = [
    ...checkRequiredFields(notice),
    ...checkDeadlines(notice),
    ...checkFormats(notice),
    ...checkWarnings(notice),
  ];

  const score = calculateScore(issues);
  const hasErrors = issues.some((i) => i.severity === 'error');

  return {
    passed: !hasErrors,
    score,
    issues,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Extract UK postcode from an address string
 * Handles common UK postcode formats like "SW1A 1AA", "BS1 1HQ", etc.
 */
function extractPostcodeFromAddress(address: string | undefined): string | undefined {
  if (!address) return undefined;
  // UK postcode regex - matches formats like SW1A 1AA, BS1 1HQ, etc.
  const postcodeRegex = /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i;
  const match = address.match(postcodeRegex);
  return match ? match[1].toUpperCase() : undefined;
}

/**
 * Check compliance for NoticeBase format (used in wizard flow)
 */
export function checkNoticeBaseCompliance(notice: NoticeBase): ComplianceResult {
  // Extract data from extras.tokens if available (template flow stores data here)
  const tokens = (notice.extras?.tokens || {}) as Record<string, string>;

  // Try multiple sources for postcode:
  // 1. Structured address field
  // 2. Tokens from template flow
  // 3. Extract from full address string
  const structuredPostcode = notice.premises?.address?.postcode;
  const tokenPostcode = tokens.PREMISES_POSTCODE;
  const extractedPostcode = extractPostcodeFromAddress(
    tokens.PREMISES_ADDRESS || notice.premises?.address?.line1
  );
  const postcode = structuredPostcode || tokenPostcode || extractedPostcode;

  // Try multiple sources for council name:
  // 1. extras.councilName (direct)
  // 2. tokens.AUTHORITY_NAME (template flow)
  const councilName =
    (notice.extras?.councilName as string) ||
    tokens.AUTHORITY_NAME ||
    '';

  // Convert NoticeBase to draft-like format for checking
  const draftLike: Partial<NoticeDraft> = {
    noticeType: notice.noticeType as NoticeDraft['noticeType'],
    applicantName: notice.applicant.fullName || notice.applicant.companyName || tokens.APPLICANT_NAME,
    applicantEmail: notice.applicant.contactEmail || tokens.REPRESENTATION_EMAIL,
    applicantPhone: notice.applicant.contactPhone,
    premisesAddress: notice.premises?.address?.line1 || tokens.PREMISES_ADDRESS,
    premisesName: notice.premises?.name || tokens.PREMISES_NAME,
    postcode,
    councilName,
    consultationStart: notice.consultation.applicationDate || tokens.APPLICATION_DATE,
    consultationEnd: notice.consultation.repsDeadline || tokens.DEADLINE_DATE,
  };

  return checkCompliance(draftLike);
}

/**
 * Council notification email content generator
 *
 * Generates email content for notifying councils when notices are published.
 * This is a content generator only - does not handle sending.
 */

import {
  getCouncil,
  getCouncilDepartment,
  type Council,
  type CouncilDepartment,
  type DepartmentEmail,
} from '@/data/councils';

// ============================================================================
// Types
// ============================================================================

export interface NoticeForCouncilNotification {
  id: string;
  noticeType: string; // e.g., 'licensing-premises-new', 'licensing-variation'
  premisesName?: string;
  premisesAddress?: string;
  applicantName?: string;
  repsDeadline?: string;
  councilId?: string;
}

export interface CouncilNotificationEmail {
  to: string | null; // null if no email found
  subject: string;
  bodyText: string;
  bodyHtml: string;
  councilName: string;
  departmentName: string;
}

// ============================================================================
// Notice Type Mappings
// ============================================================================

/**
 * Maps full notice type slugs to department lookup keys
 * Department `handles` arrays use simplified names like 'premises-licence'
 */
const NOTICE_TYPE_TO_DEPARTMENT_KEY: Record<string, string> = {
  // Licensing Act 2003 - Premises Licence
  'licensing-premises-new': 'premises-licence',
  'licensing-premises-variation': 'alcohol-variation',
  'licensing-premises-review': 'alcohol-review',
  // Licensing Act 2003 - Club Premises Certificate
  'licensing-club-new': 'premises-licence',
  'licensing-club-variation': 'alcohol-variation',
  'licensing-club-review': 'alcohol-review',
  // Gambling Act 2005 - Betting
  'gambling-betting-new': 'gambling-premises',
  'gambling-betting-variation': 'gambling-variation',
  'gambling-betting-review': 'gambling-premises',
  'gambling-betting-transfer': 'gambling-premises',
  // Gambling Act 2005 - Bingo
  'gambling-bingo-new': 'gambling-premises',
  'gambling-bingo-variation': 'gambling-variation',
  'gambling-bingo-review': 'gambling-premises',
  'gambling-bingo-transfer': 'gambling-premises',
  // Gambling Act 2005 - Adult Gaming Centre
  'gambling-agc-new': 'gambling-premises',
  'gambling-agc-variation': 'gambling-variation',
  'gambling-agc-review': 'gambling-premises',
  'gambling-agc-transfer': 'gambling-premises',
  // Gambling Act 2005 - Family Entertainment Centre
  'gambling-fec-new': 'gambling-premises',
  'gambling-fec-variation': 'gambling-variation',
  'gambling-fec-review': 'gambling-premises',
  'gambling-fec-transfer': 'gambling-premises',
  // GVOL (Gaming Vehicles Operating Licence)
  'gvol-new': 'gambling-premises',
  'gvol-variation': 'gambling-variation',
  // Planning
  'planning-major': 'planning-major',
  'planning-eia': 'planning-major',
  'planning-listed': 'listed-building-consent',
  'planning-conservation': 'conservation-area',
  'planning-prow': 'planning-application',
  'planning-departure': 'planning-application',
  // TRO (Traffic Regulation Orders)
  'tro-permanent': 'traffic-regulation-order',
  'tro-temporary': 'temporary-traffic-order',
  'tro-experimental': 'traffic-regulation-order',
  // Probate
  'probate-trustee-s27': 'probate',
};

/**
 * Human-readable notice type labels
 */
const NOTICE_TYPE_LABELS: Record<string, string> = {
  'licensing-premises-new': 'Premises Licence - New',
  'licensing-premises-variation': 'Premises Licence - Variation',
  'licensing-premises-review': 'Premises Licence - Review',
  'licensing-club-new': 'Club Premises Certificate - New',
  'licensing-club-variation': 'Club Premises Certificate - Variation',
  'licensing-club-review': 'Club Premises Certificate - Review',
  'gambling-betting-new': 'Betting Premises - New',
  'gambling-betting-variation': 'Betting Premises - Variation',
  'gambling-betting-review': 'Betting Premises - Review',
  'gambling-betting-transfer': 'Betting Premises - Transfer',
  'gambling-bingo-new': 'Bingo Premises - New',
  'gambling-bingo-variation': 'Bingo Premises - Variation',
  'gambling-bingo-review': 'Bingo Premises - Review',
  'gambling-bingo-transfer': 'Bingo Premises - Transfer',
  'gambling-agc-new': 'Adult Gaming Centre - New',
  'gambling-agc-variation': 'Adult Gaming Centre - Variation',
  'gambling-agc-review': 'Adult Gaming Centre - Review',
  'gambling-agc-transfer': 'Adult Gaming Centre - Transfer',
  'gambling-fec-new': 'Family Entertainment Centre - New',
  'gambling-fec-variation': 'Family Entertainment Centre - Variation',
  'gambling-fec-review': 'Family Entertainment Centre - Review',
  'gambling-fec-transfer': 'Family Entertainment Centre - Transfer',
  'gvol-new': 'GVOL - New',
  'gvol-variation': 'GVOL - Variation',
  'planning-major': 'Major Development',
  'planning-eia': 'EIA Development',
  'planning-listed': 'Listed Building',
  'planning-conservation': 'Conservation Area',
  'planning-prow': 'Public Right of Way',
  'planning-departure': 'Departure',
  'tro-permanent': 'Traffic Regulation Order - Permanent',
  'tro-temporary': 'Traffic Regulation Order - Temporary',
  'tro-experimental': 'Traffic Regulation Order - Experimental',
  'probate-trustee-s27': 'Trustee Act 1925 s.27',
};

// ============================================================================
// Constants
// ============================================================================

const BRAND_COLOR = '#059669'; // emerald-600
const BRAND_COLOR_DARK = '#047857'; // emerald-700
const GRAY_TEXT = '#4b5563'; // gray-600
const GRAY_LIGHT = '#f3f4f6'; // gray-100
const GRAY_BORDER = '#e5e7eb'; // gray-200

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the department lookup key for a notice type
 */
function getDepartmentKey(noticeType: string): string {
  return NOTICE_TYPE_TO_DEPARTMENT_KEY[noticeType] || noticeType;
}

/**
 * Get human-readable label for a notice type
 */
function getNoticeTypeLabel(noticeType: string): string {
  return NOTICE_TYPE_LABELS[noticeType] || formatNoticeType(noticeType);
}

/**
 * Format a notice type ID into a human-readable string (fallback)
 * e.g., 'premises-licence' -> 'Premises Licence'
 */
function formatNoticeType(noticeType: string): string {
  return noticeType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extract primary email from DepartmentEmail type
 * Handles string | null | Record<string, string>
 */
function extractPrimaryEmail(
  email: DepartmentEmail,
  noticeType?: string
): string | null {
  if (email === null) {
    return null;
  }

  if (typeof email === 'string') {
    return email;
  }

  // email is Record<string, string>
  // Try to find an email for the specific notice type first
  if (noticeType && noticeType in email) {
    return email[noticeType];
  }

  // Try common keys that might be relevant
  const fallbackKeys = ['general', 'default', 'main', 'primary', 'enquiries', 'licensing'];
  for (const key of fallbackKeys) {
    if (key in email) {
      return email[key];
    }
  }

  // Return first available email as last resort
  const values = Object.values(email);
  return values.length > 0 ? values[0] : null;
}

/**
 * Find department that handles a notice type for a council
 */
function findDepartmentForNotice(
  councilId: string,
  noticeType: string
): CouncilDepartment | undefined {
  const departmentKey = getDepartmentKey(noticeType);
  return getCouncilDepartment(councilId, departmentKey);
}

/**
 * Escape HTML entities to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

// ============================================================================
// Email Content Generation
// ============================================================================

/**
 * Generate plain text email body
 */
function generatePlainTextBody(
  notice: NoticeForCouncilNotification,
  council: Council,
  department: CouncilDepartment,
  viewUrl: string
): string {
  const noticeTypeLabel = getNoticeTypeLabel(notice.noticeType);

  const lines: string[] = [
    'NEW PUBLIC NOTICE PUBLISHED',
    '===========================',
    '',
    `A new ${noticeTypeLabel} notice has been published that may require attention from ${department.name} at ${council.name}.`,
    '',
    'NOTICE DETAILS',
    '--------------',
    `Notice Type: ${noticeTypeLabel}`,
  ];

  if (notice.premisesName) {
    lines.push(`Premises: ${notice.premisesName}`);
  }

  if (notice.premisesAddress) {
    lines.push(`Address: ${notice.premisesAddress}`);
  }

  if (notice.applicantName) {
    lines.push(`Applicant: ${notice.applicantName}`);
  }

  if (notice.repsDeadline) {
    lines.push(`Representation Deadline: ${notice.repsDeadline}`);
  }

  lines.push(`Notice ID: ${notice.id}`);
  lines.push('');
  lines.push('VIEW NOTICE');
  lines.push('-----------');
  lines.push(viewUrl);
  lines.push('');
  lines.push('---');
  lines.push('Civic Notices - Public Notice Management');
  lines.push('This is an automated notification. Please do not reply directly to this email.');

  return lines.join('\n');
}

/**
 * Generate HTML email body
 */
function generateHtmlBody(
  notice: NoticeForCouncilNotification,
  council: Council,
  department: CouncilDepartment,
  viewUrl: string
): string {
  const noticeTypeLabel = getNoticeTypeLabel(notice.noticeType);

  // Build notice details rows
  let detailsRows = `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${GRAY_BORDER};">
                          <strong style="color: #374151; font-size: 14px;">Notice Type</strong>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${GRAY_BORDER}; text-align: right;">
                          <span style="color: ${GRAY_TEXT}; font-size: 14px;">${escapeHtml(noticeTypeLabel)}</span>
                        </td>
                      </tr>`;

  if (notice.premisesName) {
    detailsRows += `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${GRAY_BORDER};">
                          <strong style="color: #374151; font-size: 14px;">Premises</strong>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${GRAY_BORDER}; text-align: right;">
                          <span style="color: ${GRAY_TEXT}; font-size: 14px;">${escapeHtml(notice.premisesName)}</span>
                        </td>
                      </tr>`;
  }

  if (notice.premisesAddress) {
    detailsRows += `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${GRAY_BORDER};">
                          <strong style="color: #374151; font-size: 14px;">Address</strong>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${GRAY_BORDER}; text-align: right;">
                          <span style="color: ${GRAY_TEXT}; font-size: 14px;">${escapeHtml(notice.premisesAddress)}</span>
                        </td>
                      </tr>`;
  }

  if (notice.applicantName) {
    detailsRows += `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${GRAY_BORDER};">
                          <strong style="color: #374151; font-size: 14px;">Applicant</strong>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${GRAY_BORDER}; text-align: right;">
                          <span style="color: ${GRAY_TEXT}; font-size: 14px;">${escapeHtml(notice.applicantName)}</span>
                        </td>
                      </tr>`;
  }

  if (notice.repsDeadline) {
    detailsRows += `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${GRAY_BORDER};">
                          <strong style="color: #374151; font-size: 14px;">Representation Deadline</strong>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${GRAY_BORDER}; text-align: right;">
                          <span style="color: #dc2626; font-size: 14px; font-weight: 600;">${escapeHtml(notice.repsDeadline)}</span>
                        </td>
                      </tr>`;
  }

  // Notice ID row (no bottom border on last item)
  detailsRows += `
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #374151; font-size: 14px;">Notice ID</strong>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="font-family: 'Menlo', monospace; color: ${GRAY_TEXT}; font-size: 13px; word-break: break-all;">${escapeHtml(notice.id)}</span>
                        </td>
                      </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New ${escapeHtml(noticeTypeLabel)} Published on Civic Notices</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; background-color: ${GRAY_LIGHT};">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${GRAY_LIGHT};">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: ${BRAND_COLOR}; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                New Public Notice Published
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 15px;">
                ${escapeHtml(noticeTypeLabel)}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: ${GRAY_TEXT}; font-size: 16px;">
                A new notice has been published that may require attention from <strong>${escapeHtml(department.name)}</strong> at ${escapeHtml(council.name)}.
              </p>

              <!-- Notice Details Table -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${GRAY_LIGHT}; border-radius: 6px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      ${detailsRows}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="${escapeHtml(viewUrl)}" style="display: inline-block; padding: 14px 32px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 6px;">
                      View Notice on Civic Notices
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${GRAY_LIGHT}; padding: 24px 40px; border-top: 1px solid ${GRAY_BORDER};">
              <p style="margin: 0; color: ${GRAY_TEXT}; font-size: 12px; text-align: center;">
                <strong style="color: ${BRAND_COLOR_DARK};">Civic Notices</strong> - Public Notice Management
              </p>
              <p style="margin: 8px 0 0; color: #9ca3af; font-size: 11px; text-align: center;">
                This is an automated notification. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Generate council notification email content
 *
 * @param notice - The notice details
 * @param councilId - The council identifier (e.g., 'westminster', 'hackney')
 * @param viewUrl - The URL to view the published notice
 * @returns Email content object or null if council/department not found
 */
export function generateCouncilNotificationEmail(
  notice: NoticeForCouncilNotification,
  councilId: string,
  viewUrl: string
): CouncilNotificationEmail | null {
  // Get council data
  const council = getCouncil(councilId);
  if (!council) {
    return null;
  }

  // Find the department that handles this notice type
  const department = findDepartmentForNotice(councilId, notice.noticeType);
  if (!department) {
    return null;
  }

  // Extract primary email
  const email = extractPrimaryEmail(department.email, notice.noticeType);

  // Generate email content
  const noticeTypeLabel = getNoticeTypeLabel(notice.noticeType);
  const subject = `New ${noticeTypeLabel} Published on Civic Notices`;

  const bodyText = generatePlainTextBody(notice, council, department, viewUrl);
  const bodyHtml = generateHtmlBody(notice, council, department, viewUrl);

  return {
    to: email,
    subject,
    bodyText,
    bodyHtml,
    councilName: council.name,
    departmentName: department.name,
  };
}

// ============================================================================
// Exports for Testing
// ============================================================================

export const _internals = {
  getDepartmentKey,
  getNoticeTypeLabel,
  formatNoticeType,
  extractPrimaryEmail,
  findDepartmentForNotice,
  escapeHtml,
  generatePlainTextBody,
  generateHtmlBody,
  NOTICE_TYPE_TO_DEPARTMENT_KEY,
  NOTICE_TYPE_LABELS,
};

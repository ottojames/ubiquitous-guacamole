/**
 * Token Generator
 *
 * Maps NoticeBase data to placeholder tokens for template rendering.
 * This is the bridge between structured notice data and template placeholders.
 */

import type { NoticeBase, Address, Applicant } from '@/types/notice';

/**
 * Format an address object into a single-line string
 */
function formatAddress(address: Address): string {
  const parts = [
    address.line1,
    address.line2,
    address.town,
    address.postcode,
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Format a date string into readable format
 * @param dateStr - ISO date string (YYYY-MM-DD) or JavaScript date string
 * @returns Formatted date like "15 December 2025"
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr; // Return original if parsing fails
    }

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format operating hours from extras
 */
function formatOperatingHours(hours: Record<string, string> | undefined): string {
  if (!hours) return '';

  const entries = Object.entries(hours);
  if (entries.length === 0) return '';

  return entries
    .map(([day, time]) => `${day}: ${time}`)
    .join(', ');
}

/**
 * Format licensable activities from extras
 */
function formatLicensableActivities(activities: string[] | undefined): string {
  if (!activities || activities.length === 0) {
    return 'Not specified';
  }

  return activities.join(', ');
}

/**
 * Get applicant name (handles both individual and company)
 */
function getApplicantName(applicant: Applicant): string {
  if (applicant.type === 'company') {
    return applicant.companyName || 'Unknown Company';
  }
  return applicant.fullName || 'Unknown Applicant';
}

/**
 * Get applicant address (handles both registered office and service address)
 */
function getApplicantAddress(applicant: Applicant): string {
  const address = applicant.serviceAddress || applicant.registeredOffice;
  return address ? formatAddress(address) : '';
}

/**
 * Extract authority names from multi-authority scenarios
 */
function getAuthorityNames(notice: NoticeBase): { single: string; list: string; hasMultiple: boolean } {
  const extras = notice.extras || {};

  // Check for multi-authority data
  if (extras.authorities && Array.isArray(extras.authorities)) {
    const names = extras.authorities.map((auth: any) => auth.name || auth).filter(Boolean);
    return {
      single: names[0] || 'Unknown Authority',
      list: names.join(' and '),
      hasMultiple: names.length > 1,
    };
  }

  // Check for single authority in extras
  if (extras.authority_name) {
    return {
      single: extras.authority_name,
      list: extras.authority_name,
      hasMultiple: false,
    };
  }

  // Check for authority in tokens (from template builder schema mappers)
  if (extras.tokens && extras.tokens.AUTHORITY_NAME) {
    return {
      single: extras.tokens.AUTHORITY_NAME,
      list: extras.tokens.AUTHORITY_NAME,
      hasMultiple: false,
    };
  }

  // Fallback to consultation data
  const authorityName = extras.consultation?.authority || 'Unknown Authority';
  return {
    single: authorityName,
    list: authorityName,
    hasMultiple: false,
  };
}

/**
 * Generate placeholder tokens from NoticeBase object
 *
 * This function maps all fields from a NoticeBase object to their corresponding
 * placeholder tokens that can be used in custom templates.
 *
 * @param notice - The notice data to tokenize
 * @returns Record of placeholder tokens to their string values
 */
export function generateTokensFromNotice(notice: NoticeBase): Record<string, string> {
  const tokens: Record<string, string> = {};
  const extras = notice.extras || {};

  // ============================================================================
  // PRIORITY: Check if tokens are already provided (from template builder forms)
  // ============================================================================

  // If extras.tokens exists (from template builder schema mappers),
  // use those tokens directly as they contain the exact form data
  if (extras.tokens && typeof extras.tokens === 'object') {
    console.log('[Tokenizer] Using pre-built tokens from extras.tokens');
    console.log('[Tokenizer] Sample tokens:', {
      APPLICANT_NAME: extras.tokens.APPLICANT_NAME,
      PREMISES_NAME: extras.tokens.PREMISES_NAME,
      PREMISES_ADDRESS: extras.tokens.PREMISES_ADDRESS,
      AUTHORITY_NAME: extras.tokens.AUTHORITY_NAME,
    });

    // Merge pre-built tokens
    Object.assign(tokens, extras.tokens);

    // Return early if we have all the tokens we need
    // (Template builder provides complete token set)
    return tokens;
  }

  // ============================================================================
  // FALLBACK: Extract tokens from structured NoticeBase data
  // (Used for traditional upload flow and OCR)
  // ============================================================================

  // NOTICE METADATA
  tokens.NOTICE_TYPE = notice.noticeType || '';

  // APPLICANT INFORMATION
  tokens.APPLICANT_NAME = getApplicantName(notice.applicant);
  tokens.APPLICANT_ADDRESS = getApplicantAddress(notice.applicant);
  tokens.APPLICANT_CONTACT = [
    notice.applicant.contactEmail ? `Email: ${notice.applicant.contactEmail}` : '',
    notice.applicant.contactPhone ? `Tel: ${notice.applicant.contactPhone}` : '',
  ].filter(Boolean).join(', ');

  // Company-specific details
  if (notice.applicant.type === 'company') {
    tokens.COMPANY_NAME = notice.applicant.companyName || '';
    tokens.COMPANY_NUMBER = notice.applicant.companyNumber || '';
    tokens.REGISTERED_OFFICE = notice.applicant.registeredOffice
      ? formatAddress(notice.applicant.registeredOffice)
      : '';
  }

  // Trading name (if different from applicant name)
  if (extras.trading_name) {
    tokens.APPLICANT_TRADING_AS = extras.trading_name;
  }

  // ============================================================================
  // PREMISES INFORMATION
  // ============================================================================

  if (notice.premises) {
    tokens.PREMISES_NAME = notice.premises.name || '';
    tokens.PREMISES_ADDRESS = formatAddress(notice.premises.address);
    tokens.PREMISES_POSTCODE = notice.premises.address.postcode || '';

    // Individual address components
    tokens.PREMISES_ADDRESS_LINE1 = notice.premises.address.line1 || '';
    tokens.PREMISES_ADDRESS_LINE2 = notice.premises.address.line2 || '';
    tokens.PREMISES_TOWN = notice.premises.address.town || '';
  }

  // ============================================================================
  // LICENSING DETAILS
  // ============================================================================

  // Licensable activities
  tokens.LICENSABLE_ACTIVITIES = formatLicensableActivities(extras.activities);

  // Activity schedule (detailed hours per activity)
  if (extras.activity_schedule) {
    tokens.ACTIVITY_SCHEDULE = extras.activity_schedule;
  } else if (extras.hours) {
    tokens.ACTIVITY_SCHEDULE = formatOperatingHours(extras.hours);
  } else {
    tokens.ACTIVITY_SCHEDULE = 'Not specified';
  }

  // Operating hours (general premises hours)
  if (extras.opening_hours) {
    tokens.OPENING_HOURS = extras.opening_hours;
  } else if (extras.hours) {
    tokens.OPERATING_HOURS = formatOperatingHours(extras.hours);
  }

  // Variation-specific
  if (extras.nature_of_variation) {
    tokens.NATURE_OF_VARIATION = extras.nature_of_variation;
  }

  if (extras.current_licence_number) {
    tokens.CURRENT_LICENCE_NUMBER = extras.current_licence_number;
  }

  // Review-specific
  if (extras.review_applicant_name) {
    tokens.REVIEW_APPLICANT_NAME = extras.review_applicant_name;
  }

  if (extras.review_applicant_type) {
    tokens.REVIEW_APPLICANT_TYPE = extras.review_applicant_type;
  }

  if (extras.review_grounds) {
    tokens.REVIEW_GROUNDS = extras.review_grounds;
  }

  if (extras.review_details) {
    tokens.REVIEW_DETAILS = extras.review_details;
  }

  if (extras.current_licence_holder) {
    tokens.CURRENT_LICENCE_HOLDER = extras.current_licence_holder;
  }

  if (extras.licensing_objectives) {
    tokens.LICENSING_OBJECTIVES = Array.isArray(extras.licensing_objectives)
      ? extras.licensing_objectives.join(', ')
      : extras.licensing_objectives;
  }

  // ============================================================================
  // AUTHORITY AND CONSULTATION
  // ============================================================================

  const authorities = getAuthorityNames(notice);
  tokens.AUTHORITY_NAME = authorities.single;
  tokens.AUTHORITY_NAMES_LIST = authorities.list;
  tokens.HAS_MULTIPLE_AUTHORITIES = authorities.hasMultiple ? 'true' : '';

  // Consultation dates
  tokens.APPLICATION_DATE = formatDate(notice.consultation.applicationDate);
  tokens.DEADLINE_DATE = formatDate(notice.consultation.repsDeadline);

  if (extras.deadline_time) {
    tokens.DEADLINE_TIME = extras.deadline_time;
  }

  if (extras.hearing_date) {
    tokens.HEARING_DATE = formatDate(extras.hearing_date);
  }

  // Inspection details
  if (extras.inspection_location) {
    tokens.INSPECTION_LOCATION = extras.inspection_location;
  }

  if (extras.inspection_hours || extras.inspection_times) {
    tokens.INSPECTION_HOURS = extras.inspection_hours || extras.inspection_times;
    tokens.INSPECTION_TIMES = extras.inspection_hours || extras.inspection_times;
  }

  if (extras.online_register_url) {
    tokens.ONLINE_REGISTER_URL = extras.online_register_url;
  }

  // Representation contact
  if (extras.representation_address) {
    tokens.REPRESENTATION_ADDRESS = extras.representation_address;
  }

  if (extras.representation_email) {
    tokens.REPRESENTATION_EMAIL = extras.representation_email;
  }

  if (extras.representations_url) {
    tokens.REPRESENTATIONS_URL = extras.representations_url;
  }

  if (extras.responsible_authorities_list_url) {
    tokens.RESPONSIBLE_AUTHORITIES_LIST_URL = extras.responsible_authorities_list_url;
  }

  // ============================================================================
  // PUBLICATION DETAILS
  // ============================================================================

  if (notice.publication) {
    tokens.NEWSPAPER_NAME = notice.publication.newspaper || '';
    tokens.PUBLICATION_DATE = formatDate(notice.publication.targetDate);

    if (notice.publication.urn) {
      tokens.PUBLICATION_URN = notice.publication.urn;
    }
  }

  if (notice.id) {
    tokens.NOTICE_ID = notice.id;
  }

  if (extras.application_ref || extras.reference) {
    tokens.APPLICATION_REF = extras.application_ref || extras.reference;
  }

  // ============================================================================
  // ADDITIONAL CONTEXT
  // ============================================================================

  // Statutory warning
  if (extras.statutory_warning) {
    tokens.STATUTORY_WARNING = extras.statutory_warning;
  }

  // Additional notes or instructions
  if (extras.additional_notes) {
    tokens.ADDITIONAL_NOTES = extras.additional_notes;
  }

  // Contact person
  if (extras.contact_person) {
    tokens.CONTACT_PERSON = extras.contact_person;
  }

  if (extras.contact_phone) {
    tokens.CONTACT_PHONE = extras.contact_phone;
  }

  if (extras.contact_email) {
    tokens.CONTACT_EMAIL = extras.contact_email;
  }

  return tokens;
}

/**
 * Render a template by replacing all {{PLACEHOLDER}} tokens with values
 *
 * @param templateText - Template text containing {{PLACEHOLDER}} tokens
 * @param tokens - Record of token names to values
 * @returns Rendered text with tokens replaced
 */
export function renderTemplate(templateText: string, tokens: Record<string, string>): string {
  let rendered = templateText;

  // Replace all {{TOKEN}} occurrences with their values
  for (const [token, value] of Object.entries(tokens)) {
    const pattern = new RegExp(`\\{\\{${token}\\}\\}`, 'g');
    rendered = rendered.replace(pattern, value || '');
  }

  // Remove any remaining unreplaced tokens (optional - could leave them or show warning)
  // rendered = rendered.replace(/\{\{[A-Z_]+\}\}/g, '[MISSING]');

  return rendered;
}

/**
 * Get missing tokens from a template
 *
 * @param templateText - Template text containing {{PLACEHOLDER}} tokens
 * @param tokens - Available token values
 * @returns Array of token names that are in template but not in tokens
 */
export function getMissingTokens(
  templateText: string,
  tokens: Record<string, string>
): string[] {
  const requiredTokens = new Set<string>();

  // Extract all tokens from template
  const matches = templateText.match(/\{\{([A-Z_]+)\}\}/g);
  if (matches) {
    matches.forEach(match => {
      const token = match.replace(/\{\{|\}\}/g, '');
      requiredTokens.add(token);
    });
  }

  // Find missing tokens (use Array.from for Set compatibility)
  const missing: string[] = [];
  const tokenArray = Array.from(requiredTokens);
  for (const token of tokenArray) {
    if (!tokens[token] || tokens[token].trim() === '') {
      missing.push(token);
    }
  }

  return missing;
}

/**
 * Validate that all required tokens are present in the notice data
 *
 * @param notice - Notice data
 * @param requiredTokens - Array of required token names
 * @returns Object with validation status and missing tokens
 */
export function validateNoticeTokens(
  notice: NoticeBase,
  requiredTokens: string[]
): { isValid: boolean; missingTokens: string[] } {
  const tokens = generateTokensFromNotice(notice);
  const missingTokens: string[] = [];

  for (const token of requiredTokens) {
    if (!tokens[token] || tokens[token].trim() === '') {
      missingTokens.push(token);
    }
  }

  return {
    isValid: missingTokens.length === 0,
    missingTokens,
  };
}

/**
 * Template Renderer
 *
 * Renders template text by substituting {{PLACEHOLDER}} tokens with values
 * from NoticeEditor form data. This bridges the gap between council templates
 * (which use the placeholder registry tokens) and the NoticeEditor form fields.
 *
 * Used when creating notices from templates in the council portal.
 */

/**
 * Address structure matching NoticeEditor form fields
 */
export interface AddressData {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
}

/**
 * Notice form data structure matching NoticeEditor state
 */
export interface NoticeFormData {
  title: string;
  notice_type: string;
  description?: string;
  premises: {
    name: string;
    address: AddressData;
  };
  applicant: {
    name: string;
    address: AddressData;
  };
  consultation: {
    authority: string;
    start_date?: string;
    end_date?: string;
  };
  licensing: {
    activities: string[];
  };
  representation_deadline?: string;
  expires_at?: string;
}

/**
 * Format an address object into a single-line string
 * Filters out empty values and joins with commas
 *
 * @param address - Address object with line1, line2, city, postcode
 * @returns Formatted address string like "123 High St, Bristol, BS1 2AB"
 */
export function formatAddress(address: AddressData | undefined): string {
  if (!address) return '';

  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.postcode,
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Format a date string into readable UK format
 *
 * @param dateStr - ISO date string (YYYY-MM-DD) or JavaScript date string
 * @returns Formatted date like "15 December 2025" or original string if parsing fails
 */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';

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
 * Get the value for a placeholder token from notice form data
 *
 * Maps placeholder tokens (from placeholders.ts registry) to NoticeEditor form fields.
 * Returns the placeholder wrapped in braces if the token is unknown,
 * or an empty string if the value is not available.
 *
 * @param token - Placeholder token name (e.g., "APPLICANT_NAME")
 * @param data - Notice form data from NoticeEditor
 * @returns The substituted value or original placeholder
 */
function getPlaceholderValue(token: string, data: NoticeFormData): string {
  // Define mappings from placeholder tokens to form data fields
  // Each mapping is a function that extracts the value from the form data
  const mappings: Record<string, () => string> = {
    // Applicant Information
    APPLICANT_NAME: () => data.applicant?.name || '',
    APPLICANT_ADDRESS: () => formatAddress(data.applicant?.address),

    // Premises Information
    PREMISES_NAME: () => data.premises?.name || '',
    PREMISES_ADDRESS: () => formatAddress(data.premises?.address),
    PREMISES_POSTCODE: () => data.premises?.address?.postcode || '',

    // Authority/Consultation Information
    AUTHORITY_NAME: () => data.consultation?.authority || '',

    // Dates
    DEADLINE_DATE: () => formatDate(data.representation_deadline),
    APPLICATION_DATE: () => formatDate(data.consultation?.start_date),
    PUBLICATION_DATE: () => formatDate(new Date().toISOString()),

    // Licensing Information
    LICENSABLE_ACTIVITIES: () => {
      const activities = data.licensing?.activities;
      if (!activities || activities.length === 0) return '';
      return activities.join(', ');
    },
  };

  // Get the value from the mapping
  const getValue = mappings[token];

  if (getValue) {
    const value = getValue();
    // Return empty string if value is undefined/null, otherwise return the value
    return value || '';
  }

  // Unknown token - keep the placeholder visible so user can see it wasn't substituted
  return `{{${token}}}`;
}

/**
 * Render template text by substituting placeholders with form data values
 *
 * This is the main function for rendering council templates when creating notices.
 * It takes the template_text from a council template and substitutes all
 * {{PLACEHOLDER}} tokens with actual values from the notice form.
 *
 * @param templateText - Template text containing {{PLACEHOLDER}} tokens
 * @param data - Notice form data from NoticeEditor
 * @returns Rendered text with placeholders replaced by actual values
 *
 * @example
 * ```typescript
 * const template = 'Notice: {{APPLICANT_NAME}} at {{PREMISES_ADDRESS}}';
 * const data = {
 *   applicant: { name: 'Test Ltd', address: { line1: '', city: '', postcode: '' } },
 *   premises: { name: '', address: { line1: '123 High St', city: '', postcode: 'BS1 1AA' } },
 *   // ... other fields
 * };
 * const result = renderTemplateText(template, data);
 * // Returns: 'Notice: Test Ltd at 123 High St, BS1 1AA'
 * ```
 */
export function renderTemplateText(
  templateText: string,
  data: NoticeFormData
): string {
  if (!templateText) return '';

  // Replace all {{TOKEN}} occurrences with their values
  // The regex matches {{WORD_WITH_UNDERSCORES}}
  return templateText.replace(/\{\{([A-Z_]+)\}\}/g, (match, token: string) => {
    const value = getPlaceholderValue(token, data);
    // If value is the original placeholder (unknown token), keep it visible
    // Otherwise return the value (which may be empty string)
    return value;
  });
}

/**
 * Check if a template text contains any placeholders
 *
 * @param templateText - Template text to check
 * @returns True if template contains at least one {{PLACEHOLDER}}
 */
export function hasPlaceholders(templateText: string): boolean {
  if (!templateText) return false;
  return /\{\{[A-Z_]+\}\}/.test(templateText);
}

/**
 * Extract all placeholder tokens from template text
 *
 * @param templateText - Template text containing {{PLACEHOLDER}} tokens
 * @returns Array of unique token names found in the template
 */
export function extractPlaceholders(templateText: string): string[] {
  if (!templateText) return [];

  const matches = templateText.match(/\{\{([A-Z_]+)\}\}/g);
  if (!matches) return [];

  // Extract token names and deduplicate
  const tokens = matches.map(match => match.replace(/\{\{|\}\}/g, ''));
  return [...new Set(tokens)];
}

/**
 * Get list of placeholders that have missing values in the form data
 *
 * @param templateText - Template text containing {{PLACEHOLDER}} tokens
 * @param data - Notice form data from NoticeEditor
 * @returns Array of token names that don't have values in the form data
 */
export function getMissingPlaceholders(
  templateText: string,
  data: NoticeFormData
): string[] {
  const placeholders = extractPlaceholders(templateText);
  const missing: string[] = [];

  for (const token of placeholders) {
    const value = getPlaceholderValue(token, data);
    // If value is still the placeholder ({{TOKEN}}), it's missing
    if (value === `{{${token}}}` || value.trim() === '') {
      missing.push(token);
    }
  }

  return missing;
}

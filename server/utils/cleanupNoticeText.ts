/**
 * AI-powered notice text cleanup utility
 *
 * Cleans up OCR-extracted text from premises licence notices:
 * - Corrects ALL CAPS to proper title case (names, addresses)
 * - Formats postcodes correctly (e.g., "MK420AS" → "MK42 0AS")
 * - Removes unnecessary company footers/agent signatures
 * - Preserves legal wording and statutory language
 */

// UK postcode regex - matches with or without space
const UK_POSTCODE_REGEX = /\b([A-Z]{1,2}[0-9][0-9A-Z]?)\s*([0-9][A-Z]{2})\b/gi;

// Legal terms that should remain uppercase or as-is
const LEGAL_TERMS = [
  'LICENSING ACT 2003',
  'SECTION 34',
  'SECTION 17',
  'SECTION 51',
  'ACT',
  'LICENCE',
  'LICENSE',
];

// Words that should always be lowercase (unless at start of sentence)
const LOWERCASE_WORDS = ['of', 'the', 'and', 'in', 'to', 'for', 'on', 'at', 'by', 'an', 'a'];

// Common agent/solicitor footer patterns to remove
const FOOTER_PATTERNS = [
  /Signed by applicant or by agent on behalf of applicant:?\s*[\r\n]*.*/gi,
  /\b(Lockett & Co|Poppleston Allen|TLT Solicitors|Licensing Matters|John Gaunt & Partners)[^.]*Agents?\b/gi,
  /– Duly Authorised Agents?/gi,
];

/**
 * Convert ALL CAPS text to proper title case
 * Preserves legal terms and handles edge cases
 */
function toProperCase(text: string): string {
  // Skip if not mostly uppercase
  const upperCount = (text.match(/[A-Z]/g) || []).length;
  const lowerCount = (text.match(/[a-z]/g) || []).length;
  if (upperCount < lowerCount * 2) return text;

  return text
    .split(/(\s+)/)
    .map((word, index, arr) => {
      // Preserve whitespace
      if (/^\s+$/.test(word)) return word;

      // Check if this is part of a legal term that should be preserved
      const surroundingText = arr.slice(Math.max(0, index - 2), index + 3).join('');
      for (const term of LEGAL_TERMS) {
        if (surroundingText.toUpperCase().includes(term)) {
          // Keep legal terms in their original case
          if (term.includes(word.toUpperCase())) return word;
        }
      }

      // Convert to title case
      const lower = word.toLowerCase();

      // Check if it's a lowercase word (and not at start)
      if (index > 0 && LOWERCASE_WORDS.includes(lower)) {
        return lower;
      }

      // Title case: first letter uppercase, rest lowercase
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

/**
 * Format UK postcodes correctly with proper spacing and uppercase
 */
function formatPostcodes(text: string): string {
  // First pass: fix spacing and case
  let result = text.replace(UK_POSTCODE_REGEX, (match, outward, inward) => {
    return `${outward.toUpperCase()} ${inward.toUpperCase()}`;
  });

  // Second pass: ensure any remaining postcodes are uppercase
  result = result.replace(/\b([A-Za-z]{1,2}[0-9][0-9A-Za-z]?)\s+([0-9][A-Za-z]{2})\b/g,
    (match, outward, inward) => `${outward.toUpperCase()} ${inward.toUpperCase()}`
  );

  return result;
}

/**
 * Remove agent/solicitor footer signatures
 */
function removeFooters(text: string): string {
  let result = text;
  for (const pattern of FOOTER_PATTERNS) {
    result = result.replace(pattern, '');
  }
  return result.trim();
}

/**
 * Clean up specific fields that are commonly ALL CAPS
 */
function cleanupSpecificFields(text: string): string {
  let result = text;

  // Applicant name pattern: "Applicant: NAME NAME" or similar
  result = result.replace(
    /(Applicant:?\s*)([A-Z][A-Z\s]+[A-Z])(\s)/gi,
    (match, prefix, name, suffix) => {
      const properName = name
        .split(/\s+/)
        .map((n: string) => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase())
        .join(' ');
      return `${prefix}${properName}${suffix}`;
    }
  );

  // Full council names (e.g., "BEDFORD BOROUGH COUNCIL")
  result = result.replace(
    /\b([A-Z]+)\s+(BOROUGH|CITY|COUNTY|DISTRICT)\s+COUNCIL\b/gi,
    (match, name, type) => {
      const properName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      const properType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
      return `${properName} ${properType} Council`;
    }
  );

  // Street names with "ST" prefix (e.g., "ST MARY'S STREET")
  // Handle both straight (') and curly (') apostrophes - using Unicode escape for curly quote
  result = result.replace(
    /\bST\s+([A-Z]+(?:['\u2019][Ss])?)\s+(STREET|ROAD|LANE|AVENUE|WAY|PLACE|CLOSE|DRIVE)/gi,
    (match, name, type) => {
      const properName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase().replace(/['\u2019]s$/i, "'s");
      const properType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
      return `St ${properName} ${properType}`;
    }
  );

  // Business/premises names in ALL CAPS (e.g., "ST MARY'S POST OFFICE")
  // Handle both straight (') and curly (') apostrophes - using Unicode escape for curly quote
  result = result.replace(
    /\bST\s+([A-Z]+(?:['\u2019][Ss])?)\s+(POST OFFICE|PUB|BAR|RESTAURANT|HOTEL|STORE|SHOP)/gi,
    (match, name, type) => {
      const properName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase().replace(/['\u2019]s$/i, "'s");
      const properType = type.split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      return `St ${properName} ${properType}`;
    }
  );

  // General ALL CAPS location names (e.g., "BOROUGH HALL, CAULDWELL STREET")
  result = result.replace(
    /\b([A-Z]{2,})\s+(HALL|HOUSE|BUILDING|CENTRE|CENTER)\b/gi,
    (match, name, type) => {
      const properName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      const properType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
      return `${properName} ${properType}`;
    }
  );

  // General ALL CAPS street names (e.g., "CAULDWELL STREET")
  result = result.replace(
    /\b([A-Z]{3,})\s+(STREET|ROAD|LANE|AVENUE|WAY|PLACE|CLOSE|DRIVE)\b/gi,
    (match, name, type) => {
      // Skip if it's a known abbreviation like "THE STREET"
      if (name === 'THE') return match;
      const properName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      const properType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
      return `${properName} ${properType}`;
    }
  );

  // Town/city names that are ALL CAPS (but not in postcodes)
  result = result.replace(
    /,\s*([A-Z]{3,})\s*,/g,
    (match, town) => {
      // Don't change if it looks like part of a postcode
      if (/^[A-Z]{1,2}[0-9]/.test(town)) return match;
      const properTown = town.charAt(0).toUpperCase() + town.slice(1).toLowerCase();
      return `, ${properTown},`;
    }
  );

  // Standalone town names before postcodes
  result = result.replace(
    /,\s*([A-Z]{3,})\s+([A-Z]{1,2}[0-9])/g,
    (match, town, postcodeStart) => {
      const properTown = town.charAt(0).toUpperCase() + town.slice(1).toLowerCase();
      return `, ${properTown} ${postcodeStart}`;
    }
  );

  return result;
}

/**
 * Main cleanup function - cleans OCR text while preserving legal wording
 */
export function cleanupNoticeText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // Step 1: Format postcodes first (before case changes)
  text = formatPostcodes(text);

  // Step 2: Clean up specific ALL CAPS fields
  text = cleanupSpecificFields(text);

  // Step 3: Remove agent footers
  text = removeFooters(text);

  // Step 4: Clean up excessive whitespace
  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  return text;
}

/**
 * Validate that the cleaned text still contains required legal elements
 */
export function validateLegalContent(text: string): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check for required legal references
  if (!/licensing act/i.test(text)) {
    warnings.push('Missing reference to Licensing Act');
  }

  if (!/representation/i.test(text)) {
    warnings.push('Missing information about representations');
  }

  if (!/\b[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}\b/i.test(text)) {
    warnings.push('No valid UK postcode found');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

export default cleanupNoticeText;

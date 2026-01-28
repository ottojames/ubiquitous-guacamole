import { listAuthorityPacks, type AuthorityPack } from './authorityPacks';

/**
 * Error codes for postcode lookup failures
 */
export type PostcodeLookupErrorCode =
  | 'INVALID_POSTCODE'      // Postcode format is invalid
  | 'POSTCODE_NOT_FOUND'    // Postcode doesn't exist in database
  | 'POSTCODE_TERMINATED'   // Postcode exists but has been terminated
  | 'NETWORK_ERROR'         // Network request failed
  | 'API_ERROR';            // API returned unexpected response

/**
 * Error class for postcode lookup failures
 */
export class PostcodeLookupError extends Error {
  constructor(
    public readonly code: PostcodeLookupErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'PostcodeLookupError';
  }
}

/**
 * User-friendly error messages for each error code
 */
export const POSTCODE_ERROR_MESSAGES: Record<PostcodeLookupErrorCode, string> = {
  INVALID_POSTCODE: 'Please enter a valid UK postcode (e.g., SW1A 1AA)',
  POSTCODE_NOT_FOUND: 'This postcode was not found. Please check and try again.',
  POSTCODE_TERMINATED: 'This postcode is no longer in use. Please use the current postcode.',
  NETWORK_ERROR: 'Unable to verify postcode. Please check your connection and try again.',
  API_ERROR: 'Unable to verify postcode at this time. Please try again later.',
};

/**
 * Validate UK postcode format (basic validation before API call)
 */
export function isValidPostcodeFormat(postcode: string): boolean {
  // UK postcode regex: allows common formats with or without spaces
  // Format: A9 9AA, A99 9AA, AA9 9AA, AA99 9AA, A9A 9AA, AA9A 9AA
  const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
  return postcodeRegex.test(postcode.trim());
}

/**
 * Result from postcodes.io API lookup
 */
export interface PostcodeApiResult {
  admin_district: string | null;
  admin_county: string | null;
  codes: {
    admin_district: string;
    admin_county: string;
  };
}

/**
 * Basic council lookup result (backward compatible)
 */
export interface CouncilLookupResult {
  councilName: string;
  councilEmail: string;
  councilAddress: string;
  councilWebsite: string;
}

/**
 * Extended council lookup result with two-tier information
 */
export interface CouncilLookupResultExtended extends CouncilLookupResult {
  districtCode: string;
  countyCode: string | null;
  countyName: string | null;
  isTwoTier: boolean;
}

/**
 * Look up council information from a UK postcode using local authority pack data.
 * This is the synchronous version for backward compatibility.
 *
 * @param postcode - UK postcode (e.g., "SW1A 1AA" or "SW1A1AA")
 * @returns Council information or null if no matching pack found
 */
export function lookupCouncilByPostcode(postcode: string): CouncilLookupResult | null {
  const packs = listAuthorityPacks();
  const normalised = postcode.replace(/\s+/g, '').toLowerCase();
  const pack = packs.find((p) => normalised.startsWith(p.id.slice(0, 2)));
  if (!pack) return null;
  return {
    councilName: pack.name,
    councilEmail: pack.representation.email || '',
    councilAddress: pack.representation.postal || '',
    councilWebsite: pack.representation.portal || '',
  };
}

/**
 * Look up council information from a UK postcode using postcodes.io API.
 * This is the recommended method for accurate council lookup with two-tier area handling.
 *
 * @param postcode - UK postcode (e.g., "SW1A 1AA" or "SW1A1AA")
 * @returns Council information with GSS codes and two-tier status
 * @throws {PostcodeLookupError} If postcode is invalid, not found, or network error occurs
 *
 * @example
 * ```typescript
 * try {
 *   const result = await lookupCouncilByPostcodeAsync('GU1 3AA');
 *   console.log(result.councilName);    // "Guildford"
 *   console.log(result.countyName);     // "Surrey"
 *   console.log(result.isTwoTier);      // true
 *   console.log(result.districtCode);   // "E07000209"
 * } catch (error) {
 *   if (error instanceof PostcodeLookupError) {
 *     console.error(POSTCODE_ERROR_MESSAGES[error.code]);
 *   }
 * }
 * ```
 */
export async function lookupCouncilByPostcodeAsync(postcode: string): Promise<CouncilLookupResultExtended> {
  const trimmed = postcode.trim();

  // Validate postcode format before making API call
  if (!trimmed || !isValidPostcodeFormat(trimmed)) {
    throw new PostcodeLookupError('INVALID_POSTCODE', `Invalid postcode format: ${postcode}`);
  }

  const normalised = trimmed.replace(/\s+/g, '').toUpperCase();

  let response: Response;
  try {
    response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(normalised)}`);
  } catch (error) {
    // Network errors (offline, DNS failure, timeout, etc.)
    throw new PostcodeLookupError('NETWORK_ERROR', `Network error looking up postcode: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Handle HTTP errors
  if (!response.ok) {
    if (response.status === 404) {
      throw new PostcodeLookupError('POSTCODE_NOT_FOUND', `Postcode not found: ${postcode}`);
    }
    throw new PostcodeLookupError('API_ERROR', `API error (${response.status}): ${response.statusText}`);
  }

  let data: { status: number; result: PostcodeApiResult | null; error?: string };
  try {
    data = await response.json();
  } catch {
    throw new PostcodeLookupError('API_ERROR', 'Invalid response from postcode API');
  }

  // Handle API-level errors (postcodes.io returns 200 with status field)
  if (data.status === 404 || !data.result) {
    throw new PostcodeLookupError('POSTCODE_NOT_FOUND', `Postcode not found: ${postcode}`);
  }

  if (data.status !== 200) {
    throw new PostcodeLookupError('API_ERROR', `API error: ${data.error || 'Unknown error'}`);
  }

  const result: PostcodeApiResult = data.result;

  // Determine if this is a two-tier area (has county council)
  const isTwoTier = result.admin_county !== null;

  // Get the district name for council matching
  const districtName = result.admin_district || '';

  // Try to find a matching authority pack for additional contact info
  const authorityPack = findMatchingAuthorityPack(districtName);

  return {
    councilName: districtName,
    councilEmail: authorityPack?.representation.email || '',
    councilAddress: authorityPack?.representation.postal || '',
    councilWebsite: authorityPack?.representation.portal || '',
    districtCode: result.codes.admin_district,
    countyCode: isTwoTier ? result.codes.admin_county : null,
    countyName: result.admin_county,
    isTwoTier,
  };
}

/**
 * Safe version of lookupCouncilByPostcodeAsync that returns null on error instead of throwing.
 * Use this when you want to handle lookup failures gracefully without try/catch.
 *
 * @param postcode - UK postcode
 * @returns Council information or null if lookup fails
 */
export async function lookupCouncilByPostcodeSafe(postcode: string): Promise<CouncilLookupResultExtended | null> {
  try {
    return await lookupCouncilByPostcodeAsync(postcode);
  } catch {
    return null;
  }
}

/**
 * Find an authority pack that matches the district name
 */
function findMatchingAuthorityPack(districtName: string): AuthorityPack | undefined {
  const packs = listAuthorityPacks();
  const normalisedDistrict = districtName.toLowerCase().replace(/\s+/g, '');

  return packs.find((pack) => {
    const packName = pack.name.toLowerCase().replace(/\s+/g, '');
    // Check if pack name contains district or vice versa
    return packName.includes(normalisedDistrict) || normalisedDistrict.includes(packName);
  });
}

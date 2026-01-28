import { listAuthorityPacks, type AuthorityPack } from './authorityPacks';

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
 * @returns Council information with GSS codes and two-tier status, or null if lookup fails
 *
 * @example
 * ```typescript
 * const result = await lookupCouncilByPostcodeAsync('GU1 3AA');
 * if (result) {
 *   console.log(result.councilName);    // "Guildford"
 *   console.log(result.countyName);     // "Surrey"
 *   console.log(result.isTwoTier);      // true
 *   console.log(result.districtCode);   // "E07000209"
 * }
 * ```
 */
export async function lookupCouncilByPostcodeAsync(postcode: string): Promise<CouncilLookupResultExtended | null> {
  const normalised = postcode.replace(/\s+/g, '').toUpperCase();

  // Call postcodes.io API
  const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(normalised)}`);

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  if (data.status !== 200 || !data.result) {
    return null;
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

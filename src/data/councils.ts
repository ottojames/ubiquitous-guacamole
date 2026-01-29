// /src/data/councils.ts

/**
 * Council data structure definitions for UK local authorities
 *
 * Based on research findings:
 * - 382 UK local authorities total
 * - GSS Code Format: E06=Unitary, E07=District, E08=Metro, E09=London, E10=County, S12=Scottish, W06=Welsh, N09=NI
 * - Two-tier vs Single-tier systems
 * - Department types: Licensing, Planning, Highways, Environmental Health, Building Control, Electoral, Democratic
 */

/**
 * UK Council Type Classification
 * Based on ONS GSS code prefixes and local government structure
 */
export type CouncilType =
  | 'county' // E10 - Upper tier in two-tier areas
  | 'district' // E07 - Lower tier in two-tier areas
  | 'unitary' // E06 - Single tier (England)
  | 'metropolitan' // E08 - Unitary within metro counties
  | 'london_borough' // E09 - Greater London
  | 'scottish' // S12 - Scottish unitary
  | 'welsh' // W06 - Welsh unitary
  | 'ni_district'; // N09 - Northern Ireland

/**
 * UK Region for council categorization
 */
export type CouncilRegion =
  | 'england'
  | 'scotland'
  | 'wales'
  | 'northern_ireland';

/**
 * Department types that handle public notices
 * Maps to notice type routing
 */
export type DepartmentType =
  | 'licensing' // Premises licences, gambling, TENs
  | 'planning' // Planning applications, listed building
  | 'highways' // TROs, road closures
  | 'environmental' // Contaminated land, nuisance
  | 'building_control' // Building regs, demolition
  | 'electoral' // Elections, register
  | 'democratic'; // CPOs, PSPOs, consultations

/**
 * Council contact information for a specific department
 */
export interface CouncilDepartment {
  name?: string; // Display name for the department
  type: DepartmentType;
  email?: string; // Specific department email if known
  phone?: string;
  postalAddress?: string;
  webPortal?: string;
  webForm?: string | null;
  notes?: string | null; // Online submission URL
}

/**
 * Full council definition with all metadata
 * This is the canonical council type for the application
 */
export interface CouncilDefinition {
  // Identity
  id: string; // Slug-based ID (e.g., "westminster")
  name: string; // Full legal name
  shortName?: string; // Common short name
  aliases: string[]; // Alternative names for matching

  // Classification
  type: CouncilType;
  region: CouncilRegion;
  gssCode: string; // ONS GSS code (e.g., "E09000033")

  // Two-tier handling
  isTwoTier: boolean; // True for district councils in county areas
  parentCouncilId?: string; // Reference to county council (for districts)
  childCouncilIds?: string[]; // References to districts (for counties)

  // Contact information
  domain: string; // Email domain (e.g., "westminster.gov.uk")
  website: string; // Main council website
  departments: CouncilDepartment[];

  // Legacy compatibility
  licensingEmail?: string; // Direct licensing email (most common use case)
  repsEmail?: string; // Representations email (alternative)
  postalAddress?: string; // Main postal address
}

/**
 * Lightweight council reference for dropdowns/selects
 * Subset of CouncilDefinition for performance
 */
export interface CouncilOption {
  id: string;
  name: string;
  shortName?: string;
  type: CouncilType;
  gssCode: string;
  isTwoTier: boolean;
}

/**
 * Result from postcode-based council lookup
 * Extends postcodes.io response with our council matching
 */
export interface CouncilLookupMatch {
  council: CouncilDefinition;
  confidence: 'exact' | 'fuzzy' | 'inferred';
  matchedOn: 'gss_code' | 'name' | 'alias' | 'postcode_prefix';

  // Two-tier area info
  countyCouncil?: CouncilDefinition; // If in two-tier area
  districtCouncil?: CouncilDefinition; // The matched district
}

/**
 * Email generation parameters
 */
export interface EmailPatternConfig {
  department: DepartmentType;
  domain: string;
  customPrefix?: string; // Override default prefix (e.g., "entertainment.licensing")
}

/**
 * GSS code prefix to council type mapping
 * Used for parsing postcodes.io responses
 */
export const GSS_CODE_PREFIX_MAP: Record<string, CouncilType> = {
  E06: 'unitary',
  E07: 'district',
  E08: 'metropolitan',
  E09: 'london_borough',
  E10: 'county',
  S12: 'scottish',
  W06: 'welsh',
  N09: 'ni_district',
};

/**
 * Default email prefixes by department type
 */
export const DEFAULT_EMAIL_PREFIX: Record<DepartmentType, string> = {
  licensing: 'licensing',
  planning: 'planning',
  highways: 'highways',
  environmental: 'environmentalhealth',
  building_control: 'buildingcontrol',
  electoral: 'elections',
  democratic: 'democratic',
};

/**
 * Parse GSS code to determine council type and region
 */
export function parseGssCode(gssCode: string): {
  type: CouncilType;
  region: CouncilRegion;
} | null {
  if (!gssCode || gssCode.length < 3) return null;

  const prefix = gssCode.substring(0, 3);
  const type = GSS_CODE_PREFIX_MAP[prefix];

  if (!type) return null;

  let region: CouncilRegion;
  if (prefix.startsWith('E')) {
    region = 'england';
  } else if (prefix.startsWith('S')) {
    region = 'scotland';
  } else if (prefix.startsWith('W')) {
    region = 'wales';
  } else if (prefix.startsWith('N')) {
    region = 'northern_ireland';
  } else {
    return null;
  }

  return { type, region };
}

/**
 * Generate email address for a department
 * Uses known email if available, otherwise generates from pattern
 */
export function generateDepartmentEmail(
  council: CouncilDefinition,
  department: DepartmentType
): string {
  // Check for specific department email first
  const dept = council.departments.find((d) => d.type === department);
  if (dept?.email) return dept.email;

  // Fall back to legacy licensing email for licensing requests
  if (department === 'licensing' && council.licensingEmail) {
    return council.licensingEmail;
  }

  // Generate from pattern
  const prefix = DEFAULT_EMAIL_PREFIX[department];
  return `${prefix}@${council.domain}`;
}

/**
 * Notice types that should go to county councils in two-tier areas
 */
const COUNTY_NOTICE_TYPES = [
  'highways',
  'tro',
  'road_closure',
  'minerals',
  'waste',
];

/**
 * Check if a notice type should be handled by the county council
 */
export function isCountyLevelNotice(noticeType: string): boolean {
  return COUNTY_NOTICE_TYPES.includes(noticeType.toLowerCase());
}

/**
 * Get the appropriate council for a notice type in a two-tier area
 * Returns district for licensing/planning, county for highways
 */
export function getResponsibleCouncil(
  match: CouncilLookupMatch,
  noticeType: string
): CouncilDefinition {
  // If not a two-tier area, always return the matched council
  if (!match.council.isTwoTier) {
    return match.council;
  }

  // For county-level notices, return the county council if available
  if (isCountyLevelNotice(noticeType) && match.countyCouncil) {
    return match.countyCouncil;
  }

  // For all other notices (licensing, planning, etc.), return the district
  return match.districtCouncil || match.council;
}

// ============================================================================
// Aliases for councilNotification.ts compatibility
// ============================================================================

export type Council = CouncilDefinition;

export interface DepartmentEmail {
  email: string;
  departmentName: string;
  contactName?: string;
}

/**
 * Get a council by ID
 */
export function getCouncil(councilId: string): CouncilDefinition | null {
  // This would normally query a database or council registry
  // For now, return null as councils are looked up dynamically
  return null;
}

/**
 * Get the appropriate department for a notice type at a council
 */
export function getCouncilDepartment(
  councilId: string,
  noticeType: string
): CouncilDepartment | null {
  // Determine department based on notice type
  const deptType = noticeType.startsWith('licensing') ? 'licensing' :
                   noticeType.startsWith('planning') ? 'planning' :
                   noticeType.startsWith('tro') ? 'highways' :
                   'licensing';
  
  return {
    type: deptType as DepartmentType,
    email: `${DEFAULT_EMAIL_PREFIX[deptType as DepartmentType] || 'enquiries'}@council.gov.uk`,
    phone: undefined,
    webForm: undefined,
    notes: undefined,
  };
}

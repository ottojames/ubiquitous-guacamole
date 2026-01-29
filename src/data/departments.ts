/**
 * Department Definitions for UK Local Authorities
 *
 * This file is the SINGLE SOURCE OF TRUTH for:
 * - Department type definitions
 * - Council tier responsibilities
 * - Notice category to department mappings
 * - Department metadata (legislation, email patterns, aliases)
 *
 * CRITICAL: In two-tier council areas (county + district), different departments
 * are handled by different tiers:
 * - COUNTY: highways (TROs), minerals, waste
 * - DISTRICT: licensing, planning, environmental, building control
 *
 * @see CLAUDE.md "Departments Requiring Public Notices" for research documentation
 */

import type { NoticeCategoryId } from '@/next/publish/config/noticeTypes';

/**
 * Canonical department type for UK local authorities
 * These are the primary council departments that handle public notices
 */
export type DepartmentType =
  | 'licensing' // Licensing Act 2003, Gambling Act 2005
  | 'planning' // Town and Country Planning Act 1990
  | 'highways' // Road Traffic Regulation Act 1984
  | 'environmental' // Environmental Protection Act 1990
  | 'building_control' // Building Act 1984
  | 'electoral' // Representation of the People Act 1983
  | 'democratic'; // Various (CPOs, PSPOs, consultations)

/**
 * Council tier classification
 * Used to determine which council handles which notices in two-tier areas
 */
export type CouncilTier = 'district' | 'county' | 'unitary' | 'all';

/**
 * Legislation reference for a department
 */
export interface LegislationReference {
  /** Short name of the act (e.g., "Licensing Act 2003") */
  name: string;
  /** Specific section if applicable (e.g., "s.17") */
  section?: string;
  /** Notice duration in days */
  noticePeriodDays?: number;
  /** Whether newspaper publication is required */
  requiresNewspaper?: boolean;
}

/**
 * Complete department definition with all metadata
 */
export interface DepartmentDefinition {
  /** Unique identifier matching DepartmentType */
  id: DepartmentType;
  /** Display name */
  name: string;
  /** Description of department responsibilities */
  description: string;
  /** Which council tier handles this department in two-tier areas */
  councilTier: CouncilTier;
  /** Common email patterns for this department (prefix before @) */
  emailPatterns: string[];
  /** Alternative names/abbreviations for matching */
  aliases: string[];
  /** Relevant legislation */
  legislation: LegislationReference[];
}

/**
 * Complete department definitions
 * Maps each DepartmentType to its full definition
 */
export const DEPARTMENTS: Record<DepartmentType, DepartmentDefinition> = {
  licensing: {
    id: 'licensing',
    name: 'Licensing',
    description:
      'Handles premises licences for alcohol/entertainment, gambling permits, and temporary event notices',
    councilTier: 'district',
    emailPatterns: [
      'licensing',
      'entertainmentlicensing',
      'liquor.licensing',
      'premises.licensing',
      'licensing.team',
    ],
    aliases: ['licensing team', 'premises licensing', 'entertainment licensing', 'liquor licensing'],
    legislation: [
      {
        name: 'Licensing Act 2003',
        section: 's.17',
        noticePeriodDays: 28,
        requiresNewspaper: true,
      },
      {
        name: 'Gambling Act 2005',
        noticePeriodDays: 28,
        requiresNewspaper: true,
      },
    ],
  },

  planning: {
    id: 'planning',
    name: 'Planning',
    description:
      'Handles planning applications, listed building consent, conservation area works, and development control',
    councilTier: 'district',
    emailPatterns: [
      'planning',
      'planningapplications',
      'development.control',
      'planning.services',
      'planning.team',
    ],
    aliases: ['development control', 'planning department', 'planning services', 'DC team'],
    legislation: [
      {
        name: 'Town and Country Planning Act 1990',
        noticePeriodDays: 21,
        requiresNewspaper: false, // Only for major/listed/conservation
      },
      {
        name: 'DMPO 2015',
        section: 'Article 15',
        noticePeriodDays: 21,
      },
      {
        name: 'Planning (Listed Buildings and Conservation Areas) Act 1990',
        noticePeriodDays: 21,
        requiresNewspaper: true,
      },
    ],
  },

  highways: {
    id: 'highways',
    name: 'Highways',
    description:
      'Handles traffic regulation orders (TROs), road closures, and public rights of way. CRITICAL: County council function in two-tier areas.',
    councilTier: 'county', // IMPORTANT: This is a county-level function
    emailPatterns: [
      'highways',
      'traffic',
      'trafficmanagement',
      'roads',
      'highways.team',
      'network.management',
    ],
    aliases: [
      'highways department',
      'traffic management',
      'network management',
      'roads department',
      'TRO team',
    ],
    legislation: [
      {
        name: 'Road Traffic Regulation Act 1984',
        section: 's.1-12',
        noticePeriodDays: 21,
        requiresNewspaper: true,
      },
      {
        name: 'Local Authorities Traffic Orders (Procedure) Regulations 1996',
        noticePeriodDays: 21,
        requiresNewspaper: true,
      },
    ],
  },

  environmental: {
    id: 'environmental',
    name: 'Environmental Health',
    description:
      'Handles contaminated land, statutory nuisances, food safety, and public health protection',
    councilTier: 'district',
    emailPatterns: [
      'environmentalhealth',
      'environmental',
      'publichealth',
      'eh',
      'environmental.services',
    ],
    aliases: [
      'environmental health',
      'EH',
      'public health',
      'environmental services',
      'contaminated land team',
    ],
    legislation: [
      {
        name: 'Environmental Protection Act 1990',
        section: 'Part 2A',
        requiresNewspaper: false, // Uses public register instead
      },
      {
        name: 'Food Safety Act 1990',
      },
    ],
  },

  building_control: {
    id: 'building_control',
    name: 'Building Control',
    description:
      'Handles building regulations, demolition notices, and structural safety compliance',
    councilTier: 'district',
    emailPatterns: [
      'buildingcontrol',
      'building.control',
      'building',
      'buildingregulations',
      'bc',
    ],
    aliases: ['building control', 'BC', 'building regulations', 'building standards'],
    legislation: [
      {
        name: 'Building Act 1984',
        section: 's.32-35',
      },
      {
        name: 'Building Regulations 2010',
      },
      {
        name: 'Building Safety Act 2022',
      },
    ],
  },

  electoral: {
    id: 'electoral',
    name: 'Electoral Services',
    description: 'Handles elections, electoral register, and democratic participation',
    councilTier: 'all', // Both county and district have electoral functions
    emailPatterns: ['elections', 'electoral', 'electoralservices', 'registrar'],
    aliases: ['elections', 'electoral services', 'electoral registration', 'ERO'],
    legislation: [
      {
        name: 'Representation of the People Act 1983',
      },
      {
        name: 'Electoral Administration Act 2006',
      },
    ],
  },

  democratic: {
    id: 'democratic',
    name: 'Democratic Services',
    description:
      'Handles CPOs, PSPOs, public path orders, and statutory consultations',
    councilTier: 'all', // Both county and district have democratic functions
    emailPatterns: [
      'democratic',
      'democraticservices',
      'legal',
      'legalservices',
      'consultation',
    ],
    aliases: [
      'democratic services',
      'legal services',
      'CPO team',
      'consultations',
      'member services',
    ],
    legislation: [
      {
        name: 'Acquisition of Land Act 1981',
        noticePeriodDays: 21,
        requiresNewspaper: true,
      },
      {
        name: 'Anti-social Behaviour, Crime and Policing Act 2014',
        section: 's.59-75',
        noticePeriodDays: 28,
      },
    ],
  },
};

/**
 * Maps notice category IDs to responsible department types
 * Used to route notices to the correct council department
 */
export const NOTICE_CATEGORY_TO_DEPARTMENT: Record<NoticeCategoryId, DepartmentType> = {
  licensing: 'licensing',
  gambling: 'licensing', // Gambling is handled by licensing department
  gvol: 'licensing', // Goods vehicle operator licences also via licensing
  planning: 'planning',
  probate: 'democratic', // Legal notices via democratic/legal services
  tro: 'highways', // Traffic regulation orders via highways
};

/**
 * Get the department definition for a notice category
 *
 * @param category - The notice category ID
 * @returns The responsible department definition
 *
 * @example
 * const dept = getDepartmentForCategory('licensing');
 * // Returns DEPARTMENTS.licensing
 */
export function getDepartmentForCategory(category: NoticeCategoryId): DepartmentDefinition {
  const deptType = NOTICE_CATEGORY_TO_DEPARTMENT[category];
  return DEPARTMENTS[deptType];
}

/**
 * Get a department definition by its ID
 *
 * @param id - The department type ID
 * @returns The department definition
 *
 * @example
 * const dept = getDepartment('highways');
 * // Returns DEPARTMENTS.highways
 */
export function getDepartment(id: DepartmentType): DepartmentDefinition {
  return DEPARTMENTS[id];
}

/**
 * Determine which council tier is responsible for a notice category
 * in a two-tier council area
 *
 * CRITICAL: In two-tier areas (county + district councils):
 * - TROs go to COUNTY (highways is a county function)
 * - Licensing goes to DISTRICT
 * - Planning goes to DISTRICT
 *
 * @param category - The notice category ID
 * @param isTwoTier - Whether the location is in a two-tier council area
 * @returns 'county' | 'district' | 'either' indicating responsible tier
 *
 * @example
 * getResponsibleCouncilTier('tro', true); // 'county'
 * getResponsibleCouncilTier('licensing', true); // 'district'
 * getResponsibleCouncilTier('licensing', false); // 'either' (unitary handles all)
 */
export function getResponsibleCouncilTier(
  category: NoticeCategoryId,
  isTwoTier: boolean
): 'county' | 'district' | 'either' {
  // In unitary/single-tier areas, the council handles everything
  if (!isTwoTier) {
    return 'either';
  }

  const department = getDepartmentForCategory(category);

  // Map department council tier to routing decision
  switch (department.councilTier) {
    case 'county':
      return 'county';
    case 'district':
      return 'district';
    case 'unitary':
    case 'all':
    default:
      // For 'all' or 'unitary', district is typically the main contact
      return 'either';
  }
}

/**
 * Generate a likely department email address
 *
 * @param deptId - The department type ID
 * @param councilDomain - The council's email domain (e.g., "cambridge.gov.uk")
 * @returns Generated email address
 *
 * @example
 * generateDepartmentEmail('licensing', 'cambridge.gov.uk');
 * // Returns "licensing@cambridge.gov.uk"
 */
export function generateDepartmentEmail(deptId: DepartmentType, councilDomain: string): string {
  const department = DEPARTMENTS[deptId];
  // Use the first (most common) email pattern
  const prefix = department.emailPatterns[0];
  return `${prefix}@${councilDomain}`;
}

/**
 * Get all departments that operate at a specific council tier
 *
 * @param tier - The council tier to filter by
 * @returns Array of department definitions for that tier
 *
 * @example
 * getDepartmentsByTier('county');
 * // Returns [DEPARTMENTS.highways] (only highways is county-level)
 */
export function getDepartmentsByTier(tier: CouncilTier): DepartmentDefinition[] {
  return Object.values(DEPARTMENTS).filter((dept) => {
    if (tier === 'all') {
      return true;
    }
    // 'all' tier departments work at any level
    if (dept.councilTier === 'all') {
      return true;
    }
    return dept.councilTier === tier;
  });
}

/**
 * Check if a notice category should be handled by the county council
 * in a two-tier area
 *
 * @param category - The notice category ID
 * @returns true if this is a county-level notice
 *
 * @example
 * isCountyLevelNotice('tro'); // true (TROs are county highways function)
 * isCountyLevelNotice('licensing'); // false (licensing is district function)
 */
export function isCountyLevelNotice(category: NoticeCategoryId): boolean {
  const department = getDepartmentForCategory(category);
  return department.councilTier === 'county';
}

/**
 * Get all notice categories handled by a specific department
 *
 * @param deptId - The department type ID
 * @returns Array of notice category IDs handled by this department
 *
 * @example
 * getNoticeCategoriesForDepartment('licensing');
 * // Returns ['licensing', 'gambling', 'gvol']
 */
export function getNoticeCategoriesForDepartment(deptId: DepartmentType): NoticeCategoryId[] {
  return (Object.entries(NOTICE_CATEGORY_TO_DEPARTMENT) as [NoticeCategoryId, DepartmentType][])
    .filter(([, dept]) => dept === deptId)
    .map(([category]) => category);
}

/**
 * Find a department by alias or name (case-insensitive)
 *
 * @param searchTerm - The term to search for
 * @returns The matching department definition, or undefined
 *
 * @example
 * findDepartmentByAlias('TRO team');
 * // Returns DEPARTMENTS.highways
 */
export function findDepartmentByAlias(searchTerm: string): DepartmentDefinition | undefined {
  const normalised = searchTerm.toLowerCase().trim();

  return Object.values(DEPARTMENTS).find((dept) => {
    // Check exact ID match
    if (dept.id === normalised) return true;

    // Check name match
    if (dept.name.toLowerCase() === normalised) return true;

    // Check aliases
    return dept.aliases.some((alias) => alias.toLowerCase() === normalised);
  });
}

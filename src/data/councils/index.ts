// Council data types and exports
// Auto-imports all council JSON files from /councils/ directory

import westminster from '../../../councils/westminster.json';
import birmingham from '../../../councils/birmingham.json';
import manchester from '../../../councils/manchester.json';
import leeds from '../../../councils/leeds.json';
import liverpool from '../../../councils/liverpool.json';
import camden from '../../../councils/camden.json';
import islington from '../../../councils/islington.json';
import towerHamlets from '../../../councils/tower-hamlets.json';
import hackney from '../../../councils/hackney.json';
import southwark from '../../../councils/southwark.json';

// Type definitions

export interface CouncilAddress {
  line1: string;
  line2?: string;
  line3?: string;
  line4?: string;
  city: string;
  postcode: string;
}

export type DepartmentEmail = string | null | Record<string, string>;
export type DepartmentPhone = string | null | Record<string, string | string[]>;

export interface CouncilDepartment {
  name: string;
  handles: string[];
  email: DepartmentEmail;
  phone: DepartmentPhone;
  address?: CouncilAddress;
  submissionMethod: 'portal' | 'email' | 'web-form' | 'online' | 'phone';
  webForm?: string | null;
  publicRegister?: string | null;
  notes?: string;
  [key: string]: unknown;
}

export interface ResponsibleAuthority {
  name: string;
  email?: string | null;
  phone?: string | string[];
  address?: CouncilAddress | string;
  website?: string;
  notes?: string;
}

export interface Council {
  name: string;
  type: string;
  region: string;
  website: string;
  address: CouncilAddress;
  mainPhone: string;
  minicom?: string;
  openingHours?: string;
  departments: CouncilDepartment[];
  responsibleAuthorities?: Record<string, ResponsibleAuthority | { notes?: string }>;
  additionalResources?: Record<string, string>;
  verified: boolean;
  lastUpdated: string;
  researchNotes?: string;
}

export type CouncilId =
  | 'westminster'
  | 'birmingham'
  | 'manchester'
  | 'leeds'
  | 'liverpool'
  | 'camden'
  | 'islington'
  | 'tower-hamlets'
  | 'hackney'
  | 'southwark';

// Typed councils object
const councils: Record<CouncilId, Council> = {
  westminster: westminster as unknown as Council,
  birmingham: birmingham as unknown as Council,
  manchester: manchester as unknown as Council,
  leeds: leeds as unknown as Council,
  liverpool: liverpool as unknown as Council,
  camden: camden as unknown as Council,
  islington: islington as unknown as Council,
  'tower-hamlets': towerHamlets as unknown as Council,
  hackney: hackney as unknown as Council,
  southwark: southwark as unknown as Council,
};

export default councils;

// Helper functions

/**
 * Get a council by its ID
 */
export function getCouncil(id: CouncilId | string): Council | undefined {
  return councils[id as CouncilId];
}

/**
 * Get a council by its ID (alias for getCouncil)
 */
export const getCouncilById = getCouncil;

/**
 * Get all councils as an array
 */
export function listCouncils(): Council[] {
  return Object.values(councils);
}

/**
 * Get all council IDs
 */
export function getCouncilIds(): CouncilId[] {
  return Object.keys(councils) as CouncilId[];
}

/**
 * Find a council by partial name match (case-insensitive)
 */
export function findCouncilByName(name: string): Council | undefined {
  const normalizedSearch = name.toLowerCase();
  return Object.values(councils).find((council) =>
    council.name.toLowerCase().includes(normalizedSearch)
  );
}

/**
 * Get a specific department from a council by department name
 */
export function getDepartment(
  councilId: CouncilId | string,
  departmentName: string
): CouncilDepartment | undefined {
  const council = getCouncil(councilId);
  if (!council) return undefined;
  return council.departments.find(
    (dept) => dept.name.toLowerCase() === departmentName.toLowerCase()
  );
}

/**
 * Get the department that handles a specific notice type for a council
 * Searches by notice type ID (e.g., 'premises-licence') rather than department name
 */
export function getCouncilDepartment(
  councilId: CouncilId | string,
  noticeType: string
): CouncilDepartment | undefined {
  const council = getCouncil(councilId);
  if (!council) return undefined;

  return council.departments.find((dept) => dept.handles.includes(noticeType));
}

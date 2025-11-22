/**
 * Department Notice Type Mapping
 *
 * Defines which notice types each council department can create templates for.
 * This ensures licensing departments only see licensing notices, traffic only sees traffic notices, etc.
 */

export type DepartmentType = 'licensing' | 'planning' | 'traffic' | 'environmental_health' | 'other';

export type NoticeTypeOption = {
  value: string;
  label: string;
  category: string;
};

/**
 * Complete registry of all notice types available in the system
 */
export const ALL_NOTICE_TYPES: NoticeTypeOption[] = [
  // Licensing Act 2003
  { value: 'licensing-premises-new', label: 'New Premises Licence', category: 'licensing' },
  { value: 'licensing-premises-variation', label: 'Premises Licence Variation', category: 'licensing' },
  { value: 'licensing-premises-review', label: 'Premises Licence Review', category: 'licensing' },
  { value: 'licensing-premises-transfer', label: 'Premises Licence Transfer', category: 'licensing' },
  { value: 'licensing-club-new', label: 'New Club Premises Certificate', category: 'licensing' },
  { value: 'licensing-club-variation', label: 'Club Certificate Variation', category: 'licensing' },
  { value: 'licensing-club-review', label: 'Club Certificate Review', category: 'licensing' },
  { value: 'licensing-ten', label: 'Temporary Event Notice', category: 'licensing' },
  { value: 'licensing-personal', label: 'Personal Licence', category: 'licensing' },

  // Gambling Act 2005
  { value: 'gambling-betting-new', label: 'New Betting Premises Licence', category: 'licensing' },
  { value: 'gambling-betting-variation', label: 'Betting Premises Variation', category: 'licensing' },
  { value: 'gambling-bingo-new', label: 'New Bingo Premises Licence', category: 'licensing' },
  { value: 'gambling-agc-new', label: 'New Adult Gaming Centre Licence', category: 'licensing' },

  // Planning
  { value: 'planning-application', label: 'Planning Application', category: 'planning' },
  { value: 'planning-variation', label: 'Planning Application Variation', category: 'planning' },
  { value: 'planning-eia', label: 'Environmental Impact Assessment', category: 'planning' },
  { value: 'planning-conservation', label: 'Conservation Area Notice', category: 'planning' },

  // Traffic & Highways
  { value: 'tro-permanent', label: 'Permanent Traffic Regulation Order', category: 'traffic' },
  { value: 'tro-temporary', label: 'Temporary Traffic Regulation Order (TTRO)', category: 'traffic' },
  { value: 'tro-variation', label: 'TRO Variation', category: 'traffic' },
  { value: 'tro-revocation', label: 'TRO Revocation', category: 'traffic' },

  // Goods Vehicle Operator Licensing
  { value: 'gvol-new', label: 'New Operator Licence', category: 'traffic' },
  { value: 'gvol-variation', label: 'Operator Licence Variation', category: 'traffic' },

  // Environmental Health
  { value: 'environmental-permit-new', label: 'Environmental Permit Application', category: 'environmental_health' },
  { value: 'environmental-permit-variation', label: 'Environmental Permit Variation', category: 'environmental_health' },
  { value: 'noise-abatement', label: 'Noise Abatement Notice', category: 'environmental_health' },

  // Probate & Legal
  { value: 'probate-trustee-act', label: 'Trustee Act Notice', category: 'other' },
  { value: 'probate-creditors', label: 'Creditors Notice', category: 'other' },
];

/**
 * Maps department types to the notice type categories they can manage
 */
export const DEPARTMENT_NOTICE_TYPE_MAPPING: Record<DepartmentType, string[]> = {
  licensing: ['licensing'],
  planning: ['planning'],
  traffic: ['traffic'],
  environmental_health: ['environmental_health'],
  other: ['licensing', 'planning', 'traffic', 'environmental_health', 'other'], // 'other' can see all
};

/**
 * Get allowed notice types for a specific department type
 *
 * @param departmentType - The type of the department (e.g., 'licensing', 'traffic')
 * @returns Array of notice type options that this department can create templates for
 *
 * @example
 * ```typescript
 * const licensingTypes = getNoticeTypesForDepartment('licensing');
 * // Returns: [
 * //   { value: 'licensing-premises-new', label: 'New Premises Licence', category: 'licensing' },
 * //   { value: 'licensing-premises-variation', label: 'Premises Licence Variation', category: 'licensing' },
 * //   ...
 * // ]
 * ```
 */
export function getNoticeTypesForDepartment(departmentType: DepartmentType): NoticeTypeOption[] {
  const allowedCategories = DEPARTMENT_NOTICE_TYPE_MAPPING[departmentType] || [];

  return ALL_NOTICE_TYPES.filter(noticeType =>
    allowedCategories.includes(noticeType.category)
  );
}

/**
 * Check if a department type is allowed to create templates for a specific notice type
 *
 * @param departmentType - The department type
 * @param noticeTypeId - The notice type ID to check
 * @returns True if the department can create templates for this notice type
 *
 * @example
 * ```typescript
 * canDepartmentManageNoticeType('licensing', 'licensing-premises-new'); // true
 * canDepartmentManageNoticeType('licensing', 'tro-permanent'); // false
 * canDepartmentManageNoticeType('traffic', 'tro-permanent'); // true
 * ```
 */
export function canDepartmentManageNoticeType(
  departmentType: DepartmentType,
  noticeTypeId: string
): boolean {
  const allowedTypes = getNoticeTypesForDepartment(departmentType);
  return allowedTypes.some(type => type.value === noticeTypeId);
}

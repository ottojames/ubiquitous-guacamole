/**
 * Category to Department Type Mapping
 *
 * Maps notice categories to council department types.
 * This ensures licensing notices are sent to licensing departments,
 * planning notices to planning departments, etc.
 */

import type { NoticeCategoryId } from './noticeTypes';
import type { DepartmentType } from './departmentNoticeTypes';

/**
 * Maps notice category IDs to department types
 *
 * This mapping ensures that:
 * - Licensing Act 2003 notices → licensing departments
 * - Gambling Act 2005 notices → licensing departments (gambling is part of licensing)
 * - Planning notices → planning departments
 * - Traffic/GVOL notices → traffic departments
 * - Probate/legal notices → other departments
 */
export const CATEGORY_TO_DEPARTMENT: Record<NoticeCategoryId, DepartmentType> = {
  licensing: 'licensing',
  gambling: 'licensing',      // Gambling notices handled by licensing departments
  planning: 'planning',
  gvol: 'traffic',            // Goods Vehicle Operator Licences handled by traffic
  tro: 'traffic',             // Traffic Regulation Orders handled by traffic/highways departments
  probate: 'other',
};

/**
 * Get the department type for a given notice category
 *
 * @param category - Notice category ID
 * @returns Department type that should handle this category
 *
 * @example
 * ```typescript
 * getDepartmentTypeForCategory('licensing'); // Returns: 'licensing'
 * getDepartmentTypeForCategory('gambling');  // Returns: 'licensing'
 * getDepartmentTypeForCategory('gvol');      // Returns: 'traffic'
 * ```
 */
export function getDepartmentTypeForCategory(category: NoticeCategoryId): DepartmentType {
  return CATEGORY_TO_DEPARTMENT[category];
}

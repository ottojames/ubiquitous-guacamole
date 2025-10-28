import type { NoticeCategoryId } from '@/next/publish/config/noticeTypes';

/**
 * Practice Area Configuration
 *
 * Maps firm practice areas to notice categories and types.
 * This enables intelligent filtering of the publishing wizard
 * based on a firm's selected practice areas.
 */

export interface PracticeAreaDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Notice categories that belong to this practice area */
  noticeCategories: NoticeCategoryId[];
  /** Keywords for intelligent matching */
  keywords: string[];
}

export const PRACTICE_AREA_DEFINITIONS: PracticeAreaDefinition[] = [
  {
    id: 'licensing',
    name: 'Licensing',
    description: 'Premises licences, variations, reviews, and club certificates',
    icon: '🏪',
    noticeCategories: ['licensing', 'gambling'],
    keywords: [
      'premises',
      'licence',
      'license',
      'alcohol',
      'entertainment',
      'club',
      'variation',
      'review',
      'gambling',
      'betting',
      'bingo',
      'casino',
      'gaming',
    ],
  },
  {
    id: 'planning',
    name: 'Planning & Development',
    description: 'Planning applications, appeals, and development notices',
    icon: '🏗️',
    noticeCategories: ['planning'],
    keywords: [
      'planning',
      'development',
      'building',
      'construction',
      'listed building',
      'conservation',
      'eia',
      'environmental impact',
      'major development',
    ],
  },
  {
    id: 'highways',
    name: 'Highways & Transport',
    description: 'Traffic orders, road closures, and transport infrastructure',
    icon: '🚦',
    noticeCategories: ['gvol'],
    keywords: [
      'traffic',
      'road',
      'highway',
      'transport',
      'gvol',
      'goods vehicle',
      'operating centre',
      'haulage',
      'logistics',
    ],
  },
  {
    id: 'environmental',
    name: 'Environmental',
    description: 'Environmental permits, pollution control, and waste management',
    icon: '🌳',
    noticeCategories: ['planning'], // Planning includes environmental notices
    keywords: [
      'environmental',
      'pollution',
      'waste',
      'emissions',
      'ecology',
      'conservation',
      'sustainability',
    ],
  },
  {
    id: 'property',
    name: 'Property & Land',
    description: 'Property transactions, land registry, and compulsory purchase',
    icon: '🏘️',
    noticeCategories: ['probate'],
    keywords: [
      'property',
      'land',
      'real estate',
      'conveyancing',
      'trustee',
      'probate',
      'estate',
      'compulsory purchase',
    ],
  },
  {
    id: 'statutory',
    name: 'Statutory Notices',
    description: 'Legal notices, public announcements, and statutory declarations',
    icon: '⚖️',
    noticeCategories: ['licensing', 'planning', 'gambling', 'gvol', 'probate'], // All categories
    keywords: [
      'statutory',
      'legal',
      'public notice',
      'declaration',
      'announcement',
    ],
  },
];

/**
 * Get all notice categories that should be available
 * based on the firm's selected practice areas
 */
export function getAllowedNoticeCategoriesForPracticeAreas(
  practiceAreas: string[]
): NoticeCategoryId[] {
  if (!practiceAreas || practiceAreas.length === 0) {
    // If no practice areas selected, show none (or optionally, show all)
    return [];
  }

  const allowedCategories = new Set<NoticeCategoryId>();

  for (const areaId of practiceAreas) {
    const area = PRACTICE_AREA_DEFINITIONS.find((def) => def.id === areaId);
    if (area) {
      area.noticeCategories.forEach((category) => allowedCategories.add(category));
    }
  }

  return Array.from(allowedCategories);
}

/**
 * Check if a notice category is allowed for the given practice areas
 */
export function isNoticeCategoryAllowed(
  category: NoticeCategoryId,
  practiceAreas: string[]
): boolean {
  const allowedCategories = getAllowedNoticeCategoriesForPracticeAreas(practiceAreas);
  return allowedCategories.includes(category);
}

/**
 * Get practice area definition by ID
 */
export function getPracticeAreaById(id: string): PracticeAreaDefinition | undefined {
  return PRACTICE_AREA_DEFINITIONS.find((def) => def.id === id);
}

/**
 * Get all practice area definitions
 */
export function getAllPracticeAreas(): PracticeAreaDefinition[] {
  return PRACTICE_AREA_DEFINITIONS;
}

/**
 * Filter notice category tree based on practice areas
 * Returns the full tree if no practice areas are specified (e.g., for councils)
 * Otherwise returns only categories allowed by the practice areas
 */
export function getFilteredNoticeCategoryTree<T extends { id: NoticeCategoryId }>(
  tree: T[],
  practiceAreas: string[] | null | undefined
): T[] {
  // If no practice areas specified, return full tree (council mode)
  if (!practiceAreas || practiceAreas.length === 0) {
    return tree;
  }

  // Get allowed categories based on practice areas
  const allowedCategories = getAllowedNoticeCategoriesForPracticeAreas(practiceAreas);

  // Filter tree to only include allowed categories
  return tree.filter(category => allowedCategories.includes(category.id));
}

/**
 * Get names of filtered out categories (for display in info banner)
 */
export function getFilteredOutCategories(
  practiceAreas: string[] | null | undefined
): string[] {
  if (!practiceAreas || practiceAreas.length === 0) {
    return [];
  }

  const allowedCategories = getAllowedNoticeCategoriesForPracticeAreas(practiceAreas);

  // All possible categories
  const allCategories: NoticeCategoryId[] = ['licensing', 'gambling', 'gvol', 'planning', 'probate'];

  // Find which ones are filtered out
  const filteredOut = allCategories.filter(cat => !allowedCategories.includes(cat));

  // Map to readable names
  const categoryNames: Record<NoticeCategoryId, string> = {
    'licensing': 'Licensing Act 2003',
    'gambling': 'Gambling Act 2005',
    'gvol': 'GVOL',
    'planning': 'Planning',
    'probate': 'Probate'
  };

  return filteredOut.map(cat => categoryNames[cat]);
}

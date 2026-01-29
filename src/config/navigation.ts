/**
 * Shared navigation configuration
 * Used by all headers across the site for consistency
 */

export type NavLink = {
  href: string;
  label: string;
};

/**
 * Main navigation links - used in site header across all pages
 * Order is: Find notices, For councils, Pricing, Email alerts
 */
export const NAV_LINKS: readonly NavLink[] = [
  { href: '/notices', label: 'Find notices' },
  { href: '/#for-councils', label: 'For councils' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/email-alerts', label: 'Email alerts' },
] as const;

/**
 * P2-003: Shared pricing configuration
 * Single source of truth for all pricing across the application
 *
 * This matches the Pricing page and should be used by:
 * - src/pages/Pricing.tsx
 * - src/pages/council/Billing.tsx
 * - Any other component displaying pricing
 */

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number | null; // null = custom pricing
  pricePerNotice?: number; // additional per-notice cost
  currency: 'GBP';
  interval: 'month' | 'one-time';
  features: string[];
  highlight?: boolean;
  ctaText: string;
  ctaLink: string;
}

// Professional/Firm Plans
export const PROFESSIONAL_PLANS: PricingPlan[] = [
  {
    id: 'one-off',
    name: 'One-Off',
    description: 'Pay as you go - no subscription required',
    price: 50,
    currency: 'GBP',
    interval: 'one-time',
    features: [
      'Single notice publication',
      'Compliant formatting',
      'Proof of publication',
      'Basic support'
    ],
    ctaText: 'Publish Notice',
    ctaLink: '/publish'
  },
  {
    id: 'professional',
    name: 'Professional Portal',
    description: 'For law firms and licensing agents',
    price: 49,
    pricePerNotice: 50,
    currency: 'GBP',
    interval: 'month',
    highlight: true,
    features: [
      'Dashboard for all notices',
      'Client management',
      'Deadline tracking',
      'Email alerts',
      'Draft auto-save',
      'Priority support',
      'Bulk operations',
      'CSV export'
    ],
    ctaText: 'Start Free Trial',
    ctaLink: '/register?plan=professional'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large firms with custom needs',
    price: null,
    currency: 'GBP',
    interval: 'month',
    features: [
      'Everything in Professional',
      'Unlimited users',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
      'SSO authentication',
      'Custom branding'
    ],
    ctaText: 'Contact Sales',
    ctaLink: 'mailto:enterprise@civicnotices.co.uk'
  }
];

// Council Portal - Always FREE
export const COUNCIL_PORTAL_PRICING = {
  id: 'council-free',
  name: 'Council Portal',
  description: 'Free access for local authorities',
  price: 0,
  pricePerNotice: 19.99, // If council wants to publish notices themselves
  currency: 'GBP' as const,
  interval: 'month' as const,
  features: [
    'View all published notices',
    'Manage representations',
    'Internal commenting',
    'Evidence pack downloads',
    'Audit logging',
    'Unlimited team members',
    'Email notifications',
    'CSV export'
  ],
  ctaText: 'Request Access',
  ctaLink: 'mailto:councils@civicnotices.co.uk'
};

// Helper functions
export function formatPrice(price: number | null, currency: string = 'GBP'): string {
  if (price === null) return 'Custom';
  if (price === 0) return 'Free';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: price % 1 === 0 ? 0 : 2
  }).format(price);
}

export function getPlanById(planId: string): PricingPlan | null {
  return PROFESSIONAL_PLANS.find(p => p.id === planId) || null;
}

// Pricing thresholds for display
export const PRICING_THRESHOLDS = {
  // Volume discounts could be added here
  standardNoticePrice: 50,
  councilNoticePrice: 19.99,
  professionalMonthlyFee: 49
};

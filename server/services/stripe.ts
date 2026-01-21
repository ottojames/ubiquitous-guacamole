import Stripe from 'stripe';

// Lazy initialization - only create Stripe client when actually needed
let stripeClient: Stripe | null = null;

/**
 * Get the Stripe client instance.
 * Throws if STRIPE_SECRET_KEY is not configured.
 */
export function getStripeClient(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    });
  }
  return stripeClient;
}

/**
 * Check if Stripe is configured (has secret key).
 * Useful for graceful degradation when Stripe is optional.
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

import * as Sentry from '@sentry/node';
import type { Express } from 'express';

/**
 * Initialize Sentry for backend error tracking
 * Call this before setting up routes
 */
export function initSentry(app: Express) {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

  // Only initialize if DSN is provided
  if (!dsn) {
    console.warn('[Sentry] No DSN provided, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment,

    // Set sample rate for performance monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Capture 100% of errors in production
    sampleRate: 1.0,

    // Don't send default PII
    sendDefaultPii: false,

    // Before sending errors, you can filter/modify them
    beforeSend(event, hint) {
      // Don't send errors in development
      if (environment === 'development') {
        console.log('[Sentry] Would send error:', event);
        return null;
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      'ECONNRESET',
      'ETIMEDOUT',
    ],
  });

  // Sentry middleware is handled by the error handler

  console.log(`[Sentry] Initialized for environment: ${environment}`);
}

/**
 * Add Sentry error handler middleware
 * Call this AFTER all routes, but BEFORE other error handlers
 */
export function sentryErrorHandler() {
  return (err: any, _req: any, res: any, next: any) => {
    // Log error to Sentry
    Sentry.captureException(err);

    // Pass error to next handler
    next(err);
  };
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; name?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
}

/**
 * Clear user context
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

/**
 * Manually capture a message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}

// Export Sentry for advanced use cases
export { Sentry };

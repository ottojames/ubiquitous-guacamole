import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for frontend error tracking
 * Call this in your main.tsx before rendering the app
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE;

  // Only initialize if DSN is provided
  if (!dsn) {
    console.warn('[Sentry] No DSN provided, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment,

    // Set sample rate for performance monitoring
    // 1.0 = 100% of transactions, 0.1 = 10%
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Capture 100% of errors in production
    sampleRate: 1.0,

    // Send default PII (personally identifiable information)
    // Set to false if you don't want to send user emails, IPs, etc.
    sendDefaultPii: false,

    // Before sending errors, you can filter/modify them
    beforeSend(event, hint) {
      // Don't send errors in development
      if (environment === 'development') {
        console.log('[Sentry] Would send error:', event);
        return null;
      }

      // Filter out common non-critical errors
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore ResizeObserver errors (common browser quirk)
        if (error.message?.includes('ResizeObserver')) {
          return null;
        }
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extension errors
      'Non-Error promise rejection captured',
      // Network errors that are expected
      'NetworkError',
      'Failed to fetch',
    ],
  });
}

/**
 * Set user context for error tracking
 * Call this after user logs in
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
 * Call this when user logs out
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

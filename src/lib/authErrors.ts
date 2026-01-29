/**
 * User-friendly error messages for authentication failures
 *
 * Converts technical Supabase/Auth error messages into helpful user-facing messages
 */

// Common Supabase auth error messages and their user-friendly equivalents
const AUTH_ERROR_MAP: Record<string, string> = {
  // Login errors
  'Invalid login credentials': 'The email or password you entered is incorrect. Please try again.',
  'invalid_grant': 'The email or password you entered is incorrect. Please try again.',
  'Email not confirmed': 'Please check your email and click the confirmation link before signing in.',
  'User not found': 'No account found with this email address. Please check your email or create a new account.',

  // Password errors
  'Password should be at least': 'Your password must be at least 8 characters long.',
  'Password is too weak': 'Please choose a stronger password with a mix of letters, numbers, and symbols.',

  // Rate limiting
  'Email rate limit exceeded': 'Too many sign-in attempts. Please wait a few minutes and try again.',
  'For security purposes, you can only request this': 'Too many attempts. Please wait a few minutes before trying again.',

  // Session errors
  'Session expired': 'Your session has expired. Please sign in again.',
  'refresh_token_not_found': 'Your session has expired. Please sign in again.',
  'Invalid Refresh Token': 'Your session has expired. Please sign in again.',
  'JWT expired': 'Your session has expired. Please sign in again.',

  // Account errors
  'User already registered': 'An account with this email already exists. Please sign in instead.',
  'Signups not allowed': 'New account registration is currently disabled. Please contact support.',

  // Network errors
  'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.',
  'Network request failed': 'Unable to connect to the server. Please check your internet connection.',
  'NetworkError': 'Unable to connect to the server. Please check your internet connection.',

  // Email errors
  'Unable to validate email address': 'Please enter a valid email address.',
  'Invalid email': 'Please enter a valid email address.',

  // Password reset errors
  'New password should be different': 'Your new password must be different from your current password.',
  'Password recovery required': 'Please use the password reset link sent to your email.',

  // Generic errors
  'No session returned': 'Sign in was not successful. Please try again.',
  'Request timeout': 'The request took too long. Please try again.',
};

/**
 * Converts a raw authentication error message to a user-friendly message
 */
export function getAuthErrorMessage(error: unknown): string {
  // Handle null/undefined
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  // Extract the message from the error
  let message: string;
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (typeof error === 'object' && 'message' in error) {
    message = String((error as { message: unknown }).message);
  } else {
    return 'An unexpected error occurred. Please try again.';
  }

  // Check for exact match first
  if (AUTH_ERROR_MAP[message]) {
    return AUTH_ERROR_MAP[message];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(AUTH_ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // If no match found, return a sanitized version of the original message
  // Strip any technical details that might confuse users
  if (message.includes('error_code') || message.includes('status_code')) {
    return 'An error occurred during authentication. Please try again.';
  }

  // If the message seems user-friendly already (no technical jargon), return it
  if (!message.includes('_') && !message.includes('{') && message.length < 200) {
    return message;
  }

  // Default fallback
  return 'An error occurred during authentication. Please try again.';
}

/**
 * Get a specific action hint based on the error type
 */
export function getAuthErrorAction(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('Invalid login credentials') || message.includes('invalid_grant')) {
    return 'Forgot your password? Click "Forgot password?" to reset it.';
  }

  if (message.includes('Email not confirmed')) {
    return 'Check your spam folder if you cannot find the confirmation email.';
  }

  if (message.includes('rate limit') || message.includes('too many')) {
    return 'This is a temporary security measure to protect your account.';
  }

  if (message.includes('session') || message.includes('JWT') || message.includes('Refresh Token')) {
    return 'Your login session needs to be refreshed for security purposes.';
  }

  return null;
}

/**
 * Determines if an error is likely a temporary/retriable error
 */
export function isRetriableAuthError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  return (
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('network') ||
    lowerMessage.includes('failed to fetch') ||
    lowerMessage.includes('connection')
  );
}

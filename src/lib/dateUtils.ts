/**
 * Utility functions for date handling in council portal
 */

/**
 * Check if a deadline is within 48 hours (closing soon)
 * @param deadline ISO date string or null
 * @returns true if deadline is within 48 hours from now
 */
export function isClosingSoon(deadline: string | null | undefined): boolean {
  if (!deadline) return false;

  try {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const hoursUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Within 48 hours but not yet expired
    return hoursUntilDeadline > 0 && hoursUntilDeadline <= 48;
  } catch {
    return false;
  }
}

/**
 * Check if a deadline has passed (expired)
 * @param deadline ISO date string or null
 * @returns true if deadline is in the past
 */
export function isExpired(deadline: string | null | undefined): boolean {
  if (!deadline) return false;

  try {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    return deadlineDate.getTime() < now.getTime();
  } catch {
    return false;
  }
}

/**
 * Format a date for display in council views
 * @param dateString ISO date string or null
 * @returns Formatted date string or "—" if null
 */
export function formatCouncilDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';

  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
}

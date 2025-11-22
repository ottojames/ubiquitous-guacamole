/**
 * UK Bank Holidays Calendar
 *
 * Provides official UK bank holidays for England and Wales for business day calculations.
 * Source: https://www.gov.uk/bank-holidays
 */

export const UK_BANK_HOLIDAYS: readonly string[] = [
  // 2024
  '2024-01-01', // New Year's Day
  '2024-03-29', // Good Friday
  '2024-04-01', // Easter Monday
  '2024-05-06', // Early May bank holiday
  '2024-05-27', // Spring bank holiday
  '2024-08-26', // Summer bank holiday
  '2024-12-25', // Christmas Day
  '2024-12-26', // Boxing Day

  // 2025
  '2025-01-01', // New Year's Day
  '2025-04-18', // Good Friday
  '2025-04-21', // Easter Monday
  '2025-05-05', // Early May bank holiday
  '2025-05-26', // Spring bank holiday
  '2025-08-25', // Summer bank holiday
  '2025-12-25', // Christmas Day
  '2025-12-26', // Boxing Day

  // 2026
  '2026-01-01', // New Year's Day
  '2026-04-03', // Good Friday
  '2026-04-06', // Easter Monday
  '2026-05-04', // Early May bank holiday
  '2026-05-25', // Spring bank holiday
  '2026-08-31', // Summer bank holiday
  '2026-12-25', // Christmas Day
  '2026-12-28', // Boxing Day (substitute day)

  // 2027
  '2027-01-01', // New Year's Day
  '2027-03-26', // Good Friday
  '2027-03-29', // Easter Monday
  '2027-05-03', // Early May bank holiday
  '2027-05-31', // Spring bank holiday
  '2027-08-30', // Summer bank holiday
  '2027-12-27', // Christmas Day (substitute day)
  '2027-12-28', // Boxing Day (substitute day)
];

/**
 * Check if a date is a UK bank holiday
 */
export function isBankHoliday(date: Date): boolean {
  const dateStr = formatDateISO(date);
  return UK_BANK_HOLIDAYS.includes(dateStr);
}

/**
 * Format date as ISO string (YYYY-MM-DD)
 */
function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Check if a date is a non-working day (weekend or bank holiday)
 */
export function isNonWorkingDay(date: Date): boolean {
  return isWeekend(date) || isBankHoliday(date);
}

/**
 * Calculate the number of business days between two dates, excluding weekends and bank holidays
 *
 * @param start - Start date (exclusive)
 * @param end - End date (exclusive)
 * @returns Number of business days between the dates
 */
export function businessDaysBetween(start: Date, end: Date): number {
  if (end < start) return -businessDaysBetween(end, start);

  let count = 0;
  const cursor = new Date(start.getTime());
  cursor.setHours(0, 0, 0, 0);

  const endDate = new Date(end.getTime());
  endDate.setHours(0, 0, 0, 0);

  while (cursor < endDate) {
    cursor.setDate(cursor.getDate() + 1);
    if (!isNonWorkingDay(cursor)) {
      count += 1;
    }
  }

  return count;
}

/**
 * Add a specified number of business days to a date
 *
 * @param date - Starting date
 * @param days - Number of business days to add
 * @returns New date after adding business days
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setHours(0, 0, 0, 0);

  let remaining = Math.abs(days);
  const direction = days >= 0 ? 1 : -1;

  while (remaining > 0) {
    result.setDate(result.getDate() + direction);
    if (!isNonWorkingDay(result)) {
      remaining--;
    }
  }

  return result;
}

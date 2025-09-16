/* CN:STEP2-START */
export function calculateRepresentationDeadline(input: Date | string): Date {
  const d = new Date(input);
  d.setHours(12, 0, 0, 0);
  const out = new Date(d);
  out.setDate(out.getDate() + 28);
  out.setHours(23, 59, 59, 999);
  return out;
}

export function formatLicensingDate(
  input?: Date | string | null,
  locale: string = 'en-GB'
): string {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}
/* CN:STEP2-END */

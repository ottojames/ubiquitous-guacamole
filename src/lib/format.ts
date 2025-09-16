/* CN:STEP2-COMPLIANCE-UPGRADE-START */
/* CN:OFFICER-FINAL-START */
// Legacy export kept for back-compat; prefer formatDisplayDateTime
/* CN:GUARDRAIL-FINAL-START */
export function formatDisplayDate(d: Date | string | null): string {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
/* CN:GUARDRAIL-FINAL-END */

export function formatDisplayDateTime(d?: Date | string | null): string {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
/* CN:OFFICER-FINAL-END */
/* CN:STEP2-COMPLIANCE-UPGRADE-END */

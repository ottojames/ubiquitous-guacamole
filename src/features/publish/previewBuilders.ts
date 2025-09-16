/* CN:STEP2-COMPLIANCE-START */
import { formatDisplayDate } from '@/lib/format';
import type { Authority } from '@/lib/authorities';
import type { NoticeDraft } from '@/types/notice';

export type PublishState = Partial<NoticeDraft> & {
  representationDeadline?: string | Date | null;
};

export function buildPremisesNotice(state: PublishState, auth: Authority | null): string {
  const a = (s?: string | null) => (s?.toString().trim() ? s!.toString().trim() : '—');
  const deadline = state.representationDeadline ? formatDisplayDate(state.representationDeadline) : '—';
  const council = a(state.councilName);
  const address = a(state.premisesAddress);
  const applicant = a(state.applicantName);
  const repsEmail = auth?.repsEmail || '—';
  const repsUrl = auth?.repsUrl || '';
  const repsAddr = auth?.postalAddress || '—';

  return [
    'LICENSING ACT 2003',
    'Application for a Premises Licence',
    `Notice is hereby given that ${applicant} has applied to ${council} for a Premises Licence in respect of:`,
    `${address}.`,
    `Any person wishing to make representations regarding this application should write to:`,
    repsUrl ? `${council} (${repsUrl})` : `${council}`,
    repsEmail !== '—' ? `Email: ${repsEmail}` : '',
    `Postal: ${repsAddr}`,
    `Representations must be received by ${deadline}.`,
    'It is an offence to knowingly or recklessly make a false statement in connection with an application; a person guilty of such an offence is liable on summary conviction to a fine.',
  ].filter(Boolean).join('\n');
}
/* CN:STEP2-COMPLIANCE-END */


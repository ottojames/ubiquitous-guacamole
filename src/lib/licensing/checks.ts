import { NoticeDraft } from '@/types/notice';
/* CN:STEP2-START */
import { calculateRepresentationDeadline } from '@/lib/dates/licensing';
/* CN:STEP2-END */

export type ComplianceItem = {
  id: string;
  label: string;
  ok: boolean;
  target?: string;
  severity?: 'error' | 'warning';
  rationale?: string;
};
export type ComplianceResult = ComplianceItem[];

/* CN:STEP2-START */
export function calcRepsDeadline(date: string): string {
  if (!date) return '';
  const deadline = calculateRepresentationDeadline(date);
  return Number.isNaN(deadline.getTime()) ? '' : deadline.toISOString();
}
/* CN:STEP2-END */

export function runMandatoryChecks(draft: NoticeDraft): ComplianceResult {
  const items: ComplianceResult = [];
  const push = (
    id: string,
    ok: boolean,
    label: string,
    target?: string,
    severity?: 'error' | 'warning'
  ) => items.push({ id, ok, label, target, severity });

  push('applicantName', !!draft.applicantName?.trim(), 'Applicant name present', 'applicantName');
  push('premisesAddress', !!draft.premisesAddress?.trim(), 'Premises full postal address present', 'premises-address');
  push('councilName', !!draft.councilName?.trim(), 'Council name present', 'councilName');
  push('councilEmail', !!draft.councilEmail?.trim(), 'Council email present', 'councilEmail');
  push('councilAddress', !!draft.councilAddress?.trim(), 'Council address present', 'councilAddress');
  push('applicationDate', !!draft.applicationDate?.trim(), 'Application date present', 'applicationDate');
  if (draft.repsDeadline) {
    /* CN:STEP2-START */
    const expected = calcRepsDeadline(draft.applicationDate);
    const normalize = (value: string) => {
      if (!value) return '';
      const d = new Date(value.includes('T') ? value : `${value}T00:00:00`);
      return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
    };
    push(
      'repsDeadline',
      normalize(draft.repsDeadline) === normalize(expected),
      'Representation deadline = submission date + 28 days',
      'applicationDate'
    );
    /* CN:STEP2-END */
  } else {
    push(
      'repsDeadline',
      false,
      'This notice does not state the representation deadline — please enter manually.',
      'applicationDate',
      'warning'
    );
  }

  return items;
}

import { NoticeDraft } from '@/types/notice';

export type ComplianceItem = {
  id: string;
  label: string;
  ok: boolean;
  target?: string;
  severity?: 'error' | 'warning';
  rationale?: string;
};
export type ComplianceResult = ComplianceItem[];

export function calcRepsDeadline(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() + 28);
  return d.toISOString().slice(0, 10);
}

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
    const expected = calcRepsDeadline(draft.applicationDate);
    push(
      'repsDeadline',
      draft.repsDeadline === expected,
      'Representation deadline = submission date + 28 days',
      'applicationDate'
    );
  } else {
    push(
      'repsDeadline',
      false,
      '⚠️ This notice does not state the representation deadline — please enter manually.',
      'applicationDate',
      'warning'
    );
  }

  return items;
}

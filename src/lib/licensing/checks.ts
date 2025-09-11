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

  push('applicantName', !!draft.applicantName, 'Applicant name present', 'applicantName');
  push('premisesAddress', !!draft.premisesAddress, 'Premises full postal address present', 'premises-address');
  push('premisesName', !!draft.premisesName, 'Premises name present');
  push('applicationType', !!draft.applicationType, 'Application type present');
  push('activities', !!(draft.activities && draft.activities.length), 'Activities applied for present');
  push('hours', !!draft.hours, 'Hours of operation present');
  push('councilName', !!draft.councilName, 'Council name present', 'councilName');
  push('councilEmail', !!draft.councilEmail, 'Council email present', 'councilEmail');
  push('councilAddress', !!draft.councilAddress, 'Council address present', 'councilAddress');
  push('applicationDate', !!draft.applicationDate, 'Application date present', 'applicationDate');
  if (draft.repsDeadline) {
    const expected = calcRepsDeadline(draft.applicationDate);
    push(
      'repsDeadline',
      draft.repsDeadline === expected,
      `Representation deadline = application date + 28 days (${expected})`,
      'applicationDate'
    );
  } else {
    push(
      'repsDeadline',
      false,
      'This notice does not state the representation deadline — please enter manually.',
      'applicationDate',
      'warning'
    );
  }
  push('inspectionLocation', !!draft.inspectionLocation, 'Inspection location present');
  push('repsMethod', !!draft.repsMethod, 'Representation method present');
  push('statutoryWarning', !!draft.statutoryWarningPresent, 'Statutory warning line present');

  return items;
}

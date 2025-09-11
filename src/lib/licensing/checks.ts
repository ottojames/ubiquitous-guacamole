import { NoticeDraft } from '@/types/notice';

export type ComplianceItem = { ok: boolean; message: string };
export type ComplianceResult = ComplianceItem[];

export function calcRepsDeadline(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() + 28);
  return d.toISOString().slice(0, 10);
}

export function runMandatoryChecks(draft: NoticeDraft): ComplianceResult {
  const items: ComplianceResult = [];
  const push = (ok: boolean, message: string) => items.push({ ok, message });

  push(!!draft.applicantName, 'Applicant name present');
  push(!!draft.premisesAddress, 'Premises full postal address present');
  push(!!draft.councilName, 'Council name present');
  push(!!draft.councilEmail, 'Council email present');
  push(!!draft.councilAddress, 'Council address present');
  push(!!draft.applicationDate, 'Application date present');
  if (draft.repsDeadline) {
    const expected = calcRepsDeadline(draft.applicationDate);
    push(draft.repsDeadline === expected, `Representation deadline = application date + 28 days (${expected})`);
  } else {
    push(false, 'This notice does not state the representation deadline — please enter manually.');
  }

  return items;
}

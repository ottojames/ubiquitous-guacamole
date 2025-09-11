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

  push(!!draft.applicant, 'Applicant full name present');
  push(!!draft.premisesName, 'Premises name present');
  push(!!draft.premisesAddress, 'Premises full postal address present');
  push(['Grant', 'Variation', 'Review'].includes(draft.applicationType || ''), 'Application type valid');
  push((draft.activities && draft.activities.length > 0) || false, 'Activities selected');
  push(!!draft.hours && Object.keys(draft.hours).length > 0, 'Hours present & legible for each selected activity');
  push(!!draft.applicationDate, 'Application date present');
  if (draft.applicationDate) {
    const expected = calcRepsDeadline(draft.applicationDate);
    push(draft.repsDeadline === expected, `Representation deadline = application date + 28 days (${expected})`);
  } else {
    push(false, 'Representation deadline = application date + 28 days');
  }
  push(!!draft.inspectionLocation, 'Inspection location present');
  push(!!draft.repsMethod, 'Representation method present');
  push(!!draft.statutoryWarningPresent, 'Statutory warning line present');

  return items;
}

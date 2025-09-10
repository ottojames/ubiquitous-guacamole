import { GVOL } from '../noticeTypes/gvol.schema';
import { computeRepresentationDeadline } from './premises-licence.rules';

export function validateGVOL(data: GVOL, bankHolidays: string[] = []) {
  const issues: string[] = [];
  if (data.vehicles < 0) issues.push('Vehicle count must be ≥ 0');
  const representationDeadline = computeRepresentationDeadline(data.applicationDate, bankHolidays);
  return { representationDeadline, issues };
}

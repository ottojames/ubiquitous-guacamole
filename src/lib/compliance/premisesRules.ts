import { Rule } from './engine';
import { PremisesData } from '@/schemas/premises';

export const premisesRules: Rule<PremisesData>[] = [
  {
    id: 'applicant',
    severity: 'error',
    message: 'Applicant name required',
    rationale: 'Licensing Act 2003 requires the applicant to be identified.',
    anchor: 'applicant-section',
    test: (d) => !!d.applicantName?.trim(),
  },
  {
    id: 'council',
    severity: 'error',
    message: 'Council contact required',
    rationale: 'Representations must be directed to the licensing authority.',
    anchor: 'applicant-section',
    test: (d) => !!d.councilEmail?.trim(),
  },
  {
    id: 'address',
    severity: 'error',
    message: 'Trading name and full address required',
    rationale: 'Premises must be uniquely identified for objections to be valid.',
    anchor: 'basics-section',
    test: (d) => !!(d.premisesTradingName && d.address?.line1 && d.address?.postcode && d.address?.city),
  },
  {
    id: 'deadline',
    severity: 'error',
    message: 'Representation deadline required',
    rationale: 'The public must be told when the consultation ends.',
    anchor: 'basics-section',
    test: (d) => !!d.representationDeadline,
  },
  {
    id: 'activities',
    severity: 'error',
    message: 'List at least one licensable activity',
    rationale: 'Notices must describe the activities being authorised.',
    anchor: 'activities-section',
    test: (d) => Array.isArray(d.activities) && d.activities.length > 0,
  },
];

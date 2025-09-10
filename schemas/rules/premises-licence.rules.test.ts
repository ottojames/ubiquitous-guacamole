import { describe, it, expect } from 'vitest';
import { computeRepresentationDeadline, validatePremisesLicence } from './premises-licence.rules';
import { PremisesLicence } from '../noticeTypes/premises-licence.schema';

const base: PremisesLicence = {
  applicant: 'Alice Smith',
  premises: 'The Red Lion',
  address: {
    line1: '1 High St',
    city: 'Townsville',
    postcode: 'AB1 2CD',
  },
  activities: [
    { type: 'alcohol_on', days: ['Mon'], start: '10:00', end: '22:00' },
  ],
  applicationDate: '2024-03-01',
  council: 'camden',
  region: 'england_wales',
  representation: { method: 'email', value: 'licensing@camden.gov.uk' },
};

describe('premises licence rules', () => {
  it('computes representation deadline with bank holidays', () => {
    const deadline = computeRepresentationDeadline(base.applicationDate, [
      '2024-03-29',
      '2024-04-01',
    ]);
    expect(deadline).toBe('2024-04-02');
  });

  it('flags invalid activity hours', () => {
    const bad: PremisesLicence = {
      ...base,
      activities: [{ type: 'alcohol_on', days: ['Mon'], start: '10:00', end: '10:00' }],
    };
    const result = validatePremisesLicence(bad);
    expect(result.issues).toContain('Activity 1 has invalid hours');
  });

  it('returns computed deadline', () => {
    const result = validatePremisesLicence(base, ['2024-03-29', '2024-04-01']);
    expect(result.representationDeadline).toBe('2024-04-02');
    expect(result.issues.length).toBe(0);
  });
});

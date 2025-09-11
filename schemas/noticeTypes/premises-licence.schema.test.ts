import { describe, it, expect } from 'vitest';
import { PremisesLicenceSchema } from './premises-licence.schema';

const base = {
  applicant: 'Alice Smith',
  applicantAddress: { line1: '2 Main St', city: 'Townsville', postcode: 'AB1 2CD' },
  premises: 'The Red Lion',
  address: {
    line1: '1 High St',
    city: 'Townsville',
    postcode: 'AB1 2CD',
  },
  activities: [
    { type: 'alcohol_on', days: ['Mon'], start: '10:00', end: '22:00' },
  ],
  applicationDate: '2024-01-10',
  council: 'camden',
  region: 'england_wales',
  representation: { method: 'email', value: 'licensing@camden.gov.uk' },
};

describe('PremisesLicenceSchema', () => {
  it('accepts valid data', () => {
    const parsed = PremisesLicenceSchema.parse(base);
    expect(parsed.applicant).toBe('Alice Smith');
  });

  it('requires applicant', () => {
    const res = PremisesLicenceSchema.safeParse({ ...base, applicant: '' });
    expect(res.success).toBe(false);
  });

  it('requires at least one activity', () => {
    const res = PremisesLicenceSchema.safeParse({ ...base, activities: [] });
    expect(res.success).toBe(false);
  });
});

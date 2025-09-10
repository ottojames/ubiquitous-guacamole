import { describe, it, expect } from 'vitest';
import { GVOLSchema } from './gvol.schema';

const base = {
  operator: 'Acme Logistics',
  address: { line1: '1 Fleet St', city: 'Town', postcode: 'AB1 2CD' },
  vehicles: 5,
  trailers: 2,
  applicationDate: '2024-02-01',
  council: 'leeds',
  region: 'england_wales',
};

describe('GVOLSchema', () => {
  it('accepts valid data', () => {
    const parsed = GVOLSchema.parse(base);
    expect(parsed.operator).toBe('Acme Logistics');
  });

  it('requires operator', () => {
    const res = GVOLSchema.safeParse({ ...base, operator: '' });
    expect(res.success).toBe(false);
  });
});

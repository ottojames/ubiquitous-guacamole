import { describe, it, expect } from 'vitest';
import { validateGVOL } from './gvol.rules';

const base = {
  operator: 'Acme',
  address: { line1: '1', city: 'Town', postcode: 'AB1' },
  vehicles: 1,
  trailers: 0,
  applicationDate: '2024-01-01',
  council: 'leeds',
  region: 'england_wales',
};

describe('validateGVOL', () => {
  it('computes representation deadline', () => {
    const res = validateGVOL(base as any);
    expect(res.representationDeadline).toBe('2024-01-30');
  });
});

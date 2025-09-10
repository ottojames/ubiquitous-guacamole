import { describe, it, expect } from 'vitest';
import { validateTrafficOrder } from './traffic-order.rules';

const base = {
  roadName: 'High St',
  restriction: 'Closed',
  duration: '1 week',
  applicationDate: '2024-01-01',
  council: 'camden',
  region: 'england_wales',
};

describe('validateTrafficOrder', () => {
  it('computes representation deadline', () => {
    const res = validateTrafficOrder(base as any);
    expect(res.representationDeadline).toBe('2024-01-30');
  });
});

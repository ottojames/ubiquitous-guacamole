import { describe, it, expect } from 'vitest';
import { TrafficOrderSchema } from './traffic-order.schema';

const base = {
  roadName: 'High Street',
  restriction: 'Road closed',
  duration: '2 weeks',
  applicationDate: '2024-03-15',
  council: 'camden',
  region: 'england_wales',
};

describe('TrafficOrderSchema', () => {
  it('accepts valid data', () => {
    const parsed = TrafficOrderSchema.parse(base);
    expect(parsed.roadName).toBe('High Street');
  });

  it('requires roadName', () => {
    const res = TrafficOrderSchema.safeParse({ ...base, roadName: '' });
    expect(res.success).toBe(false);
  });
});

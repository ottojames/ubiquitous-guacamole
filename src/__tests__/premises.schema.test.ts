import { describe, it, expect } from 'vitest';
import { PremisesSchema } from '@/schemas/premises';

describe('PremisesSchema', () => {
  const base = {
    applicantName: 'Alice',
    applicantEmail: 'a@example.com',
    councilId: 'council',
    councilEmail: 'licensing@example.com',
    premisesTradingName: 'The Test Arms',
    address: { line1: '1 High St', city: 'Testville', postcode: 'AA1 1AA' },
    applicationType: 'grant' as const,
    applicationDate: '2025-01-01',
    representationDeadline: '2025-01-30',
    activities: [
      { kind: 'alcohol', days: 'everyday', start: '09:00', end: '23:00', alcoholOnOff: 'on_off' },
    ],
  };

  it('validates a grant payload', () => {
    expect(PremisesSchema.safeParse(base).success).toBe(true);
  });

  it('requires variation summary for variation', () => {
    const res = PremisesSchema.safeParse({ ...base, applicationType: 'variation' });
    expect(res.success).toBe(false);
  });
});


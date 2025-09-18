import { describe, it, expect } from 'vitest';
import { runCompliance } from '@/lib/compliance/engine';
import { premisesRules } from '@/lib/compliance/premisesRules';
import { PremisesData } from '@/schemas/premises';

describe('compliance engine', () => {
  it('reports missing fields', () => {
    const data = {
      applicantName: '',
      applicantEmail: '',
      councilId: '',
      councilEmail: '',
      premisesTradingName: '',
      address: { line1: '', city: '', postcode: '' },
      applicationType: 'grant',
      applicationDate: '2024-01-01',
      representationDeadline: '2024-01-29',
      activities: [],
    } as unknown as PremisesData;
    const res = runCompliance(data, premisesRules);
    expect(res.filter(r => !r.ok).length).toBeGreaterThan(0);
  });

  it('passes when data complete', () => {
    const data: PremisesData = {
      applicantName: 'Alice',
      applicantEmail: 'a@example.com',
      councilId: 'camden',
      councilEmail: 'c@c.gov',
      premisesTradingName: 'Pub',
      address: { line1: '1 High St', city: 'Town', postcode: 'AA1 1AA' },
      applicationType: 'grant',
      applicationDate: '2024-01-01',
      representationDeadline: '2024-01-29',
      activities: [{ kind: 'alcohol', alcoholOnOff: 'on', days: ['Mon'], start: '09:00', end: '23:00' }],
    };
    const res = runCompliance(data, premisesRules);
    expect(res.every(r => r.ok)).toBe(true);
  });
});

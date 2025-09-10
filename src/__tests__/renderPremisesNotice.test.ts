import { describe, it, expect } from 'vitest';
import { renderPremisesNotice } from '@/lib/renderNotice';
import type { PremisesData } from '@/schemas/premises';

const base: PremisesData & { councilName: string } = {
  applicantName: 'Alice',
  applicantEmail: 'a@example.com',
  councilId: 'council',
  councilEmail: 'licensing@example.com',
  councilName: 'Test Council',
  premisesTradingName: 'The Test Arms',
  address: { line1: '1 High St', city: 'Testville', postcode: 'AA1 1AA' },
  applicationType: 'grant',
  applicationDate: '2025-01-01',
  representationDeadline: '2025-01-30',
  activities: [
    { kind: 'alcohol', days: 'everyday', start: '09:00', end: '23:00', alcoholOnOff: 'on_off' },
  ],
};

describe('renderPremisesNotice', () => {
  it('renders a grant notice text with inspection and reps lines', () => {
    const text = renderPremisesNotice({
      ...base,
      officeAddress: '1 Test Rd, Testville',
      licensingUrl: 'https://example.com/licensing',
      postalAddress: 'Licensing Team, 1 Test Rd, Testville',
      repsEmail: 'licensing@example.com',
    });
    expect(text).toContain('LICENSING ACT 2003');
    expect(text).toContain('The Test Arms');
    expect(text).toContain('AA1 1AA');
    expect(text).toContain('Any person may make representations');
    expect(text).toContain('It is an offence to knowingly or recklessly');
  });

  it('renders a variation with summary line', () => {
    const text = renderPremisesNotice({
      ...base,
      applicationType: 'variation',
      variationSummary: 'Extend hours',
    });
    expect(text).toContain('variation');
    expect(text).toContain('Extend hours');
  });
});

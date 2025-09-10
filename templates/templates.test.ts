import { describe, it, expect } from 'vitest';
import { renderGVOL } from './gvol.template';
import { renderTrafficOrder } from './traffic-order.template';
import { renderPremisesLicence } from './premises-licence.template';
import { getAuthorityPack } from '../src/lib/authorityPacks';

describe('templates', () => {
  const pack = getAuthorityPack('bristol')!;
  it('renders gvol template', () => {
    const text = renderGVOL({ operator: 'Acme', address: { line1: '1', city: 'Town', postcode: 'AB1' }, vehicles: 1, trailers: 0, applicationDate: '2024-01-01', council: 'bristol', region: 'england_wales' }, pack);
    expect(text).toContain('Acme');
  });
  it('renders traffic order template', () => {
    const text = renderTrafficOrder({ roadName: 'High St', restriction: 'Closed', duration: '1 week', applicationDate: '2024-01-01', council: 'bristol', region: 'england_wales' }, pack);
    expect(text).toContain('High St');
  });
});

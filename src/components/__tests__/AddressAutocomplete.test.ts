import { describe, it, expect } from 'vitest';
import { mapAddress } from '../AddressAutocomplete';

describe('mapAddress', () => {
  it('maps uprn', () => {
    const mapped = mapAddress({ line1: '1 High St', city: 'Town', postcode: 'AB1', uprn: '123' });
    expect(mapped.uprn).toBe('123');
  });
});

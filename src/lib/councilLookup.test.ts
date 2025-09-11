import { describe, it, expect } from 'vitest';
import { lookupCouncilByPostcode } from './councilLookup';

describe('lookupCouncilByPostcode', () => {
  it('populates council fields', () => {
    const res = lookupCouncilByPostcode('BR1 2AA');
    expect(res).toEqual(expect.objectContaining({
      councilName: expect.stringContaining('Bristol'),
      councilEmail: expect.stringContaining('@'),
      councilAddress: expect.any(String),
    }));
  });
});

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  lookupCouncilByPostcode,
  lookupCouncilByPostcodeAsync,
  lookupCouncilByPostcodeSafe,
  isValidPostcodeFormat,
  PostcodeLookupError,
  POSTCODE_ERROR_MESSAGES,
} from './councilLookup';

describe('isValidPostcodeFormat', () => {
  it('validates correct UK postcode formats', () => {
    // Standard formats
    expect(isValidPostcodeFormat('SW1A 1AA')).toBe(true);
    expect(isValidPostcodeFormat('EC1A 1BB')).toBe(true);
    expect(isValidPostcodeFormat('M1 1AA')).toBe(true);
    expect(isValidPostcodeFormat('B33 8TH')).toBe(true);
    expect(isValidPostcodeFormat('CR2 6XH')).toBe(true);
    expect(isValidPostcodeFormat('DN55 1PT')).toBe(true);

    // Without space
    expect(isValidPostcodeFormat('SW1A1AA')).toBe(true);
    expect(isValidPostcodeFormat('EC1A1BB')).toBe(true);

    // Lowercase
    expect(isValidPostcodeFormat('sw1a 1aa')).toBe(true);

    // With leading/trailing whitespace
    expect(isValidPostcodeFormat('  SW1A 1AA  ')).toBe(true);
  });

  it('rejects invalid postcode formats', () => {
    expect(isValidPostcodeFormat('')).toBe(false);
    expect(isValidPostcodeFormat('INVALID')).toBe(false);
    expect(isValidPostcodeFormat('12345')).toBe(false);
    expect(isValidPostcodeFormat('SW1A')).toBe(false); // Incomplete
    expect(isValidPostcodeFormat('1AA')).toBe(false); // Missing outcode
    expect(isValidPostcodeFormat('SW1A 1A')).toBe(false); // Incomplete incode
  });
});

describe('lookupCouncilByPostcode (synchronous)', () => {
  it('returns council info for Bristol area postcode', () => {
    const result = lookupCouncilByPostcode('BR1 2AA');
    expect(result).toBeDefined();
    if (result) {
      expect(result.councilName).toBeDefined();
    }
  });

  it('returns null for unrecognised postcode prefix', () => {
    const result = lookupCouncilByPostcode('ZZ99 9ZZ');
    expect(result).toBeNull();
  });
});

describe('lookupCouncilByPostcodeAsync', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns council info for a unitary authority (Westminster)', async () => {
    // Mock postcodes.io response for Westminster
    const mockResponse = {
      status: 200,
      result: {
        admin_district: 'Westminster',
        admin_county: null,
        codes: {
          admin_district: 'E09000033',
          admin_county: 'E99999999',
        },
      },
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const result = await lookupCouncilByPostcodeAsync('SW1A 1AA');

    expect(result.councilName).toBe('Westminster');
    expect(result.districtCode).toBe('E09000033');
    expect(result.isTwoTier).toBe(false);
    expect(result.countyName).toBeNull();
    expect(result.countyCode).toBeNull();
  });

  it('returns council info for a two-tier area (Guildford in Surrey)', async () => {
    // Mock postcodes.io response for Guildford (in Surrey)
    const mockResponse = {
      status: 200,
      result: {
        admin_district: 'Guildford',
        admin_county: 'Surrey',
        codes: {
          admin_district: 'E07000209',
          admin_county: 'E10000030',
        },
      },
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const result = await lookupCouncilByPostcodeAsync('GU1 3AA');

    expect(result.councilName).toBe('Guildford');
    expect(result.districtCode).toBe('E07000209');
    expect(result.isTwoTier).toBe(true);
    expect(result.countyName).toBe('Surrey');
    expect(result.countyCode).toBe('E10000030');
  });

  it('returns council info for Scottish unitary (Edinburgh)', async () => {
    const mockResponse = {
      status: 200,
      result: {
        admin_district: 'City of Edinburgh',
        admin_county: null,
        codes: {
          admin_district: 'S12000036',
          admin_county: 'S99999999',
        },
      },
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const result = await lookupCouncilByPostcodeAsync('EH1 1YZ');

    expect(result.councilName).toBe('City of Edinburgh');
    expect(result.districtCode).toBe('S12000036');
    expect(result.isTwoTier).toBe(false);
  });

  it('returns council info for Welsh unitary (Cardiff)', async () => {
    const mockResponse = {
      status: 200,
      result: {
        admin_district: 'Cardiff',
        admin_county: null,
        codes: {
          admin_district: 'W06000015',
          admin_county: 'W99999999',
        },
      },
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const result = await lookupCouncilByPostcodeAsync('CF10 3NQ');

    expect(result.councilName).toBe('Cardiff');
    expect(result.districtCode).toBe('W06000015');
    expect(result.isTwoTier).toBe(false);
  });

  it('returns council info for a London Borough (Camden)', async () => {
    const mockResponse = {
      status: 200,
      result: {
        admin_district: 'Camden',
        admin_county: null,
        codes: {
          admin_district: 'E09000007',
          admin_county: 'E99999999',
        },
      },
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const result = await lookupCouncilByPostcodeAsync('NW1 2DB');

    expect(result.councilName).toBe('Camden');
    expect(result.districtCode).toBe('E09000007');
    expect(result.isTwoTier).toBe(false);
  });

  it('returns council info for a Metropolitan Borough (Birmingham)', async () => {
    const mockResponse = {
      status: 200,
      result: {
        admin_district: 'Birmingham',
        admin_county: null,
        codes: {
          admin_district: 'E08000025',
          admin_county: 'E99999999',
        },
      },
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const result = await lookupCouncilByPostcodeAsync('B1 1BB');

    expect(result.councilName).toBe('Birmingham');
    expect(result.districtCode).toBe('E08000025');
    expect(result.isTwoTier).toBe(false);
  });

  it('throws INVALID_POSTCODE for empty input', async () => {
    await expect(lookupCouncilByPostcodeAsync('')).rejects.toThrow(PostcodeLookupError);
    await expect(lookupCouncilByPostcodeAsync('')).rejects.toMatchObject({
      code: 'INVALID_POSTCODE',
    });
  });

  it('throws INVALID_POSTCODE for malformed postcode', async () => {
    await expect(lookupCouncilByPostcodeAsync('NOT-A-POSTCODE')).rejects.toThrow(PostcodeLookupError);
    await expect(lookupCouncilByPostcodeAsync('12345')).rejects.toMatchObject({
      code: 'INVALID_POSTCODE',
    });
  });

  it('throws POSTCODE_NOT_FOUND for non-existent postcode (404 HTTP)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    }));

    await expect(lookupCouncilByPostcodeAsync('SW1A 9ZZ')).rejects.toThrow(PostcodeLookupError);
    await expect(lookupCouncilByPostcodeAsync('SW1A 9ZZ')).rejects.toMatchObject({
      code: 'POSTCODE_NOT_FOUND',
    });
  });

  it('throws POSTCODE_NOT_FOUND for non-existent postcode (200 with status 404 in body)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        status: 404,
        error: 'Postcode not found',
      }),
    }));

    await expect(lookupCouncilByPostcodeAsync('SW1A 9ZZ')).rejects.toMatchObject({
      code: 'POSTCODE_NOT_FOUND',
    });
  });

  it('throws NETWORK_ERROR on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));

    await expect(lookupCouncilByPostcodeAsync('SW1A 1AA')).rejects.toThrow(PostcodeLookupError);
    await expect(lookupCouncilByPostcodeAsync('SW1A 1AA')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('throws API_ERROR for unexpected HTTP status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    }));

    await expect(lookupCouncilByPostcodeAsync('SW1A 1AA')).rejects.toThrow(PostcodeLookupError);
    await expect(lookupCouncilByPostcodeAsync('SW1A 1AA')).rejects.toMatchObject({
      code: 'API_ERROR',
    });
  });

  it('throws API_ERROR for invalid JSON response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON')),
    }));

    await expect(lookupCouncilByPostcodeAsync('SW1A 1AA')).rejects.toMatchObject({
      code: 'API_ERROR',
    });
  });

  it('handles postcodes with and without spaces', async () => {
    const mockResponse = {
      status: 200,
      result: {
        admin_district: 'Westminster',
        admin_county: null,
        codes: {
          admin_district: 'E09000033',
          admin_county: 'E99999999',
        },
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    vi.stubGlobal('fetch', fetchMock);

    await lookupCouncilByPostcodeAsync('SW1A1AA');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('SW1A1AA'));

    await lookupCouncilByPostcodeAsync('SW1A 1AA');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('SW1A1AA'));
  });

  it('normalises postcode to uppercase', async () => {
    const mockResponse = {
      status: 200,
      result: {
        admin_district: 'Westminster',
        admin_county: null,
        codes: {
          admin_district: 'E09000033',
          admin_county: 'E99999999',
        },
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    vi.stubGlobal('fetch', fetchMock);

    await lookupCouncilByPostcodeAsync('sw1a 1aa');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('SW1A1AA'));
  });
});

describe('lookupCouncilByPostcodeSafe', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns result on success', async () => {
    const mockResponse = {
      status: 200,
      result: {
        admin_district: 'Westminster',
        admin_county: null,
        codes: {
          admin_district: 'E09000033',
          admin_county: 'E99999999',
        },
      },
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const result = await lookupCouncilByPostcodeSafe('SW1A 1AA');

    expect(result).not.toBeNull();
    expect(result?.councilName).toBe('Westminster');
  });

  it('returns null on invalid postcode instead of throwing', async () => {
    const result = await lookupCouncilByPostcodeSafe('INVALID');
    expect(result).toBeNull();
  });

  it('returns null on network error instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));

    const result = await lookupCouncilByPostcodeSafe('SW1A 1AA');
    expect(result).toBeNull();
  });

  it('returns null on API error instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    }));

    const result = await lookupCouncilByPostcodeSafe('SW1A 1AA');
    expect(result).toBeNull();
  });
});

describe('PostcodeLookupError', () => {
  it('has correct error name', () => {
    const error = new PostcodeLookupError('INVALID_POSTCODE', 'Test message');
    expect(error.name).toBe('PostcodeLookupError');
  });

  it('stores error code', () => {
    const error = new PostcodeLookupError('NETWORK_ERROR', 'Test message');
    expect(error.code).toBe('NETWORK_ERROR');
  });

  it('stores error message', () => {
    const error = new PostcodeLookupError('API_ERROR', 'Something went wrong');
    expect(error.message).toBe('Something went wrong');
  });
});

describe('POSTCODE_ERROR_MESSAGES', () => {
  it('has user-friendly messages for all error codes', () => {
    expect(POSTCODE_ERROR_MESSAGES.INVALID_POSTCODE).toContain('valid UK postcode');
    expect(POSTCODE_ERROR_MESSAGES.POSTCODE_NOT_FOUND).toContain('not found');
    expect(POSTCODE_ERROR_MESSAGES.POSTCODE_TERMINATED).toContain('no longer in use');
    expect(POSTCODE_ERROR_MESSAGES.NETWORK_ERROR).toContain('connection');
    expect(POSTCODE_ERROR_MESSAGES.API_ERROR).toContain('try again');
  });
});

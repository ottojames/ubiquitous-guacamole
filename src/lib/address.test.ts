import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { fetchAddressSuggestions, MIN_QUERY_LENGTH } from './address';

const PRIMARY_URL = 'https://primary.test';
const FALLBACK_URL = 'https://fallback.test';
const PRIMARY_KEY = 'primary-token';

describe('fetchAddressSuggestions', () => {
  beforeEach(() => {
    window.__addrApiConfig = {
      url: PRIMARY_URL,
      key: PRIMARY_KEY,
      fallbackUrl: FALLBACK_URL,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete window.__addrApiConfig;
  });

  it('merges, dedupes, and sorts results from both providers', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;

      if (url.includes('/suggest')) {
        return Promise.resolve(new Response(
          JSON.stringify({
            results: [
              {
                id: 'pri-1',
                label: '10 Downing Street, London, SW1A 2AA',
                line1: '10 Downing Street',
                town: 'London',
                postcode: 'SW1A 2AA',
                uprn: '100023336956',
              },
              {
                id: 'pri-2',
                label: '11 Downing Street, London, SW1A 2AB',
                line1: '11 Downing Street',
                town: 'London',
                postcode: 'SW1A 2AB',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ));
      }

      if (url.includes('/search')) {
        return Promise.resolve(new Response(
          JSON.stringify([
            {
              place_id: 'fb-dup',
              display_name: '10 Downing Street, City of London, London, SW1A 2AA, UK',
              address: {
                house_number: '10',
                road: 'Downing Street',
                town: 'London',
                postcode: 'SW1A 2AA',
              },
            },
            {
              place_id: 'fb-unique',
              display_name: '12 Downing Street, City of London, London, SW1A 2AA, UK',
              address: {
                house_number: '12',
                road: 'Downing Street',
                town: 'London',
                postcode: 'SW1A 2AA',
              },
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ));
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    vi.stubGlobal('fetch', fetchMock);

    const results = await fetchAddressSuggestions('Downing Street London');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(3);
    expect(results[0]?.source).toBe('primary');
    expect(results[0]?.label).toContain('10 Downing Street');
    expect(results[1]?.source).toBe('primary');
    expect(results[1]?.label).toContain('11 Downing Street');
    expect(results[2]?.source).toBe('fallback');
    expect(results[2]?.label).toContain('12 Downing Street');
  });

  it('requests the expanded fallback window and caps combined results to 20 items', async () => {
    const fallbackPayload = Array.from({ length: 30 }, (_, index) => ({
      place_id: `fb-${index}`,
      display_name: `Unit ${index} Example Street, Example Town, AB1 ${String(index).padStart(2, '0')}AA, UK`,
      address: {
        house_number: String(index),
        road: 'Example Street',
        town: 'Example Town',
        postcode: `AB1 ${String(index).padStart(2, '0')}AA`,
      },
    }));

    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;

      if (url.includes('/suggest')) {
        return Promise.resolve(new Response(JSON.stringify({ results: [] }), { status: 200 }));
      }

      if (url.includes('/search')) {
        return Promise.resolve(new Response(JSON.stringify(fallbackPayload), { status: 200 }));
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    vi.stubGlobal('fetch', fetchMock);

    const results = await fetchAddressSuggestions('Example Street');

    expect(results).toHaveLength(20);

    const fallbackCall = fetchMock.mock.calls.find(([request]) => {
      const url = typeof request === 'string'
        ? request
        : request instanceof URL
          ? request.toString()
          : (request as Request).url;
      return url.includes(FALLBACK_URL);
    });

    expect(fallbackCall).toBeDefined();
    const fallbackUrlString = (() => {
      const [request] = fallbackCall ?? [];
      if (!request) return '';
      if (typeof request === 'string') return request;
      if (request instanceof URL) return request.toString();
      return (request as Request).url;
    })();

    const parsed = new URL(fallbackUrlString);
    expect(parsed.searchParams.get('format')).toBe('jsonv2');
    expect(parsed.searchParams.get('addressdetails')).toBe('1');
    expect(parsed.searchParams.get('countrycodes')).toBe('gb');
    expect(parsed.searchParams.get('limit')).toBe('30');
    expect(parsed.searchParams.get('dedupe')).toBe('1');
    expect(parsed.searchParams.get('accept-language')).toBe('en-GB');
  });

  it('handles fallback CORS failures without throwing and keeps primary results', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;

      if (url.includes('/suggest')) {
        return Promise.resolve(new Response(
          JSON.stringify({
            results: [
              {
                id: 'pri-1',
                label: '221B Baker Street, London, NW1 6XE',
                line1: '221B Baker Street',
                town: 'London',
                postcode: 'NW1 6XE',
              },
            ],
          }),
          { status: 200 }
        ));
      }

      if (url.includes('/search')) {
        return Promise.reject(new TypeError('Failed to fetch'));
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    vi.stubGlobal('fetch', fetchMock);

    const results = await fetchAddressSuggestions('Baker Street London');

    expect(results).toHaveLength(1);
    expect(results[0]?.source).toBe('primary');

    expect(warnSpy).toHaveBeenCalledWith(
      '[address] fallback blocked by browser CORS. Point VITE_ADDR_FALLBACK_URL to a proxy endpoint (e.g. /api/geo) that forwards to Nominatim.'
    );
  });

  it('returns empty suggestions when query shorter than minimum', async () => {
    vi.stubGlobal('fetch', vi.fn());

    const results = await fetchAddressSuggestions('a'.repeat(MIN_QUERY_LENGTH - 1));

    expect(results).toEqual([]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

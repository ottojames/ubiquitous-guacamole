/** @vitest-environment node */
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const queryLog: Array<{ type: string; [key: string]: any }> = [];
let supabaseResponse: any = { data: [], error: null };
const geocodeMock = vi.fn(async (postcode: string) => ({
  postcode,
  latitude: 51.5,
  longitude: -0.2,
  source: 'cache',
}));

vi.mock('../lib/geocode', async () => {
  const actual = await vi.importActual<typeof import('../lib/geocode')>('../lib/geocode');
  return {
    ...actual,
    ensurePostcodeCoordinates: geocodeMock,
  };
});

vi.mock('@supabase/supabase-js', () => {
  class FakeQueryBuilder {
    select(columns: string) {
      queryLog.push({ type: 'select', columns });
      return this;
    }

    limit(value: number) {
      queryLog.push({ type: 'limit', value });
      return this;
    }

    ilike(column: string, pattern: string) {
      queryLog.push({ type: 'ilike', column, pattern });
      return this;
    }

    eq(column: string, value: unknown) {
      queryLog.push({ type: 'eq', column, value });
      return this;
    }

    gte(column: string, value: unknown) {
      queryLog.push({ type: 'gte', column, value });
      return this;
    }

    lte(column: string, value: unknown) {
      queryLog.push({ type: 'lte', column, value });
      return this;
    }

    or(filter: string) {
      queryLog.push({ type: 'or', filter });
      return this;
    }

    not(column: string, operator: string, value: unknown) {
      queryLog.push({ type: 'not', column, operator, value });
      return this;
    }

    filter(column: string, operator: string, value: unknown) {
      queryLog.push({ type: 'filter', column, operator, value });
      return this;
    }

    order(column: string, options: any) {
      queryLog.push({ type: 'order', column, options });
      return Promise.resolve(supabaseResponse);
    }
  }

  return {
    createClient: vi.fn(() => ({
      from() {
        queryLog.push({ type: 'from' });
        return new FakeQueryBuilder();
      },
      rpc(fn: string, args: Record<string, unknown>) {
        queryLog.push({ type: 'rpc', fn, args });
        return Promise.resolve(supabaseResponse);
      },
    })),
  };
});

// Import after mocking Supabase so the router uses our fake
const { app } = await import('../index');

afterEach(() => {
  queryLog.length = 0;
  supabaseResponse = { data: [], error: null };
  geocodeMock.mockReset();
});

describe('GET /api/notices/search', () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://unit.test';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-key';
    supabaseResponse = {
      data: [
        {
          id: 'notice-1',
          notice_type: 'Licensing: Premises - New',
          status: 'published',
          premises: {
            name: 'The Test Arms',
            address: '9 Lower Park Road, London, W4 3RQ',
            postcode: 'W4 3RQ',
          },
          consultation: {
            repsDeadline: '2025-01-31',
            applicationDate: '2025-01-01',
          },
          publication: {
            targetDate: '2025-01-05',
            newspaper: 'Unit Gazette',
          },
          extras: {
            viewUrl: 'https://example.test/notices/notice-1',
          },
          latitude: 51.508,
          longitude: -0.125,
          created_at: '2025-01-01T12:00:00.000Z',
          updated_at: '2025-01-02T12:00:00.000Z',
        },
      ],
      error: null,
    };
  });

  it('returns published notices when the postcode is embedded in the query string', async () => {
    const response = await request(app)
      .get('/api/notices/search')
      .query({ q: '102 Thames Road, London, W4 3RQ' });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({
      id: 'notice-1',
      noticeType: 'Licensing: Premises - New',
      premisesAddress: expect.stringContaining('W4 3RQ'),
      latitude: 51.508,
      longitude: -0.125,
    });

    // Postcode filter uses .or() to check both premises and premises_address
    const orFilter = queryLog.find((entry) => entry.type === 'or');
    expect(orFilter).toBeDefined();
    expect(orFilter?.filter).toContain('W4%');
  });

  it('applies bounding box filters when bbox query is present', async () => {
    supabaseResponse = {
      data: [
        {
          id: 'notice-bbox',
          notice_type: 'Premises Licence',
          status: 'published',
          premises: {
            name: 'Bbox Cafe',
            address: '5 Map Lane, London, SW1A 1AA',
            postcode: 'SW1A 1AA',
          },
          consultation: {},
          publication: {},
          extras: {},
          latitude: 51.503,
          longitude: -0.126,
          published_date: '2025-10-09',
          created_at: '2025-10-01T12:00:00.000Z',
          updated_at: '2025-10-01T12:00:00.000Z',
        },
      ],
      error: null,
    };

    const response = await request(app)
      .get('/api/notices/search')
      .query({ bbox: '51.30,-0.50,51.70,0.20', zoom: 12 });

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    const bboxRpc = queryLog.find(
      (entry) => entry.type === 'rpc' && entry.fn === 'get_bbox_notices'
    );
    expect(bboxRpc?.args).toEqual({
      min_lat: 51.3,
      min_lng: -0.5,
      max_lat: 51.7,
      max_lng: 0.2,
    });
    expect(queryLog.find((entry) => entry.type === 'limit')).toBeUndefined();
  });

  it('returns all published notices inside the bounding box ordered by published date', async () => {
    const baseLatitude = 51.503;
    const baseLongitude = -0.128;
    const notices = Array.from({ length: 10 }).map((_, index) => {
      const publishedDate = new Date(Date.UTC(2025, 9, 9 - index))
        .toISOString()
        .slice(0, 10);
      return {
        id: `sw1a-${index}`,
        notice_type: 'Premises Licence',
        status: 'published',
        premises: {
          name: `Sample Premises ${index}`,
          address: `${index + 1} Whitehall Place, London, SW1A 1AA`,
          postcode: 'SW1A 1AA',
        },
        consultation: {},
        publication: {},
        extras: {},
        latitude: baseLatitude + index * 0.0001,
        longitude: baseLongitude + index * 0.0001,
        published_date: publishedDate,
        created_at: `${publishedDate}T12:00:00.000Z`,
        updated_at: `${publishedDate}T12:00:00.000Z`,
      };
    });

    supabaseResponse = { data: notices, error: null };

    const response = await request(app)
      .get('/api/notices/search')
      .query({ bbox: '51.5025,-0.1295,51.5045,-0.1255' });

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(10);
    const returnedIds = response.body.items.map((item: any) => item.id);
    expect(returnedIds).toEqual(notices.map((notice) => notice.id));
    expect(queryLog.find((entry) => entry.type === 'limit')).toBeUndefined();
  });

  it('applies radius filter when postcode and radius are provided', async () => {
    geocodeMock.mockResolvedValueOnce({
      postcode: 'SW1A 1AA',
      latitude: 51.501,
      longitude: -0.141,
      source: 'cache',
    });

    const response = await request(app)
      .get('/api/notices/search')
      .query({ postcode: 'SW1A 1AA', radius_km: 15 });

    expect(response.status).toBe(200);
    const radiusRpc = queryLog.find(
      (entry) => entry.type === 'rpc' && entry.fn === 'get_nearby_notices'
    );
    expect(radiusRpc?.args).toEqual({
      lng: -0.141,
      lat: 51.501,
      radius_meters: 15000,
    });
    expect(geocodeMock).toHaveBeenCalledWith('SW1A 1AA');
  });

  it('hydrates legacy flat notice records without nested JSON structures', async () => {
    geocodeMock.mockResolvedValueOnce({
      postcode: 'SW1A 1AA',
      latitude: 51.503,
      longitude: -0.127,
      source: 'cache',
    });

    supabaseResponse = {
      data: [
        {
          id: 'flat-notice-1',
          notice_type: 'Premises Licence',
          status: 'published',
          applicant_name: 'Whitehall Dining Group Ltd',
          trading_name: 'No.10 Terrace',
          premises_address: '10 Downing Street, London',
          postcode: 'SW1A 2AA',
          latitude: 51.5035,
          longitude: -0.1276,
          published_date: '2025-10-09',
          representation_deadline: '2025-10-16',
          notice_text:
            'Licensing Act 2003. Notice is hereby given that Whitehall Dining Group Ltd has applied to City of Westminster Council for a premises licence for No.10 Terrace, 10 Downing Street, London, to permit the sale of alcohol on and off the premises.',
          proof_hash: '95e69532ecf40283930df86c62bc1f98e59884cba8dee69314f8c974d9f35a2e',
          council_name: 'City of Westminster',
          created_at: '2025-10-09T09:00:00.000Z',
          updated_at: '2025-10-09T09:00:00.000Z',
        },
      ],
      error: null,
    };

    const response = await request(app)
      .get('/api/notices/search')
      .query({ postcode: 'SW1A 1AA', radius_km: 5 });

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({
      id: 'flat-notice-1',
      noticeType: 'Premises Licence',
      status: 'published',
      premisesName: 'No.10 Terrace',
      premisesAddress: '10 Downing Street, London',
      premisesPostcode: 'SW1A 2AA',
      repsDeadline: '2025-10-16',
      publicationDate: '2025-10-09',
      latitude: 51.5035,
      longitude: -0.1276,
    });
  });
});

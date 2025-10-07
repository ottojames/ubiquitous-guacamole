/** @vitest-environment node */
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const queryLog: Array<{ type: string; [key: string]: any }> = [];
let supabaseResponse: any = { data: [], error: null };

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
    })),
  };
});

// Import after mocking Supabase so the router uses our fake
const { app } = await import('../index');

afterEach(() => {
  queryLog.length = 0;
  supabaseResponse = { data: [], error: null };
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
      .query({ q: '102 Thames Road, London, W4 3RQ', radius_km: 20 });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({
      id: 'notice-1',
      noticeType: 'Licensing: Premises - New',
      premisesAddress: expect.stringContaining('W4 3RQ'),
    });

    const postcodeFilter = queryLog.find(
      (entry) => entry.type === 'ilike' && entry.column === 'premises->>postcode'
    );
    expect(postcodeFilter?.pattern).toBe('W4%');
    expect(queryLog.some((entry) => entry.type === 'or')).toBe(false);
  });
});

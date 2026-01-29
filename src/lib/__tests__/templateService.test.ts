import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderNoticeWithTemplateInfo } from '../templateService';
import type { NoticeBase } from '@/types/notice';

// Mock Supabase to avoid actual database calls
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            not: () => ({
              order: () => ({
                limit: () => ({
                  single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
                }),
              }),
            }),
          }),
        }),
      }),
    }),
  },
}));

describe('templateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renderNoticeWithTemplateInfo', () => {
    it('should use licensing renderer when extras.category is "licensing"', async () => {
      const notice: NoticeBase = {
        noticeType: 'Premises Licence — Variation', // Display name, NOT the ID
        applicant: {
          type: 'company',
          fullName: 'Test Applicant Ltd',
          contactEmail: 'test@example.com',
        },
        premises: {
          name: 'Test Premises',
          address: {
            line1: '123 Test Street',
            town: 'London',
            postcode: 'W1A 1AA',
          },
        },
        publication: {
          newspaper: 'Test Newspaper',
          targetDate: '2025-01-01',
        },
        consultation: {
          applicationDate: '2025-01-01',
          repsDeadline: '2025-01-29',
          windowRule: 'LA2003_28D',
        },
        extras: {
          category: 'licensing', // This is key - should trigger licensing renderer
          variant: 'licensing-premises-variation',
          tokens: {
            APPLICANT_NAME: 'Test Applicant Ltd',
            PREMISES_NAME: 'Test Premises',
            PREMISES_ADDRESS: '123 Test Street, London, W1A 1AA',
            LICENSABLE_ACTIVITIES: 'Sale of alcohol (on and off premises)',
            ACTIVITY_SCHEDULE: 'Mon-Sun 11:00-23:00',
            APPLICATION_DATE: '1 January 2025',
            DEADLINE_DATE: '29 January 2025',
            AUTHORITY_NAME: 'Westminster City Council',
            NATURE_OF_VARIATION: 'Authorise the sale of alcohol for consumption on and off the premises',
            REPRESENTATION_METHOD: 'in writing',
            REPRESENTATION_EMAIL: 'licensing@westminster.gov.uk',
          },
        },
      };

      const result = await renderNoticeWithTemplateInfo(notice);

      // Should NOT be a custom template (no templates in test database)
      expect(result.isCustomTemplate).toBe(false);

      // Should contain the NATURE_OF_VARIATION text
      expect(result.text).toContain('Authorise the sale of alcohol for consumption on and off the premises');

      // Should NOT contain raw placeholder
      expect(result.text).not.toContain('{{NATURE_OF_VARIATION}}');

      // Should be a licensing-format notice (has LICENSING ACT header)
      expect(result.text).toContain('LICENSING ACT 2003');
    });

    it('should not show raw placeholder for NATURE_OF_VARIATION when value is provided', async () => {
      const notice: NoticeBase = {
        noticeType: 'Premises Licence — Variation',
        applicant: {
          type: 'company',
          fullName: 'Test Applicant',
          contactEmail: '',
        },
        premises: {
          address: {
            line1: '123 Test Street',
            town: 'Test Town',
            postcode: 'AB1 2CD',
          },
        },
        publication: {
          newspaper: '',
          targetDate: '2025-01-01',
        },
        consultation: {
          applicationDate: '2025-01-01',
          repsDeadline: '2025-01-29',
          windowRule: 'LA2003_28D',
        },
        extras: {
          category: 'licensing',
          variant: 'licensing-premises-variation',
          tokens: {
            APPLICANT_NAME: 'Test Applicant',
            PREMISES_ADDRESS: '123 Test Street, Test Town, AB1 2CD',
            LICENSABLE_ACTIVITIES: 'Sale of alcohol',
            ACTIVITY_SCHEDULE: 'Mon-Sun 10:00-22:00',
            APPLICATION_DATE: '1 January 2025',
            DEADLINE_DATE: '29 January 2025',
            AUTHORITY_NAME: 'Test Council',
            NATURE_OF_VARIATION: 'Extend hours for alcohol sales',
            REPRESENTATION_METHOD: 'in writing',
            REPRESENTATION_EMAIL: 'test@council.gov.uk',
          },
        },
      };

      const result = await renderNoticeWithTemplateInfo(notice);

      // Should contain the variation description
      expect(result.text).toContain('Extend hours for alcohol sales');

      // Should NOT have raw placeholders
      expect(result.text).not.toMatch(/\{\{[A-Z_]+\}\}/);
    });
  });
});

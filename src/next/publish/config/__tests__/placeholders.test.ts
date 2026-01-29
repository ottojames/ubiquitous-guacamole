/**
 * Placeholder Coverage Tests
 *
 * Verifies that all notice types defined in noticeTypes.ts
 * have corresponding placeholder definitions in placeholders.ts.
 * This ensures templates can be created for any notice type.
 */

import { describe, it, expect } from 'vitest';
import { NOTICE_DEFINITIONS } from '../noticeTypes';
import {
  getPlaceholdersForNoticeType,
  getRequiredPlaceholders,
  PLACEHOLDER_REGISTRY,
  validateTemplatePlaceholders,
} from '../placeholders';

describe('Placeholder Coverage', () => {
  describe('NOTICE_DEFINITIONS and PLACEHOLDER_REGISTRY alignment', () => {
    it('should have placeholder definitions for all notice types', () => {
      const noticeIds = NOTICE_DEFINITIONS.map(def => def.id);
      const registryIds = Object.keys(PLACEHOLDER_REGISTRY);

      // Every notice type should have placeholders
      for (const id of noticeIds) {
        expect(
          registryIds,
          `Notice type "${id}" is missing from PLACEHOLDER_REGISTRY`
        ).toContain(id);
      }
    });

    it('should not have orphan placeholder entries without notice definitions', () => {
      const noticeIds = NOTICE_DEFINITIONS.map(def => def.id);
      const registryIds = Object.keys(PLACEHOLDER_REGISTRY);

      // Every placeholder registry entry should have a notice type
      for (const id of registryIds) {
        expect(
          noticeIds,
          `Placeholder registry has orphan entry "${id}" not in NOTICE_DEFINITIONS`
        ).toContain(id);
      }
    });

    it('should have exactly 34 notice types', () => {
      expect(NOTICE_DEFINITIONS.length).toBe(34);
    });

    it('should have exactly 34 placeholder registry entries', () => {
      expect(Object.keys(PLACEHOLDER_REGISTRY).length).toBe(34);
    });
  });

  describe('getPlaceholdersForNoticeType', () => {
    it('should return non-empty array for all notice types', () => {
      for (const def of NOTICE_DEFINITIONS) {
        const placeholders = getPlaceholdersForNoticeType(def.id);
        expect(
          placeholders.length,
          `Notice type "${def.id}" returns empty placeholder array`
        ).toBeGreaterThan(0);
      }
    });

    it('should return empty array for unknown notice types', () => {
      const placeholders = getPlaceholdersForNoticeType('unknown-type');
      expect(placeholders).toEqual([]);
    });
  });

  describe('getRequiredPlaceholders', () => {
    it('should return at least one required placeholder for each notice type', () => {
      for (const def of NOTICE_DEFINITIONS) {
        const required = getRequiredPlaceholders(def.id);
        expect(
          required.length,
          `Notice type "${def.id}" has no required placeholders`
        ).toBeGreaterThan(0);
      }
    });

    it('should mark an identifying placeholder as required for all notice types', () => {
      for (const def of NOTICE_DEFINITIONS) {
        const required = getRequiredPlaceholders(def.id);
        const requiredTokens = required.map(p => p.token);

        // Most notice types should have APPLICANT_NAME, REVIEW_APPLICANT_NAME, DECEASED_NAME, or AUTHORITY_NAME (for TROs)
        const hasIdentifyingPlaceholder =
          requiredTokens.includes('APPLICANT_NAME') ||
          requiredTokens.includes('REVIEW_APPLICANT_NAME') ||
          requiredTokens.includes('DECEASED_NAME') ||
          requiredTokens.includes('AUTHORITY_NAME'); // TROs are issued by authorities

        expect(
          hasIdentifyingPlaceholder,
          `Notice type "${def.id}" should have an identifying placeholder (APPLICANT_NAME, REVIEW_APPLICANT_NAME, DECEASED_NAME, or AUTHORITY_NAME)`
        ).toBe(true);
      }
    });
  });

  describe('validateTemplatePlaceholders', () => {
    it('should return isValid: false for empty template', () => {
      const result = validateTemplatePlaceholders('', 'licensing-premises-new');
      expect(result.isValid).toBe(false);
    });

    it('should return isValid: false when missing required placeholders', () => {
      const result = validateTemplatePlaceholders(
        'This is a test template with no placeholders',
        'licensing-premises-new'
      );
      expect(result.isValid).toBe(false);
      expect(result.missingRequired.length).toBeGreaterThan(0);
    });

    it('should warn about missing Licensing Act 2003 reference for licensing notices', () => {
      const result = validateTemplatePlaceholders(
        '{{APPLICANT_NAME}} {{PREMISES_NAME}} {{PREMISES_ADDRESS}} {{LICENSABLE_ACTIVITIES}} {{ACTIVITY_SCHEDULE}} {{APPLICATION_DATE}} {{DEADLINE_DATE}} {{AUTHORITY_NAME}}',
        'licensing-premises-new'
      );
      expect(result.warnings).toContain(
        'Template should reference "Licensing Act 2003" for legal compliance'
      );
    });

    it('should warn about missing Gambling Act 2005 reference for gambling notices', () => {
      const result = validateTemplatePlaceholders(
        '{{APPLICANT_NAME}} {{PREMISES_NAME}} {{PREMISES_ADDRESS}} {{GAMBLING_PREMISES_TYPE}} {{LICENSABLE_ACTIVITIES}} {{OPENING_HOURS}} {{APPLICATION_DATE}} {{DEADLINE_DATE}} {{AUTHORITY_NAME}}',
        'gambling-betting-new'
      );
      expect(result.warnings).toContain(
        'Template should reference "Gambling Act 2005" for legal compliance'
      );
    });

    it('should return isValid: true when all required placeholders present', () => {
      // Build a template with all required placeholders for premises licence new
      const required = getRequiredPlaceholders('licensing-premises-new');
      const templateText = required.map(p => `{{${p.token}}}`).join(' ');

      const result = validateTemplatePlaceholders(
        templateText,
        'licensing-premises-new'
      );
      expect(result.isValid).toBe(true);
      expect(result.missingRequired).toEqual([]);
    });
  });

  describe('Licensing review notice types', () => {
    it('should have licensing-premises-review in both registries', () => {
      const noticeIds = NOTICE_DEFINITIONS.map(def => def.id);
      expect(noticeIds).toContain('licensing-premises-review');
      expect(PLACEHOLDER_REGISTRY).toHaveProperty('licensing-premises-review');
    });

    it('should have licensing-club-review in both registries', () => {
      const noticeIds = NOTICE_DEFINITIONS.map(def => def.id);
      expect(noticeIds).toContain('licensing-club-review');
      expect(PLACEHOLDER_REGISTRY).toHaveProperty('licensing-club-review');
    });

    it('should have review-specific placeholders for licensing-premises-review', () => {
      const placeholders = getPlaceholdersForNoticeType('licensing-premises-review');
      const tokens = placeholders.map(p => p.token);

      expect(tokens).toContain('REVIEW_APPLICANT_NAME');
      expect(tokens).toContain('REVIEW_GROUNDS');
    });

    it('should have review-specific placeholders for licensing-club-review', () => {
      const placeholders = getPlaceholdersForNoticeType('licensing-club-review');
      const tokens = placeholders.map(p => p.token);

      expect(tokens).toContain('REVIEW_APPLICANT_NAME');
      expect(tokens).toContain('REVIEW_GROUNDS');
    });
  });

  describe('Notice type categories', () => {
    it('should cover all expected categories', () => {
      const categories = [...new Set(NOTICE_DEFINITIONS.map(def => def.category))];
      expect(categories).toContain('licensing');
      expect(categories).toContain('gambling');
      expect(categories).toContain('gvol');
      expect(categories).toContain('planning');
      expect(categories).toContain('probate');
      expect(categories).toContain('tro');
    });

    it('should have 6 licensing notice types', () => {
      const licensingTypes = NOTICE_DEFINITIONS.filter(
        def => def.category === 'licensing'
      );
      expect(licensingTypes.length).toBe(6);
    });

    it('should have 16 gambling notice types', () => {
      const gamblingTypes = NOTICE_DEFINITIONS.filter(
        def => def.category === 'gambling'
      );
      expect(gamblingTypes.length).toBe(16);
    });

    it('should have 2 GVOL notice types', () => {
      const gvolTypes = NOTICE_DEFINITIONS.filter(def => def.category === 'gvol');
      expect(gvolTypes.length).toBe(2);
    });

    it('should have 6 planning notice types', () => {
      const planningTypes = NOTICE_DEFINITIONS.filter(
        def => def.category === 'planning'
      );
      expect(planningTypes.length).toBe(6);
    });

    it('should have 1 probate notice type', () => {
      const probateTypes = NOTICE_DEFINITIONS.filter(
        def => def.category === 'probate'
      );
      expect(probateTypes.length).toBe(1);
    });

    it('should have 3 TRO notice types', () => {
      const troTypes = NOTICE_DEFINITIONS.filter(def => def.category === 'tro');
      expect(troTypes.length).toBe(3);
    });
  });
});

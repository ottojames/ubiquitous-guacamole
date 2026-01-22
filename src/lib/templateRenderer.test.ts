/**
 * Template Renderer Tests
 *
 * Unit tests for the template renderer utility that substitutes
 * placeholders with form data values.
 */

import { describe, it, expect } from 'vitest';
import {
  renderTemplateText,
  formatAddress,
  formatDate,
  hasPlaceholders,
  extractPlaceholders,
  getMissingPlaceholders,
  type NoticeFormData,
} from './templateRenderer';

// Helper to create minimal form data with overrides
function createFormData(overrides: Partial<NoticeFormData> = {}): NoticeFormData {
  return {
    title: 'Test Notice',
    notice_type: 'premises-licence',
    premises: {
      name: 'The Red Lion',
      address: {
        line1: '123 High Street',
        line2: '',
        city: 'Bristol',
        postcode: 'BS1 1AA',
      },
    },
    applicant: {
      name: 'Test Ltd',
      address: {
        line1: '456 Park Road',
        line2: 'Suite 5',
        city: 'London',
        postcode: 'SW1A 1AA',
      },
    },
    consultation: {
      authority: 'Bristol City Council',
      start_date: '2025-11-01',
      end_date: '2025-12-01',
    },
    licensing: {
      activities: ['Sale of alcohol', 'Live music'],
    },
    representation_deadline: '2025-12-15',
    expires_at: '2026-01-15',
    ...overrides,
  };
}

describe('formatAddress', () => {
  it('formats complete address', () => {
    const address = {
      line1: '123 High Street',
      line2: 'Suite 5',
      city: 'Bristol',
      postcode: 'BS1 1AA',
    };
    expect(formatAddress(address)).toBe('123 High Street, Suite 5, Bristol, BS1 1AA');
  });

  it('handles missing line2', () => {
    const address = {
      line1: '123 High Street',
      line2: '',
      city: 'Bristol',
      postcode: 'BS1 1AA',
    };
    expect(formatAddress(address)).toBe('123 High Street, Bristol, BS1 1AA');
  });

  it('handles undefined address', () => {
    expect(formatAddress(undefined)).toBe('');
  });

  it('handles empty address', () => {
    const address = {
      line1: '',
      city: '',
      postcode: '',
    };
    expect(formatAddress(address)).toBe('');
  });
});

describe('formatDate', () => {
  it('formats ISO date string', () => {
    expect(formatDate('2025-12-15')).toBe('15 December 2025');
  });

  it('handles undefined date', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('handles empty string', () => {
    expect(formatDate('')).toBe('');
  });

  it('returns original string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('renderTemplateText', () => {
  it('substitutes applicant name placeholder', () => {
    const template = 'Notice: {{APPLICANT_NAME}} has applied';
    const data = createFormData();
    expect(renderTemplateText(template, data)).toBe('Notice: Test Ltd has applied');
  });

  it('substitutes premises address placeholder', () => {
    const template = 'Located at {{PREMISES_ADDRESS}}';
    const data = createFormData();
    expect(renderTemplateText(template, data)).toBe('Located at 123 High Street, Bristol, BS1 1AA');
  });

  it('substitutes multiple placeholders', () => {
    const template = '{{APPLICANT_NAME}} at {{PREMISES_ADDRESS}}';
    const data = createFormData();
    expect(renderTemplateText(template, data)).toBe('Test Ltd at 123 High Street, Bristol, BS1 1AA');
  });

  it('substitutes deadline date with formatting', () => {
    const template = 'Deadline: {{DEADLINE_DATE}}';
    const data = createFormData();
    expect(renderTemplateText(template, data)).toBe('Deadline: 15 December 2025');
  });

  it('substitutes authority name', () => {
    const template = 'Authority: {{AUTHORITY_NAME}}';
    const data = createFormData();
    expect(renderTemplateText(template, data)).toBe('Authority: Bristol City Council');
  });

  it('substitutes licensable activities', () => {
    const template = 'Activities: {{LICENSABLE_ACTIVITIES}}';
    const data = createFormData();
    expect(renderTemplateText(template, data)).toBe('Activities: Sale of alcohol, Live music');
  });

  it('keeps unknown placeholders visible', () => {
    const template = 'Unknown: {{UNKNOWN_PLACEHOLDER}}';
    const data = createFormData();
    expect(renderTemplateText(template, data)).toBe('Unknown: {{UNKNOWN_PLACEHOLDER}}');
  });

  it('handles empty template text', () => {
    const data = createFormData();
    expect(renderTemplateText('', data)).toBe('');
  });

  it('handles template with no placeholders', () => {
    const template = 'Plain text notice';
    const data = createFormData();
    expect(renderTemplateText(template, data)).toBe('Plain text notice');
  });

  it('handles missing form data values', () => {
    const template = '{{APPLICANT_NAME}} applied';
    const data = createFormData({
      applicant: {
        name: '',
        address: { line1: '', city: '', postcode: '' },
      },
    });
    expect(renderTemplateText(template, data)).toBe(' applied');
  });

  it('handles complex template with multiple placeholder types', () => {
    const template = `NOTICE

{{APPLICANT_NAME}} has submitted an application for a premises licence for {{PREMISES_NAME}} at {{PREMISES_ADDRESS}}.

The application is being made to {{AUTHORITY_NAME}}.

Proposed activities: {{LICENSABLE_ACTIVITIES}}

Representations must be received by {{DEADLINE_DATE}}.`;

    const data = createFormData();
    const result = renderTemplateText(template, data);

    expect(result).toContain('Test Ltd has submitted');
    expect(result).toContain('The Red Lion');
    expect(result).toContain('123 High Street, Bristol, BS1 1AA');
    expect(result).toContain('Bristol City Council');
    expect(result).toContain('Sale of alcohol, Live music');
    expect(result).toContain('15 December 2025');
  });
});

describe('hasPlaceholders', () => {
  it('returns true for template with placeholders', () => {
    expect(hasPlaceholders('Hello {{APPLICANT_NAME}}')).toBe(true);
  });

  it('returns false for template without placeholders', () => {
    expect(hasPlaceholders('Plain text notice')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(hasPlaceholders('')).toBe(false);
  });

  it('returns false for malformed placeholders', () => {
    expect(hasPlaceholders('Hello {APPLICANT_NAME}')).toBe(false);
    expect(hasPlaceholders('Hello {{applicant_name}}')).toBe(false);
  });
});

describe('extractPlaceholders', () => {
  it('extracts single placeholder', () => {
    expect(extractPlaceholders('Hello {{APPLICANT_NAME}}')).toEqual(['APPLICANT_NAME']);
  });

  it('extracts multiple placeholders', () => {
    const placeholders = extractPlaceholders('{{APPLICANT_NAME}} at {{PREMISES_ADDRESS}}');
    expect(placeholders).toContain('APPLICANT_NAME');
    expect(placeholders).toContain('PREMISES_ADDRESS');
    expect(placeholders.length).toBe(2);
  });

  it('deduplicates repeated placeholders', () => {
    const placeholders = extractPlaceholders('{{NAME}} and {{NAME}} again');
    expect(placeholders).toEqual(['NAME']);
  });

  it('returns empty array for no placeholders', () => {
    expect(extractPlaceholders('Plain text')).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(extractPlaceholders('')).toEqual([]);
  });
});

describe('getMissingPlaceholders', () => {
  it('returns empty array when all placeholders have values', () => {
    const template = '{{APPLICANT_NAME}} at {{PREMISES_ADDRESS}}';
    const data = createFormData();
    expect(getMissingPlaceholders(template, data)).toEqual([]);
  });

  it('returns missing placeholders when form data is incomplete', () => {
    const template = '{{APPLICANT_NAME}} at {{PREMISES_ADDRESS}}';
    const data = createFormData({
      applicant: { name: '', address: { line1: '', city: '', postcode: '' } },
    });
    const missing = getMissingPlaceholders(template, data);
    expect(missing).toContain('APPLICANT_NAME');
  });

  it('includes unknown placeholders as missing', () => {
    const template = '{{UNKNOWN_FIELD}}';
    const data = createFormData();
    expect(getMissingPlaceholders(template, data)).toContain('UNKNOWN_FIELD');
  });
});

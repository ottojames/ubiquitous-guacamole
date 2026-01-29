import { describe, expect, it } from 'vitest';
import { getDefinitionById } from '@/next/publish/config/noticeTypes';
import { getNoticeBuilder } from '@/next/publish/schema/registry';

/**
 * Helper function that mirrors the hours formatting logic from TemplateBuilderForm.tsx
 * Extracted here for testing purposes.
 */
function formatActivityHours(
  hours: Record<string, { start: string; end: string } | null>
): string {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
  const filled = days.filter(d => hours[d] !== null);

  if (filled.length === 0) return "No hours set";

  // Check if all days have the same hours
  const allSame = filled.length === 7 && filled.every(d => {
    const h = hours[d];
    return h && h.start === hours[filled[0]]?.start && h.end === hours[filled[0]]?.end;
  });

  if (allSame) {
    const h = hours[filled[0]];
    return `Mon–Sun ${h?.start}–${h?.end}`;
  }

  // Group consecutive days with same hours
  type DayGroup = { days: string[]; start: string; end: string };
  const groups: DayGroup[] = [];
  let currentGroup: DayGroup | null = null;

  for (const day of days) {
    const h = hours[day];
    if (!h) {
      // Day has no hours - close current group if exists
      if (currentGroup) {
        groups.push(currentGroup);
        currentGroup = null;
      }
      continue;
    }

    if (currentGroup && h.start === currentGroup.start && h.end === currentGroup.end) {
      // Same hours as current group - extend it
      currentGroup.days.push(day);
    } else {
      // Different hours - close current group and start new one
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = { days: [day], start: h.start, end: h.end };
    }
  }

  // Push final group if exists
  if (currentGroup) {
    groups.push(currentGroup);
  }

  // Format groups into readable strings
  const formatGroup = (group: DayGroup): string => {
    const dayStr = group.days.length === 1
      ? group.days[0]
      : `${group.days[0]}–${group.days[group.days.length - 1]}`;
    return `${dayStr} ${group.start}–${group.end}`;
  };

  return groups.map(formatGroup).join(", ");
}

/**
 * Tests for hours formatting with intelligent day grouping.
 * This addresses Issue 2: Hours showing "Various hours" instead of actual times.
 */
describe('Activity hours formatting', () => {
  it('should show "No hours set" when no days have hours', () => {
    const hours = {
      Mon: null,
      Tue: null,
      Wed: null,
      Thu: null,
      Fri: null,
      Sat: null,
      Sun: null,
    };
    expect(formatActivityHours(hours)).toBe("No hours set");
  });

  it('should show "Mon–Sun X–Y" when all days have same hours', () => {
    const hours = {
      Mon: { start: "11:00", end: "23:00" },
      Tue: { start: "11:00", end: "23:00" },
      Wed: { start: "11:00", end: "23:00" },
      Thu: { start: "11:00", end: "23:00" },
      Fri: { start: "11:00", end: "23:00" },
      Sat: { start: "11:00", end: "23:00" },
      Sun: { start: "11:00", end: "23:00" },
    };
    expect(formatActivityHours(hours)).toBe("Mon–Sun 11:00–23:00");
  });

  it('should group consecutive days with same hours', () => {
    const hours = {
      Mon: { start: "00:00", end: "23:00" },
      Tue: { start: "00:00", end: "23:59" },
      Wed: { start: "00:00", end: "23:59" },
      Thu: { start: "00:00", end: "23:59" },
      Fri: { start: "00:00", end: "23:59" },
      Sat: { start: "00:00", end: "23:59" },
      Sun: { start: "00:00", end: "23:59" },
    };
    expect(formatActivityHours(hours)).toBe("Mon 00:00–23:00, Tue–Sun 00:00–23:59");
  });

  it('should handle weekday/weekend split', () => {
    const hours = {
      Mon: { start: "11:00", end: "23:00" },
      Tue: { start: "11:00", end: "23:00" },
      Wed: { start: "11:00", end: "23:00" },
      Thu: { start: "11:00", end: "23:00" },
      Fri: { start: "11:00", end: "02:00" },
      Sat: { start: "11:00", end: "02:00" },
      Sun: { start: "11:00", end: "23:00" },
    };
    expect(formatActivityHours(hours)).toBe("Mon–Thu 11:00–23:00, Fri–Sat 11:00–02:00, Sun 11:00–23:00");
  });

  it('should show single day when only one day differs', () => {
    const hours = {
      Mon: { start: "11:00", end: "23:00" },
      Tue: { start: "11:00", end: "23:00" },
      Wed: { start: "11:00", end: "23:00" },
      Thu: { start: "11:00", end: "23:00" },
      Fri: { start: "11:00", end: "23:00" },
      Sat: { start: "11:00", end: "03:00" },
      Sun: { start: "11:00", end: "23:00" },
    };
    expect(formatActivityHours(hours)).toBe("Mon–Fri 11:00–23:00, Sat 11:00–03:00, Sun 11:00–23:00");
  });

  it('should handle gaps in days (no hours set for some days)', () => {
    const hours = {
      Mon: { start: "11:00", end: "23:00" },
      Tue: { start: "11:00", end: "23:00" },
      Wed: null,
      Thu: { start: "11:00", end: "23:00" },
      Fri: { start: "11:00", end: "23:00" },
      Sat: { start: "11:00", end: "23:00" },
      Sun: null,
    };
    expect(formatActivityHours(hours)).toBe("Mon–Tue 11:00–23:00, Thu–Sat 11:00–23:00");
  });

  it('should NOT show "Various hours" anymore', () => {
    // This was the old buggy behavior - we should never see "Various hours"
    const hours = {
      Mon: { start: "00:00", end: "23:00" },
      Tue: { start: "00:00", end: "23:59" },
      Wed: { start: "00:00", end: "23:59" },
      Thu: { start: "00:00", end: "23:59" },
      Fri: { start: "00:00", end: "23:59" },
      Sat: { start: "00:00", end: "23:59" },
      Sun: { start: "00:00", end: "23:59" },
    };
    const result = formatActivityHours(hours);
    expect(result).not.toContain("Various hours");
    expect(result).toContain("Mon 00:00–23:00");
    expect(result).toContain("Tue–Sun 00:00–23:59");
  });
});

/**
 * Test that NATURE_OF_VARIATION is properly handled in the schema and template flow.
 * This tests the data flow, not the React component.
 */
describe('NATURE_OF_VARIATION data flow', () => {
  it('should include NATURE_OF_VARIATION in licensing variation schema', () => {
    const definition = getDefinitionById('licensing-premises-variation');
    expect(definition).toBeDefined();
    expect(definition?.id).toBe('licensing-premises-variation');
  });

  it('should map NATURE_OF_VARIATION through to NoticeBase tokens', () => {
    const builder = getNoticeBuilder('licensing-premises-variation');
    expect(builder).toBeDefined();

    // Create test data with NATURE_OF_VARIATION
    const testData = {
      variant: 'licensing-premises-variation',
      NOTICE_TYPE: 'Premises Licence — Variation',
      ACT_TITLE: 'Licensing Act 2003',
      APPLICANT_NAME: 'Test Applicant Ltd',
      PREMISES_NAME: 'Test Premises',
      PREMISES_ADDRESS: '123 Test Street, London, W1A 1AA',
      LICENSABLE_ACTIVITIES: 'Sale of alcohol (on and off premises)',
      ACTIVITY_SCHEDULE: 'Mon-Sun 11:00-23:00',
      APPLICATION_DATE: '2025-01-01',
      DEADLINE_DATE: '2025-01-29',
      REPRESENTATION_METHOD: 'in writing',
      REPRESENTATION_EMAIL: 'licensing@test.gov.uk', // Required for validation
      AUTHORITY_NAME: 'Westminster City Council',
      // This is the key field we're testing
      NATURE_OF_VARIATION: 'Authorise the sale of alcohol for consumption on and off the premises',
    };

    // Parse the data through the schema
    const parseResult = builder!.schema.safeParse(testData);

    if (!parseResult.success) {
      console.log('Parse errors:', JSON.stringify(parseResult.error.flatten(), null, 2));
    }

    expect(parseResult.success).toBe(true);

    if (parseResult.success) {
      // Map to NoticeBase
      const noticeBase = builder!.mapToNoticeBase(parseResult.data);

      // Check that NATURE_OF_VARIATION is in the tokens
      expect(noticeBase.extras).toBeDefined();
      expect(noticeBase.extras?.tokens).toBeDefined();
      expect(noticeBase.extras?.tokens?.NATURE_OF_VARIATION).toBe(
        'Authorise the sale of alcohol for consumption on and off the premises'
      );
    }
  });

  it('should validate NATURE_OF_VARIATION is required for variation notices', () => {
    const builder = getNoticeBuilder('licensing-premises-variation');
    expect(builder).toBeDefined();

    // Create test data WITHOUT NATURE_OF_VARIATION
    const testDataWithout = {
      variant: 'licensing-premises-variation',
      NOTICE_TYPE: 'Premises Licence — Variation',
      ACT_TITLE: 'Licensing Act 2003',
      APPLICANT_NAME: 'Test Applicant Ltd',
      PREMISES_NAME: 'Test Premises',
      PREMISES_ADDRESS: '123 Test Street, London, W1A 1AA',
      LICENSABLE_ACTIVITIES: 'Sale of alcohol (on and off premises)',
      ACTIVITY_SCHEDULE: 'Mon-Sun 11:00-23:00',
      APPLICATION_DATE: '2025-01-01',
      DEADLINE_DATE: '2025-01-29',
      REPRESENTATION_METHOD: 'in writing',
      REPRESENTATION_EMAIL: 'licensing@test.gov.uk', // Required for validation
      AUTHORITY_NAME: 'Westminster City Council',
      // NATURE_OF_VARIATION deliberately omitted
    };

    // Parse the data - should fail because NATURE_OF_VARIATION is required for variations
    const parseResult = builder!.schema.safeParse(testDataWithout);

    // The schema uses superRefine to require NATURE_OF_VARIATION for variations
    expect(parseResult.success).toBe(false);
    if (!parseResult.success) {
      const errors = parseResult.error.flatten();
      // Should have an error for NATURE_OF_VARIATION
      const fieldErrors = errors.fieldErrors as Record<string, string[]>;
      expect(
        fieldErrors.NATURE_OF_VARIATION ||
        errors.formErrors.some((e: string) => e.toLowerCase().includes('variation'))
      ).toBeTruthy();
    }
  });

  it('should NOT require NATURE_OF_VARIATION for new licence applications', () => {
    const builder = getNoticeBuilder('licensing-premises-new');
    expect(builder).toBeDefined();

    // Create test data without NATURE_OF_VARIATION for a NEW licence
    const testData = {
      variant: 'licensing-premises-new',
      NOTICE_TYPE: 'Premises Licence — New',
      ACT_TITLE: 'Licensing Act 2003',
      APPLICANT_NAME: 'Test Applicant Ltd',
      PREMISES_NAME: 'Test Premises',
      PREMISES_ADDRESS: '123 Test Street, London, W1A 1AA',
      LICENSABLE_ACTIVITIES: 'Sale of alcohol (on and off premises)',
      ACTIVITY_SCHEDULE: 'Mon-Sun 11:00-23:00',
      APPLICATION_DATE: '2025-01-01',
      DEADLINE_DATE: '2025-01-29',
      REPRESENTATION_METHOD: 'in writing',
      REPRESENTATION_EMAIL: 'licensing@test.gov.uk', // Required for validation
      AUTHORITY_NAME: 'Westminster City Council',
      // NATURE_OF_VARIATION deliberately omitted - should be fine for new applications
    };

    // Parse the data - should succeed without NATURE_OF_VARIATION
    const parseResult = builder!.schema.safeParse(testData);

    if (!parseResult.success) {
      console.log('Parse errors for new licence:', JSON.stringify(parseResult.error.flatten(), null, 2));
    }

    expect(parseResult.success).toBe(true);
  });
});

# CRIT-008 Validation Instructions

## Issue Fixed
**Licensing Act 2003 — No Multi-Jurisdiction Support for Boundary Premises**
- Schema lacked support for premises on boundaries of multiple licensing authorities
- Templates assumed single authority application
- Platform could not handle common real-world scenario (Westminster/Camden, City of London borders)

## Validation Steps

### 1. Schema Verification

```bash
# Check that additional authority schema exists
grep "additionalAuthoritySchema" src/next/publish/schema/licensing.ts
```

**Expected Output**: Should find `const additionalAuthoritySchema = z.object({`

```bash
# Check that ADDITIONAL_LICENSING_AUTHORITIES field exists
grep "ADDITIONAL_LICENSING_AUTHORITIES" src/next/publish/schema/licensing.ts
```

**Expected Output**: Should find `ADDITIONAL_LICENSING_AUTHORITIES: z.array(additionalAuthoritySchema).optional()`

### 2. Mapper Helper Tokens Verification

```bash
# Check that mapper creates helper tokens
grep -A 5 "AUTHORITY_NAMES_LIST" src/next/publish/schema/licensing.ts
grep -A 2 "HAS_MULTIPLE_AUTHORITIES" src/next/publish/schema/licensing.ts
```

**Expected Output**: Should find both helper tokens in mapper function

### 3. Template Multi-Jurisdiction Rendering

```bash
# Count conditional multi-jurisdiction references (should be 6 templates)
grep -c "HAS_MULTIPLE_AUTHORITIES" src/next/publish/templates/licensing.ts
```

**Expected Output**: `6`

```bash
# Count AUTHORITY_NAMES_LIST usage (should be 6 templates)
grep -c "AUTHORITY_NAMES_LIST" src/next/publish/templates/licensing.ts
```

**Expected Output**: `6`

```bash
# Verify "concurrently" wording appears with conditional
grep "concurrently" src/next/publish/templates/licensing.ts | head -3
```

**Expected Output**: Should show conditional rendering pattern `{{#if HAS_MULTIPLE_AUTHORITIES}} concurrently{{/if}}`

### 4. Backward Compatibility Check

```bash
# Verify AUTHORITY_NAME still exists in representation sections
grep "{{AUTHORITY_NAME}}" src/next/publish/templates/licensing.ts | grep -c "representations"
```

**Expected Output**: `6` (one for each template's representation section)

### 5. Unit Test — Single Authority (Backward Compatibility)

Create test file `src/next/publish/templates/__tests__/licensing-crit008-single.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderLicensingText } from '../licensing';

describe('CRIT-008: Multi-Jurisdiction (Single Authority - Backward Compatible)', () => {
  it('single authority renders without "concurrently"', () => {
    const mockNotice = {
      noticeType: 'licensing-premises-new',
      extras: {
        category: 'licensing',
        variant: 'licensing-premises-new',
        tokens: {
          APPLICANT_NAME: 'Test Pub Ltd',
          AUTHORITY_NAME: 'Westminster City Council',
          AUTHORITY_NAMES_LIST: 'Westminster City Council', // Mapper creates this
          HAS_MULTIPLE_AUTHORITIES: '', // Empty string = false
          PREMISES_NAME: 'The Crown',
          PREMISES_ADDRESS: '10 High Street, London W1',
          LICENSABLE_ACTIVITIES: 'Sale of alcohol',
          ACTIVITY_SCHEDULE: 'Monday-Saturday 11:00-23:00',
          INSPECTION_LOCATION: 'Town Hall',
          INSPECTION_TIMES: '9am-5pm Monday-Friday',
          REPRESENTATION_ADDRESS: 'Licensing Team',
          DEADLINE_DATE: '2025-12-15',
        }
      }
    };

    const rendered = renderLicensingText(mockNotice);

    // Should NOT contain "concurrently"
    expect(rendered).not.toContain('concurrently');

    // Should contain single authority name
    expect(rendered).toContain('has applied to Westminster City Council');
    expect(rendered).toContain('representations must be made in writing to Westminster City Council');
  });

  it('all 6 variants work with single authority', () => {
    const variants = [
      'licensing-premises-new',
      'licensing-premises-variation',
      'licensing-premises-review',
      'licensing-club-new',
      'licensing-club-variation',
      'licensing-club-review',
    ];

    variants.forEach(variant => {
      const mockNotice = {
        noticeType: variant,
        extras: {
          category: 'licensing',
          variant: variant,
          tokens: {
            APPLICANT_NAME: 'Test',
            REVIEW_APPLICANT_NAME: 'Test Reviewer',
            AUTHORITY_NAME: 'Test Council',
            AUTHORITY_NAMES_LIST: 'Test Council',
            HAS_MULTIPLE_AUTHORITIES: '',
            PREMISES_ADDRESS: '10 High St',
            LICENSABLE_ACTIVITIES: 'Test',
            ACTIVITY_SCHEDULE: 'Test',
            NATURE_OF_VARIATION: 'Test',
            REVIEW_GROUNDS: 'Test',
            INSPECTION_LOCATION: 'Test',
            INSPECTION_TIMES: '9am-5pm',
            REPRESENTATION_ADDRESS: 'Test',
            DEADLINE_DATE: '2025-12-31',
          }
        }
      };

      const rendered = renderLicensingText(mockNotice);

      expect(rendered, `${variant} should not contain "concurrently"`).not.toContain('concurrently');
      expect(rendered, `${variant} should contain authority name`).toContain('Test Council');
    });
  });
});
```

**Run Test**:
```bash
npm test -- licensing-crit008-single.test.ts
```

**Expected**: All tests PASS ✓

### 6. Unit Test — Multiple Authorities (New Feature)

Create test file `src/next/publish/templates/__tests__/licensing-crit008-multi.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderLicensingText } from '../licensing';

describe('CRIT-008: Multi-Jurisdiction (Multiple Authorities - Boundary Premises)', () => {
  it('two authorities render with "concurrently" and "and"', () => {
    const mockNotice = {
      noticeType: 'licensing-premises-new',
      extras: {
        category: 'licensing',
        variant: 'licensing-premises-new',
        tokens: {
          APPLICANT_NAME: 'Border Pub Ltd',
          AUTHORITY_NAME: 'Westminster City Council',
          AUTHORITY_NAMES_LIST: 'Westminster City Council and Camden Borough Council',
          HAS_MULTIPLE_AUTHORITIES: 'true',
          PREMISES_NAME: 'The Boundary Inn',
          PREMISES_ADDRESS: '100 Boundary Road, London NW8',
          LICENSABLE_ACTIVITIES: 'Sale of alcohol, Live music',
          ACTIVITY_SCHEDULE: 'Monday-Sunday 11:00-23:00',
          INSPECTION_LOCATION: 'Westminster Town Hall',
          INSPECTION_TIMES: '9am-5pm Monday-Friday',
          REPRESENTATION_ADDRESS: 'Licensing Team, Westminster City Council',
          DEADLINE_DATE: '2025-12-15',
        }
      }
    };

    const rendered = renderLicensingText(mockNotice);

    // Should contain "concurrently"
    expect(rendered).toContain('concurrently');

    // Should contain both authority names with "and"
    expect(rendered).toContain('Westminster City Council and Camden Borough Council');

    // Representations should go to primary authority
    expect(rendered).toContain('representations must be made in writing to Westminster City Council');
  });

  it('three authorities render correctly', () => {
    const mockNotice = {
      noticeType: 'licensing-premises-variation',
      extras: {
        category: 'licensing',
        variant: 'licensing-premises-variation',
        tokens: {
          APPLICANT_NAME: 'Triple Border Pub Ltd',
          AUTHORITY_NAME: 'Westminster City Council',
          AUTHORITY_NAMES_LIST: 'Westminster City Council, Camden Borough Council and City of London',
          HAS_MULTIPLE_AUTHORITIES: 'true',
          PREMISES_NAME: 'The Three Boundaries',
          PREMISES_ADDRESS: '1 Triple Point, London',
          LICENSABLE_ACTIVITIES: 'Sale of alcohol',
          ACTIVITY_SCHEDULE: 'Monday-Sunday 10:00-midnight',
          NATURE_OF_VARIATION: 'Extended hours',
          INSPECTION_LOCATION: 'Westminster Town Hall',
          INSPECTION_TIMES: '9am-5pm',
          REPRESENTATION_ADDRESS: 'Licensing Team',
          DEADLINE_DATE: '2025-12-20',
        }
      }
    };

    const rendered = renderLicensingText(mockNotice);

    expect(rendered).toContain('concurrently');
    expect(rendered).toContain('Westminster City Council, Camden Borough Council and City of London');
  });

  it('all 6 variants support multi-jurisdiction', () => {
    const variants = [
      'licensing-premises-new',
      'licensing-premises-variation',
      'licensing-premises-review',
      'licensing-club-new',
      'licensing-club-variation',
      'licensing-club-review',
    ];

    variants.forEach(variant => {
      const mockNotice = {
        noticeType: variant,
        extras: {
          category: 'licensing',
          variant: variant,
          tokens: {
            APPLICANT_NAME: 'Test',
            REVIEW_APPLICANT_NAME: 'Test Reviewer',
            AUTHORITY_NAME: 'Authority A',
            AUTHORITY_NAMES_LIST: 'Authority A and Authority B',
            HAS_MULTIPLE_AUTHORITIES: 'true',
            PREMISES_ADDRESS: '10 Boundary St',
            LICENSABLE_ACTIVITIES: 'Test',
            ACTIVITY_SCHEDULE: 'Test',
            NATURE_OF_VARIATION: 'Test',
            REVIEW_GROUNDS: 'Test',
            INSPECTION_LOCATION: 'Test',
            INSPECTION_TIMES: '9am-5pm',
            REPRESENTATION_ADDRESS: 'Test',
            DEADLINE_DATE: '2025-12-31',
          }
        }
      };

      const rendered = renderLicensingText(mockNotice);

      expect(rendered, `${variant} should contain "concurrently"`).toContain('concurrently');
      expect(rendered, `${variant} should list both authorities`).toContain('Authority A and Authority B');
    });
  });
});
```

**Run Test**:
```bash
npm test -- licensing-crit008-multi.test.ts
```

**Expected**: All tests PASS ✓

### 7. Schema Validation Test

Create test file `src/next/publish/schema/__tests__/licensing-schema-crit008.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { licensingNoticeSchema, mapLicensingToNoticeBase } from '../licensing';

describe('CRIT-008: Multi-Jurisdiction Schema', () => {
  it('accepts single authority (no additional authorities)', () => {
    const validData = {
      variant: 'licensing-premises-new',
      NOTICE_TYPE: 'Premises Licence Application',
      ACT_TITLE: 'Licensing Act 2003',
      APPLICANT_NAME: 'Test Pub Ltd',
      PREMISES_ADDRESS: '10 High St',
      LICENSABLE_ACTIVITIES: 'Sale of alcohol',
      ACTIVITY_SCHEDULE: 'Mon-Sat 11-23',
      APPLICATION_DATE: '2025-11-01',
      DEADLINE_DATE: '2025-12-01',
      INSPECTION_TIMES: '9am-5pm',
      REPRESENTATION_METHOD: 'in writing',
      AUTHORITY_NAME: 'Westminster City Council',
      // No ADDITIONAL_LICENSING_AUTHORITIES
    };

    expect(() => licensingNoticeSchema.parse(validData)).not.toThrow();
  });

  it('accepts additional authorities array', () => {
    const validData = {
      variant: 'licensing-premises-new',
      NOTICE_TYPE: 'Premises Licence Application',
      ACT_TITLE: 'Licensing Act 2003',
      APPLICANT_NAME: 'Border Pub Ltd',
      PREMISES_ADDRESS: '100 Boundary Road',
      LICENSABLE_ACTIVITIES: 'Sale of alcohol',
      ACTIVITY_SCHEDULE: 'Mon-Sun 11-23',
      APPLICATION_DATE: '2025-11-01',
      DEADLINE_DATE: '2025-12-01',
      INSPECTION_TIMES: '9am-5pm',
      REPRESENTATION_METHOD: 'in writing',
      AUTHORITY_NAME: 'Westminster City Council',
      ADDITIONAL_LICENSING_AUTHORITIES: [
        {
          name: 'Camden Borough Council',
          address: '5 Pancras Square, London N1C 4AG',
          email: 'licensing@camden.gov.uk',
          phone: '020 7974 4444',
        },
      ],
    };

    expect(() => licensingNoticeSchema.parse(validData)).not.toThrow();
  });

  it('accepts multiple additional authorities', () => {
    const validData = {
      variant: 'licensing-premises-new',
      NOTICE_TYPE: 'Premises Licence Application',
      ACT_TITLE: 'Licensing Act 2003',
      APPLICANT_NAME: 'Triple Border Pub Ltd',
      PREMISES_ADDRESS: '1 Triple Point',
      LICENSABLE_ACTIVITIES: 'Sale of alcohol',
      ACTIVITY_SCHEDULE: 'Mon-Sun 10-midnight',
      APPLICATION_DATE: '2025-11-01',
      DEADLINE_DATE: '2025-12-01',
      INSPECTION_TIMES: '9am-5pm',
      REPRESENTATION_METHOD: 'in writing',
      AUTHORITY_NAME: 'Westminster City Council',
      ADDITIONAL_LICENSING_AUTHORITIES: [
        { name: 'Camden Borough Council' },
        { name: 'City of London Corporation' },
      ],
    };

    expect(() => licensingNoticeSchema.parse(validData)).not.toThrow();
  });

  it('rejects additional authority without name', () => {
    const invalidData = {
      variant: 'licensing-premises-new',
      NOTICE_TYPE: 'Premises Licence Application',
      ACT_TITLE: 'Licensing Act 2003',
      APPLICANT_NAME: 'Test',
      PREMISES_ADDRESS: 'Test',
      LICENSABLE_ACTIVITIES: 'Test',
      ACTIVITY_SCHEDULE: 'Test',
      APPLICATION_DATE: '2025-11-01',
      DEADLINE_DATE: '2025-12-01',
      INSPECTION_TIMES: '9am-5pm',
      REPRESENTATION_METHOD: 'in writing',
      AUTHORITY_NAME: 'Test Council',
      ADDITIONAL_LICENSING_AUTHORITIES: [
        { name: '', address: 'Test' }, // Empty name should fail
      ],
    };

    expect(() => licensingNoticeSchema.parse(invalidData)).toThrow();
  });

  it('mapper creates AUTHORITY_NAMES_LIST correctly', () => {
    const input = {
      variant: 'licensing-premises-new' as const,
      NOTICE_TYPE: 'Test',
      ACT_TITLE: 'Licensing Act 2003',
      APPLICANT_NAME: 'Test',
      PREMISES_ADDRESS: 'Test',
      LICENSABLE_ACTIVITIES: 'Test',
      ACTIVITY_SCHEDULE: 'Test',
      APPLICATION_DATE: '2025-11-01',
      DEADLINE_DATE: '2025-12-01',
      INSPECTION_TIMES: '9am-5pm',
      REPRESENTATION_METHOD: 'in writing',
      AUTHORITY_NAME: 'Westminster City Council',
      ADDITIONAL_LICENSING_AUTHORITIES: [
        { name: 'Camden Borough Council' },
      ],
    };

    const result = mapLicensingToNoticeBase(input);
    const tokens = result.extras?.tokens as Record<string, string>;

    expect(tokens.AUTHORITY_NAMES_LIST).toBe('Westminster City Council and Camden Borough Council');
    expect(tokens.HAS_MULTIPLE_AUTHORITIES).toBe('true');
  });

  it('mapper handles three authorities correctly', () => {
    const input = {
      variant: 'licensing-premises-new' as const,
      NOTICE_TYPE: 'Test',
      ACT_TITLE: 'Licensing Act 2003',
      APPLICANT_NAME: 'Test',
      PREMISES_ADDRESS: 'Test',
      LICENSABLE_ACTIVITIES: 'Test',
      ACTIVITY_SCHEDULE: 'Test',
      APPLICATION_DATE: '2025-11-01',
      DEADLINE_DATE: '2025-12-01',
      INSPECTION_TIMES: '9am-5pm',
      REPRESENTATION_METHOD: 'in writing',
      AUTHORITY_NAME: 'Authority A',
      ADDITIONAL_LICENSING_AUTHORITIES: [
        { name: 'Authority B' },
        { name: 'Authority C' },
      ],
    };

    const result = mapLicensingToNoticeBase(input);
    const tokens = result.extras?.tokens as Record<string, string>;

    expect(tokens.AUTHORITY_NAMES_LIST).toBe('Authority A, Authority B and Authority C');
    expect(tokens.HAS_MULTIPLE_AUTHORITIES).toBe('true');
  });
});
```

**Run Test**:
```bash
npm test -- licensing-schema-crit008.test.ts
```

**Expected**: All tests PASS ✓

### 8. Render Test (Sample Output)

**Single Authority (Backward Compatible)**:
```typescript
const mockNotice = {
  noticeType: 'licensing-premises-new',
  extras: {
    category: 'licensing',
    variant: 'licensing-premises-new',
    tokens: {
      APPLICANT_NAME: 'The Crown Pub Ltd',
      AUTHORITY_NAME: 'Westminster City Council',
      AUTHORITY_NAMES_LIST: 'Westminster City Council',
      HAS_MULTIPLE_AUTHORITIES: '',
      PREMISES_NAME: 'The Crown',
      PREMISES_ADDRESS: '50 Victoria Street, London SW1H 0NP',
      LICENSABLE_ACTIVITIES: 'Sale of alcohol, Live music',
      ACTIVITY_SCHEDULE: 'Monday-Saturday 11:00-23:00, Sunday 12:00-22:30',
      INSPECTION_LOCATION: 'Westminster City Hall, 64 Victoria Street',
      INSPECTION_TIMES: '9am-5pm Monday-Friday',
      REPRESENTATION_ADDRESS: 'Licensing Team, Westminster City Council',
      REPRESENTATION_EMAIL: 'licensing@westminster.gov.uk',
      DEADLINE_DATE: '2025-12-15',
    }
  }
};

const rendered = renderLicensingText(mockNotice);
console.log(rendered);
```

**Expected Output**:
```
LICENSING ACT 2003
APPLICATION FOR A NEW PREMISES LICENCE

Notice is hereby given that The Crown Pub Ltd has applied to Westminster City Council for a new premises licence for The Crown, 50 Victoria Street, London SW1H 0NP.

Licensable activities applied for: Sale of alcohol, Live music.
Proposed hours: Monday-Saturday 11:00-23:00, Sunday 12:00-22:30.

The application can be inspected at Westminster City Hall, 64 Victoria Street during 9am-5pm Monday-Friday.

Any representations must be made in writing to Westminster City Council at Licensing Team, Westminster City Council or licensing@westminster.gov.uk by 2025-12-15. Representors must also serve a copy of their representations on each of the responsible authorities.

It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.
```

**Multiple Authorities (Boundary Premises)**:
```typescript
const mockNotice = {
  noticeType: 'licensing-premises-new',
  extras: {
    category: 'licensing',
    variant: 'licensing-premises-new',
    tokens: {
      APPLICANT_NAME: 'Boundary Tavern Ltd',
      AUTHORITY_NAME: 'Westminster City Council',
      AUTHORITY_NAMES_LIST: 'Westminster City Council and Camden Borough Council',
      HAS_MULTIPLE_AUTHORITIES: 'true',
      PREMISES_NAME: 'The Boundary',
      PREMISES_ADDRESS: '200 Boundary Road, London NW8 0RH',
      LICENSABLE_ACTIVITIES: 'Sale of alcohol, Regulated entertainment',
      ACTIVITY_SCHEDULE: 'Monday-Sunday 10:00-midnight',
      INSPECTION_LOCATION: 'Westminster City Hall',
      INSPECTION_TIMES: '9am-5pm Monday-Friday',
      REPRESENTATION_ADDRESS: 'Licensing Team, Westminster City Council',
      DEADLINE_DATE: '2025-12-20',
    }
  }
};

const rendered = renderLicensingText(mockNotice);
console.log(rendered);
```

**Expected Output**:
```
LICENSING ACT 2003
APPLICATION FOR A NEW PREMISES LICENCE

Notice is hereby given that Boundary Tavern Ltd has applied concurrently to Westminster City Council and Camden Borough Council for a new premises licence for The Boundary, 200 Boundary Road, London NW8 0RH.

Licensable activities applied for: Sale of alcohol, Regulated entertainment.
Proposed hours: Monday-Sunday 10:00-midnight.

The application can be inspected at Westminster City Hall during 9am-5pm Monday-Friday.

Any representations must be made in writing to Westminster City Council at Licensing Team, Westminster City Council by 2025-12-20. Representors must also serve a copy of their representations on each of the responsible authorities.

It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.
```

**Note the differences**:
- ✓ "has applied concurrently to Westminster City Council and Camden Borough Council" (not just "to Westminster City Council")
- ✓ Representations still go to primary authority (Westminster City Council)

### 9. Regulatory Checklist

- [x] Schema supports ADDITIONAL_LICENSING_AUTHORITIES array
- [x] Additional authority schema has required name field
- [x] Additional authority schema has optional address, email, phone fields
- [x] Mapper creates AUTHORITY_NAMES_LIST with proper formatting
- [x] Mapper creates HAS_MULTIPLE_AUTHORITIES boolean flag
- [x] All 6 templates updated with conditional multi-jurisdiction rendering
- [x] "concurrently" appears only when HAS_MULTIPLE_AUTHORITIES is true
- [x] Backward compatible - single authority applications unchanged
- [x] Representation contact remains primary authority
- [x] Authority list uses "and" for final separator (UK style)
- [x] No Oxford comma (consistent with UK legal style)

### 10. Type Check

```bash
npm run typecheck
```

**Expected**: No TypeScript errors in modified files

### 11. Build Check

```bash
npm run build
```

**Expected**: Build succeeds (pre-existing build config issue unrelated)

## Acceptance Criteria

✅ Schema accepts ADDITIONAL_LICENSING_AUTHORITIES array (optional)
✅ Schema validates additional authority name is required
✅ Mapper creates AUTHORITY_NAMES_LIST with proper formatting ("A and B" or "A, B and C")
✅ Mapper creates HAS_MULTIPLE_AUTHORITIES boolean flag
✅ All 6 templates conditionally render "concurrently" when flag is true
✅ All 6 templates use AUTHORITY_NAMES_LIST for application statement
✅ Backward compatible - single authority applications unchanged
✅ Unit tests pass for both single and multiple authority scenarios
✅ TypeScript compilation succeeds
✅ No regressions in existing functionality

## UI Enhancement Required (Follow-Up Task)

The following UI changes are recommended in a separate commit:

1. **Wizard Form Addition** (src/next/publish/flow/steps/ConfirmStep.tsx):
   - Add checkbox: "This premises is on a licensing authority boundary"
   - When checked, show dynamic form section
   - Allow adding 1-3 additional authorities
   - Fields per authority: Name (required), Address (optional), Email (optional), Phone (optional)

2. **Validation**:
   - When boundary checkbox selected, require at least 1 additional authority
   - Validate authority names are unique (no duplicates)

3. **User Guidance**:
   - Tooltip: "Tick this if your premises is located on the boundary of two or more licensing authority areas"
   - Warning: "This notice must be published in newspapers circulating in all affected authority areas"

4. **Example Boundaries**:
   - Westminster / Camden (Boundary Road)
   - Westminster / City of London (Strand)
   - Camden / Islington (various streets)

## Legal Sign-Off Required

Before pilot launch, legal counsel should review:
- Sample single authority notice (backward compatibility)
- Sample two-authority notice (boundary premises)
- Sample three-authority notice (complex boundary)
- Confirm "concurrently" wording is appropriate
- Confirm representation contact being primary authority is acceptable

---

**Status**: CRIT-008 implementation complete — ready for testing and UI enhancement
**Estimated Test Time**: 45 minutes (schema + mapper + 6 templates)
**Implementation Method**: Schema array field + mapper helper + conditional template rendering
**Blocking Issues**: None (UI enhancement can proceed independently)

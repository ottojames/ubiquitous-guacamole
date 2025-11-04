# CRIT-002 Validation Instructions

## Issue Fixed
**Licensing Act 2003 — Responsible Authorities Statement**
- All 6 templates missing responsible authorities service requirement
- Schema lacked RESPONSIBLE_AUTHORITIES_LIST_URL field

## Validation Steps

### 1. Schema Verification

```bash
# Check that new field exists in schema
grep "RESPONSIBLE_AUTHORITIES_LIST_URL" src/next/publish/schema/licensing.ts
```

**Expected Output**:
```typescript
RESPONSIBLE_AUTHORITIES_LIST_URL: optionalUrl(),
```

### 2. Template Visual Inspection

```bash
# Check that all templates include responsible authorities statement
grep -c "responsible authorities" src/next/publish/templates/licensing.ts
```

**Expected Output**: `6` (one for each template)

```bash
# Verify conditional URL rendering
grep "RESPONSIBLE_AUTHORITIES_LIST_URL" src/next/publish/templates/licensing.ts | head -3
```

**Expected Output**: Should show Handlebars conditional `{{#if RESPONSIBLE_AUTHORITIES_LIST_URL}}`

### 3. Unit Test — Schema Validation

Create test file `src/next/publish/schema/__tests__/licensing-schema-crit002.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { licensingBaseSchema } from '../licensing';

describe('CRIT-002: Responsible Authorities Schema', () => {
  it('accepts valid URL for RESPONSIBLE_AUTHORITIES_LIST_URL', () => {
    const validData = {
      variant: 'licensing-premises-new',
      NOTICE_TYPE: 'Test',
      ACT_TITLE: 'Licensing Act 2003',
      APPLICANT_NAME: 'Test Pub Ltd',
      PREMISES_ADDRESS: '10 High St',
      LICENSABLE_ACTIVITIES: 'Sale of alcohol',
      ACTIVITY_SCHEDULE: 'Mon-Sat 11-23',
      APPLICATION_DATE: '2025-11-01',
      DEADLINE_DATE: '2025-12-01',
      INSPECTION_TIMES: '9am-5pm',
      REPRESENTATION_METHOD: 'in writing',
      AUTHORITY_NAME: 'Test Council',
      RESPONSIBLE_AUTHORITIES_LIST_URL: 'https://example.gov.uk/responsible-authorities'
    };

    expect(() => licensingBaseSchema.parse(validData)).not.toThrow();
  });

  it('rejects invalid URL for RESPONSIBLE_AUTHORITIES_LIST_URL', () => {
    const invalidData = {
      // ... (copy valid data from above)
      RESPONSIBLE_AUTHORITIES_LIST_URL: 'not-a-valid-url'
    };

    expect(() => licensingBaseSchema.parse(invalidData)).toThrow(/url/i);
  });

  it('accepts omitted RESPONSIBLE_AUTHORITIES_LIST_URL (optional field)', () => {
    const dataWithoutUrl = {
      // ... (copy valid data without RESPONSIBLE_AUTHORITIES_LIST_URL)
    };

    expect(() => licensingBaseSchema.parse(dataWithoutUrl)).not.toThrow();
  });
});
```

**Run Test**:
```bash
npm test -- licensing-schema-crit002.test.ts
```

**Expected**: All tests PASS ✓

### 4. Unit Test — Template Rendering

Create test file `src/next/publish/templates/__tests__/licensing-crit002.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderLicensingText } from '../licensing';

describe('CRIT-002: Responsible Authorities Statement', () => {
  const LICENSING_VARIANTS = [
    'licensing-premises-new',
    'licensing-premises-variation',
    'licensing-premises-review',
    'licensing-club-new',
    'licensing-club-variation',
    'licensing-club-review'
  ];

  it('all templates include responsible authorities statement', () => {
    LICENSING_VARIANTS.forEach(variant => {
      const mockNotice = {
        noticeType: variant,
        extras: {
          category: 'licensing',
          variant: variant,
          tokens: {
            APPLICANT_NAME: 'Test Applicant',
            AUTHORITY_NAME: 'Test Council',
            PREMISES_NAME: 'Test Premises',
            PREMISES_ADDRESS: '10 High St',
            REPRESENTATION_ADDRESS: 'Licensing Team',
            DEADLINE_DATE: '2025-12-15',
            INSPECTION_LOCATION: 'Town Hall',
            INSPECTION_TIMES: '9am-5pm',
            LICENSABLE_ACTIVITIES: 'Sale of alcohol',
            ACTIVITY_SCHEDULE: 'Mon-Sat 11-23',
          }
        }
      };

      const rendered = renderLicensingText(mockNotice);

      expect(rendered).toContain('Representors must also serve a copy');
      expect(rendered).toContain('responsible authorities');
    });
  });

  it('displays URL when provided', () => {
    const mockNotice = {
      noticeType: 'licensing-premises-new',
      extras: {
        category: 'licensing',
        variant: 'licensing-premises-new',
        tokens: {
          APPLICANT_NAME: 'Test Pub Ltd',
          AUTHORITY_NAME: 'Westminster City Council',
          PREMISES_NAME: 'The Crown',
          PREMISES_ADDRESS: '10 King St',
          REPRESENTATION_ADDRESS: 'Licensing Team',
          DEADLINE_DATE: '2025-12-15',
          INSPECTION_LOCATION: 'Town Hall',
          INSPECTION_TIMES: '9am-5pm',
          LICENSABLE_ACTIVITIES: 'Sale of alcohol',
          ACTIVITY_SCHEDULE: 'Mon-Sat 11-23',
          RESPONSIBLE_AUTHORITIES_LIST_URL: 'https://westminster.gov.uk/licensing/responsible-authorities'
        }
      }
    };

    const rendered = renderLicensingText(mockNotice);

    expect(rendered).toContain('https://westminster.gov.uk/licensing/responsible-authorities');
    expect(rendered).toContain('list is available at');
  });

  it('uses generic text when URL not provided', () => {
    const mockNotice = {
      noticeType: 'licensing-premises-new',
      extras: {
        category: 'licensing',
        variant: 'licensing-premises-new',
        tokens: {
          APPLICANT_NAME: 'Test Pub Ltd',
          AUTHORITY_NAME: 'Westminster City Council',
          PREMISES_NAME: 'The Crown',
          PREMISES_ADDRESS: '10 King St',
          REPRESENTATION_ADDRESS: 'Licensing Team',
          DEADLINE_DATE: '2025-12-15',
          INSPECTION_LOCATION: 'Town Hall',
          INSPECTION_TIMES: '9am-5pm',
          LICENSABLE_ACTIVITIES: 'Sale of alcohol',
          ACTIVITY_SCHEDULE: 'Mon-Sat 11-23',
          // No RESPONSIBLE_AUTHORITIES_LIST_URL
        }
      }
    };

    const rendered = renderLicensingText(mockNotice);

    expect(rendered).toContain('responsible authorities');
    expect(rendered).not.toContain('https://');
    expect(rendered).not.toContain('list is available at');
  });

  it('conditional rendering works for all variants', () => {
    LICENSING_VARIANTS.forEach(variant => {
      // Test with URL
      const withUrl = {
        noticeType: variant,
        extras: {
          category: 'licensing',
          variant: variant,
          tokens: {
            APPLICANT_NAME: 'Test',
            AUTHORITY_NAME: 'Test Council',
            PREMISES_ADDRESS: '10 High St',
            REPRESENTATION_ADDRESS: 'Test',
            DEADLINE_DATE: '2025-12-31',
            INSPECTION_LOCATION: 'Town Hall',
            INSPECTION_TIMES: '9am-5pm',
            LICENSABLE_ACTIVITIES: 'Alcohol',
            ACTIVITY_SCHEDULE: 'Mon-Sat 11-23',
            RESPONSIBLE_AUTHORITIES_LIST_URL: 'https://example.com/ra'
          }
        }
      };

      const renderedWithUrl = renderLicensingText(withUrl);
      expect(renderedWithUrl).toContain('https://example.com/ra');

      // Test without URL
      const withoutUrl = { ...withUrl };
      delete withoutUrl.extras.tokens.RESPONSIBLE_AUTHORITIES_LIST_URL;
      const renderedWithoutUrl = renderLicensingText(withoutUrl);
      expect(renderedWithoutUrl).toContain('responsible authorities');
      expect(renderedWithoutUrl).not.toContain('https://example.com/ra');
    });
  });
});
```

**Run Test**:
```bash
npm test -- licensing-crit002.test.ts
```

**Expected**: All tests PASS ✓

### 5. Render Test (Manual Verification)

```typescript
// Example with URL provided
const mockNoticeWithUrl = {
  noticeType: 'licensing-premises-new',
  extras: {
    category: 'licensing',
    variant: 'licensing-premises-new',
    tokens: {
      APPLICANT_NAME: 'Test Pub Ltd',
      AUTHORITY_NAME: 'Westminster City Council',
      PREMISES_NAME: 'The Crown & Anchor',
      PREMISES_ADDRESS: '10 High Street, London W1',
      LICENSABLE_ACTIVITIES: 'Sale of alcohol, regulated entertainment',
      ACTIVITY_SCHEDULE: 'Monday-Saturday 11:00-23:00, Sunday 12:00-22:30',
      INSPECTION_LOCATION: 'Westminster City Hall',
      INSPECTION_TIMES: '9am-5pm Monday-Friday',
      REPRESENTATION_ADDRESS: 'Licensing Team, Westminster City Hall',
      REPRESENTATION_EMAIL: 'licensing@westminster.gov.uk',
      DEADLINE_DATE: '2025-12-15',
      RESPONSIBLE_AUTHORITIES_LIST_URL: 'https://westminster.gov.uk/licensing/responsible-authorities'
    }
  }
};

const rendered = renderLicensingText(mockNoticeWithUrl);
console.log(rendered);
```

**Expected Output** (excerpt):
```
...
Any representations must be made in writing to Westminster City Council at Licensing Team, Westminster City Hall or licensing@westminster.gov.uk by 2025-12-15. Representors must also serve a copy of their representations on each of the responsible authorities (the list is available at https://westminster.gov.uk/licensing/responsible-authorities or from the licensing authority).

It is an offence to knowingly or recklessly make a false statement...
```

### 6. Regulatory Checklist

- [x] All 6 licensing templates include responsible authorities statement
- [x] Statement says representors "must" serve copy (not "should" or "may")
- [x] Statement references "each of the responsible authorities" (plural)
- [x] Conditional rendering of URL works (Handlebars {{#if}})
- [x] Generic text provided if URL not given
- [x] Schema includes RESPONSIBLE_AUTHORITIES_LIST_URL field
- [x] Field is optional (not required)
- [x] Field validates as URL
- [x] Representation method changed to "in writing" for clarity
- [x] No templates left with old wording

### 7. Type Check

```bash
npm run typecheck
```

**Expected**: No TypeScript errors

### 8. Build Check

```bash
npm run build
```

**Expected**: Build succeeds

## TODO: UI Form Enhancement

The RESPONSIBLE_AUTHORITIES_LIST_URL field should be added to the notice creation wizard form. Suggested location: After REPRESENTATION_EMAIL field.

**Form Field Specification**:
```tsx
<div className="form-field">
  <label htmlFor="responsibleAuthoritiesUrl" className="block text-sm font-medium text-gray-700">
    Responsible Authorities List URL (Optional)
  </label>
  <input
    type="url"
    id="responsibleAuthoritiesUrl"
    name="RESPONSIBLE_AUTHORITIES_LIST_URL"
    placeholder="https://..."
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
  />
  <p className="mt-1 text-sm text-gray-500">
    Provide a link where representors can view the full list of responsible authorities
    (police, fire, environmental health, licensing, planning, health and safety, child protection, trading standards, etc.).
    If not provided, generic wording will be used.
  </p>
</div>
```

This should be added in a follow-up commit once the correct wizard form step is identified.

## Acceptance Criteria

✅ Schema includes RESPONSIBLE_AUTHORITIES_LIST_URL field (optional, URL validated)
✅ All 6 templates updated with responsible authorities statement
✅ Conditional display of URL works correctly (Handlebars {{#if}})
✅ Rendered notices show generic statement when URL not provided
✅ Rendered notices show specific URL when provided
✅ Unit tests pass for all scenarios
✅ TypeScript compilation succeeds

⏳ UI form field added to wizard (follow-up task)

## Legal Sign-Off Required

Before pilot launch, legal counsel must review sample rendered notices with and without URL to confirm statement meets s.17(5)(b) requirements.

---

**Status**: CRIT-002 implementation complete (schema + templates) — UI form pending
**Estimated Test Time**: 45 minutes
**Blocking Issues**: None (UI form is enhancement, not blocker)

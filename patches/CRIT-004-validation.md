# CRIT-004 Validation Instructions

## Issue Fixed
**Gambling Act 2005 — Missing Licensing Objectives**
- All 16 gambling templates missing statement about licensing objectives
- No guidance to representors on valid grounds for representations

## Validation Steps

### 1. Automated Count Verification

```bash
# Count licensing objectives statements (should be exactly 16)
grep -c "Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005" src/next/publish/templates/gambling.ts
```

**Expected Output**: `16`

### 2. Verify Statement Wording Consistency

```bash
# Show all 16 instances to verify identical wording
grep -n "Any representations must relate to one or more of the licensing objectives" src/next/publish/templates/gambling.ts
```

**Expected Output**: 16 lines showing statement at appropriate location in each template

### 3. Visual Inspection of Template Structure

```bash
# Examine first "new" template (betting-new)
sed -n '11,18p' src/next/publish/templates/gambling.ts

# Examine first "variation" template (betting-variation)
sed -n '20,27p' src/next/publish/templates/gambling.ts

# Examine first "review" template (betting-review)
sed -n '29,36p' src/next/publish/templates/gambling.ts

# Examine first "transfer" template (betting-transfer)
sed -n '38,45p' src/next/publish/templates/gambling.ts
```

**Expected**: Licensing objectives statement appears between premises/application description and inspection/representation details in all cases.

### 4. Unit Test — All Variants Include Statement

Create test file `src/next/publish/templates/__tests__/gambling-crit004.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderGamblingText } from '../gambling';

describe('CRIT-004: Gambling Licensing Objectives', () => {
  const GAMBLING_VARIANTS = [
    'gambling-betting-new',
    'gambling-betting-variation',
    'gambling-betting-review',
    'gambling-betting-transfer',
    'gambling-bingo-new',
    'gambling-bingo-variation',
    'gambling-bingo-review',
    'gambling-bingo-transfer',
    'gambling-agc-new',
    'gambling-agc-variation',
    'gambling-agc-review',
    'gambling-agc-transfer',
    'gambling-fec-new',
    'gambling-fec-variation',
    'gambling-fec-review',
    'gambling-fec-transfer',
  ];

  const OBJECTIVES_STATEMENT =
    'Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: ' +
    '(a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; ' +
    '(b) ensuring that gambling is conducted in a fair and open way; ' +
    '(c) protecting children and other vulnerable persons from being harmed or exploited by gambling.';

  it('all 16 gambling templates include licensing objectives statement', () => {
    GAMBLING_VARIANTS.forEach(variant => {
      const mockNotice = {
        noticeType: variant,
        extras: {
          category: 'gambling',
          variant: variant,
          tokens: {
            APPLICANT_NAME: 'Test Operator Ltd',
            AUTHORITY_NAME: 'Test Borough Council',
            PREMISES_NAME: 'Test Gaming Centre',
            PREMISES_ADDRESS: '50 High Street, Test Town',
            OPENING_HOURS: 'Mon-Sat 08:00-22:00',
            INSPECTION_LOCATION: 'Council Offices',
            INSPECTION_TIMES: '9am-5pm Mon-Fri',
            REPRESENTATION_METHOD: 'in writing',
            REPRESENTATION_ADDRESS: 'Licensing Team',
            DEADLINE_DATE: '2025-12-31',
            NATURE_OF_VARIATION: 'Extended hours',
            REVIEW_APPLICANT_NAME: 'Resident Association',
            REVIEW_GROUNDS: 'Noise complaints',
            TRANSFER_FROM_NAME: 'Old Operator Ltd',
            TRANSFER_TO_NAME: 'New Operator Ltd',
          }
        }
      };

      const rendered = renderGamblingText(mockNotice);

      expect(
        rendered,
        `${variant} should contain full objectives statement`
      ).toContain(OBJECTIVES_STATEMENT);
    });
  });

  it('licensing objectives mention all three objectives', () => {
    GAMBLING_VARIANTS.forEach(variant => {
      const mockNotice = {
        noticeType: variant,
        extras: {
          category: 'gambling',
          variant: variant,
          tokens: {
            APPLICANT_NAME: 'Test',
            AUTHORITY_NAME: 'Test Council',
            PREMISES_NAME: 'Test',
            PREMISES_ADDRESS: '10 High St',
            INSPECTION_LOCATION: 'Town Hall',
            INSPECTION_TIMES: '9am-5pm',
            REPRESENTATION_METHOD: 'in writing',
            REPRESENTATION_ADDRESS: 'Test',
            DEADLINE_DATE: '2025-12-31',
          }
        }
      };

      const rendered = renderGamblingText(mockNotice);

      // Check all three objectives are present
      expect(rendered).toContain('preventing gambling from being a source of crime or disorder');
      expect(rendered).toContain('ensuring that gambling is conducted in a fair and open way');
      expect(rendered).toContain('protecting children and other vulnerable persons from being harmed or exploited by gambling');
    });
  });

  it('objectives statement appears before inspection details', () => {
    const mockNotice = {
      noticeType: 'gambling-betting-new',
      extras: {
        category: 'gambling',
        variant: 'gambling-betting-new',
        tokens: {
          APPLICANT_NAME: 'Test Operator',
          AUTHORITY_NAME: 'Test Council',
          PREMISES_NAME: 'Test Premises',
          PREMISES_ADDRESS: '100 High St',
          OPENING_HOURS: 'Mon-Sat 10-22',
          INSPECTION_LOCATION: 'Town Hall',
          INSPECTION_TIMES: '9am-5pm',
          REPRESENTATION_METHOD: 'in writing',
          REPRESENTATION_ADDRESS: 'Licensing Team',
          DEADLINE_DATE: '2025-12-31',
        }
      }
    };

    const rendered = renderGamblingText(mockNotice);

    const objectivesIndex = rendered.indexOf('licensing objectives under the Gambling Act 2005');
    const inspectionIndex = rendered.indexOf('The application can be inspected');

    expect(objectivesIndex).toBeGreaterThan(0);
    expect(inspectionIndex).toBeGreaterThan(objectivesIndex);
  });

  it('objectives statement appears after premises description', () => {
    const mockNotice = {
      noticeType: 'gambling-betting-new',
      extras: {
        category: 'gambling',
        variant: 'gambling-betting-new',
        tokens: {
          APPLICANT_NAME: 'Test Operator',
          AUTHORITY_NAME: 'Test Council',
          PREMISES_NAME: 'Test Premises',
          PREMISES_ADDRESS: '100 High St',
          OPENING_HOURS: 'Mon-Sat 10-22',
          INSPECTION_LOCATION: 'Town Hall',
          INSPECTION_TIMES: '9am-5pm',
          REPRESENTATION_METHOD: 'in writing',
          REPRESENTATION_ADDRESS: 'Licensing Team',
          DEADLINE_DATE: '2025-12-31',
        }
      }
    };

    const rendered = renderGamblingText(mockNotice);

    const premisesIndex = rendered.indexOf('has applied to Test Council for a betting premises licence');
    const objectivesIndex = rendered.indexOf('licensing objectives under the Gambling Act 2005');

    expect(premisesIndex).toBeGreaterThan(0);
    expect(objectivesIndex).toBeGreaterThan(premisesIndex);
  });

  it('all three objectives cited in correct order: (a) crime, (b) fair, (c) protection', () => {
    const mockNotice = {
      noticeType: 'gambling-agc-new',
      extras: {
        category: 'gambling',
        variant: 'gambling-agc-new',
        tokens: {
          APPLICANT_NAME: 'Test',
          AUTHORITY_NAME: 'Test',
          PREMISES_NAME: 'Test',
          PREMISES_ADDRESS: 'Test',
          INSPECTION_LOCATION: 'Test',
          INSPECTION_TIMES: '9am-5pm',
          REPRESENTATION_METHOD: 'in writing',
          REPRESENTATION_ADDRESS: 'Test',
          DEADLINE_DATE: '2025-12-31',
        }
      }
    };

    const rendered = renderGamblingText(mockNotice);

    const objectivesMatch = rendered.match(/\(a\).*?\(b\).*?\(c\)/s);
    expect(objectivesMatch).toBeTruthy();

    const fullText = objectivesMatch![0];
    expect(fullText).toContain('(a) preventing gambling from being a source of crime');
    expect(fullText).toContain('(b) ensuring that gambling is conducted in a fair and open way');
    expect(fullText).toContain('(c) protecting children and other vulnerable persons');
  });
});
```

**Run Test**:
```bash
npm test -- gambling-crit004.test.ts
```

**Expected**: All tests PASS ✓

### 5. Render Test (Sample Output)

```typescript
const mockNotice = {
  noticeType: 'gambling-betting-new',
  extras: {
    category: 'gambling',
    variant: 'gambling-betting-new',
    tokens: {
      APPLICANT_NAME: 'Coral Retail Ltd',
      AUTHORITY_NAME: 'Camden Borough Council',
      PREMISES_NAME: 'Coral Betting Shop',
      PREMISES_ADDRESS: '150 Camden High Street, London NW1 0NE',
      OPENING_HOURS: 'Monday-Saturday 08:00-22:00, Sunday 10:00-22:00',
      INSPECTION_LOCATION: 'Camden Town Hall, Judd Street',
      INSPECTION_TIMES: '9:00am-5:00pm Monday-Friday',
      REPRESENTATION_METHOD: 'in writing',
      REPRESENTATION_ADDRESS: 'Licensing Team, Camden Borough Council',
      REPRESENTATION_EMAIL: 'licensing@camden.gov.uk',
      DEADLINE_DATE: '2025-12-20',
    }
  }
};

const rendered = renderGamblingText(mockNotice);
console.log(rendered);
```

**Expected Output** (excerpt):
```
GAMBLING ACT 2005, SCHEDULE 9
APPLICATION FOR A NEW BETTING PREMISES LICENCE

Coral Retail Ltd has applied to Camden Borough Council for a betting premises licence at Coral Betting Shop, 150 Camden High Street, London NW1 0NE. Proposed hours: Monday-Saturday 08:00-22:00, Sunday 10:00-22:00.

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

The application can be inspected at Camden Town Hall, Judd Street during 9:00am-5:00pm Monday-Friday. Any representations must be made in writing to Camden Borough Council at Licensing Team, Camden Borough Council or licensing@camden.gov.uk by 2025-12-20.
```

### 6. Diff Verification

```bash
# View the diff
git diff HEAD src/next/publish/templates/gambling.ts | grep -A 2 "licensing objectives"
```

**Expected Output**: Should show 16 additions of the licensing objectives statement

### 7. Regulatory Checklist

- [x] All 16 gambling templates include licensing objectives statement
- [x] Statement cites all three objectives from Gambling Act 2005 s.1
- [x] Objectives listed in correct order: (a) crime prevention, (b) fair gambling, (c) protection
- [x] Wording identical across all variants
- [x] Statement positioned logically (after premises description, before inspection details)
- [x] Statement applies to all 4 premises types: betting, bingo, AGC, FEC
- [x] Statement applies to all 4 application types: new, variation, review, transfer
- [x] No templates left without objectives statement

### 8. Type Check

```bash
npm run typecheck
```

**Expected**: No TypeScript errors

### 9. Build Check

```bash
npm run build
```

**Expected**: Build succeeds

## Acceptance Criteria

✅ All 16 gambling templates cite three licensing objectives
✅ Statement wording is identical across all templates
✅ Objectives appear in statutory order (a, b, c)
✅ Statement logically placed between application details and inspection information
✅ Unit tests pass for all 16 variants
✅ TypeScript compilation succeeds
✅ No unintended side effects

## Legal Sign-Off Required

Before pilot launch, legal counsel must confirm licensing objectives statement is accurate and satisfies Gambling Commission guidance on consultation.

---

**Status**: CRIT-004 implementation complete — ready for testing and legal review
**Estimated Test Time**: 30 minutes
**Implementation Method**: Manual insertion into all 16 templates with consistent wording
**Blocking Issues**: None

# CRIT-003 Validation Instructions

## Issue Fixed
**Gambling Act 2005 — Schedule 9 Reference**
- All 16 gambling templates missing Schedule 9 citation in header

## Validation Steps

### 1. Automated Count Verification

```bash
# Count Schedule 9 references (should be exactly 16)
grep -c "GAMBLING ACT 2005, SCHEDULE 9" src/next/publish/templates/gambling.ts
```

**Expected Output**: `16`

### 2. Verify No Old Wording Remains

```bash
# Check for templates with old wording (should be 0)
grep -c "^GAMBLING ACT 2005$" src/next/publish/templates/gambling.ts
```

**Expected Output**: `0`

```bash
# Alternative: Check that Schedule 9 always follows Gambling Act
grep "GAMBLING ACT 2005" src/next/publish/templates/gambling.ts | grep -c "SCHEDULE 9"
```

**Expected Output**: `16`

### 3. Visual Inspection of All Templates

```bash
# Show all 16 template headers
grep -n "GAMBLING ACT 2005, SCHEDULE 9" src/next/publish/templates/gambling.ts
```

**Expected Output** (line numbers may vary):
```
11:  "gambling-betting-new": `GAMBLING ACT 2005, SCHEDULE 9
18:  "gambling-betting-variation": `GAMBLING ACT 2005, SCHEDULE 9
25:  "gambling-betting-review": `GAMBLING ACT 2005, SCHEDULE 9
32:  "gambling-betting-transfer": `GAMBLING ACT 2005, SCHEDULE 9
39:  "gambling-bingo-new": `GAMBLING ACT 2005, SCHEDULE 9
46:  "gambling-bingo-variation": `GAMBLING ACT 2005, SCHEDULE 9
53:  "gambling-bingo-review": `GAMBLING ACT 2005, SCHEDULE 9
60:  "gambling-bingo-transfer": `GAMBLING ACT 2005, SCHEDULE 9
67:  "gambling-agc-new": `GAMBLING ACT 2005, SCHEDULE 9
74:  "gambling-agc-variation": `GAMBLING ACT 2005, SCHEDULE 9
81:  "gambling-agc-review": `GAMBLING ACT 2005, SCHEDULE 9
88:  "gambling-agc-transfer": `GAMBLING ACT 2005, SCHEDULE 9
95:  "gambling-fec-new": `GAMBLING ACT 2005, SCHEDULE 9
102:  "gambling-fec-variation": `GAMBLING ACT 2005, SCHEDULE 9
109:  "gambling-fec-review": `GAMBLING ACT 2005, SCHEDULE 9
116:  "gambling-fec-transfer": `GAMBLING ACT 2005, SCHEDULE 9
```

### 4. Unit Test

Create test file `src/next/publish/templates/__tests__/gambling-crit003.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderGamblingText } from '../gambling';

describe('CRIT-003: Gambling Schedule 9 Reference', () => {
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

  it('all 16 gambling templates cite Schedule 9', () => {
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
            INSPECTION_LOCATION: 'Council Offices',
            INSPECTION_TIMES: '9am-5pm Mon-Fri',
            REPRESENTATION_METHOD: 'in writing',
            REPRESENTATION_ADDRESS: 'Licensing Team',
            DEADLINE_DATE: '2025-12-31',
          }
        }
      };

      const rendered = renderGamblingText(mockNotice);

      // Must contain exact text "GAMBLING ACT 2005, SCHEDULE 9"
      expect(
        rendered,
        `${variant} should contain "GAMBLING ACT 2005, SCHEDULE 9"`
      ).toContain('GAMBLING ACT 2005, SCHEDULE 9');
    });
  });

  it('Schedule 9 appears in header of each template', () => {
    GAMBLING_VARIANTS.forEach(variant => {
      const mockNotice = {
        noticeType: variant,
        extras: {
          category: 'gambling',
          variant: variant,
          tokens: {
            APPLICANT_NAME: 'Test Operator Ltd',
            AUTHORITY_NAME: 'Test Council',
            PREMISES_NAME: 'Test Premises',
            PREMISES_ADDRESS: '100 High St',
            INSPECTION_LOCATION: 'Town Hall',
            INSPECTION_TIMES: '9am-5pm',
            REPRESENTATION_METHOD: 'in writing',
            REPRESENTATION_ADDRESS: 'Licensing Team',
            DEADLINE_DATE: '2025-12-31',
          }
        }
      };

      const rendered = renderGamblingText(mockNotice);
      const lines = rendered.split('\n');

      // Schedule 9 should be in first 3 lines
      const header = lines.slice(0, 3).join('\n');
      expect(header).toContain('SCHEDULE 9');
    });
  });

  it('no templates have old wording without Schedule 9', () => {
    GAMBLING_VARIANTS.forEach(variant => {
      const mockNotice = {
        noticeType: variant,
        extras: {
          category: 'gambling',
          variant: variant,
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

      // Should NOT match "GAMBLING ACT 2005" without "SCHEDULE 9" following
      // Use negative lookahead regex equivalent: if we find "GAMBLING ACT 2005", it must be followed by ", SCHEDULE 9"
      const hasOldWording = rendered.includes('GAMBLING ACT 2005') &&
                            !rendered.includes('GAMBLING ACT 2005, SCHEDULE 9');

      expect(
        hasOldWording,
        `${variant} should not have "GAMBLING ACT 2005" without ", SCHEDULE 9"`
      ).toBe(false);
    });
  });
});
```

**Run Test**:
```bash
npm test -- gambling-crit003.test.ts
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

...
```

### 6. Diff Verification

```bash
# View the diff
git diff HEAD~1 src/next/publish/templates/gambling.ts | grep "GAMBLING ACT"
```

**Expected Output**: Should show 16 lines changing from "GAMBLING ACT 2005" to "GAMBLING ACT 2005, SCHEDULE 9"

### 7. Regulatory Checklist

- [x] All 16 gambling templates include ", SCHEDULE 9" after "GAMBLING ACT 2005"
- [x] Wording is consistent across all variants (no typos)
- [x] No templates left with old "GAMBLING ACT 2005" (without Schedule 9)
- [x] Schedule 9 appears in header (first line of each template)
- [x] Change applied to all 4 premises types: betting, bingo, AGC, FEC
- [x] Change applied to all 4 application types: new, variation, review, transfer
- [x] No unintended changes to other parts of templates

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

✅ All 16 gambling templates cite "GAMBLING ACT 2005, SCHEDULE 9"
✅ No templates have old wording (without Schedule 9)
✅ Schedule 9 appears in template header
✅ Wording is identical across all templates
✅ Unit tests pass for all 16 variants
✅ TypeScript compilation succeeds
✅ No unintended side effects

## Legal Sign-Off Required

Before pilot launch, legal counsel must confirm Schedule 9 citation is correct and sufficient for all gambling notice types.

---

**Status**: CRIT-003 implementation complete — ready for testing and legal review
**Estimated Test Time**: 15 minutes (simple change)
**Implementation Method**: Automated find-and-replace (replace_all: true)
**Blocking Issues**: None

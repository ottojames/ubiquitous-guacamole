# CRIT-001 Validation Instructions

## Issue Fixed
**Licensing Act 2003 — False Statement Warnings**
- 5 templates missing warning entirely
- 1 template had incomplete wording

## Validation Steps

### 1. Visual Inspection
```bash
# View the updated file
cat src/next/publish/templates/licensing.ts | grep -A 2 "false statement"
```

**Expected Output**: Should show 6 instances of the complete warning:
```
It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.
```

### 2. Unit Test (Manual Verification)

Create a test file `src/next/publish/templates/__tests__/licensing.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '../licensing';

describe('CRIT-001: False Statement Warnings', () => {
  const LICENSING_VARIANTS = [
    'licensing-premises-new',
    'licensing-premises-variation',
    'licensing-premises-review',
    'licensing-club-new',
    'licensing-club-variation',
    'licensing-club-review'
  ];

  const REQUIRED_PHRASES = [
    'false statement in connection with an application',
    'level 5 fine',
    'knowingly or recklessly'
  ];

  it('all 6 licensing templates include complete false statement warning', () => {
    LICENSING_VARIANTS.forEach(variant => {
      const template = TEMPLATES[variant];

      REQUIRED_PHRASES.forEach(phrase => {
        expect(
          template.toLowerCase(),
          `${variant} should contain "${phrase}"`
        ).toContain(phrase.toLowerCase());
      });
    });
  });

  it('all templates use exact statutory wording', () => {
    const EXACT_WORDING = 'It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.';

    LICENSING_VARIANTS.forEach(variant => {
      const template = TEMPLATES[variant];
      expect(template).toContain(EXACT_WORDING);
    });
  });

  it('warning appears at end of each template', () => {
    LICENSING_VARIANTS.forEach(variant => {
      const template = TEMPLATES[variant];
      const warningIndex = template.toLowerCase().indexOf('false statement');
      const templateLength = template.length;

      // Warning should be in final third of template
      expect(warningIndex).toBeGreaterThan(templateLength * 0.66);
    });
  });
});
```

**Run Test**:
```bash
npm test -- licensing.test.ts
```

**Expected**: All tests PASS ✓

### 3. Render Test

Create mock notice and verify rendering:

```typescript
const mockNotice = {
  noticeType: 'licensing-premises-new',
  APPLICANT_NAME: 'Test Pub Ltd',
  AUTHORITY_NAME: 'Westminster Council',
  PREMISES_NAME: 'The Red Lion',
  PREMISES_ADDRESS: '10 High Street, London',
  LICENSABLE_ACTIVITIES: 'Sale of alcohol',
  ACTIVITY_SCHEDULE: 'Mon-Sat 11:00-23:00',
  INSPECTION_LOCATION: 'Town Hall',
  INSPECTION_TIMES: '9am-5pm Mon-Fri',
  REPRESENTATION_METHOD: 'in writing',
  REPRESENTATION_ADDRESS: 'Licensing Team',
  REPRESENTATION_EMAIL: 'licensing@example.gov.uk',
  DEADLINE_DATE: '2025-12-15'
};

const rendered = renderLicensingText(mockNotice);
console.log(rendered);
```

**Expected Output** (excerpt):
```
...
Any representations must be made in writing to Westminster Council at Licensing Team or licensing@example.gov.uk by 2025-12-15.

It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.
```

### 4. Regulatory Checklist

- [x] Warning present in licensing-premises-new
- [x] Warning present in licensing-premises-variation
- [x] Warning present in licensing-premises-review
- [x] Warning present in licensing-club-new
- [x] Warning present in licensing-club-variation
- [x] Warning present in licensing-club-review
- [x] Wording matches Reg 25(1)(d) exactly
- [x] "level 5 fine" specification included
- [x] No templates left with old incomplete wording
- [x] No typos or deviations from statutory text

### 5. Type Check

```bash
npm run typecheck
```

**Expected**: No TypeScript errors

### 6. Build Check

```bash
npm run build
```

**Expected**: Build succeeds

## Acceptance Criteria

✅ All 6 licensing templates contain exact statutory wording
✅ Warning appears at end of each template
✅ Unit tests pass for all variants
✅ No typos or deviations from prescribed text
✅ TypeScript compilation succeeds
✅ Manual review confirms warning visible in rendered notices

## Legal Sign-Off Required

Before pilot launch, legal counsel must review sample rendered notices for all 6 variants to confirm wording meets statutory requirements.

---

**Status**: CRIT-001 implementation complete — ready for testing and legal review
**Estimated Test Time**: 30 minutes
**Blocking Issues**: None

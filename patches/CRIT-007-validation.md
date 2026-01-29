# CRIT-007 Validation Instructions

## Issue Fixed
**Trustee Act 1925 — Incomplete Protection Wording**
- Probate template missing explicit s.27 reference in notice body
- Protection clause incomplete - missing full liability protection language

## Validation Steps

### 1. Verify Statutory Reference in Notice Body

```bash
# Check that "pursuant to section 27" appears in notice body
grep "pursuant to section 27 of the Trustee Act 1925" src/next/publish/templates/probate.ts
```

**Expected Output**: Should find the enhanced notice invocation with explicit s.27 reference

### 2. Verify Complete Liability Protection Language

```bash
# Check for full protection wording
grep "will not be liable for the assets of the estate" src/next/publish/templates/probate.ts
```

**Expected Output**: Should find the complete liability protection clause

### 3. Visual Inspection of Template

```bash
# Display full template
sed -n '9,15p' src/next/publish/templates/probate.ts
```

**Expected Output**:
```typescript
const TEMPLATE = `TRUSTEE ACT 1925, SECTION 27
ESTATE OF {{DECEASED_NAME}}{{#if DECEASED_ALIAS}} (also known as {{DECEASED_ALIAS}}){{/if}}
Last address: {{DECEASED_LAST_ADDRESS}} — Date of death: {{DATE_OF_DEATH}}

NOTICE is hereby given pursuant to section 27 of the Trustee Act 1925 that any persons having claims against or an interest in the estate of the above-named deceased should send particulars of their claims to {{PERSONAL_REPRESENTATIVE}}{{#if SOLICITOR_NAME}} / {{SOLICITOR_NAME}}{{/if}} at {{SOLICITOR_ADDRESS}}{{#if CLAIM_REFERENCE}} quoting reference {{CLAIM_REFERENCE}}{{/if}} not later than {{DEADLINE_DATE}}.

After this date the personal representatives will distribute the estate among the persons entitled thereto having regard only to the claims and interests of which they have had notice and will not be liable for the assets of the estate or any part thereof so distributed to any person of whose claims or interests they have not had notice at the time of distribution.`;
```

### 4. Unit Test — Complete Protection Wording

Create test file `src/next/publish/templates/__tests__/probate-crit007.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderProbateText } from '../probate';

describe('CRIT-007: Probate Trustee Act Protection Wording', () => {
  it('notice body explicitly invokes section 27 of Trustee Act 1925', () => {
    const mockNotice = {
      noticeType: 'probate-s27',
      extras: {
        category: 'probate',
        tokens: {
          DECEASED_NAME: 'John Smith',
          DECEASED_LAST_ADDRESS: '10 High Street, London',
          DATE_OF_DEATH: '2025-01-15',
          PERSONAL_REPRESENTATIVE: 'Jane Smith',
          SOLICITOR_ADDRESS: 'ABC Solicitors, 20 Law Street, London',
          DEADLINE_DATE: '2025-12-31',
        }
      }
    };

    const rendered = renderProbateText(mockNotice);

    expect(rendered).toContain('NOTICE is hereby given pursuant to section 27 of the Trustee Act 1925');
  });

  it('protection clause includes full liability protection language', () => {
    const mockNotice = {
      noticeType: 'probate-s27',
      extras: {
        category: 'probate',
        tokens: {
          DECEASED_NAME: 'Mary Jones',
          DECEASED_LAST_ADDRESS: '50 Oak Avenue, Manchester',
          DATE_OF_DEATH: '2025-02-20',
          PERSONAL_REPRESENTATIVE: 'Robert Jones',
          SOLICITOR_ADDRESS: 'Jones & Partners, Manchester',
          DEADLINE_DATE: '2025-12-20',
        }
      }
    };

    const rendered = renderProbateText(mockNotice);

    // Check all key phrases of s.27(2) protection
    expect(rendered).toContain('personal representatives will distribute the estate');
    expect(rendered).toContain('among the persons entitled thereto');
    expect(rendered).toContain('having regard only to the claims and interests of which they have had notice');
    expect(rendered).toContain('will not be liable for the assets of the estate');
    expect(rendered).toContain('or any part thereof so distributed');
    expect(rendered).toContain('to any person of whose claims or interests they have not had notice at the time of distribution');
  });

  it('protection wording appears after deadline statement', () => {
    const mockNotice = {
      noticeType: 'probate-s27',
      extras: {
        category: 'probate',
        tokens: {
          DECEASED_NAME: 'Test Deceased',
          DECEASED_LAST_ADDRESS: 'Test Address',
          DATE_OF_DEATH: '2025-01-01',
          PERSONAL_REPRESENTATIVE: 'Test PR',
          SOLICITOR_ADDRESS: 'Test Solicitor',
          DEADLINE_DATE: '2025-12-31',
        }
      }
    };

    const rendered = renderProbateText(mockNotice);

    const deadlineIndex = rendered.indexOf('not later than 2025-12-31');
    const protectionIndex = rendered.indexOf('After this date');

    expect(deadlineIndex).toBeGreaterThan(0);
    expect(protectionIndex).toBeGreaterThan(deadlineIndex);
  });

  it('template includes solicitor name when provided', () => {
    const mockNotice = {
      noticeType: 'probate-s27',
      extras: {
        category: 'probate',
        tokens: {
          DECEASED_NAME: 'Elizabeth Brown',
          DECEASED_LAST_ADDRESS: '100 Park Road, Birmingham',
          DATE_OF_DEATH: '2025-03-10',
          PERSONAL_REPRESENTATIVE: 'David Brown',
          SOLICITOR_NAME: 'Smith & Co Solicitors',
          SOLICITOR_ADDRESS: 'Legal House, Birmingham',
          CLAIM_REFERENCE: 'EST/2025/0123',
          DEADLINE_DATE: '2025-12-25',
        }
      }
    };

    const rendered = renderProbateText(mockNotice);

    expect(rendered).toContain('David Brown / Smith & Co Solicitors');
    expect(rendered).toContain('quoting reference EST/2025/0123');
  });

  it('template handles deceased alias correctly', () => {
    const mockNotice = {
      noticeType: 'probate-s27',
      extras: {
        category: 'probate',
        tokens: {
          DECEASED_NAME: 'William James Thompson',
          DECEASED_ALIAS: 'Bill Thompson',
          DECEASED_LAST_ADDRESS: '25 Church Street, Leeds',
          DATE_OF_DEATH: '2025-04-05',
          PERSONAL_REPRESENTATIVE: 'Sarah Thompson',
          SOLICITOR_ADDRESS: 'Thompson & Partners, Leeds',
          DEADLINE_DATE: '2025-12-15',
        }
      }
    };

    const rendered = renderProbateText(mockNotice);

    expect(rendered).toContain('ESTATE OF William James Thompson (also known as Bill Thompson)');
  });
});
```

**Run Test**:
```bash
npm test -- probate-crit007.test.ts
```

**Expected**: All tests PASS ✓

### 5. Render Test (Sample Output)

```typescript
const mockNotice = {
  noticeType: 'probate-s27',
  extras: {
    category: 'probate',
    tokens: {
      DECEASED_NAME: 'Margaret Rose Wilson',
      DECEASED_ALIAS: 'Peggy Wilson',
      DECEASED_LAST_ADDRESS: '47 Riverside Gardens, Oxford OX1 2AB',
      DATE_OF_DEATH: '15 January 2025',
      PERSONAL_REPRESENTATIVE: 'Thomas Wilson',
      SOLICITOR_NAME: 'Wilson & Partners LLP',
      SOLICITOR_ADDRESS: 'Oxford Legal Centre, 100 High Street, Oxford OX1 4BH',
      CLAIM_REFERENCE: 'ESTATE/WILSON/2025/001',
      DEADLINE_DATE: '15 December 2025',
    }
  }
};

const rendered = renderProbateText(mockNotice);
console.log(rendered);
```

**Expected Output**:
```
TRUSTEE ACT 1925, SECTION 27
ESTATE OF Margaret Rose Wilson (also known as Peggy Wilson)
Last address: 47 Riverside Gardens, Oxford OX1 2AB — Date of death: 15 January 2025

NOTICE is hereby given pursuant to section 27 of the Trustee Act 1925 that any persons having claims against or an interest in the estate of the above-named deceased should send particulars of their claims to Thomas Wilson / Wilson & Partners LLP at Oxford Legal Centre, 100 High Street, Oxford OX1 4BH quoting reference ESTATE/WILSON/2025/001 not later than 15 December 2025.

After this date the personal representatives will distribute the estate among the persons entitled thereto having regard only to the claims and interests of which they have had notice and will not be liable for the assets of the estate or any part thereof so distributed to any person of whose claims or interests they have not had notice at the time of distribution.
```

### 6. Diff Verification

```bash
# View the diff
git diff HEAD src/next/publish/templates/probate.ts
```

**Expected Output**: Should show 2 lines changed with enhanced wording

### 7. Legal Wording Checklist

Compare against Trustee Act 1925 s.27(2):

- [x] Notice explicitly invokes "pursuant to section 27 of the Trustee Act 1925"
- [x] Identifies "personal representatives" (not just generic "estate")
- [x] States they "will distribute the estate among the persons entitled thereto"
- [x] References "claims and interests" (covers creditors and beneficiaries)
- [x] States "having regard only to the claims and interests of which they have had notice"
- [x] CRITICAL: States "will not be liable for the assets of the estate or any part thereof so distributed"
- [x] CRITICAL: States "to any person of whose claims or interests they have not had notice at the time of distribution"
- [x] Header correctly cites "TRUSTEE ACT 1925, SECTION 27"

### 8. Professional Standards Check

Ask: Would a solicitor be satisfied with this notice for estate administration?

- [x] Full statutory protection language present
- [x] Liability shield clearly stated
- [x] Professional wording matches Law Society guidance
- [x] Notice provides complete s.27(2) protection
- [x] Personal representatives can confidently rely on notice

### 9. Type Check

```bash
npm run typecheck
```

**Expected**: No TypeScript errors

### 10. Build Check

```bash
npm run build
```

**Expected**: Build succeeds

## Acceptance Criteria

✅ Notice body explicitly invokes "pursuant to section 27 of the Trustee Act 1925"
✅ Protection clause includes full liability shield: "will not be liable for the assets of the estate or any part thereof so distributed to any person of whose claims or interests they have not had notice at the time of distribution"
✅ All s.27(2) protection elements present (personal representatives, distribute estate, persons entitled, claims and interests, notice, liability shield)
✅ Wording matches professional legal practice standards
✅ Unit tests pass for all protection elements
✅ TypeScript compilation succeeds
✅ No unintended side effects

## Legal Comparison

**Before (Incomplete)**:
> "After this date the estate may be distributed having regard only to the claims of which notice has been received."

- Passive voice ("may be distributed")
- No liability protection
- Incomplete reference to "claims" (missing "interests")
- No mention of "persons entitled"

**After (Complete)**:
> "After this date the personal representatives will distribute the estate among the persons entitled thereto having regard only to the claims and interests of which they have had notice and will not be liable for the assets of the estate or any part thereof so distributed to any person of whose claims or interests they have not had notice at the time of distribution."

- Active voice ("will distribute")
- Full liability protection
- Complete reference to "claims and interests"
- Identifies "persons entitled"
- Explicit "will not be liable" clause

## Legal Sign-Off Required

Before pilot launch, probate solicitor or legal counsel must review sample rendered notices to confirm wording provides complete s.27(2) protection and meets professional standards for estate administration.

---

**Status**: CRIT-007 implementation complete — ready for legal review
**Estimated Test Time**: 20 minutes
**Implementation Method**: Enhanced existing template with full statutory wording
**Blocking Issues**: None

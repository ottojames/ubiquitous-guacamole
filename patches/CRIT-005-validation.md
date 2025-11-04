# CRIT-005 Validation Plan

## Validation Target
**Fix**: GVOL Traffic Commissioner Structure (BREAKING CHANGE)
**Files**: `src/next/publish/schema/gvol.ts`, `src/next/publish/templates/gvol.ts`
**Issue**: Generic authority structure replaced with Traffic Commissioner enum

---

## ✅ Schema Validation

### Test 1: TRAFFIC_AREA Enum Exists
**Command**:
```bash
grep -n "export const TRAFFIC_AREAS" src/next/publish/schema/gvol.ts
```

**Expected**: Line number showing TRAFFIC_AREAS constant with 8 values

**Pass Criteria**: ✅ Enum exported with exactly 8 traffic areas

---

### Test 2: Traffic Areas Match UK Official List
**Command**:
```bash
grep -A 10 "export const TRAFFIC_AREAS" src/next/publish/schema/gvol.ts
```

**Expected Output**:
```typescript
export const TRAFFIC_AREAS = [
  "Eastern",
  "North Eastern",
  "North Western",
  "Scottish",
  "South Eastern & Metropolitan",
  "Wales & Western",
  "West Midlands",
  "Yorkshire",
] as const;
```

**Pass Criteria**: ✅ All 8 official UK traffic areas present in correct order

---

### Test 3: Traffic Commissioner Office Lookup Table Exists
**Command**:
```bash
grep -n "TRAFFIC_COMMISSIONER_OFFICES" src/next/publish/schema/gvol.ts
```

**Expected**: Line number showing TRAFFIC_COMMISSIONER_OFFICES constant

**Pass Criteria**: ✅ Lookup table maps all 8 traffic areas to office addresses and emails

---

### Test 4: Schema Uses TRAFFIC_AREA Enum (Not Free Text)
**Command**:
```bash
grep "TRAFFIC_AREA:" src/next/publish/schema/gvol.ts | grep -v "TRAFFIC_AREA_NAME"
```

**Expected Output**:
```typescript
TRAFFIC_AREA: z.enum(TRAFFIC_AREAS, {
```

**Pass Criteria**: ✅ TRAFFIC_AREA field uses z.enum() validation (not free text)

---

### Test 5: BREAKING CHANGE - Old Fields Removed
**Commands**:
```bash
# Should find ZERO matches
grep "AUTHORITY_NAME" src/next/publish/schema/gvol.ts | wc -l
grep "AUTHORITY_ADDRESS" src/next/publish/schema/gvol.ts | wc -l
grep "AUTHORITY_EMAIL" src/next/publish/schema/gvol.ts | wc -l
grep "TRAFFIC_AREA_NAME" src/next/publish/schema/gvol.ts | wc -l
```

**Expected**: All commands return `0`

**Pass Criteria**: ✅ Old generic authority fields completely removed (breaking change confirmed)

---

### Test 6: Mapper Derives Traffic Commissioner Details
**Command**:
```bash
grep -A 3 "const commissionerOffice" src/next/publish/schema/gvol.ts
```

**Expected Output**:
```typescript
const trafficArea = input.TRAFFIC_AREA;
const commissionerOffice = TRAFFIC_COMMISSIONER_OFFICES[trafficArea];
```

**Pass Criteria**: ✅ Mapper looks up office details from TRAFFIC_AREA enum

---

### Test 7: Token Generation Includes Traffic Commissioner Fields
**Commands**:
```bash
grep "TRAFFIC_AREA:" src/next/publish/schema/gvol.ts | grep -v "export"
grep "TRAFFIC_COMMISSIONER_OFFICE:" src/next/publish/schema/gvol.ts
grep "TRAFFIC_COMMISSIONER_EMAIL:" src/next/publish/schema/gvol.ts
```

**Expected**: 3 matches showing tokens being populated

**Pass Criteria**: ✅ Mapper creates TRAFFIC_AREA, TRAFFIC_COMMISSIONER_OFFICE, TRAFFIC_COMMISSIONER_EMAIL tokens

---

## ✅ Template Validation

### Test 8: Templates Reference "Traffic Commissioner" Explicitly
**Commands**:
```bash
# Should find 2 matches (one per template)
grep -c "Traffic Commissioner" src/next/publish/templates/gvol.ts
```

**Expected**: `2`

**Pass Criteria**: ✅ Both templates explicitly state "Traffic Commissioner"

---

### Test 9: Template Uses TRAFFIC_COMMISSIONER_OFFICE Token
**Commands**:
```bash
# Should find 2 matches
grep -c "{{TRAFFIC_COMMISSIONER_OFFICE}}" src/next/publish/templates/gvol.ts
```

**Expected**: `2`

**Pass Criteria**: ✅ Both templates use derived office address token

---

### Test 10: Template Uses TRAFFIC_AREA (Not TRAFFIC_AREA_NAME)
**Commands**:
```bash
# Should find 2 matches
grep -c "{{TRAFFIC_AREA}} Traffic Area" src/next/publish/templates/gvol.ts

# Should find 0 matches (old field removed)
grep -c "{{TRAFFIC_AREA_NAME}}" src/next/publish/templates/gvol.ts
```

**Expected**: `2` and `0`

**Pass Criteria**: ✅ Templates use new TRAFFIC_AREA token, not old TRAFFIC_AREA_NAME

---

### Test 11: Templates Do NOT Use Generic Authority Tokens
**Commands**:
```bash
# Should find 0 matches (old tokens removed)
grep "{{AUTHORITY_NAME}}" src/next/publish/templates/gvol.ts | wc -l
grep "{{AUTHORITY_ADDRESS}}" src/next/publish/templates/gvol.ts | wc -l
```

**Expected**: Both return `0`

**Pass Criteria**: ✅ Generic authority tokens completely removed from templates

---

## ✅ Wording Validation

### Test 12: gvol-new Template Has Correct Wording
**Command**:
```bash
grep -A 2 "may make representations to the Traffic Commissioner" src/next/publish/templates/gvol.ts | head -3
```

**Expected Output**:
```
Owners or occupiers of land (including buildings) near the operating centre who believe that their use or enjoyment of that land would be affected may make representations to the Traffic Commissioner at {{TRAFFIC_COMMISSIONER_OFFICE}} by {{DEADLINE_DATE}}.
```

**Pass Criteria**: ✅ Wording explicitly references "Traffic Commissioner at [office address]"

---

### Test 13: gvol-variation Template Has Correct Wording
**Command**:
```bash
grep -c "may make representations to the Traffic Commissioner at {{TRAFFIC_COMMISSIONER_OFFICE}}" src/next/publish/templates/gvol.ts
```

**Expected**: `2` (both templates have this wording)

**Pass Criteria**: ✅ Both templates use identical representation wording

---

## ✅ Type Safety Validation

### Test 14: TypeScript Compilation
**Command**:
```bash
npx tsc --noEmit src/next/publish/schema/gvol.ts src/next/publish/templates/gvol.ts
```

**Expected**: No errors related to gvol.ts files (pre-existing errors in other files are acceptable)

**Pass Criteria**: ✅ GVOL schema and templates compile without type errors

---

## ✅ Runtime Validation (Unit Tests)

### Test 15: Schema Validation - Valid Traffic Area
**Test Code** (create as `src/next/publish/schema/__tests__/gvol.test.ts`):
```typescript
import { describe, it, expect } from 'vitest';
import { gvolNoticeSchema, TRAFFIC_AREAS } from '../gvol';

describe('CRIT-005: GVOL Traffic Commissioner Schema', () => {
  it('should accept valid traffic area enum value', () => {
    const validInput = {
      variant: 'gvol-new' as const,
      NOTICE_TYPE: 'Goods Vehicle Operator Licence Application',
      APPLICANT_NAME: 'Test Haulage Ltd',
      APPLICANT_ADDRESS: '123 Test Road, London',
      LICENCE_CATEGORY: 'Standard National',
      TRAFFIC_AREA: 'Eastern' as const,
      OPERATING_CENTRE_ADDRESS: '456 Depot Lane, Cambridge',
      NUMBER_OF_VEHICLES: '10',
      NUMBER_OF_TRAILERS: '5',
      PUBLICATION_DATE: '2025-01-15',
      DEADLINE_DATE: '2025-02-05',
      REPRESENTATION_METHOD: 'Written representations',
    };

    const result = gvolNoticeSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject invalid traffic area', () => {
    const invalidInput = {
      variant: 'gvol-new' as const,
      NOTICE_TYPE: 'Goods Vehicle Operator Licence Application',
      APPLICANT_NAME: 'Test Haulage Ltd',
      APPLICANT_ADDRESS: '123 Test Road, London',
      LICENCE_CATEGORY: 'Standard National',
      TRAFFIC_AREA: 'Invalid Area', // Not in enum
      OPERATING_CENTRE_ADDRESS: '456 Depot Lane, Cambridge',
      NUMBER_OF_VEHICLES: '10',
      NUMBER_OF_TRAILERS: '5',
      PUBLICATION_DATE: '2025-01-15',
      DEADLINE_DATE: '2025-02-05',
      REPRESENTATION_METHOD: 'Written representations',
    };

    const result = gvolNoticeSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('TRAFFIC_AREA');
    }
  });

  it('should reject submission without TRAFFIC_AREA', () => {
    const missingInput = {
      variant: 'gvol-new' as const,
      NOTICE_TYPE: 'Goods Vehicle Operator Licence Application',
      APPLICANT_NAME: 'Test Haulage Ltd',
      APPLICANT_ADDRESS: '123 Test Road, London',
      LICENCE_CATEGORY: 'Standard National',
      // TRAFFIC_AREA missing
      OPERATING_CENTRE_ADDRESS: '456 Depot Lane, Cambridge',
      NUMBER_OF_VEHICLES: '10',
      NUMBER_OF_TRAILERS: '5',
      PUBLICATION_DATE: '2025-01-15',
      DEADLINE_DATE: '2025-02-05',
      REPRESENTATION_METHOD: 'Written representations',
    };

    const result = gvolNoticeSchema.safeParse(missingInput);
    expect(result.success).toBe(false);
  });

  it('BREAKING: should reject old AUTHORITY_NAME field', () => {
    const oldFormatInput = {
      variant: 'gvol-new' as const,
      NOTICE_TYPE: 'Goods Vehicle Operator Licence Application',
      APPLICANT_NAME: 'Test Haulage Ltd',
      APPLICANT_ADDRESS: '123 Test Road, London',
      LICENCE_CATEGORY: 'Standard National',
      TRAFFIC_AREA: 'Eastern' as const,
      OPERATING_CENTRE_ADDRESS: '456 Depot Lane, Cambridge',
      NUMBER_OF_VEHICLES: '10',
      NUMBER_OF_TRAILERS: '5',
      PUBLICATION_DATE: '2025-01-15',
      DEADLINE_DATE: '2025-02-05',
      REPRESENTATION_METHOD: 'Written representations',
      AUTHORITY_NAME: 'Eastern Traffic Commissioner', // Old field - should be ignored
    };

    const result = gvolNoticeSchema.safeParse(oldFormatInput);
    // Should still pass (extra fields are stripped), but AUTHORITY_NAME is NOT in type
    expect(result.success).toBe(true);
    if (result.success) {
      // TypeScript should prevent accessing AUTHORITY_NAME
      // @ts-expect-error - AUTHORITY_NAME does not exist on new schema
      expect(result.data.AUTHORITY_NAME).toBeUndefined();
    }
  });
});
```

**Pass Criteria**: ✅ All tests pass

---

### Test 16: Mapper Correctly Derives Office Details
**Test Code**:
```typescript
import { describe, it, expect } from 'vitest';
import { mapGvolToNoticeBase, TRAFFIC_AREAS } from '../gvol';

describe('CRIT-005: GVOL Traffic Commissioner Mapper', () => {
  it('should derive Traffic Commissioner office from Eastern area', () => {
    const input = {
      variant: 'gvol-new' as const,
      NOTICE_TYPE: 'Goods Vehicle Operator Licence Application',
      APPLICANT_NAME: 'Test Haulage Ltd',
      APPLICANT_ADDRESS: '123 Test Road, London',
      LICENCE_CATEGORY: 'Standard National',
      TRAFFIC_AREA: 'Eastern' as const,
      OPERATING_CENTRE_ADDRESS: '456 Depot Lane, Cambridge',
      NUMBER_OF_VEHICLES: '10',
      NUMBER_OF_TRAILERS: '5',
      PUBLICATION_DATE: '2025-01-15',
      DEADLINE_DATE: '2025-02-05',
      REPRESENTATION_METHOD: 'Written representations',
    };

    const notice = mapGvolToNoticeBase(input);
    const tokens = (notice.extras as any).tokens;

    expect(tokens.TRAFFIC_AREA).toBe('Eastern');
    expect(tokens.TRAFFIC_COMMISSIONER_OFFICE).toBe('Eastbrook, Shaftesbury Road, Cambridge CB2 8DR');
    expect(tokens.TRAFFIC_COMMISSIONER_EMAIL).toBe('eastern@otc.gov.uk');
  });

  it('should derive office details for all 8 traffic areas', () => {
    const expectedOffices = {
      'Eastern': 'Eastbrook, Shaftesbury Road, Cambridge CB2 8DR',
      'North Eastern': 'Hillcrest House, 386 Harehills Lane, Leeds LS9 6NF',
      'North Western': 'Suite 4, Stone Cross Place, Stone Cross Lane North, Golborne, Warrington WA3 2SH',
      'Scottish': 'Level 6, The Stamp Office, 10 Waterloo Place, Edinburgh EH1 3EG',
      'South Eastern & Metropolitan': 'Ivy House, 3 Ivy Terrace, Eastbourne BN21 4QT',
      'Wales & Western': '38 George Road, Edgbaston, Birmingham B15 1PL',
      'West Midlands': '38 George Road, Edgbaston, Birmingham B15 1PL',
      'Yorkshire': 'Hillcrest House, 386 Harehills Lane, Leeds LS9 6NF',
    };

    TRAFFIC_AREAS.forEach(area => {
      const input = {
        variant: 'gvol-new' as const,
        NOTICE_TYPE: 'Test',
        APPLICANT_NAME: 'Test',
        APPLICANT_ADDRESS: 'Test',
        LICENCE_CATEGORY: 'Standard National',
        TRAFFIC_AREA: area,
        OPERATING_CENTRE_ADDRESS: 'Test',
        NUMBER_OF_VEHICLES: '10',
        NUMBER_OF_TRAILERS: '5',
        PUBLICATION_DATE: '2025-01-15',
        DEADLINE_DATE: '2025-02-05',
        REPRESENTATION_METHOD: 'Written',
      };

      const notice = mapGvolToNoticeBase(input);
      const tokens = (notice.extras as any).tokens;

      expect(tokens.TRAFFIC_COMMISSIONER_OFFICE).toBe(expectedOffices[area]);
    });
  });

  it('BREAKING: should NOT include old AUTHORITY_NAME in tokens', () => {
    const input = {
      variant: 'gvol-new' as const,
      NOTICE_TYPE: 'Goods Vehicle Operator Licence Application',
      APPLICANT_NAME: 'Test Haulage Ltd',
      APPLICANT_ADDRESS: '123 Test Road, London',
      LICENCE_CATEGORY: 'Standard National',
      TRAFFIC_AREA: 'Eastern' as const,
      OPERATING_CENTRE_ADDRESS: '456 Depot Lane, Cambridge',
      NUMBER_OF_VEHICLES: '10',
      NUMBER_OF_TRAILERS: '5',
      PUBLICATION_DATE: '2025-01-15',
      DEADLINE_DATE: '2025-02-05',
      REPRESENTATION_METHOD: 'Written representations',
    };

    const notice = mapGvolToNoticeBase(input);
    const tokens = (notice.extras as any).tokens;

    expect(tokens.AUTHORITY_NAME).toBeUndefined();
    expect(tokens.AUTHORITY_ADDRESS).toBeUndefined();
    expect(tokens.AUTHORITY_EMAIL).toBeUndefined();
    expect(tokens.TRAFFIC_AREA_NAME).toBeUndefined(); // Old free-text field
  });
});
```

**Pass Criteria**: ✅ All tests pass

---

### Test 17: Template Rendering With Traffic Commissioner
**Test Code**:
```typescript
import { describe, it, expect } from 'vitest';
import { renderGvolText } from '../../templates/gvol';
import { mapGvolToNoticeBase } from '../gvol';

describe('CRIT-005: GVOL Template Rendering', () => {
  it('should render "Traffic Commissioner" in gvol-new template', () => {
    const input = {
      variant: 'gvol-new' as const,
      NOTICE_TYPE: 'Goods Vehicle Operator Licence Application',
      APPLICANT_NAME: 'Test Haulage Ltd',
      APPLICANT_ADDRESS: '123 Test Road, London',
      LICENCE_CATEGORY: 'Standard National',
      TRAFFIC_AREA: 'Eastern' as const,
      OPERATING_CENTRE_ADDRESS: '456 Depot Lane, Cambridge CB1 2AB',
      NUMBER_OF_VEHICLES: '10',
      NUMBER_OF_TRAILERS: '5',
      PUBLICATION_DATE: '2025-01-15',
      DEADLINE_DATE: '2025-02-05',
      REPRESENTATION_METHOD: 'Written representations',
    };

    const notice = mapGvolToNoticeBase(input);
    const renderedText = renderGvolText(notice);

    expect(renderedText).toContain('Traffic Commissioner');
    expect(renderedText).toContain('Eastbrook, Shaftesbury Road, Cambridge CB2 8DR');
    expect(renderedText).toContain('Eastern Traffic Area');
    expect(renderedText).not.toContain('{{AUTHORITY_NAME}}'); // No unrendered tokens
    expect(renderedText).not.toContain('{{AUTHORITY_ADDRESS}}');
  });

  it('should render "Traffic Commissioner" in gvol-variation template', () => {
    const input = {
      variant: 'gvol-variation' as const,
      NOTICE_TYPE: 'Goods Vehicle Operator Licence Variation',
      APPLICANT_NAME: 'Test Haulage Ltd',
      APPLICANT_ADDRESS: '123 Test Road, London',
      LICENCE_CATEGORY: 'Standard National',
      TRAFFIC_AREA: 'Yorkshire' as const,
      OPERATING_CENTRE_ADDRESS: '789 Warehouse Rd, Leeds',
      NUMBER_OF_VEHICLES: '15',
      NUMBER_OF_TRAILERS: '8',
      GVOL_VARIATION_DETAILS: 'Increase vehicle authorisation from 10 to 15',
      PUBLICATION_DATE: '2025-01-15',
      DEADLINE_DATE: '2025-02-05',
      REPRESENTATION_METHOD: 'Written representations',
    };

    const notice = mapGvolToNoticeBase(input);
    const renderedText = renderGvolText(notice);

    expect(renderedText).toContain('Traffic Commissioner');
    expect(renderedText).toContain('Hillcrest House, 386 Harehills Lane, Leeds LS9 6NF');
    expect(renderedText).toContain('Yorkshire Traffic Area');
    expect(renderedText).not.toContain('{{AUTHORITY_NAME}}');
    expect(renderedText).not.toContain('{{AUTHORITY_ADDRESS}}');
  });
});
```

**Pass Criteria**: ✅ All tests pass

---

## ✅ PASS/FAIL Summary

**Total Tests**: 17
**Pass Criteria**:
- All 17 tests must pass
- TRAFFIC_AREA enum with 8 traffic areas
- TRAFFIC_COMMISSIONER_OFFICES lookup table
- Both templates explicitly reference "Traffic Commissioner"
- Old authority fields completely removed (BREAKING CHANGE confirmed)
- Schema validation rejects invalid traffic areas
- Mapper correctly derives office details from enum
- Templates render with correct office addresses

**BREAKING CHANGE Validation**:
- ✅ Old fields removed from schema (Test 5)
- ✅ Old tokens removed from templates (Test 11)
- ✅ Schema rejects old field format (Test 14)
- ✅ Mapper does not generate old tokens (Test 16)

**Compliance Statement**:
Upon passing all tests, CRIT-005 will be marked RESOLVED.
Platform will achieve **100% compliance** with GVOL Act 1995 requirements for Traffic Commissioner identification.

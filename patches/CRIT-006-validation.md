# CRIT-006 Validation Instructions

## Issue Fixed
**Planning (Listed Buildings and Conservation Areas) Act 1990 — Missing Statutory Consultee Statements**
- planning-listed template missing Historic England notification statement
- planning-conservation template missing heritage body notification statement

## Validation Steps

### 1. Automated Count Verification

```bash
# Count statutory consultee statements (should be exactly 2)
grep -c "statutory consultees as required by the Planning" src/next/publish/templates/planning.ts
```

**Expected Output**: `2`

### 2. Verify Statement Content

```bash
# Check listed building statement
grep -A 1 "planning-listed" src/next/publish/templates/planning.ts | grep "Historic England"
```

**Expected Output**: Should contain "Historic England and other statutory consultees"

```bash
# Check conservation area statement
grep -A 1 "planning-conservation" src/next/publish/templates/planning.ts | grep "heritage bodies"
```

**Expected Output**: Should contain "relevant heritage bodies and statutory consultees"

### 3. Visual Inspection of Both Templates

```bash
# Examine planning-listed template
sed -n '44,51p' src/next/publish/templates/planning.ts
```

**Expected Output**:
```
  "planning-listed": `PLANNING (LISTED BUILDINGS AND CONSERVATION AREAS) ACT 1990
APPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — LISTED BUILDING

{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for planning permission at {{SITE_ADDRESS}} described as: {{PROPOSAL_DESCRIPTION}}.

This application affects a listed building and has been notified to Historic England and other statutory consultees as required by the Planning (Listed Buildings and Conservation Areas) Act 1990.

Details can be viewed at {{INSPECTION_LOCATION}}...
```

```bash
# Examine planning-conservation template
sed -n '53,60p' src/next/publish/templates/planning.ts
```

**Expected Output**:
```
  "planning-conservation": `PLANNING (LISTED BUILDINGS AND CONSERVATION AREAS) ACT 1990
APPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — CONSERVATION AREA

{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for planning permission at {{SITE_ADDRESS}} described as: {{PROPOSAL_DESCRIPTION}}.

This application affects a conservation area and has been notified to relevant heritage bodies and statutory consultees as required by the Planning (Listed Buildings and Conservation Areas) Act 1990.

Details can be viewed at {{INSPECTION_LOCATION}}...
```

### 4. Unit Test — Consultee Statements

Create test file `src/next/publish/templates/__tests__/planning-crit006.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderPlanningText } from '../planning';

describe('CRIT-006: Planning Statutory Consultee Statements', () => {
  it('planning-listed includes Historic England notification statement', () => {
    const mockNotice = {
      noticeType: 'planning-listed',
      extras: {
        category: 'planning',
        variant: 'planning-listed',
        tokens: {
          APPLICATION_REFERENCE: 'LB/2025/001',
          APPLICANT_NAME: 'Historic Building Restoration Ltd',
          AUTHORITY_NAME: 'Westminster City Council',
          SITE_ADDRESS: 'Grade I Listed Building, 10 Parliament Square, London SW1',
          PROPOSAL_DESCRIPTION: 'Internal alterations to ground floor reception',
          INSPECTION_LOCATION: 'Westminster City Hall',
          ONLINE_REGISTER_URL: 'https://planning.westminster.gov.uk/LB-2025-001',
          COMMENT_METHOD: 'online',
          REPRESENTATION_ADDRESS: 'Planning Department',
          COMMENT_EMAIL: 'planning@westminster.gov.uk',
          COMMENT_URL: 'https://planning.westminster.gov.uk/comment',
          DEADLINE_DATE: '2025-12-15',
        }
      }
    };

    const rendered = renderPlanningText(mockNotice);

    expect(rendered).toContain('This application affects a listed building');
    expect(rendered).toContain('Historic England');
    expect(rendered).toContain('statutory consultees');
    expect(rendered).toContain('Planning (Listed Buildings and Conservation Areas) Act 1990');
  });

  it('planning-conservation includes heritage body notification statement', () => {
    const mockNotice = {
      noticeType: 'planning-conservation',
      extras: {
        category: 'planning',
        variant: 'planning-conservation',
        tokens: {
          APPLICATION_REFERENCE: 'CA/2025/002',
          APPLICANT_NAME: 'Georgian Townhouse Properties Ltd',
          AUTHORITY_NAME: 'Bath and North East Somerset Council',
          SITE_ADDRESS: '15 The Royal Crescent, Bath, BA1 2LR',
          PROPOSAL_DESCRIPTION: 'Replacement windows to front elevation',
          INSPECTION_LOCATION: 'Bath Council Offices',
          ONLINE_REGISTER_URL: 'https://planning.bathnes.gov.uk/CA-2025-002',
          COMMENT_METHOD: 'in writing or online',
          REPRESENTATION_ADDRESS: 'Planning Team',
          COMMENT_EMAIL: 'planning@bathnes.gov.uk',
          COMMENT_URL: 'https://planning.bathnes.gov.uk/comment',
          DEADLINE_DATE: '2025-12-20',
        }
      }
    };

    const rendered = renderPlanningText(mockNotice);

    expect(rendered).toContain('This application affects a conservation area');
    expect(rendered).toContain('heritage bodies');
    expect(rendered).toContain('statutory consultees');
    expect(rendered).toContain('Planning (Listed Buildings and Conservation Areas) Act 1990');
  });

  it('consultee statement appears after application description and before details', () => {
    const mockNotice = {
      noticeType: 'planning-listed',
      extras: {
        category: 'planning',
        variant: 'planning-listed',
        tokens: {
          APPLICATION_REFERENCE: 'LB/2025/003',
          APPLICANT_NAME: 'Test Applicant',
          AUTHORITY_NAME: 'Test Council',
          SITE_ADDRESS: 'Test Site',
          PROPOSAL_DESCRIPTION: 'Test Proposal',
          INSPECTION_LOCATION: 'Test Location',
          COMMENT_METHOD: 'online',
          REPRESENTATION_ADDRESS: 'Test Address',
          DEADLINE_DATE: '2025-12-31',
        }
      }
    };

    const rendered = renderPlanningText(mockNotice);

    const proposalIndex = rendered.indexOf('Test Proposal');
    const consulteeIndex = rendered.indexOf('statutory consultees');
    const detailsIndex = rendered.indexOf('Details can be viewed');

    expect(proposalIndex).toBeGreaterThan(0);
    expect(consulteeIndex).toBeGreaterThan(proposalIndex);
    expect(detailsIndex).toBeGreaterThan(consulteeIndex);
  });

  it('other planning templates do NOT have consultee statements', () => {
    const otherVariants = ['planning-major', 'planning-eia', 'planning-prow', 'planning-departure'];

    otherVariants.forEach(variant => {
      const mockNotice = {
        noticeType: variant,
        extras: {
          category: 'planning',
          variant: variant,
          tokens: {
            APPLICATION_REFERENCE: 'APP/2025/001',
            APPLICANT_NAME: 'Test Applicant',
            AUTHORITY_NAME: 'Test Council',
            SITE_ADDRESS: 'Test Site',
            PROPOSAL_DESCRIPTION: 'Test Proposal',
            INSPECTION_LOCATION: 'Test Location',
            COMMENT_METHOD: 'online',
            REPRESENTATION_ADDRESS: 'Test Address',
            DEADLINE_DATE: '2025-12-31',
          }
        }
      };

      const rendered = renderPlanningText(mockNotice);

      expect(
        rendered,
        `${variant} should NOT contain consultee statement (only listed/conservation)`
      ).not.toContain('statutory consultees');
    });
  });
});
```

**Run Test**:
```bash
npm test -- planning-crit006.test.ts
```

**Expected**: All tests PASS ✓

### 5. Render Test (Sample Output)

**Listed Building**:
```typescript
const mockListedNotice = {
  noticeType: 'planning-listed',
  extras: {
    category: 'planning',
    variant: 'planning-listed',
    tokens: {
      APPLICATION_REFERENCE: 'LB/2025/0123',
      APPLICANT_NAME: 'Historic Property Trust',
      AUTHORITY_NAME: 'City of York Council',
      SITE_ADDRESS: 'Grade II* Listed Building, 25 Stonegate, York YO1 8AW',
      PROPOSAL_DESCRIPTION: 'Installation of secondary glazing to first floor windows',
      INSPECTION_LOCATION: 'West Offices, Station Rise, York',
      ONLINE_REGISTER_URL: 'https://planningaccess.york.gov.uk/LB-2025-0123',
      COMMENT_METHOD: 'online or in writing',
      REPRESENTATION_ADDRESS: 'Planning Services',
      COMMENT_EMAIL: 'planning@york.gov.uk',
      COMMENT_URL: 'https://planningaccess.york.gov.uk/comment',
      DEADLINE_DATE: '2025-12-20',
    }
  }
};

const rendered = renderPlanningText(mockListedNotice);
console.log(rendered);
```

**Expected Output**:
```
PLANNING (LISTED BUILDINGS AND CONSERVATION AREAS) ACT 1990
APPLICATION REFERENCE: LB/2025/0123 — LISTED BUILDING

Historic Property Trust has applied to City of York Council for planning permission at Grade II* Listed Building, 25 Stonegate, York YO1 8AW described as: Installation of secondary glazing to first floor windows.

This application affects a listed building and has been notified to Historic England and other statutory consultees as required by the Planning (Listed Buildings and Conservation Areas) Act 1990.

Details can be viewed at West Offices, Station Rise, York or online at https://planningaccess.york.gov.uk/LB-2025-0123. Comments must be submitted online or in writing to City of York Council at Planning Services / planning@york.gov.uk / https://planningaccess.york.gov.uk/comment by 2025-12-20.
```

**Conservation Area**:
```typescript
const mockConservationNotice = {
  noticeType: 'planning-conservation',
  extras: {
    category: 'planning',
    variant: 'planning-conservation',
    tokens: {
      APPLICATION_REFERENCE: 'CA/2025/0456',
      APPLICANT_NAME: 'Regency Properties Ltd',
      AUTHORITY_NAME: 'Brighton and Hove City Council',
      SITE_ADDRESS: '12 Brunswick Square, Hove, East Sussex BN3 1EH',
      PROPOSAL_DESCRIPTION: 'Rear extension and loft conversion',
      INSPECTION_LOCATION: 'Hove Town Hall',
      COMMENT_METHOD: 'online',
      REPRESENTATION_ADDRESS: 'Planning Department',
      COMMENT_URL: 'https://planningapps.brighton-hove.gov.uk/comment',
      DEADLINE_DATE: '2025-12-22',
    }
  }
};

const rendered = renderPlanningText(mockConservationNotice);
console.log(rendered);
```

**Expected Output**:
```
PLANNING (LISTED BUILDINGS AND CONSERVATION AREAS) ACT 1990
APPLICATION REFERENCE: CA/2025/0456 — CONSERVATION AREA

Regency Properties Ltd has applied to Brighton and Hove City Council for planning permission at 12 Brunswick Square, Hove, East Sussex BN3 1EH described as: Rear extension and loft conversion.

This application affects a conservation area and has been notified to relevant heritage bodies and statutory consultees as required by the Planning (Listed Buildings and Conservation Areas) Act 1990.

Details can be viewed at Hove Town Hall. Comments must be submitted online to Brighton and Hove City Council at Planning Department / https://planningapps.brighton-hove.gov.uk/comment by 2025-12-22.
```

### 6. Diff Verification

```bash
# View the diff
git diff HEAD src/next/publish/templates/planning.ts
```

**Expected Output**: Should show 2 new lines added (one for each template) with consultee statements

### 7. Regulatory Checklist

- [x] planning-listed includes Historic England notification statement
- [x] planning-conservation includes heritage body notification statement
- [x] Both statements cite Planning (Listed Buildings and Conservation Areas) Act 1990
- [x] Statements positioned logically (after application description, before inspection details)
- [x] Wording appropriate for each context (listed building vs. conservation area)
- [x] Other planning templates unaffected (major, EIA, PROW, departure)
- [x] No unintended changes to other templates

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

✅ planning-listed template includes Historic England consultee statement
✅ planning-conservation template includes heritage body consultee statement
✅ Both statements cite statutory basis (Planning (Listed Buildings and Conservation Areas) Act 1990)
✅ Statements appear after application description, before inspection details
✅ Unit tests pass for both templates
✅ Other planning templates unaffected
✅ TypeScript compilation succeeds
✅ No unintended side effects

## Future Enhancements

The following enhancements should be considered in a follow-up commit:

1. **Schema Fields**: Add optional fields to planning schema:
   - `HISTORIC_ENGLAND_NOTIFIED: optionalBoolean()`
   - `STATUTORY_CONSULTEES_LIST: optionalString()`

2. **UI Form Fields**: Add checkboxes/inputs to planning notice wizard:
   - Checkbox: "Has Historic England been notified?" (for listed buildings)
   - Textarea: "List of statutory consultees notified" (optional detail field)

3. **Conditional Wording**: Make consultee statement conditional on schema fields:
   - If fields not provided: Use current static wording
   - If fields provided: Customize statement based on actual notification status

## Legal Sign-Off Required

Before pilot launch, planning legal counsel must review sample rendered notices to confirm consultee statements meet Planning (Listed Buildings and Conservation Areas) Act 1990 s.73 requirements and provide sufficient evidence of statutory consultation.

---

**Status**: CRIT-006 implementation complete — ready for testing and legal review
**Estimated Test Time**: 20 minutes
**Implementation Method**: Manual insertion of consultee statements in 2 templates
**Blocking Issues**: None

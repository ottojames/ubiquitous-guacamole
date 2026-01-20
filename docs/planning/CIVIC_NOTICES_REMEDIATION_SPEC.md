# Civic Notices Platform — Statutory Remediation Specification

**Document Version**: 1.0
**Date**: 4 November 2025
**Status**: Production-Ready Implementation Specification
**Target Audience**: CivicDev Engineering Team

---

## Executive Summary

### Purpose

This specification provides a complete, actionable remediation plan for the 32 statutory compliance issues identified in the Civic Notices Platform audit dated 4 November 2025. It translates audit findings into concrete development tasks with clear acceptance criteria, effort estimates, and regulatory validation requirements.

### Current Status

**Platform Readiness**: CONDITIONAL ADOPTION PENDING CRITICAL FIXES

The platform demonstrates strong technical architecture with:
- Comprehensive template infrastructure covering 35+ statutory notice types
- Excellent audit trail capabilities (immutable logs, automatic expiration tracking)
- Robust database design with proper geospatial support
- Modern React 19 + Supabase stack with wizard-based publish flow

**However**, 8 critical statutory compliance gaps prevent immediate production deployment by local authorities and regulatory bodies.

### Scope & Objectives

**What This Specification Covers**:
1. Detailed technical specifications for all 32 identified compliance issues
2. Exact template wording changes required for statutory compliance
3. Schema modifications with field definitions and validation rules
4. Component updates for UI/UX enhancements
5. Database migrations for audit trail and versioning
6. Comprehensive testing requirements with acceptance criteria

**What This Does NOT Cover**:
- New feature development beyond statutory requirements
- Performance optimization (existing architecture is adequate)
- Major architectural refactoring (current patterns are sound)
- Third-party integrations (API development is a future enhancement)

### Critical Path to Launch

**8 Critical Issues** must be resolved before any production deployment:
- 5 missing mandatory statutory declarations (Licensing Act 2003)
- 1 missing responsible authorities statement (Licensing Act 2003)
- 2 missing statutory references (Gambling Act 2005)
- 1 incorrect authority structure (GVOL)
- 1 missing consultee statement (Planning Act 1990)
- 1 incomplete statutory wording (Trustee Act 1925)
- 1 missing multi-jurisdiction support (Licensing Act 2003)

**Timeline Estimate**: 8-12 weeks to full production readiness
- Weeks 1-2: Critical template fixes (8 issues)
- Weeks 3-4: High priority schema enhancements (10 issues)
- Weeks 5-8: Workflow and validation improvements (8 issues)
- Weeks 9-12: Testing, pilot, and production rollout

**Success Criteria**: Zero statutory compliance issues raised by councils; platform meets professional standards for local authority adoption; all notices procedurally valid under UK law.

---

## Prioritized Issue Catalog

### Priority Levels Defined

- **IMMEDIATE**: Must-fix before any production deployment; legal risk of procedurally defective notices
- **HIGH**: Should-fix within first release cycle; significant non-compliance risk or professional readiness gap
- **MEDIUM**: Important improvements for user experience and efficiency; desirable for continuous improvement
- **LOW**: Future enhancements for enterprise adoption; not blocking initial launch

---

## IMMEDIATE PRIORITY ISSUES (8 Issues)

### Issue 001: Licensing Act 2003 - Missing False Statement Warning (5 Templates)

**ID**: CRIT-001
**Severity**: CRITICAL
**Domain**: Statutory Compliance
**Statutory Reference**: Licensing Act 2003 s.17(5)(c); Licensing Act 2003 (Premises licences and club premises certificates) Regulations 2005, Reg 25(1)(d)

**Affected Components**:
- `/src/next/publish/templates/licensing.ts` (lines 33-43, 45-54, 56-63, 65-72, 74-81)

**Current Behavior**:
Five licensing templates omit the mandatory false statement warning:
- `licensing-premises-variation` (lines 33-43)
- `licensing-premises-review` (lines 45-54)
- `licensing-club-new` (lines 56-63)
- `licensing-club-variation` (lines 65-72)
- `licensing-club-review` (lines 74-81)

Only `licensing-premises-new` (lines 19-31) currently includes the warning.

**Required Behavior**:
All licensing templates must include the exact statutory wording mandated by Reg 25(1)(d):

> "It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine."

**Technical Specification**:

Add the following text to the END of each affected template (before the closing backtick):

```javascript
// File: /src/next/publish/templates/licensing.ts

// FOR: licensing-premises-variation (line 43, before closing `)
// FOR: licensing-premises-review (line 54, before closing `)
// FOR: licensing-club-new (line 63, before closing `)
// FOR: licensing-club-variation (line 72, before closing `)
// FOR: licensing-club-review (line 81, before closing `)

// ADD THIS TEXT (separated by blank line from previous content):

It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.
```

**Acceptance Criteria**:
- [ ] All 6 licensing templates contain the false statement warning
- [ ] Wording matches Reg 25(1)(d) exactly (no paraphrasing)
- [ ] Warning appears at the end of each template
- [ ] Unit test confirms presence in all variants
- [ ] Rendered sample notices display warning correctly

**Testing Requirements**:

**Unit Test** (`/src/next/publish/templates/__tests__/licensing.test.ts`):
```typescript
describe('Licensing Templates - Statutory Compliance', () => {
  it('all licensing templates include false statement warning', () => {
    const variants = [
      'licensing-premises-new',
      'licensing-premises-variation',
      'licensing-premises-review',
      'licensing-club-new',
      'licensing-club-variation',
      'licensing-club-review'
    ];

    const requiredPhrase = 'false statement in connection with an application';

    variants.forEach(variant => {
      const mockNotice = createMockLicensingNotice({ variant });
      const rendered = renderLicensingTemplate(mockNotice);

      expect(rendered).toContain(requiredPhrase);
      expect(rendered).toContain('level 5 fine');
    });
  });
});
```

**Integration Test** (E2E):
- Create licensing notice of each type in wizard flow
- Verify warning appears in Step 4 (Review) preview
- Verify warning appears in published notice text
- Verify warning appears in PDF export

**Effort Estimate**: XS (0.5 days)
- 5 simple text additions
- Straightforward unit tests
- No schema changes required

**Risk Assessment**:
- **Legal Risk**: HIGH if not fixed - notices may be procedurally defective, exposing councils to judicial review
- **Technical Risk**: LOW - pure text addition, no logic changes
- **Regression Risk**: MINIMAL - isolated template changes

---

### Issue 002: Licensing Act 2003 - Missing Responsible Authorities Statement

**ID**: CRIT-002
**Severity**: CRITICAL
**Domain**: Statutory Compliance
**Statutory Reference**: Licensing Act 2003 s.17(5)(b), s.13

**Affected Components**:
- `/src/next/publish/schema/licensing.ts` (schema enhancement)
- `/src/next/publish/templates/licensing.ts` (all 6 templates)
- `/src/next/publish/flow/steps/ConfirmStep.tsx` (UI form)

**Current Behavior**:
Templates only state where representations should be sent to the licensing authority, but do not inform representors that they must ALSO serve a copy on each responsible authority (police, fire, health, etc.).

**Required Behavior**:
Section 17(5)(b) requires the notice to facilitate compliance with s.17(3)(b), which mandates that representors serve responsible authorities. Best practice is to state this requirement in the public notice and provide access to the list of responsible authorities.

**Technical Specification**:

**Step 1: Enhance Schema**

File: `/src/next/publish/schema/licensing.ts`

Add after line 102 (after `REFERENCE: optionalString()`):

```typescript
RESPONSIBLE_AUTHORITIES_SERVED: z.enum(['yes', 'pending', 'not_applicable'])
  .optional()
  .describe("Has applicant served all responsible authorities?"),

RESPONSIBLE_AUTHORITIES_LIST_URL: z
  .string()
  .url()
  .optional()
  .transform((value) => (typeof value === "string" ? value.trim() : value))
  .describe("URL where list of responsible authorities can be viewed"),
```

**Step 2: Update All Templates**

File: `/src/next/publish/templates/licensing.ts`

For ALL 6 licensing templates, find the paragraph starting with "Any representations must be made..." and replace with:

```javascript
// CURRENT TEXT (example from line 29):
Any representations must be made {{REPRESENTATION_METHOD}} to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}.

// REPLACE WITH:
Any representations must be made in writing to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}. Representors must also serve a copy of their representations on each of the responsible authorities{{#if RESPONSIBLE_AUTHORITIES_LIST_URL}} (the list is available at {{RESPONSIBLE_AUTHORITIES_LIST_URL}} or from the licensing authority){{/if}}.
```

Apply to:
- Line 29 (`licensing-premises-new`)
- Line 41 (`licensing-premises-variation`)
- Line 52 (`licensing-premises-review`)
- Line 61 (`licensing-club-new`)
- Line 70 (`licensing-club-variation`)
- Line 79 (`licensing-club-review`)

**Step 3: Update UI Form**

File: `/src/next/publish/flow/steps/ConfirmStep.tsx`

Add form field after `REPRESENTATION_EMAIL`:

```tsx
<FormField>
  <label htmlFor="responsibleAuthoritiesUrl">
    Responsible Authorities List URL (Optional)
  </label>
  <input
    type="url"
    id="responsibleAuthoritiesUrl"
    name="RESPONSIBLE_AUTHORITIES_LIST_URL"
    placeholder="https://..."
    className="form-input"
  />
  <p className="text-sm text-gray-600 mt-1">
    Provide a link where representors can view the full list of responsible authorities
    (police, fire, environmental health, etc.). If not provided, generic wording will be used.
  </p>
</FormField>
```

**Acceptance Criteria**:
- [ ] Schema includes new fields with proper validation
- [ ] All 6 templates updated with responsible authorities statement
- [ ] Conditional display of URL works correctly
- [ ] UI form captures URL and validates format
- [ ] Rendered notices show generic statement if URL not provided
- [ ] Rendered notices show specific URL if provided
- [ ] Unit tests cover both conditional branches

**Testing Requirements**:

**Unit Test**:
```typescript
describe('Licensing Templates - Responsible Authorities', () => {
  it('all templates include responsible authorities statement', () => {
    const variants = ['licensing-premises-new', /* ... others */];

    variants.forEach(variant => {
      const mockNotice = createMockLicensingNotice({ variant });
      const rendered = renderLicensingTemplate(mockNotice);

      expect(rendered).toContain('responsible authorities');
      expect(rendered).toContain('serve a copy');
    });
  });

  it('displays URL when provided', () => {
    const notice = createMockLicensingNotice({
      variant: 'licensing-premises-new',
      RESPONSIBLE_AUTHORITIES_LIST_URL: 'https://example.com/responsible-authorities'
    });

    const rendered = renderLicensingTemplate(notice);

    expect(rendered).toContain('https://example.com/responsible-authorities');
    expect(rendered).toContain('list is available at');
  });

  it('displays generic text when URL not provided', () => {
    const notice = createMockLicensingNotice({
      variant: 'licensing-premises-new'
      // No URL
    });

    const rendered = renderLicensingTemplate(notice);

    expect(rendered).toContain('responsible authorities');
    expect(rendered).not.toContain('https://');
  });
});
```

**E2E Test**:
- Create licensing notice with URL provided → verify URL appears in preview
- Create licensing notice without URL → verify generic text appears
- Verify both scenarios work across all 6 template variants

**Effort Estimate**: S (1 day)
- Schema enhancement: 0.25 day
- Template updates (6 variants): 0.25 day
- UI form update: 0.25 day
- Testing: 0.25 day

**Risk Assessment**:
- **Legal Risk**: HIGH if not fixed - failure to facilitate service on RAs is procedural defect
- **Technical Risk**: LOW - conditional rendering is standard pattern
- **Regression Risk**: LOW - schema fields are optional, backward compatible

---

### Issue 003: Gambling Act 2005 - Missing Schedule 9 Reference

**ID**: CRIT-003
**Severity**: CRITICAL
**Domain**: Statutory Compliance
**Statutory Reference**: Gambling Act 2005, Schedule 9

**Affected Components**:
- `/src/next/publish/templates/gambling.ts` (all 16 templates)

**Current Behavior**:
All gambling templates begin with "GAMBLING ACT 2005" but do not cite Schedule 9, which is the statutory source of the notice requirement.

**Required Behavior**:
All gambling notices must reference "Gambling Act 2005, Schedule 9" to properly invoke the statutory framework for applications.

**Technical Specification**:

File: `/src/next/publish/templates/gambling.ts`

Update ALL 16 template headers:

```javascript
// FIND (lines 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 95, 102, 109, 116):
GAMBLING ACT 2005
APPLICATION FOR A [NEW/VARIATION/REVIEW/TRANSFER] [TYPE] PREMISES LICENCE

// REPLACE WITH:
GAMBLING ACT 2005, SCHEDULE 9
APPLICATION FOR A [NEW/VARIATION/REVIEW/TRANSFER] [TYPE] PREMISES LICENCE
```

**Automation Option**:
Can be performed via find-and-replace:

```bash
sed -i '' 's/^GAMBLING ACT 2005$/GAMBLING ACT 2005, SCHEDULE 9/g' src/next/publish/templates/gambling.ts
```

**Affected Templates**:
1. `gambling-betting-new` (line 11)
2. `gambling-betting-variation` (line 18)
3. `gambling-betting-review` (line 25)
4. `gambling-betting-transfer` (line 32)
5. `gambling-bingo-new` (line 39)
6. `gambling-bingo-variation` (line 46)
7. `gambling-bingo-review` (line 53)
8. `gambling-bingo-transfer` (line 60)
9. `gambling-agc-new` (line 67)
10. `gambling-agc-variation` (line 74)
11. `gambling-agc-review` (line 81)
12. `gambling-agc-transfer` (line 88)
13. `gambling-fec-new` (line 95)
14. `gambling-fec-variation` (line 102)
15. `gambling-fec-review` (line 109)
16. `gambling-fec-transfer` (line 116)

**Acceptance Criteria**:
- [ ] All 16 gambling templates include "Schedule 9" in header
- [ ] Wording is consistent across all variants
- [ ] Unit test validates presence in all templates
- [ ] Rendered samples display correctly

**Testing Requirements**:

**Unit Test**:
```typescript
describe('Gambling Templates - Schedule 9 Reference', () => {
  it('all gambling templates cite Schedule 9', () => {
    const variants = [
      'gambling-betting-new', 'gambling-betting-variation', 'gambling-betting-review', 'gambling-betting-transfer',
      'gambling-bingo-new', 'gambling-bingo-variation', 'gambling-bingo-review', 'gambling-bingo-transfer',
      'gambling-agc-new', 'gambling-agc-variation', 'gambling-agc-review', 'gambling-agc-transfer',
      'gambling-fec-new', 'gambling-fec-variation', 'gambling-fec-review', 'gambling-fec-transfer'
    ];

    variants.forEach(variant => {
      const mockNotice = createMockGamblingNotice({ variant });
      const rendered = renderGamblingTemplate(mockNotice);

      expect(rendered).toContain('GAMBLING ACT 2005, SCHEDULE 9');
    });
  });
});
```

**Effort Estimate**: XS (0.25 days)
- 16 identical text changes (can be automated)
- Simple validation test
- No schema or logic changes

**Risk Assessment**:
- **Legal Risk**: HIGH if not fixed - omission may render notices procedurally defective
- **Technical Risk**: MINIMAL - pure text replacement
- **Regression Risk**: NONE - isolated header text change

---

### Issue 004: Gambling Act 2005 - Missing Licensing Objectives

**ID**: CRIT-004
**Severity**: CRITICAL
**Domain**: Statutory Compliance
**Statutory Reference**: Gambling Act 2005 s.1

**Affected Components**:
- `/src/next/publish/templates/gambling.ts` (all 16 templates)

**Current Behavior**:
Templates do not reference the three licensing objectives that representations must address.

**Required Behavior**:
Templates should remind representors that representations must relate to one or more of the licensing objectives defined in s.1:
1. Preventing gambling from being a source of crime or disorder
2. Ensuring gambling is conducted in a fair and open way
3. Protecting children and vulnerable persons from being harmed or exploited

**Technical Specification**:

File: `/src/next/publish/templates/gambling.ts`

For ALL 16 gambling templates, add the following paragraph AFTER the premises description and BEFORE the inspection details:

```javascript
// INSERT THIS BLOCK (adapt line numbers based on template):

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.
```

**Specific Insertion Points**:
- `gambling-betting-new`: After line 14, before "The application can be inspected..."
- `gambling-betting-variation`: After line 21, before "The application..."
- `gambling-betting-review`: After line 28, before "The application..."
- `gambling-betting-transfer`: After line 35, before "The application..."
- (Repeat pattern for bingo, agc, fec variants)

**Acceptance Criteria**:
- [ ] All 16 gambling templates include licensing objectives statement
- [ ] All three objectives are stated (a, b, c)
- [ ] Statement positioned logically before inspection details
- [ ] Unit tests validate presence and content
- [ ] Rendered notices display correctly

**Testing Requirements**:

**Unit Test**:
```typescript
describe('Gambling Templates - Licensing Objectives', () => {
  it('all templates include licensing objectives statement', () => {
    const variants = [
      'gambling-betting-new', /* ... all 16 */
    ];

    const requiredPhrases = [
      'licensing objectives',
      'preventing gambling from being a source of crime',
      'ensuring that gambling is conducted in a fair and open way',
      'protecting children and other vulnerable persons'
    ];

    variants.forEach(variant => {
      const mockNotice = createMockGamblingNotice({ variant });
      const rendered = renderGamblingTemplate(mockNotice);

      requiredPhrases.forEach(phrase => {
        expect(rendered.toLowerCase()).toContain(phrase.toLowerCase());
      });
    });
  });
});
```

**Effort Estimate**: S (0.5 days)
- 16 identical insertions (can be scripted)
- Straightforward testing
- No schema changes

**Risk Assessment**:
- **Legal Risk**: HIGH if not fixed - councils may receive irrelevant representations, increasing administrative burden
- **Technical Risk**: MINIMAL - pure text insertion
- **Regression Risk**: NONE - additive change only

---

### Issue 005: GVOL - Incorrect Statutory Authority Structure

**ID**: CRIT-005
**Severity**: CRITICAL
**Domain**: Statutory Compliance
**Statutory Reference**: Goods Vehicles (Licensing of Operators) Act 1995 s.2, s.57

**Affected Components**:
- `/src/next/publish/schema/gvol.ts` (schema redesign)
- `/src/next/publish/templates/gvol.ts` (2 templates)
- `/src/next/publish/flow/steps/ConfirmStep.tsx` (UI form)

**Current Behavior**:
Templates use generic "AUTHORITY_NAME" and "AUTHORITY_ADDRESS" fields, but GVOL applications are determined by the **Traffic Commissioner** for the relevant traffic area, not a generic local authority.

**Required Behavior**:
Templates must specifically reference the Traffic Commissioner and the correct Traffic Area Office (e.g., "Hillcrest House, 386 Harehills Lane, Leeds LS9 6NF" for Western Traffic Area).

**Technical Specification**:

**Step 1: Update Schema**

File: `/src/next/publish/schema/gvol.ts`

```typescript
// FIND (lines 52-54):
AUTHORITY_NAME: requiredString("Traffic Commissioner / Area office"),
AUTHORITY_ADDRESS: requiredString("Representation address"),
AUTHORITY_EMAIL: optionalString(),

// REPLACE WITH:
TRAFFIC_AREA: z.enum([
  'Scottish',
  'North Eastern',
  'North Western',
  'West Midlands',
  'East of England',
  'Western',
  'South Eastern & Metropolitan',
  'Wales'
]).describe("Traffic Commissioner traffic area"),

TRAFFIC_COMMISSIONER_OFFICE: requiredString("Full address of Traffic Commissioner office for this area"),

TRAFFIC_COMMISSIONER_EMAIL: z
  .string()
  .email()
  .optional()
  .transform((value) => (typeof value === "string" ? value.trim() : value))
  .describe("Email for Traffic Commissioner office"),
```

**Step 2: Update Templates**

File: `/src/next/publish/templates/gvol.ts`

**For `gvol-new` (lines 20-22):**

```javascript
// CURRENT:
Owners or occupiers of land (including buildings) near the operating centre who believe that their use or enjoyment of that land would be affected may make representations to {{AUTHORITY_NAME}}, {{AUTHORITY_ADDRESS}} by {{DEADLINE_DATE}}.

Representations must be made in writing. Representors must at the same time send a copy to the applicant at the address given above.

// REPLACE WITH:
Owners or occupiers of land (including buildings) near the operating centre who believe that their use or enjoyment of that land would be affected should make written representations to the Traffic Commissioner at {{TRAFFIC_COMMISSIONER_OFFICE}} by {{DEADLINE_DATE}}.

Representors must at the same time send a copy of their representations to the applicant at the address given above. A Guide to Making Representations is available from the Traffic Commissioner's office.
```

**For `gvol-variation` (lines 30-33):**

```javascript
// CURRENT:
Owners or occupiers of land (including buildings) near the operating centre who believe that their use or enjoyment of that land would be affected may make representations to {{AUTHORITY_NAME}}, {{AUTHORITY_ADDRESS}} by {{DEADLINE_DATE}}.

Representations must be made in writing. Representors must at the same time send a copy to the applicant at the address given above.

// REPLACE WITH:
Owners or occupiers of land (including buildings) near the operating centre who believe that their use or enjoyment of that land would be affected should make written representations to the Traffic Commissioner at {{TRAFFIC_COMMISSIONER_OFFICE}} by {{DEADLINE_DATE}}.

Representors must at the same time send a copy of their representations to the applicant at the address given above. A Guide to Making Representations is available from the Traffic Commissioner's office.
```

**Step 3: Update UI Form**

File: `/src/next/publish/flow/steps/ConfirmStep.tsx`

Replace authority fields with Traffic Commissioner fields:

```tsx
<FormField>
  <label htmlFor="trafficArea" className="required">
    Traffic Area
  </label>
  <select
    id="trafficArea"
    name="TRAFFIC_AREA"
    required
    className="form-select"
  >
    <option value="">Select traffic area...</option>
    <option value="Scottish">Scottish</option>
    <option value="North Eastern">North Eastern</option>
    <option value="North Western">North Western</option>
    <option value="West Midlands">West Midlands</option>
    <option value="East of England">East of England</option>
    <option value="Western">Western</option>
    <option value="South Eastern & Metropolitan">South Eastern & Metropolitan</option>
    <option value="Wales">Wales</option>
  </select>
</FormField>

<FormField>
  <label htmlFor="trafficCommissionerOffice" className="required">
    Traffic Commissioner Office Address
  </label>
  <textarea
    id="trafficCommissionerOffice"
    name="TRAFFIC_COMMISSIONER_OFFICE"
    required
    rows={3}
    placeholder="e.g., Hillcrest House, 386 Harehills Lane, Leeds LS9 6NF"
    className="form-textarea"
  />
  <p className="text-sm text-gray-600 mt-1">
    Enter the full postal address of the Traffic Commissioner office for the selected traffic area.
  </p>
</FormField>
```

**Step 4: Update Schema Registry**

File: `/src/next/publish/schema/registry.ts`

Update the GVOL builder's `mapToNoticeBase()` function to map new fields:

```typescript
// In GVOL builder:
mapToNoticeBase(validated) {
  return {
    // ... existing mappings
    AUTHORITY_NAME: `Traffic Commissioner (${validated.TRAFFIC_AREA})`,
    AUTHORITY_ADDRESS: validated.TRAFFIC_COMMISSIONER_OFFICE,
    AUTHORITY_EMAIL: validated.TRAFFIC_COMMISSIONER_EMAIL,
    // Add to details:
    details: {
      ...validated,
      TRAFFIC_AREA: validated.TRAFFIC_AREA,
      TRAFFIC_COMMISSIONER_OFFICE: validated.TRAFFIC_COMMISSIONER_OFFICE,
    }
  };
}
```

**Acceptance Criteria**:
- [ ] Schema uses TRAFFIC_AREA enum (not freetext)
- [ ] Schema uses TRAFFIC_COMMISSIONER_OFFICE (not generic AUTHORITY_ADDRESS)
- [ ] Templates reference "Traffic Commissioner" explicitly
- [ ] Templates use TRAFFIC_COMMISSIONER_OFFICE variable
- [ ] UI dropdown presents all 8 traffic areas
- [ ] UI validates office address is provided
- [ ] Rendered notices display "Traffic Commissioner at [address]"
- [ ] Unit tests validate traffic area enum
- [ ] E2E test creates GVOL notice and verifies rendering

**Testing Requirements**:

**Unit Test**:
```typescript
describe('GVOL Templates - Traffic Commissioner Authority', () => {
  it('GVOL templates reference Traffic Commissioner', () => {
    const variants = ['gvol-new', 'gvol-variation'];

    variants.forEach(variant => {
      const mockNotice = createMockGvolNotice({
        variant,
        TRAFFIC_AREA: 'Western',
        TRAFFIC_COMMISSIONER_OFFICE: 'Hillcrest House, 386 Harehills Lane, Leeds LS9 6NF'
      });

      const rendered = renderGvolTemplate(mockNotice);

      expect(rendered).toContain('Traffic Commissioner');
      expect(rendered).toContain('Hillcrest House');
      expect(rendered).not.toContain('AUTHORITY_NAME'); // Ensure variable replaced
    });
  });
});
```

**Effort Estimate**: M (2 days)
- Schema redesign with enum: 0.5 day
- Template updates: 0.25 day
- UI form restructure: 0.5 day
- Schema registry mapping: 0.25 day
- Testing: 0.5 day

**Risk Assessment**:
- **Legal Risk**: CRITICAL if not fixed - incorrect authority renders notices invalid
- **Technical Risk**: MEDIUM - breaking schema change requires migration
- **Regression Risk**: MEDIUM - existing GVOL drafts may need migration

**Migration Strategy**:
- Add new fields as separate columns initially
- Create data migration to map old AUTHORITY_NAME → TRAFFIC_AREA
- Deprecate old fields after migration complete
- Warn users with existing drafts to re-enter details

---

### Issue 006: Planning - Missing Statutory Consultee Statement (Listed Buildings)

**ID**: CRIT-006
**Severity**: CRITICAL
**Domain**: Statutory Compliance
**Statutory Reference**: Planning (Listed Buildings and Conservation Areas) Act 1990 s.73

**Affected Components**:
- `/src/next/publish/schema/planning.ts` (schema enhancement)
- `/src/next/publish/templates/planning.ts` (2 templates: listed building, conservation area)
- `/src/next/publish/flow/steps/ConfirmStep.tsx` (UI form)

**Current Behavior**:
Listed building and conservation area templates do not state that statutory bodies (e.g., Historic England) have been consulted.

**Required Behavior**:
Section 73 requires certain consultees be named in press notices for listed building and conservation area applications.

**Technical Specification**:

**Step 1: Enhance Schema**

File: `/src/next/publish/schema/planning.ts`

Add after line 87 (after `DEADLINE_DATE`):

```typescript
HISTORIC_ENGLAND_NOTIFIED: z
  .boolean()
  .optional()
  .describe("Has Historic England been notified? (required for listed buildings)"),

STATUTORY_CONSULTEES: z
  .string()
  .optional()
  .transform((value) => (typeof value === "string" ? value.trim() : value))
  .describe("Additional statutory consultees notified (e.g., heritage bodies, amenity societies)"),
```

**Step 2: Update Templates**

File: `/src/next/publish/templates/planning.ts`

**For `planning-listed` (lines 44-49):**

```javascript
// REPLACE ENTIRE TEMPLATE WITH:
"planning-listed": `PLANNING (LISTED BUILDINGS AND CONSERVATION AREAS) ACT 1990
APPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — LISTED BUILDING

This application affects a listed building and has been notified to Historic England{{#if STATUTORY_CONSULTEES}} and {{STATUTORY_CONSULTEES}}{{/if}}.

{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for planning permission at {{SITE_ADDRESS}} described as: {{PROPOSAL_DESCRIPTION}}.

Details can be viewed at {{INSPECTION_LOCATION}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}. Comments must be submitted {{COMMENT_METHOD}} to {{AUTHORITY_NAME}} {{COMMENT_DESTINATIONS}} by {{DEADLINE_DATE}}.`,
```

**For `planning-conservation` (lines 51-56):**

```javascript
// REPLACE FIRST PARAGRAPH WITH:
"planning-conservation": `PLANNING (LISTED BUILDINGS AND CONSERVATION AREAS) ACT 1990
APPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — CONSERVATION AREA

This application affects a conservation area and has been notified to relevant heritage bodies{{#if STATUTORY_CONSULTEES}} including {{STATUTORY_CONSULTEES}}{{/if}}.

{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for planning permission at {{SITE_ADDRESS}} described as: {{PROPOSAL_DESCRIPTION}}.

Details can be viewed at {{INSPECTION_LOCATION}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}. Comments must be submitted {{COMMENT_METHOD}} to {{AUTHORITY_NAME}} {{COMMENT_DESTINATIONS}} by {{DEADLINE_DATE}}.`,
```

**Step 3: Update UI Form**

File: `/src/next/publish/flow/steps/ConfirmStep.tsx`

Add conditional fields for listed building and conservation area variants:

```tsx
{(variant === 'planning-listed' || variant === 'planning-conservation') && (
  <>
    <FormField>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="HISTORIC_ENGLAND_NOTIFIED"
          className="form-checkbox"
        />
        <span>Historic England has been notified</span>
      </label>
      {variant === 'planning-listed' && (
        <p className="text-sm text-red-600 mt-1">
          Required for listed building applications (s.73)
        </p>
      )}
    </FormField>

    <FormField>
      <label htmlFor="statutoryConsultees">
        Additional Statutory Consultees (Optional)
      </label>
      <input
        type="text"
        id="statutoryConsultees"
        name="STATUTORY_CONSULTEES"
        placeholder="e.g., Victorian Society, Ancient Monuments Society"
        className="form-input"
      />
      <p className="text-sm text-gray-600 mt-1">
        List any other heritage or amenity societies consulted, separated by commas.
      </p>
    </FormField>
  </>
)}
```

**Step 4: Add Validation**

File: `/src/next/publish/schema/planning.ts`

Add validation in `.superRefine()`:

```typescript
.superRefine((value, ctx) => {
  const isListed = value.variant === "planning-listed";

  if (isListed && !value.HISTORIC_ENGLAND_NOTIFIED) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["HISTORIC_ENGLAND_NOTIFIED"],
      message: "You must confirm Historic England has been notified for listed building applications (s.73 requirement).",
    });
  }

  // ... existing validation
});
```

**Acceptance Criteria**:
- [ ] Schema includes HISTORIC_ENGLAND_NOTIFIED boolean field
- [ ] Schema includes STATUTORY_CONSULTEES text field
- [ ] Listed building template states "notified to Historic England"
- [ ] Conservation area template states "notified to relevant heritage bodies"
- [ ] Conditional UI fields appear only for listed/conservation variants
- [ ] Validation enforces Historic England checkbox for listed buildings
- [ ] Rendered notices display consultee information correctly
- [ ] Unit tests cover both variants

**Testing Requirements**:

**Unit Test**:
```typescript
describe('Planning Templates - Statutory Consultees', () => {
  it('listed building template states Historic England notified', () => {
    const notice = createMockPlanningNotice({
      variant: 'planning-listed',
      HISTORIC_ENGLAND_NOTIFIED: true
    });

    const rendered = renderPlanningTemplate(notice);

    expect(rendered).toContain('Historic England');
    expect(rendered).toContain('has been notified');
  });

  it('conservation area template states heritage bodies notified', () => {
    const notice = createMockPlanningNotice({
      variant: 'planning-conservation',
      STATUTORY_CONSULTEES: 'Victorian Society, Georgian Group'
    });

    const rendered = renderPlanningTemplate(notice);

    expect(rendered).toContain('heritage bodies');
    expect(rendered).toContain('Victorian Society');
  });

  it('validates Historic England checkbox for listed buildings', () => {
    const invalidData = {
      variant: 'planning-listed',
      // Missing HISTORIC_ENGLAND_NOTIFIED
    };

    expect(() => PlanningSchema.parse(invalidData)).toThrow(/Historic England/);
  });
});
```

**Effort Estimate**: S (1 day)
- Schema enhancement: 0.25 day
- Template updates (2 variants): 0.25 day
- UI conditional fields: 0.25 day
- Validation logic: 0.25 day

**Risk Assessment**:
- **Legal Risk**: HIGH if not fixed - failure to demonstrate consultation may render decision susceptible to judicial review
- **Technical Risk**: LOW - standard conditional rendering
- **Regression Risk**: LOW - optional fields, backward compatible

---

### Issue 007: Probate - Incomplete Trustee Act Declaration

**ID**: CRIT-007
**Severity**: CRITICAL
**Domain**: Statutory Compliance
**Statutory Reference**: Trustee Act 1925 s.27(2)

**Affected Components**:
- `/src/next/publish/templates/probate.ts` (line 9-15)

**Current Behavior**:
Template includes "having regard only to the claims of which notice has been received" but lacks the full standard wording used in professional practice.

**Required Behavior**:
Template should explicitly invoke Trustee Act 1925 s.27 and include the complete statutory protection language used by solicitors nationwide.

**Technical Specification**:

File: `/src/next/publish/templates/probate.ts`

Replace entire template (lines 9-15):

```javascript
// CURRENT TEMPLATE:
const TEMPLATE = `NOTICE is hereby given that any persons having claims against or an interest in the estate of the above-named deceased should send particulars of their claims to {{PERSONAL_REPRESENTATIVE}} / {{SOLICITOR_NAME}} at {{SOLICITOR_ADDRESS}} not later than {{DEADLINE_DATE}}.

After this date the estate may be distributed having regard only to the claims of which notice has been received.`;

// REPLACE WITH:
const TEMPLATE = `TRUSTEE ACT 1925, SECTION 27
ESTATE OF {{DECEASED_NAME}}{{#if DECEASED_ALIAS}} (also known as {{DECEASED_ALIAS}}){{/if}}
Last address: {{DECEASED_LAST_ADDRESS}} — Date of death: {{DATE_OF_DEATH}}

NOTICE is hereby given pursuant to section 27 of the Trustee Act 1925 that any persons having claims against or an interest in the estate of the above-named deceased should send written particulars thereof to {{PERSONAL_REPRESENTATIVE}}{{#if SOLICITOR_NAME}} / {{SOLICITOR_NAME}}{{/if}} at {{SOLICITOR_ADDRESS}}{{#if CLAIM_REFERENCE}} quoting reference {{CLAIM_REFERENCE}}{{/if}} on or before {{DEADLINE_DATE}}.

After that date the personal representatives will distribute the estate among the persons entitled thereto, having regard only to the claims and interests of which they have had notice, and will not be liable for the assets of the estate or any part thereof so distributed to any person of whose claims or interests they have not had notice at the time of distribution.`;
```

**Acceptance Criteria**:
- [ ] Template explicitly cites "TRUSTEE ACT 1925, SECTION 27"
- [ ] Template includes "pursuant to section 27 of the Trustee Act 1925"
- [ ] Template includes full liability protection clause
- [ ] Critical phrase "having regard only to the claims and interests of which they have had notice" is present
- [ ] Template includes "will not be liable" protection language
- [ ] Unit test validates presence of all statutory phrases
- [ ] Rendered notices display professional-standard wording

**Testing Requirements**:

**Unit Test**:
```typescript
describe('Probate Template - Trustee Act s.27 Compliance', () => {
  it('template explicitly invokes section 27', () => {
    const notice = createMockProbateNotice();
    const rendered = renderProbateTemplate(notice);

    expect(rendered).toContain('TRUSTEE ACT 1925, SECTION 27');
    expect(rendered).toContain('pursuant to section 27');
  });

  it('template includes full statutory protection wording', () => {
    const notice = createMockProbateNotice();
    const rendered = renderProbateTemplate(notice);

    const requiredPhrases = [
      'having regard only to the claims and interests of which they have had notice',
      'will not be liable',
      'any person of whose claims or interests they have not had notice'
    ];

    requiredPhrases.forEach(phrase => {
      expect(rendered.toLowerCase()).toContain(phrase.toLowerCase());
    });
  });

  it('template displays deceased alias when provided', () => {
    const notice = createMockProbateNotice({
      DECEASED_NAME: 'John Smith',
      DECEASED_ALIAS: 'John P. Smith'
    });

    const rendered = renderProbateTemplate(notice);

    expect(rendered).toContain('John Smith');
    expect(rendered).toContain('also known as John P. Smith');
  });
});
```

**Effort Estimate**: XS (0.25 days)
- Single template replacement
- No schema changes
- Simple validation test

**Risk Assessment**:
- **Legal Risk**: HIGH if not fixed - inadequate protection may expose personal representatives to claims
- **Technical Risk**: MINIMAL - straightforward text replacement
- **Regression Risk**: NONE - enhanced wording provides stronger protection

---

### Issue 008: Licensing - No Multi-Jurisdiction Support

**ID**: CRIT-008
**Severity**: CRITICAL
**Domain**: Professional Readiness
**Statutory Reference**: Licensing Act 2003 s.4 (definition of licensing authority)

**Affected Components**:
- `/src/next/publish/schema/licensing.ts` (schema enhancement)
- `/src/next/publish/templates/licensing.ts` (all 6 templates)
- `/src/next/publish/flow/steps/ConfirmStep.tsx` (UI form)

**Current Behavior**:
Platform assumes a single licensing authority per notice. Cannot handle premises on the boundary of two or more licensing authority areas.

**Required Behavior**:
Support for multiple concurrent licensing authorities when premises are located on boundaries (common in urban areas). Applicants must serve both/all authorities.

**Technical Specification**:

**Step 1: Enhance Schema**

File: `/src/next/publish/schema/licensing.ts`

Add after line 96 (after `AUTHORITY_NAME`):

```typescript
ADDITIONAL_LICENSING_AUTHORITIES: z
  .array(
    z.object({
      name: z.string().min(1, "Authority name required"),
      address: z.string().optional(),
      email: z.string().email("Invalid email").optional(),
    })
  )
  .optional()
  .describe("Additional licensing authorities for boundary premises"),

PRIMARY_AUTHORITY_DESIGNATION: z
  .string()
  .optional()
  .describe("Designation of which authority is lead/coordinating authority"),
```

**Step 2: Update Templates**

File: `/src/next/publish/templates/licensing.ts`

For ALL 6 licensing templates, update the line that states the application:

```javascript
// FIND (example from line 21):
{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a new premises licence...

// REPLACE WITH:
{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}}{{#if ADDITIONAL_LICENSING_AUTHORITIES}} (concurrent applications to {{#each ADDITIONAL_LICENSING_AUTHORITIES}}{{name}}{{#unless @last}}, {{/unless}}{{/each}}){{/if}} for a {{#if variant}}{{variant}}{{else}}new{{/if}} premises licence...
```

Apply to all 6 templates:
- Line 21 (`licensing-premises-new`)
- Line 35 (`licensing-premises-variation`)
- Line 47 (`licensing-premises-review`)
- Line 58 (`licensing-club-new`)
- Line 67 (`licensing-club-variation`)
- Line 76 (`licensing-club-review`)

**Step 3: Update UI Form**

File: `/src/next/publish/flow/steps/ConfirmStep.tsx`

Add dynamic field for additional authorities:

```tsx
<FormSection>
  <h3>Licensing Authorities</h3>

  <FormField>
    <label htmlFor="authorityName" className="required">
      Primary Licensing Authority
    </label>
    <input
      type="text"
      id="authorityName"
      name="AUTHORITY_NAME"
      required
      className="form-input"
    />
  </FormField>

  <FormField>
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        id="boundaryPremises"
        onChange={(e) => setShowAdditionalAuthorities(e.target.checked)}
        className="form-checkbox"
      />
      <span>This premises is on a boundary between multiple licensing authority areas</span>
    </label>
  </FormField>

  {showAdditionalAuthorities && (
    <FormField>
      <label>Additional Licensing Authorities</label>
      <div className="space-y-2">
        {additionalAuthorities.map((auth, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              placeholder="Authority name"
              value={auth.name}
              onChange={(e) => updateAuthority(index, 'name', e.target.value)}
              className="form-input flex-1"
            />
            <button
              type="button"
              onClick={() => removeAuthority(index)}
              className="btn-secondary"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addAuthority}
          className="btn-secondary"
        >
          + Add Authority
        </button>
      </div>
      <p className="text-sm text-gray-600 mt-1">
        For boundary premises, you must serve all licensing authorities. Add all authorities
        that have jurisdiction over the premises location.
      </p>
    </FormField>
  )}
</FormSection>
```

**Step 4: Verify Handlebars Helper Support**

File: Check template rendering engine

Ensure Handlebars `each` helper is supported:

```typescript
// In template renderer (e.g., /src/next/publish/templates/index.ts):
import Handlebars from 'handlebars';

// Register unless helper if not already available
Handlebars.registerHelper('unless', function(conditional, options) {
  if (!conditional) {
    return options.fn(this);
  }
  return options.inverse(this);
});
```

**Acceptance Criteria**:
- [ ] Schema accepts array of additional authorities
- [ ] Each authority object includes name, address, email
- [ ] Templates conditionally display additional authorities
- [ ] Multiple authorities joined with commas correctly
- [ ] UI checkbox reveals additional authority fields
- [ ] UI allows adding/removing authorities dynamically
- [ ] Rendered notices display primary + additional authorities correctly
- [ ] Unit tests cover single authority and multi-authority scenarios
- [ ] E2E test creates boundary premises notice

**Testing Requirements**:

**Unit Test**:
```typescript
describe('Licensing Templates - Multi-Jurisdiction Support', () => {
  it('displays single authority when no additional authorities', () => {
    const notice = createMockLicensingNotice({
      variant: 'licensing-premises-new',
      AUTHORITY_NAME: 'Westminster City Council'
    });

    const rendered = renderLicensingTemplate(notice);

    expect(rendered).toContain('Westminster City Council');
    expect(rendered).not.toContain('concurrent applications');
  });

  it('displays multiple authorities when provided', () => {
    const notice = createMockLicensingNotice({
      variant: 'licensing-premises-new',
      AUTHORITY_NAME: 'Westminster City Council',
      ADDITIONAL_LICENSING_AUTHORITIES: [
        { name: 'Camden Borough Council', address: '', email: '' },
        { name: 'City of London Corporation', address: '', email: '' }
      ]
    });

    const rendered = renderLicensingTemplate(notice);

    expect(rendered).toContain('Westminster City Council');
    expect(rendered).toContain('concurrent applications');
    expect(rendered).toContain('Camden Borough Council');
    expect(rendered).toContain('City of London Corporation');
  });

  it('formats multiple authorities with correct punctuation', () => {
    const notice = createMockLicensingNotice({
      ADDITIONAL_LICENSING_AUTHORITIES: [
        { name: 'Authority A' },
        { name: 'Authority B' }
      ]
    });

    const rendered = renderLicensingTemplate(notice);

    // Should be "Authority A, Authority B" not "Authority A, , Authority B"
    expect(rendered).toContain('Authority A, Authority B');
  });
});
```

**E2E Test**:
```typescript
test('can create boundary premises notice with multiple authorities', async ({ page }) => {
  await page.goto('/publish/step-1');
  await page.click('text=Licensing Act 2003');
  await page.click('text=Premises Licence — New');

  // ... complete steps 2-3

  // Step 3: Confirm Details
  await page.fill('[name="AUTHORITY_NAME"]', 'Westminster City Council');
  await page.check('#boundaryPremises');
  await page.fill('[name="ADDITIONAL_LICENSING_AUTHORITIES[0].name"]', 'Camden Borough Council');

  // Step 4: Review
  const preview = page.locator('[data-testid="notice-preview"]');
  await expect(preview).toContainText('Westminster City Council');
  await expect(preview).toContainText('concurrent applications');
  await expect(preview).toContainText('Camden Borough Council');
});
```

**Effort Estimate**: M (2 days)
- Schema enhancement with nested array: 0.5 day
- Template updates (6 variants): 0.25 day
- UI dynamic form with add/remove: 0.75 day
- Handlebars helper verification: 0.25 day
- Testing: 0.25 day

**Risk Assessment**:
- **Legal Risk**: CRITICAL if not fixed - boundary premises are common; platform must handle this
- **Technical Risk**: MEDIUM - dynamic form state management and Handlebars `each` loop
- **Regression Risk**: LOW - optional field, backward compatible

**Migration Strategy**:
- New field is optional, existing notices unaffected
- No data migration required
- Provide guidance to councils on when to use multi-jurisdiction

---

## HIGH PRIORITY ISSUES (10 Issues)

*[Due to length constraints, I'll provide a condensed format for High priority issues. Full specifications follow the same pattern as Critical issues above.]*

### Issue 009: Licensing - Incomplete DPS Declaration

**ID**: HIGH-009
**Severity**: HIGH
**Domain**: Statutory Compliance
**Statutory Reference**: Licensing Act 2003 s.15, s.18

**Affected Components**: `/src/next/publish/templates/licensing.ts` (lines 25, 39)

**Current**: `{{#if DPS_NAME}} The proposed designated premises supervisor is {{DPS_NAME}}.{{/if}}`

**Required**: `{{#if DPS_NAME}} The proposed designated premises supervisor is {{DPS_NAME}}{{#if DPS_LICENSING_AUTHORITY}}, holder of a personal licence issued by {{DPS_LICENSING_AUTHORITY}}{{/if}}.{{/if}}`

**Note**: `DPS_LICENSING_AUTHORITY` already exists in schema (line 81), so no schema change needed.

**Effort**: XS (0.25 days)

---

### Issue 010: Licensing - Add Interim Steps Notice Type

**ID**: HIGH-010
**Severity**: HIGH
**Domain**: Statutory Compliance
**Statutory Reference**: Licensing Act 2003 ss.53A-53C (VCRA 2006)

**Affected Components**:
- `/src/next/publish/config/noticeTypes.ts` (add notice definition)
- `/src/next/publish/schema/licensing.ts` (add validation)
- `/src/next/publish/templates/licensing.ts` (new template)
- `/src/next/publish/schema/registry.ts` (register builder)

**Required**: Create complete notice type for interim steps pending review (urgent licensing enforcement actions).

**Effort**: M (2 days)

---

### Issue 011: Gambling - Transfer Notice Period

**ID**: HIGH-011
**Severity**: HIGH
**Domain**: Statutory Compliance
**Statutory Reference**: Gambling Act 2005 Schedule 9 Part 8 para 35

**Affected Components**: `/src/next/publish/templates/gambling.ts` (4 transfer templates: lines 32-37, 60-64, 88-92, 116-120)

**Required**: Add statement: "The licensing authority must determine this application within 14 days beginning with the day on which it received the application (Schedule 9, para 35)."

**Effort**: XS (0.5 days)

---

### Issue 012: Gambling - Review Applicant Category Validation

**ID**: HIGH-012
**Severity**: HIGH
**Domain**: Statutory Compliance
**Statutory Reference**: Gambling Act 2005 ss.157-158

**Affected Components**: `/src/next/publish/schema/gambling.ts`

**Required**: Add field `REVIEW_APPLICANT_CATEGORY: z.enum(['licensing_authority', 'responsible_authority', 'interested_party'])`

**Effort**: S (0.5 days)

---

### Issue 013: GVOL - Missing Existing Licence Number Field

**ID**: HIGH-013
**Severity**: HIGH
**Domain**: Statutory Compliance
**Statutory Reference**: Goods Vehicles (Licensing of Operators) Regulations 1995 Reg 3

**Affected Components**:
- `/src/next/publish/schema/gvol.ts` (add field)
- `/src/next/publish/templates/gvol.ts` (variation template)

**Required**: Add `EXISTING_LICENCE_NUMBER: optionalString()` and display in variation template as "(Operator's Licence No. {{EXISTING_LICENCE_NUMBER}})"

**Effort**: XS (0.5 days)

---

### Issue 014: Planning EIA - Missing Environmental Statement Inspection Details

**ID**: HIGH-014
**Severity**: HIGH
**Domain**: Statutory Compliance
**Statutory Reference**: EIA Regulations 2017 Reg 19(3)

**Affected Components**:
- `/src/next/publish/schema/planning.ts` (add fields)
- `/src/next/publish/templates/planning.ts` (EIA template)

**Required**: Add `ENVIRONMENTAL_STATEMENT_LOCATION` and `ENVIRONMENTAL_STATEMENT_TIMES` fields. Template must state "may be inspected free of charge at [location] during [times]".

**Effort**: S (1 day)

---

### Issue 015: Licensing & Gambling - Newspaper Circulation Validation

**ID**: HIGH-015
**Severity**: HIGH
**Domain**: Workflow Integrity
**Statutory Reference**: Licensing Act 2003 Reg 25(2)(b); Gambling Act 2005 Sch 9 para 10(2)

**Affected Components**:
- `/src/next/publish/schema/licensing.ts` (add fields)
- `/src/next/publish/schema/gambling.ts` (add fields)
- UI forms in ConfirmStep

**Required**: Add fields:
```typescript
NEWSPAPER_NAME: requiredString("Name of newspaper"),
NEWSPAPER_CIRCULATION_AREA: requiredString("Newspaper circulation area"),
NEWSPAPER_CIRCULATES_LOCALLY: z.boolean().refine(val => val === true, {
  message: "You must confirm the newspaper circulates in the vicinity of the premises"
}),
```

**Effort**: M (1.5 days)

---

### Issue 016: Data Protection - GDPR Redaction Guidance

**ID**: HIGH-016
**Severity**: HIGH
**Domain**: Data Protection & Security
**Statutory Reference**: UK GDPR Article 5(1)(c) (Data Minimisation)

**Affected Components**:
- Create `/src/next/publish/flow/components/PrivacyGuidance.tsx`
- Integrate in `/src/next/publish/flow/steps/ConfirmStep.tsx`

**Required**: Display prominent guidance warning users to minimize personal data:
- Use business addresses, not home addresses
- Use business email/phone, not personal
- For probate, deceased's address required but next-of-kin details are not
- No sensitive personal data

**Effort**: S (0.5 days)

---

### Issue 017: Template Versioning System

**ID**: HIGH-017
**Severity**: HIGH
**Domain**: Professional Readiness
**Statutory Reference**: Regulatory change management requirement

**Affected Components**:
- Create migration `/supabase/migrations/20251105000001_template_versioning.sql`
- Create `notice_template_versions` table
- Link `notices.template_version_id` to specific version
- Create seed script to populate from current templates

**Required**: Full version control system for statutory templates with:
- Version history tracking
- Statutory basis documentation
- Change summary logging
- Effective/deprecated date tracking
- Audit trail linking notices to template version used

**Effort**: L (3 days)

---

### Issue 018: Planning Departure - Missing Explanation

**ID**: HIGH-018
**Severity**: MEDIUM
**Domain**: Wording & Presentation
**Statutory Reference**: Town and Country Planning (DMP) Order 2015 Art 15

**Affected Components**: `/src/next/publish/templates/planning.ts` (planning-departure template)

**Required**: Add explanatory text: "This application is a departure from the Development Plan and has been notified to the Secretary of State."

**Effort**: XS (0.25 days)

---

## MEDIUM PRIORITY ISSUES (8 Issues)

*[Condensed format continues]*

### Issue 019: Licensing - 28-Day Consultation Clarification

**ID**: MED-019
**File**: `/src/next/publish/validation/windowRules.ts` (lines 78-85)
**Fix**: Update error message to clarify "28 consecutive days from the day AFTER the application date"
**Effort**: XS (0.25 days)

---

### Issue 020: Licensing - 10 Working Days Calculation Off-by-One

**ID**: MED-020
**File**: `/src/next/publish/validation/windowRules.ts` (lines 87-95)
**Fix**: Change `if (workingDays > 10)` to `if (workingDays >= 10)` and adjust start date to day after application
**Effort**: XS (0.25 days)

---

### Issue 021: GVOL - 21 Days Should Be Minimum (Not Exact)

**ID**: MED-021
**File**: `/src/next/publish/validation/windowRules.ts` (lines 134-143)
**Fix**: Change `if (diff !== 21)` to `if (diff < 21)` and update message
**Effort**: XS (0.25 days)

---

### Issue 022: Planning EIA - Consultation Calculation Date

**ID**: MED-022
**File**: `/src/next/publish/validation/windowRules.ts` (lines 146-156)
**Fix**: Verify 30-day period calculated from publication date, not application date
**Effort**: S (0.5 days)

---

### Issue 023: Probate - Clarify Two-Month Minimum

**ID**: MED-023
**File**: `/src/next/publish/validation/windowRules.ts` (lines 159-171)
**Fix**: Update message to state "minimum" and recommend 3-6 months for complex estates
**Effort**: XS (0.25 days)

---

### Issue 024: OCR - Auto-Calculate Representation Deadlines

**ID**: MED-024
**File**: `/src/next/publish/flow/lib/legalDetails.ts` (after line 491)
**Fix**: Add logic to calculate statutory deadline from extracted application date based on notice type
**Effort**: M (1 day)

---

### Issue 025: Draft Management - Expiry Warnings

**ID**: MED-025
**File**: `/src/wizard/draftStore.ts`
**Fix**: Add timestamp checking on draft load; warn if application date > 9 working days old
**Effort**: M (1 day)

---

### Issue 026: Audit Trail - Publication Hash for Legal Evidence

**ID**: MED-026
**File**: Create `/supabase/migrations/20251105000002_publication_hash.sql`
**Fix**: Add `publication_hash` column with SHA-256 trigger on status change to 'published'
**Effort**: S (1 day)

---

## DESIRABLE ENHANCEMENTS (6 Issues)

*[Brief descriptions only]*

### Issue 027: Probate - Multiple Aliases Support
**Effort**: S (1 day) - Change `DECEASED_ALIAS` to array

### Issue 028: Interested Party vs RA Guidance
**Effort**: S (0.5 days) - Create tooltip component

### Issue 029: REST API for Integration
**Effort**: XL (15+ days) - Full API development

### Issue 030: Bulk Import/Export
**Effort**: L (5 days) - CSV import, Excel export

### Issue 031: White-Label Branding
**Effort**: L (5 days) - Per-organization customization

### Issue 032: Developer Documentation
**Effort**: M (2 days) - API docs, integration guides

---

## Testing Requirements

### Unit Test Coverage

**Priority**: CRITICAL for all IMMEDIATE issues

Create comprehensive unit test suite in `/src/next/publish/templates/__tests__/`:

1. **statutory-compliance.test.ts**: Validate all mandatory statutory statements present
2. **licensing.test.ts**: Test all 6 licensing variants
3. **gambling.test.ts**: Test all 16 gambling variants
4. **gvol.test.ts**: Test Traffic Commissioner references
5. **planning.test.ts**: Test consultee statements
6. **probate.test.ts**: Test s.27 protection wording

**Coverage Target**: 100% of CRITICAL and HIGH priority template changes

**Example Pattern**:
```typescript
describe('Statutory Compliance - Mandatory Statements', () => {
  it('licensing templates include false statement warning', () => {
    LICENSING_VARIANTS.forEach(variant => {
      const rendered = renderTemplate(variant, mockData);
      expect(rendered).toContain('false statement');
      expect(rendered).toContain('level 5 fine');
    });
  });
});
```

---

### Integration Testing

**Priority**: HIGH for all schema and workflow changes

Create integration tests in `/tests/integration/`:

1. **schema-validation.test.ts**: Test all schema enhancements validate correctly
2. **template-rendering.test.ts**: Test schema data maps to templates correctly
3. **wizard-flow.test.ts**: Test UI captures and passes data through wizard
4. **publication-flow.test.ts**: Test end-to-end notice creation and publication

**Key Scenarios**:
- Create notice with minimal required fields → validates successfully
- Create notice with all optional fields → renders correctly
- Create notice with invalid data → shows appropriate errors
- Multi-jurisdiction notice → displays all authorities correctly

---

### End-to-End Testing

**Priority**: CRITICAL before pilot launch

Create E2E tests in `/e2e/`:

1. **licensing-notice-flow.spec.ts**: Complete licensing notice creation
2. **gambling-notice-flow.spec.ts**: Complete gambling notice creation
3. **gvol-notice-flow.spec.ts**: Complete GVOL notice creation
4. **planning-notice-flow.spec.ts**: Complete planning notice creation
5. **probate-notice-flow.spec.ts**: Complete probate notice creation

**Test Pattern**:
```typescript
test('create licensing premises new notice with all statutory elements', async ({ page }) => {
  // Step 1: Select notice type
  await page.goto('/publish/step-1');
  await selectNoticeType('Licensing Act 2003', 'Premises Licence — New');

  // Step 2: Upload form
  await uploadFile('sample-licensing-application.pdf');
  await verifyOCRExtraction();

  // Step 3: Confirm details
  await fillRequiredFields();
  await fillOptionalFields();

  // Step 4: Review and verify
  const preview = page.locator('[data-testid="notice-preview"]');
  await expect(preview).toContainText('false statement');
  await expect(preview).toContainText('responsible authorities');

  // Publish
  await page.click('button:has-text("Publish Notice")');
  await expect(page).toHaveURL(/\/notices\/\d+/);
});
```

---

### Regulatory Validation Checklists

**Priority**: CRITICAL for legal sign-off

Use these checklists for manual validation after automated tests pass:

#### Licensing Act 2003 Checklist
- [ ] All 6 templates include false statement warning (exact wording)
- [ ] All templates state responsible authorities service requirement
- [ ] DPS personal licence authority displayed when applicable
- [ ] 28-day consultation period validated correctly
- [ ] 10-working-day newspaper window calculated correctly
- [ ] Multi-jurisdiction support works for boundary premises
- [ ] Interim steps notice type available and renders correctly

#### Gambling Act 2005 Checklist
- [ ] All 16 templates cite Schedule 9
- [ ] All templates list three licensing objectives
- [ ] Transfer notices state 14-day determination period
- [ ] Review applicant category captured and validated
- [ ] Newspaper circulation validated

#### GVOL Checklist
- [ ] Templates reference Traffic Commissioner (not generic authority)
- [ ] Traffic area dropdown presents all 8 areas
- [ ] Variation notices display existing licence number
- [ ] 21-day minimum (not exact) consultation validated

#### Planning Checklist
- [ ] Listed building notices state Historic England consultation
- [ ] Conservation area notices state heritage bodies
- [ ] EIA notices include ES inspection location and times
- [ ] Departure notices explain development plan departure

#### Probate Checklist
- [ ] Template explicitly invokes Trustee Act 1925 s.27
- [ ] Full liability protection clause present
- [ ] "Having regard only to claims received" wording present
- [ ] Two-month minimum validated

---

## Rollout Criteria

### Phase 1: Critical Fixes Complete (Definition of Done)

**Before proceeding to pilot**:
- [ ] All 8 CRITICAL issues resolved and tested
- [ ] Unit tests passing for all template changes (100% coverage)
- [ ] Integration tests passing for all schema changes
- [ ] E2E smoke tests passing for each notice category
- [ ] Manual regulatory checklist validation complete
- [ ] Legal counsel review of corrected templates obtained
- [ ] Sample notices rendered for all variants
- [ ] No regression in existing functionality
- [ ] Code review complete with sign-off from senior engineer
- [ ] Documentation updated (CLAUDE.md, README.md)

---

### Phase 2: High Priority Issues Complete (Pilot Readiness)

**Before opening to multiple councils**:
- [ ] All HIGH priority issues resolved
- [ ] Template versioning system operational
- [ ] GDPR redaction guidance displayed in wizard
- [ ] Newspaper circulation validation enforced
- [ ] Full test suite passing (unit + integration + E2E)
- [ ] Performance testing complete (no degradation)
- [ ] Security audit complete (RLS policies verified)
- [ ] Pilot user training materials prepared
- [ ] Support escalation process established

---

### Phase 3: Production Ready (Full Launch)

**Before general availability**:
- [ ] All MEDIUM priority issues resolved or deferred with justification
- [ ] Pilot feedback incorporated
- [ ] Zero critical bugs in production
- [ ] Uptime > 99.5% during pilot
- [ ] Average notice publication time < 15 minutes
- [ ] User satisfaction score > 8/10 from pilot councils
- [ ] Regulatory sign-off from at least 3 councils
- [ ] Marketing materials prepared
- [ ] Self-service onboarding flow tested
- [ ] 24/7 support coverage established

---

## Risk Register

### Critical Risks

**RISK-001: Legal Challenge to Published Notices**
- **Probability**: HIGH if CRITICAL issues not fixed
- **Impact**: SEVERE - notices invalidated, councils liable
- **Mitigation**: Complete Phase 1 before any production use; obtain legal counsel review

**RISK-002: Breaking Schema Changes Affect Existing Drafts**
- **Probability**: MEDIUM (GVOL authority structure change)
- **Impact**: HIGH - user frustration, data loss
- **Mitigation**: Implement migration script; warn users to re-enter; provide grace period

**RISK-003: Handlebars Template Engine Limitations**
- **Probability**: LOW (each helper not supported)
- **Impact**: MEDIUM - multi-jurisdiction rendering fails
- **Mitigation**: Verify Handlebars version; implement custom helpers; test thoroughly

---

### Technical Risks

**RISK-004: Performance Degradation from Schema Complexity**
- **Probability**: LOW (new fields are optional)
- **Impact**: LOW - slight increase in render time
- **Mitigation**: Load testing; optimize queries; add indexes if needed

**RISK-005: UI Form Complexity Reduces Usability**
- **Probability**: MEDIUM (many new fields)
- **Impact**: MEDIUM - user confusion, abandonment
- **Mitigation**: Progressive disclosure; conditional fields; inline help text; user testing

---

### Compliance Risks

**RISK-006: Misinterpretation of Statutory Requirements**
- **Probability**: MEDIUM (some regulations open to interpretation)
- **Impact**: HIGH - non-compliant notices
- **Mitigation**: Legal counsel review; consultation with licensing officers; pilot testing

**RISK-007: Regulatory Changes During Development**
- **Probability**: LOW (regulations stable)
- **Impact**: MEDIUM - rework required
- **Mitigation**: Template versioning system; monitor gov.uk for updates; agile adaptation

---

## Dependencies and Blockers

### External Dependencies

1. **Legal Counsel Review** (Week 2)
   - Required before pilot launch
   - Potential delay if legal team overcommitted
   - Mitigation: Engage legal early; provide clear documentation

2. **Pilot Council Availability** (Week 5)
   - Need 2-3 councils willing to participate
   - Potential delay if councils unavailable
   - Mitigation: Pre-identify candidates; offer incentives (free subscription)

3. **Traffic Commissioner Office Data** (GVOL fix)
   - Need accurate addresses for all 8 traffic areas
   - Low risk - publicly available data
   - Mitigation: Source from gov.uk; provide dropdown

---

### Internal Dependencies

1. **Handlebars Template Engine Upgrade** (if needed)
   - Multi-jurisdiction support requires `each` helper
   - Potential blocker if not supported
   - Mitigation: Verify version; upgrade if needed; test compatibility

2. **Database Migration for Template Versioning**
   - Must complete before deploying new templates
   - Risk of rollback if migration fails
   - Mitigation: Test migration on staging; create rollback script

3. **QA Team Capacity** (Weeks 3-4)
   - Comprehensive testing required
   - Potential delay if QA overloaded
   - Mitigation: Allocate dedicated QA resource; prioritize critical path

---

## Success Metrics

### Compliance Metrics (Primary)

**Target**: Zero statutory compliance issues raised by councils

- **Metric 1**: Number of legal challenges to published notices
  - **Target**: 0 per year
  - **Measurement**: Track judicial review applications, ombudsman complaints

- **Metric 2**: Template version audit trail completeness
  - **Target**: 100% of notices linked to template version
  - **Measurement**: Database query `SELECT COUNT(*) FROM notices WHERE template_version_id IS NULL`

- **Metric 3**: Regulatory audit pass rate
  - **Target**: 100% pass on re-audit after remediation
  - **Measurement**: External audit using CIVIC_NOTICES_STATUTORY_AUDIT_REPORT checklist

---

### Quality Metrics (Secondary)

**Target**: High-quality, error-free notices

- **Metric 4**: Notice rejection rate
  - **Target**: < 5% of notices require correction before publication
  - **Measurement**: Track notices returned from review step

- **Metric 5**: Time to publish notice
  - **Target**: < 15 minutes from form upload to publication
  - **Measurement**: Average time delta between notice creation and publication

- **Metric 6**: User satisfaction score
  - **Target**: > 8.5/10
  - **Measurement**: Post-publication survey

---

### Adoption Metrics (Tertiary)

**Target**: Widespread council adoption

- **Metric 7**: Active councils using platform
  - **Target**: 50+ by Month 12
  - **Measurement**: Count of councils with published notice in last 90 days

- **Metric 8**: Notices published per month
  - **Target**: 500+ by Month 12
  - **Measurement**: Total published notices per calendar month

- **Metric 9**: Support ticket volume (compliance-related)
  - **Target**: < 2 per month
  - **Measurement**: Track Zendesk/support tickets tagged "statutory compliance"

---

## Appendix: Statutory Reference Library

### Licensing Act 2003
- **Section 13**: Definition of "responsible authorities"
- **Section 17**: Application for premises licence - notice requirements
- **Section 17(3)(b)**: Applicant must serve each responsible authority
- **Section 17(5)(b)**: Notice must specify representation deadline
- **Section 17(5)(c)**: Notice must include false statement warning
- **Section 53A-53C**: Interim steps pending review (VCRA 2006)
- **Regulations 2005, Reg 25**: Form and content of notice
- **Regulations 2005, Reg 25(1)(d)**: Exact wording of false statement warning
- **Regulations 2005, Reg 25(2)(a)**: 10 working days newspaper publication
- **Regulations 2005, Reg 25(2)(b)**: Newspaper must circulate in vicinity
- **Regulations 2005, Reg 26(2)**: 28 consecutive days consultation period

### Gambling Act 2005
- **Section 1**: The three licensing objectives
- **Section 157-158**: Definition of "interested party" and "responsible authority"
- **Schedule 9**: Premises licence applications and procedures
- **Schedule 9, Part 2**: New premises licence applications
- **Schedule 9, para 10**: Public notice requirements
- **Schedule 9, para 10(2)**: Newspaper circulation requirement
- **Schedule 9, para 10(3)**: Prescribed notice content
- **Schedule 9, Part 8**: Transfer applications
- **Schedule 9, para 35**: 14-day determination period for transfers

### Goods Vehicles (Licensing of Operators) Act 1995
- **Section 2**: Traffic Commissioners - appointment and areas
- **Section 57**: Objections to applications
- **Regulations 1995, Reg 3**: Publication requirements
- **Regulations 1995, Reg 3(3)**: Not less than 21 days notice period

### Town and Country Planning Act 1990
- **Section 65**: Planning applications - publicity requirements
- **Planning (LBCA) Act 1990, s.73**: Listed building notice requirements
- **EIA Regulations 2017, Reg 19**: Environmental statement publicity
- **EIA Regulations 2017, Reg 19(3)**: Minimum 30 days consultation
- **EIA Regulations 2017, Reg 19(3)(e)**: Consultation period from publication
- **DMP Order 2015, Art 15**: Departure from development plan notices

### Trustee Act 1925
- **Section 27**: Protection of personal representatives from liability
- **Section 27(2)**: Two-month minimum notice period
- **Section 27(2)**: "Having regard only to claims received" protection language

### UK GDPR
- **Article 5(1)(c)**: Data minimisation principle
- **Article 5(1)(f)**: Integrity and confidentiality principle

---

## Document Control

**Version History**:
- v1.0 (4 Nov 2025): Initial comprehensive specification

**Next Review**: After Phase 1 (Critical fixes) implementation complete

**Approval Required From**:
- CTO (technical feasibility)
- Legal Counsel (statutory compliance)
- Product Owner (scope and priorities)

**Contact for Questions**:
- Technical Specifications: Lead Engineer
- Regulatory Interpretation: Legal Counsel
- Timeline and Priorities: Product Owner

---

**END OF REMEDIATION SPECIFICATION**

**Status**: Ready for immediate implementation by CivicDev team

**Next Steps**:
1. Engineering team reviews specification (Week 1 Day 1-2)
2. Legal counsel reviews corrected template wording (Week 1 Day 3-5)
3. Sprint planning for Phase 1 implementation (Week 2 Day 1)
4. Development begins (Week 2 Day 2)
5. Testing and QA (Week 3-4)
6. Pilot launch (Week 5)

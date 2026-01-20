# Civic Notices Platform — Statutory Compliance Remediation Plan

**Date**: 4 November 2025
**Version**: 1.0
**Status**: Ready for Implementation

---

## IMMEDIATE ACTIONS (Before Production Launch)

### Issue 1: Licensing Act 2003 - Missing False Statement Warning

**Priority**: CRITICAL
**Affected Files**: `/src/next/publish/templates/licensing.ts`
**Affected Templates**: Lines 33-43, 45-54, 56-63, 65-72, 74-81
**Statutory Requirement**: Licensing Act 2003 s.17(5)(c); Regulations 2005 Reg 25(1)(d)

**Problem**: Five of six licensing templates omit the mandatory false statement warning. Only `licensing-premises-new` includes it.

**Fix**: Add to END of each template (before closing backtick):

```javascript
// FOR: licensing-premises-variation (line 43)
// FOR: licensing-premises-review (line 54)
// FOR: licensing-club-new (line 63)
// FOR: licensing-club-variation (line 72)
// FOR: licensing-club-review (line 81)

// ADD THIS TEXT:

It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.
```

**Validation**: After implementation, grep all templates to confirm presence:
```bash
grep -n "false statement" src/next/publish/templates/licensing.ts
# Should return 6 matches (one per template)
```

---

### Issue 2: Licensing Act 2003 - Missing Responsible Authorities Statement

**Priority**: CRITICAL
**Affected Files**:
- `/src/next/publish/schema/licensing.ts` (schema enhancement)
- `/src/next/publish/templates/licensing.ts` (all templates)
**Statutory Requirement**: Licensing Act 2003 s.17(5)(b), s.13

**Problem**: Templates do not inform representors that they should also serve responsible authorities with a copy.

**Fix Step 1: Enhance Schema**

Edit `/src/next/publish/schema/licensing.ts`, add after line 102 (after `REFERENCE: optionalString()`):

```typescript
RESPONSIBLE_AUTHORITIES_SERVED: z.enum(['yes', 'no']).optional(),
RESPONSIBLE_AUTHORITIES_LIST_URL: optionalUrl(),
```

**Fix Step 2: Update Templates**

For ALL templates in `/src/next/publish/templates/licensing.ts`, replace the "Any representations must be made..." paragraph with:

```javascript
// FIND (example from line 29):
Any representations must be made {{REPRESENTATION_METHOD}} to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}.

// REPLACE WITH:
Any representations must be made in writing to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}. Representors must also serve a copy on each of the responsible authorities{{#if RESPONSIBLE_AUTHORITIES_LIST_URL}} (list available at {{RESPONSIBLE_AUTHORITIES_LIST_URL}}){{/if}}.
```

**Validation**: Test with sample notice including `RESPONSIBLE_AUTHORITIES_LIST_URL` to confirm conditional display.

---

### Issue 3: Gambling Act 2005 - Missing Schedule 9 Reference

**Priority**: CRITICAL
**Affected Files**: `/src/next/publish/templates/gambling.ts`
**Statutory Requirement**: Gambling Act 2005 Schedule 9

**Problem**: All 16 gambling templates omit reference to Schedule 9, which is the source of the notice requirement.

**Fix**: Update ALL template headers:

```javascript
// FIND (lines 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 95, 102, 109, 116):
GAMBLING ACT 2005
APPLICATION FOR A [NEW/VARIATION/REVIEW/TRANSFER] [TYPE] PREMISES LICENCE

// REPLACE WITH:
GAMBLING ACT 2005, SCHEDULE 9
APPLICATION FOR A [NEW/VARIATION/REVIEW/TRANSFER] [TYPE] PREMISES LICENCE
```

**Automation**: Use find-and-replace:
```bash
sed -i '' 's/^GAMBLING ACT 2005$/GAMBLING ACT 2005, SCHEDULE 9/g' src/next/publish/templates/gambling.ts
```

---

### Issue 4: Gambling Act 2005 - Missing Licensing Objectives

**Priority**: CRITICAL
**Affected Files**: `/src/next/publish/templates/gambling.ts`
**Statutory Requirement**: Gambling Act 2005 s.1

**Problem**: Templates do not state the licensing objectives that representations must address.

**Fix**: Add after premises address and hours, before inspection details:

```javascript
// FOR ALL GAMBLING TEMPLATES (after line stating hours/description)
// INSERT THIS BLOCK:

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

The application can be inspected at {{INSPECTION_LOCATION}}...
```

**Specific Line Numbers** to insert before:
- `gambling-betting-new`: before line 16
- `gambling-betting-variation`: before line 23
- `gambling-betting-review`: before line 30
- `gambling-betting-transfer`: before line 37
- (Repeat for bingo, agc, fec variants)

---

### Issue 5: GVOL - Incorrect Statutory Authority Structure

**Priority**: CRITICAL
**Affected Files**:
- `/src/next/publish/schema/gvol.ts`
- `/src/next/publish/templates/gvol.ts`
**Statutory Requirement**: Goods Vehicles (Licensing of Operators) Act 1995 s.2, s.57

**Problem**: Templates use generic "AUTHORITY_NAME" but must cite Traffic Commissioner.

**Fix Step 1: Update Schema** (`/src/next/publish/schema/gvol.ts`)

```typescript
// FIND (lines 52-54):
AUTHORITY_NAME: requiredString("Traffic Commissioner / Area office"),
AUTHORITY_ADDRESS: requiredString("Representation address"),
AUTHORITY_EMAIL: optionalString(),

// REPLACE WITH:
TRAFFIC_AREA: requiredString("Traffic Area name"), // e.g., "Western Traffic Area"
TRAFFIC_COMMISSIONER_OFFICE: requiredString("Traffic Commissioner office"), // e.g., "Hillcrest House, 386 Harehills Lane, Leeds LS9 6NF"
```

**Fix Step 2: Update Templates** (`/src/next/publish/templates/gvol.ts`)

```typescript
// FIND (line 20-22 in gvol-new template):
Owners or occupiers of land (including buildings) near the operating centre who believe that their use or enjoyment of that land would be affected may make representations to {{AUTHORITY_NAME}}, {{AUTHORITY_ADDRESS}} by {{DEADLINE_DATE}}.

Representations must be made in writing. Representors must at the same time send a copy to the applicant at the address given above.

// REPLACE WITH:
Owners or occupiers of land (including buildings) near the operating centre who believe that their use or enjoyment of that land would be affected should make written representations to the Traffic Commissioner at {{TRAFFIC_COMMISSIONER_OFFICE}} by {{DEADLINE_DATE}}.

Representors must at the same time send a copy of their representations to the applicant at the address given above. A Guide to Making Representations is available from the Traffic Commissioner's office.
```

Repeat for `gvol-variation` template (lines 30-33).

---

### Issue 6: Planning - Missing Statutory Consultee Statement (Listed Buildings)

**Priority**: CRITICAL
**Affected Files**:
- `/src/next/publish/schema/planning.ts`
- `/src/next/publish/templates/planning.ts`
**Statutory Requirement**: Planning (Listed Buildings and Conservation Areas) Act 1990 s.73

**Problem**: Listed building and conservation area templates do not state that statutory bodies have been consulted.

**Fix Step 1: Enhance Schema** (`/src/next/publish/schema/planning.ts`)

```typescript
// ADD after line 87 (after DEADLINE_DATE):
HISTORIC_ENGLAND_NOTIFIED: z.boolean().optional(),
STATUTORY_CONSULTEES: optionalString(),
```

**Fix Step 2: Update Templates** (`/src/next/publish/templates/planning.ts`)

```javascript
// FOR planning-listed (lines 44-49):
// REPLACE entire template with:

  "planning-listed": `PLANNING (LISTED BUILDINGS AND CONSERVATION AREAS) ACT 1990
APPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — LISTED BUILDING

This application affects a listed building and has been notified to Historic England{{#if STATUTORY_CONSULTEES}} and {{STATUTORY_CONSULTEES}}{{/if}}.

{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for planning permission at {{SITE_ADDRESS}} described as: {{PROPOSAL_DESCRIPTION}}.

Details can be viewed at {{INSPECTION_LOCATION}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}. Comments must be submitted {{COMMENT_METHOD}} to {{AUTHORITY_NAME}} {{COMMENT_DESTINATIONS}} by {{DEADLINE_DATE}}.`,

// FOR planning-conservation (lines 51-56):
// REPLACE first line with:

  "planning-conservation": `PLANNING (LISTED BUILDINGS AND CONSERVATION AREAS) ACT 1990
APPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — CONSERVATION AREA

This application affects a conservation area and has been notified to relevant heritage bodies{{#if STATUTORY_CONSULTEES}} including {{STATUTORY_CONSULTEES}}{{/if}}.

{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}}...
```

---

### Issue 7: Probate - Incomplete Trustee Act Declaration

**Priority**: CRITICAL
**Affected Files**: `/src/next/publish/templates/probate.ts`
**Statutory Requirement**: Trustee Act 1925 s.27(2)

**Problem**: Current template lacks the full statutory protection wording used in standard practice.

**Fix**: Replace entire template (lines 9-15) with:

```javascript
const TEMPLATE = `TRUSTEE ACT 1925, SECTION 27
ESTATE OF {{DECEASED_NAME}}{{#if DECEASED_ALIAS}} (also known as {{DECEASED_ALIAS}}){{/if}}
Last address: {{DECEASED_LAST_ADDRESS}} — Date of death: {{DATE_OF_DEATH}}

NOTICE is hereby given pursuant to section 27 of the Trustee Act 1925 that any persons having claims against or an interest in the estate of the above-named deceased should send written particulars thereof to {{PERSONAL_REPRESENTATIVE}}{{#if SOLICITOR_NAME}} / {{SOLICITOR_NAME}}{{/if}} at {{SOLICITOR_ADDRESS}}{{#if CLAIM_REFERENCE}} quoting reference {{CLAIM_REFERENCE}}{{/if}} on or before {{DEADLINE_DATE}}.

After that date the personal representatives will distribute the estate among the persons entitled thereto, having regard only to the claims and interests of which they have had notice, and will not be liable for the assets of the estate or any part thereof so distributed to any person of whose claims or interests they have not had notice at the time of distribution.`;
```

**Validation**: The critical phrase "having regard only to the claims...of which they have not had notice" must be present.

---

### Issue 8: Multi-Jurisdiction Licensing Authorities

**Priority**: CRITICAL
**Affected Files**:
- `/src/next/publish/schema/licensing.ts`
- `/src/next/publish/templates/licensing.ts`
**Statutory Requirement**: Licensing Act 2003 s.4

**Problem**: No support for boundary premises served by multiple licensing authorities.

**Fix Step 1: Enhance Schema** (`/src/next/publish/schema/licensing.ts`)

```typescript
// ADD after line 96 (after AUTHORITY_NAME):
ADDITIONAL_LICENSING_AUTHORITIES: z.array(z.object({
  name: z.string(),
  address: z.string().optional(),
  email: optionalEmail(),
})).optional(),
```

**Fix Step 2: Update Templates** (all licensing templates)

```javascript
// FOR ALL TEMPLATES, UPDATE the line with {{AUTHORITY_NAME}}:

// FIND:
{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for...

// REPLACE WITH:
{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}}{{#if ADDITIONAL_LICENSING_AUTHORITIES}} (concurrent applications to {{#each ADDITIONAL_LICENSING_AUTHORITIES}}{{name}}{{#unless @last}}, {{/unless}}{{/each}}){{/if}} for...
```

**Note**: This requires Handlebars `each` helper support. Verify template engine supports this.

---

## SHORT-TERM REMEDIATION (Within 3 Months)

### High Priority Issues (Weeks 5-12)

#### H1: Licensing - Incomplete DPS Declaration

**File**: `/src/next/publish/templates/licensing.ts`
**Lines**: 25 (and 39 for variation)

**Current**:
```javascript
{{#if DPS_NAME}} The proposed designated premises supervisor is {{DPS_NAME}}.{{/if}}
```

**Enhanced**:
```javascript
{{#if DPS_NAME}} The proposed designated premises supervisor is {{DPS_NAME}}{{#if DPS_LICENSING_AUTHORITY}}, holder of a personal licence issued by {{DPS_LICENSING_AUTHORITY}}{{/if}}.{{/if}}
```

**Note**: `DPS_LICENSING_AUTHORITY` already exists in schema (line 81) so no schema change needed.

---

#### H2: Licensing - Add Interim Steps Notice Type

**File**: `/src/next/publish/config/noticeTypes.ts`

**Add after line 48** (after licensing-premises-review):

```typescript
{
  id: 'licensing-premises-interim-steps',
  category: 'licensing',
  categoryLabel: 'Licensing Act 2003',
  group: 'Premises Licence',
  variant: 'Interim Steps',
  label: 'Premises Licence — Interim Steps',
  noticeType: 'Licensing: Premises - Interim Steps',
  templateKey: 'licensing_premises_interim_steps_v1',
  version: 1,
},
```

**Create Schema** (`/src/next/publish/schema/licensing.ts`):

```typescript
// Add to LICENSING_VARIANTS array:
"licensing-premises-interim-steps"

// Add validation in superRefine:
const isInterimSteps = value.variant.includes("interim-steps");

if (isInterimSteps) {
  if (!value.INTERIM_STEPS_DESCRIPTION) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["INTERIM_STEPS_DESCRIPTION"],
      message: "Describe the interim steps taken.",
    });
  }
  if (!value.REVIEW_REFERENCE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["REVIEW_REFERENCE"],
      message: "Provide the review application reference.",
    });
  }
}
```

**Create Template** (`/src/next/publish/templates/licensing.ts`):

```typescript
"licensing-premises-interim-steps": `LICENSING ACT 2003
INTERIM STEPS PENDING REVIEW (Section 53C)

Notice is hereby given that {{AUTHORITY_NAME}} has taken interim steps in relation to the premises licence for {{PREMISES_NAME}}, {{PREMISES_ADDRESS}} following an application for review (reference: {{REVIEW_REFERENCE}}).

The interim steps are: {{INTERIM_STEPS_DESCRIPTION}}.

These interim steps have immediate effect and will remain in place until: (a) the conclusion of the review hearing, or (b) they are withdrawn by the licensing authority following further representations.

The licence holder may make representations against the interim steps to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}}.`,
```

---

#### H3: Gambling - Transfer Notice Period

**File**: `/src/next/publish/templates/gambling.ts`
**Affected**: Lines 32-37, 60-64, 88-92, 116-120 (all transfer templates)

**Current** (example):
```javascript
Application has been made to {{AUTHORITY_NAME}} to transfer the betting premises licence for {{PREMISES_ADDRESS}} from {{TRANSFER_FROM_NAME}} to {{TRANSFER_TO_NAME}}.
```

**Enhanced**:
```javascript
{{TRANSFER_TO_NAME}} has applied to {{AUTHORITY_NAME}} to transfer the [type] premises licence for {{PREMISES_ADDRESS}} from {{TRANSFER_FROM_NAME}}.

The licensing authority must determine this application within 14 days beginning with the day on which it received the application (Schedule 9, para 35). Any representations must be made to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}.
```

Replace in all four transfer templates (betting, bingo, agc, fec).

---

#### H4: GVOL - Add Existing Licence Number Field

**File**: `/src/next/publish/schema/gvol.ts`

**Add after line 42** (after APPLICANT_ADDRESS):

```typescript
EXISTING_LICENCE_NUMBER: optionalString(),
```

**Update Template** (`/src/next/publish/templates/gvol.ts`):

```javascript
// FOR gvol-variation (line 25-27):

// FIND:
{{APPLICANT_NAME}}{{#if APPLICANT_TRADING_AS}} trading as {{APPLICANT_TRADING_AS}}{{/if}} of {{APPLICANT_ADDRESS}} has applied to vary the operator's licence...

// REPLACE WITH:
{{APPLICANT_NAME}}{{#if APPLICANT_TRADING_AS}} trading as {{APPLICANT_TRADING_AS}}{{/if}}{{#if EXISTING_LICENCE_NUMBER}} (Operator's Licence No. {{EXISTING_LICENCE_NUMBER}}){{/if}} of {{APPLICANT_ADDRESS}} has applied to vary the operator's licence...
```

---

#### H5: Planning EIA - Environmental Statement Inspection

**File**: `/src/next/publish/schema/planning.ts`

**Add after line 87**:

```typescript
ENVIRONMENTAL_STATEMENT_LOCATION: optionalString(),
ENVIRONMENTAL_STATEMENT_TIMES: optionalString(),
```

**Update Template** (`/src/next/publish/templates/planning.ts`):

```javascript
// FOR planning-eia (lines 37-42):

// FIND:
The Environmental Statement and application documents may be inspected at {{INSPECTION_LOCATION}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}.

// REPLACE WITH:
The Environmental Statement, plans, and supporting documents may be inspected free of charge at {{#if ENVIRONMENTAL_STATEMENT_LOCATION}}{{ENVIRONMENTAL_STATEMENT_LOCATION}}{{else}}{{INSPECTION_LOCATION}}{{/if}}{{#if ENVIRONMENTAL_STATEMENT_TIMES}} during {{ENVIRONMENTAL_STATEMENT_TIMES}}{{/if}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}.
```

---

#### H6: Newspaper Circulation Validation

**File**: `/src/next/publish/schema/licensing.ts` (and `gambling.ts`)

**Add before line 103** (after ONLINE_REGISTER_URL):

```typescript
NEWSPAPER_NAME: requiredString("Name of newspaper"),
NEWSPAPER_CIRCULATION_AREA: requiredString("Newspaper circulation area"),
NEWSPAPER_CIRCULATES_LOCALLY: z.boolean().refine(val => val === true, {
  message: "You must confirm the newspaper circulates in the vicinity of the premises (statutory requirement)"
}),
```

Repeat for `/src/next/publish/schema/gambling.ts` after line 91.

**Note**: This adds required fields to the schema. UI forms must be updated to capture these.

---

#### H7: GDPR Redaction Guidance

**File**: Create new file `/src/next/publish/flow/components/PrivacyGuidance.tsx`

```tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

export function PrivacyGuidance() {
  return (
    <div className="rounded-md bg-blue-50 border border-blue-200 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">
            Personal Data in Public Notices
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <p className="mb-2">
              Only include personal information required by statute:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use business addresses, not personal home addresses</li>
              <li>Use business email and phone numbers where possible</li>
              <li>For probate notices, deceased's last address is required but next-of-kin details are not</li>
              <li>Do not include sensitive personal data (health, ethnicity, etc.)</li>
            </ul>
            <p className="mt-2 text-xs">
              See <a href="/privacy-policy" className="underline">GDPR guidance</a> for more information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Integrate** in `/src/next/publish/flow/steps/ConfirmStep.tsx` before form fields.

---

#### H8: Template Versioning System

**Create Migration**: `/supabase/migrations/20251105000001_template_versioning.sql`

```sql
-- Template Versioning System
CREATE TABLE IF NOT EXISTS public.notice_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL, -- e.g., "licensing_premises_new_v1"
  version INTEGER NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  deprecated_from DATE,
  statutory_basis TEXT NOT NULL, -- e.g., "Licensing Act 2003, s.17 & Regulations 2005"
  change_summary TEXT, -- Description of what changed and why
  template_content TEXT NOT NULL, -- Full Handlebars template text
  schema_version TEXT, -- Links to schema registry version
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(template_key, version)
);

CREATE INDEX idx_template_versions_key ON public.notice_template_versions(template_key);
CREATE INDEX idx_template_versions_effective ON public.notice_template_versions(effective_from DESC);

COMMENT ON TABLE public.notice_template_versions IS 'Version control for statutory notice templates - tracks changes due to regulatory updates';

-- Link notices to specific template version used
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS template_version_id UUID REFERENCES public.notice_template_versions(id);

COMMENT ON COLUMN public.notices.template_version_id IS 'Specific template version used to generate this notice - critical for audit trail';
```

**Seed Initial Versions**: Create script `/scripts/seed-template-versions.ts` to populate from current templates.

---

### Medium Priority Issues (Months 2-3)

#### M1: Fix 10-Working-Day Calculation

**File**: `/src/next/publish/validation/windowRules.ts`
**Lines**: 87-95

**Current**:
```typescript
if (applicationDate && publicationDate) {
  const workingDays = businessDaysBetween(applicationDate, publicationDate);
  if (workingDays > 10) {
    issues.push({
      code: 'LICENSING_NEWS_WINDOW',
      message: 'Newspaper publication should be within 10 working days of the application date.',
    });
  }
}
```

**Fixed**:
```typescript
if (applicationDate && publicationDate) {
  const startDate = new Date(applicationDate);
  startDate.setDate(startDate.getDate() + 1); // Start from day after application
  const workingDays = businessDaysBetween(startDate, publicationDate);
  if (workingDays >= 10) { // Changed from > to >=
    issues.push({
      code: 'LICENSING_NEWS_WINDOW',
      message: 'Newspaper publication must occur within 10 working days starting the day after the application date (Licensing Act 2003 Regulations 2005, Reg 25(2)(a)).',
    });
  }
}
```

---

#### M2: Fix GVOL 21-Day Minimum (Not Exact)

**File**: `/src/next/publish/validation/windowRules.ts`
**Lines**: 134-143

**Current**:
```typescript
if (publicationDate && repsDeadline) {
  const diff = calendarDaysBetween(publicationDate, repsDeadline);
  if (diff !== 21) {
    issues.push({
      code: 'GVOL_PUBLICATION_WINDOW',
      message: 'Objection deadline should be exactly 21 days after publication.',
    });
  }
}
```

**Fixed**:
```typescript
if (publicationDate && repsDeadline) {
  const diff = calendarDaysBetween(publicationDate, repsDeadline);
  if (diff < 21) {
    issues.push({
      code: 'GVOL_PUBLICATION_WINDOW',
      message: 'Objection deadline must be at least 21 days after the date of publication (Goods Vehicles (Licensing of Operators) Regulations 1995, Reg 3(3)).',
    });
  }
}
```

---

#### M3: OCR Auto-Calculate Deadlines

**File**: `/src/next/publish/flow/lib/legalDetails.ts`
**Insert after line 491** (end of extractLegalDetailsFromOcr function, before return):

```typescript
// Auto-calculate representation deadline if application date extracted
if (details.applicationDate && !details.representationDeadline) {
  const appDate = new Date(details.applicationDate);
  const noticeType = details.applicationType; // licensing, gambling, planning, etc.

  let daysToAdd = 28; // default for licensing/gambling
  if (noticeType?.toLowerCase().includes('planning')) daysToAdd = 21;
  if (noticeType?.toLowerCase().includes('gvol')) daysToAdd = 21;
  if (noticeType?.toLowerCase().includes('probate')) daysToAdd = 60;

  const deadline = new Date(appDate);
  deadline.setDate(deadline.getDate() + daysToAdd + 1); // +1 for "day after" rule
  details.representationDeadline = deadline.toISOString().split('T')[0];

  meta.representationDeadline = {
    confidence: 0.7,
    sourceText: `Auto-calculated: ${daysToAdd} days from application date (statutory minimum)`
  };
}
```

---

#### M4: Publication Hash for Audit Trail

**Create Migration**: `/supabase/migrations/20251105000002_publication_hash.sql`

```sql
-- Add cryptographic hash of published notice text
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS publication_hash TEXT;

COMMENT ON COLUMN public.notices.publication_hash IS 'SHA-256 hash of published notice text at moment of publication - provides legal evidence of exact wording';

-- Trigger to auto-calculate hash when status changes to published
CREATE OR REPLACE FUNCTION set_notice_publication_hash()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    -- Assuming notice_text column exists or use COALESCE of relevant fields
    NEW.publication_hash := encode(
      digest(
        COALESCE(NEW.notice_text, NEW.description, 'No text available'),
        'sha256'
      ),
      'hex'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notices_set_publication_hash
  BEFORE INSERT OR UPDATE ON public.notices
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION set_notice_publication_hash();
```

**Note**: Verify `notices.notice_text` column exists. If not, add it to store the final rendered notice text.

---

## DESIRABLE ENHANCEMENTS (Months 4-12)

### User Experience Improvements

1. **Draft Expiry Warnings** (Month 4)
   - File: `/src/wizard/draftStore.ts`
   - Add timestamp checking on draft load
   - Display warning banner if application date > 9 working days old

2. **Interested Party Guidance** (Month 5)
   - File: Create `/src/components/guidance/InterestedPartyInfo.tsx`
   - Tooltip component explaining definitions
   - Integrate in licensing/gambling forms

3. **Planning Departure Explanation** (Month 5)
   - File: `/src/next/publish/templates/planning.ts`
   - Enhance `planning-departure` template with clearer explanation

4. **Probate Multiple Aliases** (Month 6)
   - File: `/src/next/publish/schema/probate.ts`
   - Change `DECEASED_ALIAS` to `DECEASED_ALIASES: z.array(z.string())`
   - Update template to use `{{#each DECEASED_ALIASES}}...{{/each}}`

### Enterprise Features (Months 7-12)

5. **REST API Development** (Months 7-9)
   - Create `/server/routes/api/v1/` directory
   - Implement notice CRUD endpoints
   - Add webhook support for status updates
   - Document with OpenAPI spec

6. **Bulk Import/Export** (Month 10)
   - CSV import for multiple notices
   - Excel export for reporting
   - PDF batch generation

7. **White-Label Branding** (Months 11-12)
   - Per-organization logo upload
   - Custom color schemes
   - Email template customization

---

## Testing Protocol

### Unit Tests Required

Create `/src/next/publish/templates/__tests__/statutory-compliance.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderLicensingText } from '../licensing';
import { renderGamblingText } from '../gambling';
import { renderGvolText } from '../gvol';
import { renderPlanningText } from '../planning';
import { renderProbateText } from '../probate';

describe('Statutory Compliance - Mandatory Statements', () => {
  describe('Licensing Act 2003', () => {
    it('all licensing templates include false statement warning', () => {
      const variants = [
        'licensing-premises-new',
        'licensing-premises-variation',
        'licensing-premises-review',
        'licensing-club-new',
        'licensing-club-variation',
        'licensing-club-review'
      ];

      const requiredPhrase = 'false statement';

      variants.forEach(variant => {
        const mockNotice = createMockNotice(variant);
        const rendered = renderLicensingText(mockNotice);
        expect(rendered.toLowerCase()).toContain(requiredPhrase);
      });
    });

    it('all licensing templates include responsible authorities statement', () => {
      const requiredPhrase = 'responsible authorities';
      // Test each variant...
    });
  });

  describe('Gambling Act 2005', () => {
    it('all gambling templates include Schedule 9 reference', () => {
      const requiredPhrase = 'schedule 9';
      // Test each variant...
    });

    it('all gambling templates include licensing objectives', () => {
      const requiredPhrases = [
        'preventing gambling from being a source of crime',
        'ensuring gambling is conducted in a fair and open way',
        'protecting children and other vulnerable persons'
      ];
      // Test each variant...
    });
  });

  describe('GVOL', () => {
    it('GVOL templates reference Traffic Commissioner', () => {
      const requiredPhrase = 'traffic commissioner';
      // Test...
    });
  });

  describe('Probate', () => {
    it('probate template includes full s.27 protection wording', () => {
      const requiredPhrase = 'having regard only to the claims and interests of which they have had notice';
      // Test...
    });
  });
});
```

### Integration Tests

Create `/tests/e2e/statutory-notices.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Statutory Notice Publication Flow', () => {
  test('licensing notice includes all mandatory elements', async ({ page }) => {
    await page.goto('/publish/step-1');

    // Select notice type
    await page.click('text=Licensing Act 2003');
    await page.click('text=Premises Licence — New');

    // Upload form (Step 2) - mock file upload
    // ... complete wizard steps

    // Step 4: Review - verify rendered notice
    const noticePreview = page.locator('[data-testid="notice-preview"]');
    await expect(noticePreview).toContainText('It is an offence to knowingly or recklessly make a false statement');
    await expect(noticePreview).toContainText('responsible authorities');
  });

  test('gambling notice includes Schedule 9 and objectives', async ({ page }) => {
    // Similar flow for gambling notice
  });

  // Add tests for each critical statutory requirement
});
```

---

## Validation Checklist (Post-Remediation)

Use this checklist to verify each fix:

```markdown
## CRITICAL ISSUES

- [ ] 1. Licensing - False statement warning in premises-variation template
- [ ] 2. Licensing - False statement warning in premises-review template
- [ ] 3. Licensing - False statement warning in club-new template
- [ ] 4. Licensing - False statement warning in club-variation template
- [ ] 5. Licensing - False statement warning in club-review template
- [ ] 6. Licensing - Responsible authorities statement in ALL templates
- [ ] 7. Licensing - Schema includes RESPONSIBLE_AUTHORITIES fields
- [ ] 8. Gambling - Schedule 9 reference in ALL 16 templates
- [ ] 9. Gambling - Licensing objectives in ALL templates
- [ ] 10. GVOL - "Traffic Commissioner" not "Authority" in schema
- [ ] 11. GVOL - Templates use TRAFFIC_COMMISSIONER_OFFICE field
- [ ] 12. Planning - Listed building template states Historic England notified
- [ ] 13. Planning - Conservation area template states consultees
- [ ] 14. Planning - Schema includes HISTORIC_ENGLAND_NOTIFIED field
- [ ] 15. Probate - Full s.27(2) protection wording in template
- [ ] 16. Licensing - Multi-jurisdiction support in schema
- [ ] 17. Licensing - Templates handle ADDITIONAL_LICENSING_AUTHORITIES

## HIGH PRIORITY

- [ ] 18. Licensing - DPS personal licence authority in templates
- [ ] 19. Licensing - Interim steps notice type added
- [ ] 20. Licensing - Interim steps schema created
- [ ] 21. Licensing - Interim steps template created
- [ ] 22. Gambling - Transfer notices include 14-day statement
- [ ] 23. GVOL - EXISTING_LICENCE_NUMBER field in schema
- [ ] 24. GVOL - Licence number displayed in variation template
- [ ] 25. Planning EIA - ES inspection location/times in schema
- [ ] 26. Planning EIA - Template uses ES location fields
- [ ] 27. All - Newspaper name, circulation, confirmation in schema
- [ ] 28. All - PrivacyGuidance component created
- [ ] 29. All - PrivacyGuidance integrated in ConfirmStep
- [ ] 30. All - Template versioning migration created
- [ ] 31. All - Template versioning seeded with current templates

## MEDIUM PRIORITY

- [ ] 32. Licensing - 10 working days calculation fixed
- [ ] 33. GVOL - 21 days minimum (not exact) fixed
- [ ] 34. OCR - Auto-calculate deadline logic added
- [ ] 35. Database - publication_hash migration created
- [ ] 36. Database - publication_hash trigger working

## TESTS

- [ ] 37. Unit tests for statutory compliance created
- [ ] 38. All unit tests passing
- [ ] 39. E2E tests for critical notice types created
- [ ] 40. All E2E tests passing
- [ ] 41. Manual smoke test of each notice type completed
- [ ] 42. Legal review of corrected templates obtained
```

---

## Legal Review Process

Before deploying remediated templates to production:

1. **Internal Review** (Week 1)
   - Development team confirms all code changes implemented
   - QA team runs full test suite
   - Product owner reviews rendered sample notices

2. **Legal Counsel Review** (Week 2)
   - Provide legal team with:
     - This audit report
     - Rendered samples of all notice types
     - Statutory references used
   - Legal team confirms wording compliance

3. **Pilot Authority Review** (Week 3-4)
   - Select 2-3 friendly councils
   - Licensing officers review templates
   - Test full workflow with real application data
   - Collect feedback on usability and compliance

4. **Final Sign-Off** (Week 5)
   - Executive summary of changes
   - Sign-off from CTO and Legal Counsel
   - Plan production deployment

---

## Rollout Strategy

**Phase 1: Critical Fixes** (Weeks 1-4)
- Deploy to staging environment
- Internal testing only
- No public access

**Phase 2: Controlled Pilot** (Weeks 5-8)
- Deploy to production with feature flag
- Enable for 2-3 pilot councils only
- Monitor audit logs daily
- Weekly check-ins with pilot users

**Phase 3: Soft Launch** (Weeks 9-12)
- Open to all councils (opt-in basis)
- Marketing limited to existing contacts
- Support team on standby
- Collect feedback via in-app survey

**Phase 4: Full Production** (Month 4+)
- Remove feature flags
- Public marketing campaign
- Self-service onboarding enabled
- 24/7 support available

---

## Success Metrics

Track these KPIs post-remediation:

1. **Compliance Metrics**
   - Zero statutory compliance issues raised by councils (Target: 0 per month)
   - Zero legal challenges to notices (Target: 0 per year)
   - Template versioning audit trail 100% complete (Target: 100%)

2. **Usage Metrics**
   - Number of councils actively using platform (Target: 50+ by Month 12)
   - Number of notices published per month (Target: 500+ by Month 12)
   - User satisfaction score (Target: 8.5/10)

3. **Quality Metrics**
   - Time to publish notice (Target: < 15 minutes from form to publication)
   - Notice rejection rate (Target: < 5%)
   - Support tickets related to compliance (Target: < 2 per month)

---

## Contact for Questions

- **Technical Lead**: [Name] - technical implementation questions
- **Legal Counsel**: [Name] - statutory interpretation queries
- **Product Owner**: [Name] - prioritization and scope questions

---

**Document Version**: 1.0
**Last Updated**: 4 November 2025
**Next Review**: Post-Phase 1 completion

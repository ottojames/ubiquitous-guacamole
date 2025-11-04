# Civic Notices Platform — Dependencies & Risk Register

**Document Version**: 1.0
**Date**: 4 November 2025
**Status**: Risk Management Plan
**Review Frequency**: Weekly during implementation

---

## Executive Summary

This document provides a comprehensive analysis of:
1. **Cross-Domain Dependencies**: Issues affecting multiple notice types or system components
2. **Technical Dependencies**: Sequencing requirements and blocking relationships
3. **Legal & Compliance Dependencies**: External validation requirements
4. **Risk Register**: Comprehensive catalog of technical, legal, and timeline risks
5. **Decision Log**: Open questions and assumptions requiring resolution

### Risk Assessment Overview

**Total Identified Risks**: 23
- **Critical Severity**: 7 (require immediate mitigation)
- **High Severity**: 9 (require active management)
- **Medium Severity**: 5 (monitor and mitigate if escalates)
- **Low Severity**: 2 (awareness only)

**Key Risk Domains**:
- Legal & Compliance: 7 risks
- Technical Implementation: 8 risks
- Timeline & Resources: 5 risks
- Adoption & Usability: 3 risks

---

## Cross-Domain Dependencies

### CD-001: Multi-Template Statutory Statements

**Description**: False statement warnings, responsible authorities statements, and licensing objectives must be consistent across all variants within a domain.

**Affected Issues**:
- CRIT-001 (licensing false statement)
- CRIT-002 (responsible authorities)
- CRIT-004 (gambling objectives)

**Impact**: If one template variant has incorrect wording, all variants in that domain must be reviewed for consistency.

**Dependencies**:
- Legal counsel review must cover ALL variants, not just samples
- Unit tests must validate EVERY variant

**Mitigation**:
- Use identical wording across all variants (copy-paste, not re-type)
- Automate validation with unit tests that check every template
- Create shared constants for statutory text to ensure consistency

**Status**: Managed via comprehensive test suite

---

### CD-002: Schema Changes Affecting Multiple Notice Types

**Description**: Adding fields like newspaper circulation affects both licensing AND gambling schemas, templates, and UI forms.

**Affected Issues**:
- HIGH-015 (newspaper circulation validation)
- CRIT-002 (responsible authorities - licensing only)

**Impact**: Changes must be implemented in parallel across multiple files:
- `/src/next/publish/schema/licensing.ts`
- `/src/next/publish/schema/gambling.ts`
- `/src/next/publish/flow/steps/ConfirmStep.tsx` (UI must handle both)

**Dependencies**:
- Schema changes must be completed before template updates
- UI form must dynamically show/hide fields based on notice type

**Mitigation**:
- Create shared schema fragments for common fields
- Use conditional rendering in UI forms
- Test each notice type variant individually

**Status**: Requires careful coordination in Week 6

---

### CD-003: Template Rendering Engine Capabilities

**Description**: Multi-jurisdiction support requires Handlebars `each` helper and conditional logic.

**Affected Issues**:
- CRIT-008 (multi-jurisdiction licensing)
- All conditional field rendering

**Impact**: If Handlebars version doesn't support required helpers, major refactor needed.

**Dependencies**:
- Verify Handlebars version supports `each`, `unless`, `if` helpers
- May require custom helper registration

**Mitigation**:
- **Action Week 5 Day 1**: Verify Handlebars capabilities
- Upgrade Handlebars if needed (test for breaking changes)
- Create custom helpers if needed
- Test complex conditionals thoroughly

**Status**: MUST VERIFY BEFORE MILESTONE 3

---

### CD-004: Database Schema Migrations Must Precede Code Deployment

**Description**: Template versioning and publication hash migrations must run successfully before deploying code that depends on them.

**Affected Issues**:
- HIGH-017 (template versioning)
- MED-026 (publication hash)

**Impact**: If migrations fail, code deployment will fail. Rollback required.

**Dependencies**:
- Migrations must be tested on staging before production
- Rollback scripts must be prepared for each migration
- Code must handle absence of new columns gracefully (for backward compatibility during rollout)

**Mitigation**:
- Test migrations on staging database first
- Create rollback migration for each forward migration
- Use `IF NOT EXISTS` clauses to make migrations idempotent
- Deploy migrations in separate release from code (migrations → test → code)

**Sequencing**:
1. Week 7: Deploy migration to staging
2. Week 7: Test migration success
3. Week 7: Deploy code to staging
4. Week 7: Test full functionality
5. Week 8: Deploy migration to production (separate release)
6. Week 8: Deploy code to production

**Status**: Critical path dependency for Weeks 7-8

---

### CD-005: OCR Extraction Logic Depends on Notice Type Registry

**Description**: Auto-calculation of deadlines (MED-024) requires knowledge of notice type to determine correct statutory period.

**Affected Issues**:
- MED-024 (OCR auto-calculate deadlines)
- Notice type definitions in `/src/next/publish/config/noticeTypes.ts`

**Impact**: Cannot implement auto-calculation until notice type is reliably detected from OCR.

**Dependencies**:
- OCR must extract application type reliably
- Notice type registry must map types to statutory periods
- Mapping logic: licensing → 28 days, gambling → 28 days, planning → 21 days, GVOL → 21 days, probate → 60 days

**Mitigation**:
- Create lookup table mapping notice type IDs to deadline periods
- Add confidence scoring to auto-calculated deadlines
- Always allow manual override

**Implementation**:
```typescript
const STATUTORY_DEADLINE_PERIODS: Record<string, number> = {
  'licensing': 28,
  'gambling': 28,
  'planning': 21,
  'gvol': 21,
  'probate': 60,
};
```

**Status**: Straightforward implementation in Week 7

---

### CD-006: Validation Rules Depend on Schema Enhancements

**Description**: Window validation rules reference schema fields that may not exist yet.

**Affected Issues**:
- MED-020 (10 working days licensing)
- MED-021 (21 days GVOL)
- Schema enhancements in Milestones 1-3

**Impact**: Cannot update validation rules until corresponding schema fields exist.

**Dependencies**:
- Schema must define `APPLICATION_DATE`, `PUBLICATION_DATE`, `REPRESENTATION_DEADLINE`
- Validation rules must check field existence before validating

**Sequencing**:
1. Milestone 1-3: Schema enhancements
2. Milestone 4: Validation rule updates

**Mitigation**:
- Validation functions check field existence: `if (applicationDate && publicationDate) { ... }`
- Use TypeScript to enforce required fields at compile time

**Status**: Natural sequencing; no issue if followed

---

## Technical Dependencies

### TD-001: Handlebars Template Engine Version

**Dependency**: Multi-jurisdiction support (CRIT-008) requires Handlebars `each` helper

**Current State**: Unknown (must verify)

**Required State**: Handlebars v4.0+ with `each`, `if`, `unless` helpers registered

**Verification Action** (Week 5 Day 1):
```bash
npm list handlebars
# Check version and test each helper
```

**Test Case**:
```typescript
import Handlebars from 'handlebars';

const template = Handlebars.compile(`
  {{#each items}}
    {{name}}{{#unless @last}}, {{/unless}}
  {{/each}}
`);

const result = template({ items: [{ name: 'A' }, { name: 'B' }] });
// Expected: "A, B"
// If result is incorrect or error, upgrade needed
```

**Mitigation Path**:
- **If supported**: Proceed with implementation
- **If not supported**: Upgrade Handlebars to v4.7+ (latest stable)
- **If upgrade breaks existing templates**: Register custom helpers
- **Worst case**: Refactor multi-jurisdiction to use string concatenation instead of `each` loop

**Risk Level**: MEDIUM (likely supported, but must verify)

---

### TD-002: Supabase PostgreSQL Trigger Support

**Dependency**: Publication hash (MED-026) requires PostgreSQL trigger with `digest()` function

**Current State**: Supabase supports PostgreSQL 14+ with `pgcrypto` extension

**Required State**: `pgcrypto` extension enabled, trigger functions work

**Verification Action** (Week 8 Day 1):
```sql
-- Test that digest function available
SELECT encode(digest('test', 'sha256'), 'hex');
-- Expected: SHA-256 hash output
```

**Migration Pattern**:
```sql
-- Enable extension if not already
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create trigger function
CREATE OR REPLACE FUNCTION set_notice_publication_hash()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    NEW.publication_hash := encode(digest(COALESCE(NEW.notice_text, ''), 'sha256'), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
CREATE TRIGGER notices_set_publication_hash
  BEFORE INSERT OR UPDATE ON public.notices
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION set_notice_publication_hash();
```

**Mitigation Path**:
- **If digest() not available**: Enable `pgcrypto` extension
- **If extension cannot be enabled**: Calculate hash in application code (less ideal)
- **Rollback plan**: Drop trigger if causes issues

**Risk Level**: LOW (Supabase fully supports this)

---

### TD-003: React 19 & Vite Compatibility

**Dependency**: New UI components (PrivacyGuidance, dynamic form fields) must be compatible with React 19

**Current State**: Project uses React 19.x (confirmed in package.json)

**Required State**: All new components follow React 19 patterns (no deprecated lifecycle methods)

**Verification**: All new components use modern patterns:
- Functional components with hooks
- No class components
- No deprecated `componentWillMount` etc.

**Test Cases**:
- Component renders without warnings
- No console errors about deprecated features
- HMR (Hot Module Replacement) works correctly

**Risk Level**: LOW (team already using React 19)

---

### TD-004: Supabase Row Level Security (RLS) Policies

**Dependency**: New schema fields must be covered by existing RLS policies

**Current State**: Notices table has RLS policies for read/write/update

**Required State**: All new fields (e.g., `RESPONSIBLE_AUTHORITIES_LIST_URL`, `TRAFFIC_COMMISSIONER_OFFICE`) inherit table-level policies

**Verification Action** (Week 8 Day 5):
```sql
-- Test that authenticated user can read/write new fields
SELECT
  RESPONSIBLE_AUTHORITIES_LIST_URL,
  TRAFFIC_COMMISSIONER_OFFICE,
  publication_hash
FROM public.notices
WHERE id = 'test-notice-id';
```

**Mitigation**:
- New columns inherit table-level RLS policies automatically
- No field-level RLS needed unless restricting specific columns
- Test CRUD operations after schema changes

**Risk Level**: LOW (inherit existing policies)

---

### TD-005: Template Registry Mapping

**Dependency**: New notice types (interim steps) must be registered in schema registry

**Current State**: Registry at `/src/next/publish/schema/registry.ts` maps notice type IDs to builders

**Required State**: Interim steps builder added to registry with `mapToNoticeBase()` function

**Implementation Pattern**:
```typescript
// In registry.ts
export const NOTICE_SCHEMA_REGISTRY = {
  // ... existing
  'licensing-premises-interim-steps': {
    schema: LicensingInterimStepsSchema,
    mapToNoticeBase(validated) {
      return {
        noticeType: 'Licensing: Premises - Interim Steps',
        AUTHORITY_NAME: validated.AUTHORITY_NAME,
        // ... map all fields
        details: validated,
      };
    },
  },
};
```

**Dependency Chain**:
1. Define notice type in `noticeTypes.ts`
2. Create schema in `schema/licensing.ts`
3. Create template in `templates/licensing.ts`
4. Register in `schema/registry.ts`
5. Test end-to-end

**Risk Level**: LOW (standard pattern, well-documented)

---

### TD-006: Draft Storage Schema Compatibility

**Dependency**: Draft storage (sessionStorage) must handle new schema fields without breaking existing drafts

**Current State**: Drafts stored as JSON in sessionStorage

**Required State**: New fields added without invalidating existing drafts

**Approach**: Additive changes only
- All new fields are OPTIONAL in schemas
- Draft loading handles missing fields gracefully
- No rename or delete of existing fields

**Mitigation**:
- Add migration logic in `draftStore.ts` if field renames necessary
- Display warning banner if draft schema version mismatches current
- Allow users to "upgrade" draft or start fresh

**Example Migration**:
```typescript
function migrateDraft(draft: Draft): Draft {
  // If old AUTHORITY_NAME exists and new TRAFFIC_COMMISSIONER_OFFICE doesn't
  if (draft.AUTHORITY_NAME && !draft.TRAFFIC_COMMISSIONER_OFFICE) {
    draft.TRAFFIC_COMMISSIONER_OFFICE = draft.AUTHORITY_NAME;
    draft.TRAFFIC_AREA = 'Unknown'; // Require user to select
    draft._needsMigration = true;
  }
  return draft;
}
```

**Risk Level**: MEDIUM (GVOL schema change is breaking for existing drafts)

---

### TD-007: PDF Generation with New Template Content

**Dependency**: PDF generation must handle longer templates (with statutory statements) without pagination issues

**Current State**: Unknown page break behavior for long templates

**Required State**: Templates render correctly in PDF with appropriate page breaks

**Verification Action** (Week 2):
- Generate PDF of longest template (licensing with all optional fields)
- Check that content doesn't overflow or cut off
- Check that formatting preserved (line breaks, paragraphs)

**Mitigation**:
- Test PDF generation for all templates after changes
- Adjust CSS `page-break-inside: avoid` if needed
- Consider A4 vs Letter page size

**Risk Level**: LOW (mostly formatting concern)

---

### TD-008: TypeScript Type Safety for New Fields

**Dependency**: All new schema fields must have proper TypeScript types

**Current State**: Zod schemas generate TypeScript types via `z.infer<>`

**Required State**: Type safety maintained across all changes

**Verification**: TypeScript compilation succeeds with no type errors
```bash
npm run typecheck
```

**Mitigation**:
- Use Zod `.optional()` for optional fields
- Use Zod `.enum()` for restricted values (TRAFFIC_AREA)
- Avoid `any` types; use explicit types

**Example**:
```typescript
// Good: Explicit enum
TRAFFIC_AREA: z.enum(['Scottish', 'North Eastern', /* ... */])

// Bad: Loose string
TRAFFIC_AREA: z.string() // Allows invalid values
```

**Risk Level**: LOW (enforced at compile time)

---

## Legal & Compliance Dependencies

### LD-001: Legal Counsel Availability for Template Review

**Dependency**: Legal counsel must review ALL corrected templates before pilot launch

**Required Availability**: Week 10 Days 1-3 (minimum 8 hours over 3 days)

**Deliverables to Legal**:
1. Rendered sample of every notice type (35+ PDFs)
2. Statutory reference mapping document
3. Before/after comparison for all CRITICAL fixes
4. List of all template changes with justifications

**Review Scope**:
- Verify wording matches statutory requirements
- Confirm false statement warnings use exact prescribed language
- Validate responsible authorities statements
- Check Traffic Commissioner references (GVOL)
- Verify probate s.27 protection wording
- Sign off on gambling licensing objectives

**Risk**: Legal counsel unavailable or requests extensive revisions

**Mitigation**:
- **Action Week 1 Day 1**: Schedule legal review appointment for Week 10
- **Action Week 9**: Send preliminary materials to legal for early feedback
- **Buffer**: Week 10 Days 4-5 available for revisions if needed

**Escalation**: If legal review cannot be completed by end of Week 10, pilot launch MUST be delayed

**Status**: CRITICAL PATH DEPENDENCY

---

### LD-002: Pilot Council Commitment

**Dependency**: Need 2-3 councils willing to participate in pilot (Week 11)

**Required Commitment**:
- Use platform for real notices (not just test data)
- Provide feedback via survey and calls
- Allow use of published notices as case studies
- Commit to 1 week participation

**Ideal Pilot Councils**:
- Mix of urban and rural
- Different sizes (small district, large unitary)
- Active licensing and planning departments
- Existing relationship with platform team

**Risk**: Councils unwilling to participate or drop out mid-pilot

**Mitigation**:
- **Action Week 1**: Identify 5-6 candidate councils (shortlist)
- **Action Week 8**: Send pilot invitation with incentives (free subscription)
- **Action Week 9**: Confirm 2-3 councils committed
- **Backup plan**: If councils unavailable, extend internal testing and go directly to soft launch

**Status**: Medium risk; have backup plan

---

### LD-003: Statutory Interpretation Clarity

**Dependency**: Confirm interpretation of ambiguous regulations

**Open Questions Requiring Legal Clarification**:

1. **Licensing Act Reg 25(2)(a)**: Does "10 working days starting on the day after" mean:
   - Day 0 (application) + Day 1 (start) + 10 working days = Day 11?
   - Or Day 0 (application) + 10 working days = Day 10?
   - **Status**: Assumed Day 11 (most conservative interpretation)

2. **GVOL Reg 3(3)**: "Not less than 21 days" - can consultation be longer (e.g., 28 days)?
   - **Status**: Assumed yes, minimum not maximum (validation changed to `< 21` not `!== 21`)

3. **Planning EIA Reg 19(3)**: Does 30-day period start from:
   - Date application submitted?
   - Date notice published?
   - **Status**: Assumed publication date (most common practice)

**Action Required**:
- Legal counsel to confirm interpretations during Week 10 review
- If interpretation differs, adjust validation rules accordingly

**Risk**: Misinterpretation leads to non-compliant notices

**Mitigation**: Use most conservative interpretation; document assumptions; seek legal confirmation

**Status**: Assumptions documented in REMEDIATION_SPEC.md; awaiting legal review

---

### LD-004: Regulatory Change During Development

**Dependency**: No major statutory changes occur during 12-week development period

**Monitoring**:
- Weekly check of gov.uk for new regulations or guidance
- Subscribe to Local Government Association (LGA) updates
- Monitor Licensing Act section 182 guidance updates

**Example Risk Scenarios**:
- New Licensing Act regulations published requiring additional notice content
- Gambling Commission updates Schedule 9 guidance
- Planning EIA regulations amended

**Mitigation**:
- Template versioning system allows rapid updates
- If major change occurs mid-development, assess impact and adjust timeline
- Maintain relationships with regulatory bodies for early warning

**Contingency**:
- If change affects CRITICAL issues, may delay launch to incorporate
- If change affects DESIRABLE enhancements, defer to post-launch update

**Risk Level**: LOW (major regulatory changes are infrequent and announced months in advance)

---

### LD-005: Trade Association and DfT Validation (Optional)

**Dependency**: Optional external validation from industry bodies

**Potential Validators**:
- Institute of Licensing (IoL)
- Local Government Association (LGA)
- Planning Officers Society
- Chartered Institute of Legal Executives (CILEX)

**Value**:
- Industry endorsement increases council confidence
- Identifies any edge cases or best practices missed
- Marketing benefit ("Approved by IoL")

**Risk**: External validators unavailable or identify issues

**Mitigation**:
- **Not required for pilot launch** (nice-to-have)
- Can pursue post-launch
- If issues identified, incorporate into next sprint

**Status**: OPTIONAL; defer to post-launch

---

### LD-006: GDPR / ICO Compliance Validation

**Dependency**: GDPR redaction guidance (HIGH-016) meets ICO standards

**Required State**: Privacy guidance component accurately reflects UK GDPR principles

**Validation**:
- Guidance states data minimization principle
- Recommends business addresses over personal addresses
- Warns against sensitive personal data
- Links to full privacy policy

**Risk**: ICO enforcement action if platform facilitates excessive personal data disclosure

**Mitigation**:
- Base guidance on ICO published guidance for public authorities
- Include disclaimer: "Councils are responsible for determining what information is required by statute"
- Provide clear examples of appropriate vs. excessive data

**Reference**: ICO Guide to GDPR for Public Authorities
https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/

**Status**: Guidance component drafted; ICO review not required (guidance is advisory, not data processing)

---

### LD-007: Accessibility Compliance (WCAG 2.1 AA)

**Dependency**: All UI enhancements must meet accessibility standards (legal requirement for public sector)

**Required State**: WCAG 2.1 Level AA compliance for all new components

**Key Requirements**:
- Keyboard navigation works for all form fields
- Color contrast ratios meet 4.5:1 minimum
- Form labels properly associated with inputs
- Error messages announced to screen readers
- Focus indicators visible

**Testing** (Week 9 Day 3):
- Automated: Axe DevTools scan
- Manual: Keyboard-only navigation test
- Screen reader: NVDA or JAWS test

**Risk**: Non-compliance prevents public sector adoption (legal requirement under UK accessibility regulations)

**Mitigation**:
- Use semantic HTML (`<label>`, `<fieldset>`, `<legend>`)
- Test with keyboard and screen reader during development
- Allocate 0.5 day in Week 9 for accessibility testing

**Status**: Straightforward; use existing accessible components from `/src/components/ui/`

---

## Risk Register

### Critical Risks (Probability: Likely, Impact: Severe)

---

### RISK-001: Legal Challenge to Published Notices

**Category**: Legal & Compliance
**Probability**: HIGH (if CRITICAL issues not fixed)
**Impact**: SEVERE (notices invalidated, councils liable, reputational damage)

**Description**: A published notice is challenged in court as procedurally defective due to missing statutory declarations (e.g., no false statement warning, no Schedule 9 reference).

**Consequences**:
- Judicial review of licensing decision
- Notice declared invalid
- Application process must restart
- Council faces legal costs
- Platform liability claims
- Loss of trust; councils abandon platform

**Triggers**:
- Any of the 8 CRITICAL issues not resolved before pilot
- Legal counsel sign-off not obtained
- Pilot council receives complaint about notice

**Mitigation**:
- **Primary**: Complete ALL critical fixes before pilot (Milestones 1-2)
- **Secondary**: Obtain legal counsel sign-off on all templates
- **Tertiary**: Include disclaimer in platform ToS: "Councils are responsible for reviewing notice content"
- **Insurance**: Ensure platform has professional indemnity insurance

**Contingency**:
- If challenge occurs during pilot: Immediately suspend platform, fix issue, re-audit all notices
- If challenge occurs post-launch: Emergency hotfix, notify all councils, offer to republish affected notices

**Monitoring**: Track any representations or complaints about published notices; escalate immediately to legal

**Status**: UNDER ACTIVE MANAGEMENT (fixes in progress)

---

### RISK-002: Breaking Schema Change Affects Existing Drafts

**Category**: Technical Implementation
**Probability**: MEDIUM (GVOL authority structure change is breaking)
**Impact**: HIGH (user frustration, data loss, support burden)

**Description**: GVOL schema change (CRIT-005) from `AUTHORITY_NAME` to `TRAFFIC_COMMISSIONER_OFFICE` breaks existing drafts.

**Consequences**:
- Users lose work on in-progress GVOL notices
- Support tickets spike
- User frustration and negative reviews
- Manual data re-entry required

**Affected Users**: Any council with saved GVOL draft when migration deployed

**Mitigation**:
- **Pre-deployment**: Query production database to count existing GVOL drafts
- **If count = 0**: No issue, proceed with deployment
- **If count > 0**:
  1. Contact affected users 1 week before deployment
  2. Provide migration script or manual instructions
  3. Offer to manually migrate their drafts
  4. Give 1-week grace period

**Migration Strategy**:
```typescript
// In draftStore.ts
function migrateDraftToV2(draft: Draft): Draft {
  if (draft.schemaVersion === 1 && draft.noticeType === 'gvol') {
    return {
      ...draft,
      TRAFFIC_COMMISSIONER_OFFICE: draft.AUTHORITY_NAME || '',
      TRAFFIC_AREA: 'Unknown', // User must select
      _migrationWarning: 'Please select your Traffic Area and verify the office address',
      schemaVersion: 2,
    };
  }
  return draft;
}
```

**User Communication**:
```
Subject: Action Required: GVOL Notice Drafts

We're improving our GVOL notice templates to better match statutory requirements.

If you have a saved GVOL draft, please complete and publish it by [DATE], or it will need to be re-entered after our system update on [DATE].

For assistance, contact support@civicnotices.com
```

**Monitoring**: Track draft load errors; provide clear error message with recovery steps

**Status**: MUST ADDRESS in Week 4 (before deployment)

---

### RISK-003: Handlebars Template Engine Incompatibility

**Category**: Technical Implementation
**Probability**: LOW (likely supported)
**Impact**: HIGH (major refactor required)

**Description**: Handlebars version doesn't support `each` helper needed for multi-jurisdiction rendering (CRIT-008).

**Consequences**:
- Cannot implement multi-jurisdiction feature as designed
- Must refactor to use string concatenation
- Development delay (2-3 days)

**Verification Date**: Week 5 Day 1

**Test**:
```typescript
const template = Handlebars.compile(`{{#each items}}{{name}}{{/each}}`);
const result = template({ items: [{ name: 'A' }] });
if (result !== 'A') throw new Error('each helper not supported');
```

**Mitigation Plan A** (if not supported):
- Upgrade Handlebars to v4.7+ (latest stable)
- Test all existing templates for breaking changes
- Regression test entire template library

**Mitigation Plan B** (if upgrade breaks things):
- Register custom `each` helper:
```typescript
Handlebars.registerHelper('each', function(context, options) {
  let ret = "";
  for(let i=0; i<context.length; i++) {
    ret += options.fn(context[i]);
  }
  return ret;
});
```

**Mitigation Plan C** (worst case):
- Refactor multi-jurisdiction to use string concatenation in `mapToNoticeBase()`:
```typescript
mapToNoticeBase(validated) {
  const additionalAuthorities = validated.ADDITIONAL_LICENSING_AUTHORITIES
    ?.map(a => a.name)
    .join(', ') || '';

  return {
    AUTHORITY_NAME: validated.AUTHORITY_NAME,
    ADDITIONAL_AUTHORITIES_TEXT: additionalAuthorities ? ` (concurrent applications to ${additionalAuthorities})` : '',
  };
}
```

**Status**: MUST VERIFY Week 5 Day 1

---

### RISK-004: Legal Counsel Unavailable for Review

**Category**: Legal & Compliance
**Probability**: MEDIUM (dependent on external resource)
**Impact**: HIGH (blocks pilot launch)

**Description**: Legal counsel unable to complete review in Week 10, delaying pilot launch.

**Possible Causes**:
- Legal team overcommitted with other priorities
- Counsel requests extensive revisions requiring multiple review cycles
- Key counsel on holiday/sick leave

**Mitigation**:
- **Action Week 1 Day 1**: Pre-schedule legal review appointment for Week 10
- **Action Week 9**: Send preliminary materials to legal for early informal feedback
- **Buffer Time**: Week 10 Days 4-5 available for revisions
- **Backup Counsel**: Identify backup legal reviewer if primary unavailable

**Contingency**:
- If review cannot complete by end of Week 10: Delay pilot launch by 1 week (acceptable)
- If review identifies major issues: Fix immediately, schedule re-review
- If counsel completely unavailable: Seek external specialist licensing solicitor (£1-2k cost)

**Status**: Pre-schedule in Week 1

---

### RISK-005: Database Migration Failure

**Category**: Technical Implementation
**Probability**: LOW (with proper testing)
**Impact**: HIGH (production outage, rollback required)

**Description**: Template versioning or publication hash migration fails during production deployment.

**Possible Causes**:
- SQL syntax errors
- Constraint violations (foreign key, unique)
- Insufficient database permissions
- Timeout on large table

**Mitigation**:
- **Test on Staging First**: Run migration on staging database (Week 7)
- **Idempotent Migrations**: Use `IF NOT EXISTS`, `IF NOT NULL`
- **Rollback Script**: Prepare rollback migration for each forward migration
- **Backup**: Take database snapshot before migration
- **Monitor**: Watch migration progress; set timeout alerts

**Example Rollback**:
```sql
-- Rollback for template versioning
DROP TRIGGER IF EXISTS notices_template_version_link;
DROP TABLE IF EXISTS public.notice_template_versions;
ALTER TABLE public.notices DROP COLUMN IF EXISTS template_version_id;
```

**Deployment Sequence**:
1. Backup production database
2. Run migration in transaction
3. Test migration success (query new tables/columns)
4. If success: Commit transaction
5. If failure: Rollback transaction, investigate, fix, retry

**Status**: Standard database migration risk; well-managed

---

### RISK-006: Pilot Council Finds Critical Compliance Issue

**Category**: Legal & Compliance
**Probability**: MEDIUM (pilot is designed to catch issues)
**Impact**: HIGH (delays full launch, requires hotfix)

**Description**: During pilot (Week 11), council licensing officer identifies a statutory compliance issue missed in earlier reviews.

**Example Scenarios**:
- "The 28-day period is wrong; our solicitor says it should be calculated differently"
- "Historic England says they must be named explicitly, not just 'heritage bodies'"
- "Traffic Commissioner office address is wrong for our area"

**Mitigation**:
- **Comprehensive Legal Review**: Reduce likelihood via thorough Week 10 legal review
- **Pilot Support**: Provide immediate support to pilot councils; investigate any concerns within 2 hours
- **Hotfix Process**: Have expedited deployment process for critical fixes (< 24 hours)
- **Extension**: Allow pilot to extend to Week 12 if issues found

**Contingency**:
- If critical issue found: Immediate hotfix, re-test, notify all pilot users
- If non-critical issue: Document for next sprint, doesn't block launch
- If multiple issues: Pause pilot, conduct secondary review, extend timeline

**Status**: Acceptable risk; pilot designed to catch these

---

### RISK-007: Performance Degradation Under Load

**Category**: Technical Implementation
**Probability**: LOW (schema changes are minor)
**Impact**: MEDIUM (poor user experience, reputation)

**Description**: New schema fields, validation logic, or template rendering causes performance degradation.

**Possible Manifestations**:
- Wizard step transitions slow (> 2 seconds)
- Template rendering slow (> 5 seconds)
- PDF generation timeout
- Database queries slow

**Mitigation**:
- **Load Testing** (Week 9): Simulate 50 concurrent users creating notices
- **Benchmarking**: Measure render time for longest templates
- **Database Indexes**: Ensure indexes on frequently queried fields
- **Caching**: Cache rendered templates if generation is slow

**Benchmarks**:
- Wizard step transition: < 500ms (acceptable < 2s)
- Template render: < 2s (acceptable < 5s)
- PDF generation: < 3s (acceptable < 10s)
- Database query: < 100ms (acceptable < 500ms)

**Contingency**:
- If slow: Profile and optimize hot paths
- If database slow: Add indexes, optimize queries
- If template rendering slow: Consider template caching

**Status**: Low risk; monitor during QA

---

## High Risks (Probability: Medium, Impact: High OR Probability: High, Impact: Medium)

### RISK-008: Scope Creep During Development

**Category**: Timeline & Resources
**Probability**: MEDIUM
**Impact**: MEDIUM (timeline delay, team burnout)

**Description**: Additional requirements discovered mid-sprint, or stakeholders request feature additions.

**Example Scenarios**:
- "Can we also add TENs (Temporary Event Notices)?"
- "What about taxi licensing notices?"
- "The design needs to match our new brand guidelines"

**Mitigation**:
- **Strict Scope**: Document exact scope in REMEDIATION_SPEC.md; refer to it when new requests arise
- **Prioritization**: Product owner maintains priority list; new items go to backlog for next sprint
- **Change Control**: Any scope change requires CTO approval and timeline adjustment
- **Communication**: Educate stakeholders that goal is statutory compliance, not new features

**Response Template**:
```
Thank you for the suggestion. Our current focus is resolving the 8 critical statutory compliance issues to enable pilot launch by Week 11.

Your request has been added to the backlog for consideration in Sprint 2 (post-launch).

If you believe this is a critical compliance issue that blocks pilot, please escalate to [Product Owner] for priority review.
```

**Status**: Managed by product owner; requires discipline

---

### RISK-009: QA Resource Unavailable Week 9-10

**Category**: Timeline & Resources
**Probability**: MEDIUM
**Impact**: HIGH (cannot validate quality before pilot)

**Description**: QA engineer unavailable during critical testing phase (Week 9-10).

**Mitigation**:
- **Allocation**: Pre-allocate QA resource in Week 1; get commitment
- **Backup**: Identify backup QA resource (another engineer can do manual testing)
- **Automation**: Maximize automated test coverage to reduce manual QA burden
- **Buffer**: Week 10 Days 4-5 can absorb QA overflow if needed

**Contingency**:
- If QA unavailable: Developer performs manual testing using checklists
- If QA delayed: Extend timeline by 3-5 days (acceptable)

**Status**: Mitigate via early resource allocation

---

### RISK-010: Developer Capacity / Illness

**Category**: Timeline & Resources
**Probability**: MEDIUM
**Impact**: MEDIUM (timeline delay)

**Description**: Lead developer unavailable due to illness, holiday, or departure.

**Mitigation**:
- **Cross-Training**: Ensure 2nd engineer familiar with codebase
- **Documentation**: Comprehensive specs and code comments
- **Buffer Time**: Testing days can absorb 1-2 day delays
- **Prioritization**: If capacity reduced, defer DESIRABLE enhancements

**Contingency**:
- If 1-2 days lost: Use buffer time, work weekend if critical
- If 1 week lost: Extend timeline or reduce scope (defer HIGH priority issues to post-launch)
- If developer departure: Onboard replacement; extend timeline by 2 weeks

**Status**: Standard project risk; have contingency

---

### RISK-011: User Confusion with New Fields

**Category**: Adoption & Usability
**Probability**: MEDIUM
**Impact**: MEDIUM (support burden, user frustration)

**Description**: Users confused by new required fields (newspaper circulation, multi-jurisdiction, Traffic Commissioner dropdown).

**Manifestations**:
- High support ticket volume
- Users abandoning wizard mid-flow
- Users publishing notices with incorrect data

**Mitigation**:
- **Help Text**: Clear inline help for every new field
- **Examples**: Provide examples in placeholder text ("e.g., Hillcrest House, Leeds")
- **Validation Messages**: Friendly error messages with guidance
- **User Guide**: Comprehensive user guide with screenshots
- **Training**: Offer webinar or video tutorial for pilot councils

**Monitoring**:
- Track wizard abandonment rate (target < 20%)
- Track validation errors (which fields cause most issues)
- Review support tickets for common confusion

**Iteration**:
- After pilot, refine help text based on feedback
- Add tooltips for complex fields
- Consider progressive disclosure (hide advanced fields until needed)

**Status**: Acceptable risk; usability testing in Week 9 will identify issues

---

### RISK-012: Browser Compatibility Issues

**Category**: Technical Implementation
**Probability**: LOW
**Impact**: MEDIUM (some users cannot access platform)

**Description**: New components or validation logic doesn't work in older browsers (e.g., IE11, old Safari).

**Mitigation**:
- **Target Browsers**: Modern browsers only (Chrome, Firefox, Edge, Safari last 2 versions)
- **Polyfills**: Include polyfills for ES6+ features if targeting older browsers
- **Testing**: Test in multiple browsers during Week 9 QA
- **Messaging**: Display browser compatibility message for unsupported browsers

**Acceptable**: Modern browser requirement (local authorities typically have updated browsers)

**Status**: Low risk; standard web development

---

### RISK-013: PDF Generation Formatting Issues

**Category**: Technical Implementation
**Probability**: MEDIUM
**Impact**: MEDIUM (unprofessional appearance, user complaints)

**Description**: Longer templates (with new statutory text) cause PDF formatting issues (overflow, cut-off text, bad page breaks).

**Mitigation**:
- **Test After Changes** (Week 2): Generate PDF of longest template, check formatting
- **CSS Adjustments**: Use `page-break-inside: avoid` for paragraphs
- **Font Size**: Ensure font size readable (minimum 11pt)
- **Margins**: Ensure adequate margins (2cm all sides)

**Testing**: Generate PDF of every template variant during Week 9 QA

**Contingency**:
- If formatting issues: Adjust CSS, re-test
- If major issues: Consider alternative PDF library (html2pdf, puppeteer)

**Status**: Test early (Week 2) to catch issues

---

### RISK-014: Inadequate Monitoring / Alerting

**Category**: Technical Implementation
**Probability**: MEDIUM
**Impact**: MEDIUM (issues not caught early)

**Description**: Production issues (errors, performance, security) not caught until users report them.

**Mitigation**:
- **Error Tracking**: Sentry or similar for JavaScript and server errors
- **Performance Monitoring**: New Relic or similar for response times
- **Uptime Monitoring**: Pingdom or similar for availability
- **Log Aggregation**: Centralized logging for debugging
- **Alerts**: Configure alerts for critical errors, 5xx responses, downtime

**Setup** (Week 10 Days 4-5):
- Configure error tracking
- Set up dashboards
- Configure Slack/email alerts
- Test alert delivery

**Status**: Standard DevOps; allocate time in Week 10

---

### RISK-015: Support Escalation Process Undefined

**Category**: Timeline & Resources
**Probability**: MEDIUM
**Impact**: MEDIUM (poor pilot experience, unresolved issues)

**Description**: Pilot users encounter issues but don't know how to get help, or support team doesn't know how to escalate.

**Mitigation**:
- **Support Documentation** (Week 10): Create escalation matrix
  - **Tier 1** (User Questions): Product owner responds within 4 hours
  - **Tier 2** (Technical Issues): Engineer investigates within 2 hours
  - **Tier 3** (Legal/Compliance): Legal counsel reviews within 24 hours
- **Support Channels**: Email (support@), Slack channel for pilot councils, phone number for urgent
- **On-Call**: Engineer on-call during pilot week (Week 11)

**Escalation Matrix**:
| Issue Type | Severity | Response Time | Owner |
|------------|----------|---------------|-------|
| User question | Low | 4 hours | Product Owner |
| Validation error | Medium | 2 hours | Engineer |
| Template incorrect | High | 1 hour | Engineer + Legal |
| Platform down | Critical | 15 min | Engineer + CTO |

**Status**: Define in Week 10

---

### RISK-016: Rollback Complexity

**Category**: Technical Implementation
**Probability**: LOW
**Impact**: HIGH (cannot revert if issues found)

**Description**: If critical issue found post-deployment, rolling back is complex due to database migrations.

**Mitigation**:
- **Rollback Scripts**: Create rollback migration for every forward migration
- **Test Rollback**: Test rollback on staging before production
- **Backward Compatibility**: Ensure code handles absence of new fields gracefully
- **Deployment Strategy**: Deploy migrations separate from code (can rollback code without rolling back database)

**Example Rollback Scenario**:
1. Deploy migration (adds template_version_id column)
2. Deploy code (uses template_version_id column)
3. Issue found in code
4. Rollback code to previous version
5. Previous code handles missing template_version_id gracefully (optional field)
6. Fix code, re-deploy

**Status**: Plan rollback strategy for each migration

---

## Medium Risks (Probability: Low, Impact: High OR Probability: Medium, Impact: Low)

### RISK-017: Third-Party Service Dependency (Supabase)

**Category**: Technical Implementation
**Probability**: LOW (Supabase highly reliable)
**Impact**: HIGH (platform unavailable)

**Description**: Supabase outage or degradation affects platform availability.

**Mitigation**:
- **Monitor**: Subscribe to Supabase status page (status.supabase.com)
- **Backup**: Ensure regular backups (Supabase automatic backups)
- **Redundancy**: Consider multi-region setup (future enhancement)
- **Communication**: Have status page to inform users of outages

**Contingency**:
- If Supabase down: Display maintenance message to users
- If extended outage: Communicate timeline, offer refunds/credits if applicable

**Status**: Accept as inherent platform dependency

---

### RISK-018: OCR Quality Degradation

**Category**: Technical Implementation
**Probability**: MEDIUM
**Impact**: LOW (user can manually correct)

**Description**: OCR extraction quality varies based on document format, causing user frustration.

**Mitigation**:
- **User Expectation**: Set expectation that OCR is assistive, not perfect
- **Manual Override**: Always allow manual editing of extracted fields
- **Confidence Scores**: Display confidence scores to guide user review
- **Feedback Loop**: Collect examples of poor OCR for future model improvement

**Acceptable**: OCR is convenience feature, not critical path

**Status**: Not blocking; improve over time

---

### RISK-019: Competition Launches Similar Platform

**Category**: Adoption & Usability
**Probability**: MEDIUM
**Impact**: MEDIUM (market share loss)

**Description**: Competitor launches statutory notice platform while Civic Notices in development.

**Mitigation**:
- **Speed**: 12-week timeline is aggressive; first to market advantage
- **Quality**: Statutory compliance is differentiator; competitor may have same issues
- **Relationships**: Leverage existing council relationships

**Not Actionable**: Market competition is business risk, not project risk; outside scope

---

### RISK-020: Insufficient User Adoption Post-Launch

**Category**: Adoption & Usability
**Probability**: MEDIUM
**Impact**: MEDIUM (low ROI, product failure)

**Description**: Platform launches but councils don't sign up or don't actively use it.

**Possible Causes**:
- Councils satisfied with existing process (newspaper ads)
- Platform too complex or expensive
- Lack of awareness
- Competing priorities

**Mitigation**:
- **Marketing**: Targeted outreach to councils highlighting statutory compliance benefits
- **Pricing**: Competitive pricing vs. newspaper ads
- **Success Stories**: Showcase pilot council testimonials
- **Integrations**: Future REST API for integration with council systems (reduces friction)

**Not Blocking**: Adoption is business concern; ensure product quality first

---

### RISK-021: Future Regulatory Change Invalidates Templates

**Category**: Legal & Compliance
**Probability**: LOW (regulations stable)
**Impact**: MEDIUM (templates need updating)

**Description**: UK government publishes new licensing regulations requiring template changes.

**Mitigation**:
- **Template Versioning**: HIGH-017 provides infrastructure to update templates
- **Monitoring**: Subscribe to gov.uk updates, LGA newsletters
- **Agility**: Can deploy template updates within days (not weeks)

**Example Scenario**: Licensing Act Section 182 Guidance updated
- **Action**: Review guidance for template implications
- **If Change Required**: Update templates, increment version, notify councils
- **Rollout**: Councils use new version for new notices; old notices unaffected

**Status**: Template versioning system provides future-proofing

---

## Low Risks (Probability: Low, Impact: Low)

### RISK-022: Developer Disagreement on Implementation Approach

**Category**: Timeline & Resources
**Probability**: LOW (clear specs)
**Impact**: LOW (minor delay)

**Description**: Developers debate technical approach, causing minor delays.

**Mitigation**:
- **Clear Specs**: REMEDIATION_SPEC.md provides exact implementation
- **Decision Authority**: CTO or lead engineer has final say
- **Time-box**: Limit design discussions to 30 minutes; then decide

**Status**: Standard development process

---

### RISK-023: Minor UI/UX Issues Discovered Post-Launch

**Category**: Adoption & Usability
**Probability**: HIGH (inevitable with new features)
**Impact**: LOW (annoying but not blocking)

**Description**: Users report minor issues (typo, misaligned button, confusing label).

**Mitigation**:
- **Feedback Channel**: Easy way for users to report issues
- **Backlog**: Track in backlog, prioritize for next sprint
- **Hotfix Process**: Quick turnaround for simple fixes

**Acceptable**: Continuous improvement model

---

## Decision Log

### Open Questions Requiring Resolution

#### OQ-001: Handlebars Version Verification

**Question**: Does current Handlebars version support `each`, `if`, `unless` helpers?

**Impact**: CRIT-008 (multi-jurisdiction support)

**Decision Deadline**: Week 5 Day 1

**Action**: Run verification test (see TD-001)

**Status**: OPEN

---

#### OQ-002: GVOL Draft Migration Strategy

**Question**: How to handle existing GVOL drafts when schema changes?

**Options**:
1. Auto-migrate with warning banner (user must verify)
2. Invalidate old drafts, force re-entry
3. Manual migration by support team

**Impact**: RISK-002 (data loss)

**Decision Deadline**: Week 4 Day 1

**Recommendation**: Option 1 (auto-migrate with warning)

**Status**: OPEN

---

#### OQ-003: Template Versioning Seed Data

**Question**: How to populate initial template versions (assign effective dates to existing templates)?

**Options**:
1. All current templates effective from "2025-11-01" (pre-remediation)
2. Corrected templates effective from "2025-12-20" (post-remediation)
3. Assign based on actual deployment dates

**Impact**: HIGH-017 (template versioning)

**Decision Deadline**: Week 7 Day 1

**Recommendation**: Option 2 (mark corrected templates with remediation effective date)

**Status**: OPEN

---

#### OQ-004: Newspaper Circulation Validation Enforcement

**Question**: Should newspaper circulation confirmation be REQUIRED or just RECOMMENDED?

**Options**:
1. Required checkbox (blocks submission if not checked)
2. Warning only (allows submission but displays warning)

**Impact**: HIGH-015 (newspaper validation)

**Decision Deadline**: Week 6 Day 1

**Legal Opinion Needed**: Is this statutorily required or best practice?

**Recommendation**: Option 1 (required) if statutory, Option 2 (warning) if best practice

**Status**: OPEN - Legal counsel to advise

---

#### OQ-005: Publication Hash Storage

**Question**: Should publication hash be stored in `notices` table or separate `publication_audit` table?

**Options**:
1. Add column to `notices` table (simpler)
2. Create separate `publication_audit` table (more flexible for future)

**Impact**: MED-026 (publication hash)

**Decision Deadline**: Week 8 Day 1

**Recommendation**: Option 1 (add column) - simpler, hash directly linked to notice

**Status**: OPEN

---

### Assumptions Made (Requiring Validation)

#### ASSUMP-001: Licensing Act 10 Working Days Calculation

**Assumption**: "10 working days starting on the day after" means application date + 1 day + 10 working days

**Basis**: Most conservative interpretation

**Risk if Wrong**: Validation incorrectly flags valid notices

**Validation**: Legal counsel to confirm during Week 10 review

**Status**: ASSUMED (pending legal confirmation)

---

#### ASSUMP-002: GVOL 21 Days is Minimum

**Assumption**: "Not less than 21 days" allows longer periods (25, 28, 30 days)

**Basis**: Plain reading of "not less than" = minimum

**Risk if Wrong**: Validation allows invalid long periods

**Validation**: Legal counsel to confirm

**Status**: ASSUMED (pending legal confirmation)

---

#### ASSUMP-003: EIA 30 Days Starts from Publication

**Assumption**: EIA 30-day consultation period starts from date notice published, not date application submitted

**Basis**: Common practice; allows public time to see notice

**Risk if Wrong**: Validation enforces incorrect deadline

**Validation**: Legal counsel or planning officer to confirm

**Status**: ASSUMED (pending confirmation)

---

#### ASSUMP-004: Responsible Authorities List URL is Optional

**Assumption**: Providing URL to RA list is best practice but not statutory requirement

**Basis**: Statute says representor must serve RAs, doesn't require notice to provide list

**Risk if Wrong**: Missing statutory requirement

**Validation**: Legal counsel to confirm

**Status**: ASSUMED - Made field optional to be safe

---

#### ASSUMP-005: Historic England Must Be Named Explicitly

**Assumption**: Listed building notices should name Historic England specifically, not just "heritage bodies"

**Basis**: s.73 requires consultation with specified bodies; transparency best practice

**Risk if Wrong**: Generic wording may be acceptable

**Validation**: Legal counsel or planning officer to confirm

**Status**: ASSUMED - Better to be explicit

---

### Decisions Made (Locked In)

#### DEC-001: Template Wording Source

**Decision**: Use exact statutory wording from regulations where prescribed (e.g., false statement warning)

**Rationale**: Avoid any risk of paraphrasing errors

**Date**: 4 November 2025

**Status**: LOCKED

---

#### DEC-002: Multi-Jurisdiction as Optional Feature

**Decision**: Multi-jurisdiction support is optional field; users opt-in via checkbox

**Rationale**: Most notices are single-jurisdiction; avoid cluttering UI for common case

**Date**: 4 November 2025

**Status**: LOCKED

---

#### DEC-003: Template Versioning Effective Date Tracking

**Decision**: Track effective_from and deprecated_from dates for each template version

**Rationale**: Enables audit trail and historical notice validation

**Date**: 4 November 2025

**Status**: LOCKED

---

#### DEC-004: OCR Auto-Calculation is Assistive, Not Authoritative

**Decision**: Auto-calculated deadlines display with confidence score; user must review and confirm

**Rationale**: OCR not perfect; user responsible for accuracy

**Date**: 4 November 2025

**Status**: LOCKED

---

#### DEC-005: Pilot Before Full Launch

**Decision**: 1-week controlled pilot with 2-3 councils mandatory before general availability

**Rationale**: Real-world validation reduces post-launch issues

**Date**: 4 November 2025

**Status**: LOCKED

---

## Monitoring & Review Process

### Weekly Risk Review (Fridays)

**Agenda**:
1. Review open risks - any escalations?
2. Review open questions - any decisions made?
3. Update risk probabilities based on progress
4. Identify new risks
5. Update mitigation plans

**Attendees**: Product Owner, Lead Engineer, CTO (if critical risks)

**Output**: Updated risk register, action items for next week

---

### Milestone Gate Reviews

**Process**: At each milestone exit criteria review, assess:
1. Which risks materialized?
2. How effective were mitigations?
3. Any new risks for next milestone?
4. Update risk probability/impact based on learnings

**Gates**:
- End of Week 2 (Milestone 1)
- End of Week 4 (Milestone 2)
- End of Week 6 (Milestone 3)
- End of Week 8 (Milestone 4)
- End of Week 10 (Milestone 5)
- End of Week 11 (Milestone 6)

---

### Post-Launch Review (End Week 12)

**Comprehensive Review**:
1. Which risks materialized? How were they handled?
2. Which mitigations were effective? Which weren't?
3. What risks were missed?
4. Lessons learned for future projects

**Output**: Post-launch report with risk retrospective

---

## Escalation Matrix

### When to Escalate to CTO

- Any CRITICAL risk probability increases
- Legal counsel sign-off delayed beyond Week 10
- Database migration failure in production
- Pilot council reports statutory compliance issue
- Timeline slippage > 1 week
- Major architectural decision needed

### When to Escalate to Legal Counsel

- Statutory interpretation uncertainty
- Pilot council receives complaint about notice
- Regulatory change during development
- External legal challenge

### When to Escalate to Product Owner

- Scope creep requests
- Resource unavailability
- Prioritization conflicts
- User feedback requires design change

---

## Document Control

**Version**: 1.0
**Date**: 4 November 2025
**Next Review**: Weekly (Fridays)
**Owner**: Product Owner

**Change Log**:
- v1.0 (4 Nov 2025): Initial risk register

**Approval Required**:
- [ ] CTO (risk acceptance)
- [ ] Product Owner (prioritization)
- [ ] Legal Counsel (legal risk awareness)

---

**END OF DEPENDENCIES & RISK REGISTER**

**Next Action**: Week 1 Day 1 - Risk review as part of kickoff meeting

**Critical Actions This Week**:
1. Schedule legal counsel review for Week 10
2. Verify Handlebars version and test `each` helper (or schedule for Week 5)
3. Identify 5-6 candidate pilot councils
4. Pre-allocate QA resource for Weeks 9-10

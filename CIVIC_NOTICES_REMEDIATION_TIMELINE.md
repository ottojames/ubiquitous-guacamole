# Civic Notices Platform — Remediation Timeline & Milestone Plan

**Document Version**: 1.0
**Date**: 4 November 2025
**Status**: Production-Ready Implementation Schedule
**Duration**: 12 weeks to full production readiness

---

## Executive Overview

### Timeline at a Glance

**Total Duration**: 12 weeks (approximately 3 months)
**Critical Path**: Weeks 1-4 (must complete before pilot)
**Pilot Phase**: Weeks 5-8
**Production Launch**: Week 12

### Phased Approach

```
Week 1-2   ████████████ Milestone 1: Critical Licensing Act Fixes
Week 3-4   ████████████ Milestone 2: Critical Gambling & GVOL Compliance
Week 5-6   ████████████ Milestone 3: High Priority Enhancements
Week 7-8   ████████████ Milestone 4: Workflow & Validation Improvements
Week 9-10  ████████████ Milestone 5: QA, Testing & Legal Review
Week 11    ████████████ Milestone 6: Controlled Pilot Launch
Week 12    ████████████ Milestone 7: Production Rollout
```

### Team Composition Required

**Minimum Team**:
- 1x Lead Full-Stack Engineer (React + Express + Supabase)
- 1x QA Engineer (manual + automated testing)
- 1x Product Owner (regulatory liaison, priority decisions)
- 0.5x Legal Counsel (template review, statutory interpretation)
- 0.5x Designer (UI enhancements, GDPR guidance component)

**Ideal Team** (for parallel workstreams):
- 2x Full-Stack Engineers (one focused on templates, one on schemas/validation)
- 1x QA Engineer
- 1x Product Owner
- 0.5x Legal Counsel
- 0.5x Designer

### Key Deliverables

**End of Week 2**: All critical template fixes deployed to staging
**End of Week 4**: All critical schema enhancements and validation complete
**End of Week 8**: High priority features complete; pilot-ready
**End of Week 10**: QA complete; legal sign-off obtained
**End of Week 12**: Production launch; all councils can onboard

---

## Detailed Milestone Breakdown

---

## Milestone 1: Critical Licensing Act Fixes
**Duration**: Weeks 1-2
**Status Gate**: MUST COMPLETE before any pilot deployment
**Team Allocation**: 1 Engineer, 0.25 QA, 0.25 Legal

### Week 1: Template Text Corrections

#### Day 1-2: Licensing False Statement Warnings
**Issues Addressed**: CRIT-001

**Tasks**:
1. Add false statement warning to 5 licensing templates
   - `licensing-premises-variation` (line 43)
   - `licensing-premises-review` (line 54)
   - `licensing-club-new` (line 63)
   - `licensing-club-variation` (line 72)
   - `licensing-club-review` (line 81)

2. Create unit test suite for statutory compliance
   - Test all 6 templates for presence of warning
   - Verify exact wording matches Reg 25(1)(d)

3. Render sample notices for legal review
   - Generate PDF samples of all 6 variants
   - Prepare for legal counsel review

**Deliverables**:
- [ ] 5 templates updated with statutory warning
- [ ] Unit tests passing (100% coverage for warnings)
- [ ] Sample PDFs generated for legal review

**Acceptance Criteria**:
- All 6 licensing templates contain exact statutory wording: "It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine."
- Unit test `licensing.test.ts` validates presence in all variants
- No regression in existing functionality

**Risk Mitigation**:
- Simple text additions, minimal technical risk
- Legal counsel review scheduled for Day 3

---

#### Day 3-4: Licensing Responsible Authorities Statement
**Issues Addressed**: CRIT-002

**Tasks**:
1. Enhance licensing schema
   - Add `RESPONSIBLE_AUTHORITIES_SERVED` field
   - Add `RESPONSIBLE_AUTHORITIES_LIST_URL` field

2. Update all 6 licensing templates
   - Modify representation paragraph to include RA service requirement
   - Implement conditional display of URL

3. Update UI form (ConfirmStep.tsx)
   - Add URL input field
   - Add help text explaining RA requirement

4. Create unit tests
   - Test conditional rendering with/without URL
   - Test all 6 template variants

**Deliverables**:
- [ ] Schema enhancement complete
- [ ] All 6 templates updated
- [ ] UI form updated with URL field
- [ ] Unit tests passing

**Acceptance Criteria**:
- All templates state: "Representors must also serve a copy of their representations on each of the responsible authorities"
- URL displays conditionally when provided
- Generic text displays when URL not provided
- Schema validates URL format if provided

**Risk Mitigation**:
- Optional field, backward compatible
- Conditional rendering is standard pattern

---

#### Day 5: Probate Template Enhancement
**Issues Addressed**: CRIT-007

**Tasks**:
1. Replace probate template with full statutory wording
   - Add "TRUSTEE ACT 1925, SECTION 27" header
   - Add "pursuant to section 27" language
   - Add complete liability protection clause

2. Create unit test for s.27 compliance
   - Verify all required phrases present
   - Test alias display

3. Generate sample notice for legal review

**Deliverables**:
- [ ] Probate template updated with full s.27 wording
- [ ] Unit test passing
- [ ] Sample PDF for legal review

**Acceptance Criteria**:
- Template explicitly invokes "TRUSTEE ACT 1925, SECTION 27"
- Contains complete protection language: "having regard only to the claims and interests of which they have had notice, and will not be liable..."
- Alias field displays conditionally

**Risk Mitigation**:
- Straightforward text replacement
- Enhanced wording provides stronger legal protection

---

### Week 2: Multi-Jurisdiction Support

#### Day 1-3: Licensing Multi-Jurisdiction Schema & Templates
**Issues Addressed**: CRIT-008

**Tasks**:
1. Enhance licensing schema
   - Add `ADDITIONAL_LICENSING_AUTHORITIES` array field
   - Add `PRIMARY_AUTHORITY_DESIGNATION` field
   - Implement validation for nested objects

2. Update all 6 licensing templates
   - Add conditional rendering for additional authorities
   - Test Handlebars `each` helper support

3. Update UI form (ConfirmStep.tsx)
   - Add checkbox for boundary premises
   - Implement dynamic add/remove authority fields
   - Add form state management for authority array

4. Create comprehensive unit tests
   - Test single authority (default case)
   - Test multiple authorities with correct formatting
   - Test edge cases (2, 3, 5 authorities)

**Deliverables**:
- [ ] Schema enhancement complete with array validation
- [ ] All 6 templates updated with conditional rendering
- [ ] UI form with dynamic add/remove functionality
- [ ] Unit tests covering all scenarios

**Acceptance Criteria**:
- Schema accepts array of authority objects (name, address, email)
- Templates display: "applied to [Primary] (concurrent applications to [Authority A], [Authority B])"
- UI allows adding/removing authorities dynamically
- Formatting correct for 1-N authorities (commas, no trailing comma)

**Risk Mitigation**:
- Verify Handlebars version supports `each` helper
- Test dynamic form state management thoroughly
- Optional field, backward compatible

---

#### Day 4-5: Week 2 Testing & Legal Review

**Tasks**:
1. Run full unit test suite
   - All licensing templates (6 variants)
   - Probate template
   - Schema validation tests

2. Run integration tests
   - Create notices with new fields
   - Verify rendering in all scenarios
   - Test multi-jurisdiction rendering

3. Conduct manual smoke testing
   - Create licensing notice with all new fields
   - Create licensing notice with boundary premises
   - Create probate notice
   - Verify PDF exports

4. Legal counsel review
   - Review all sample notices
   - Confirm statutory compliance
   - Sign-off on template wording

5. Prepare for staging deployment

**Deliverables**:
- [ ] Full test suite passing (unit + integration)
- [ ] Manual test report with screenshots
- [ ] Legal counsel sign-off obtained
- [ ] Deployment plan for staging

**Acceptance Criteria**:
- Zero failing tests
- Legal counsel confirms templates meet statutory requirements
- No regressions in existing functionality
- Ready for staging deployment

---

### Milestone 1 Exit Criteria

**Definition of Done**:
- [ ] All 8 CRITICAL issues (CRIT-001 to CRIT-008) resolved
- [ ] Unit tests passing with 100% coverage for changes
- [ ] Integration tests passing
- [ ] Manual smoke tests complete
- [ ] Legal counsel review and sign-off obtained
- [ ] Deployed to staging environment
- [ ] No critical bugs in staging

**Go/No-Go Decision Point**:
- If ALL exit criteria met → Proceed to Milestone 2
- If ANY exit criteria not met → Resolve blockers before proceeding

**Estimated Completion**: End of Week 2

---

## Milestone 2: Critical Gambling & GVOL Compliance
**Duration**: Weeks 3-4
**Status Gate**: MUST COMPLETE before pilot
**Team Allocation**: 1 Engineer, 0.25 QA, 0.25 Legal

### Week 3: Gambling Act Compliance

#### Day 1: Gambling Schedule 9 Reference
**Issues Addressed**: CRIT-003

**Tasks**:
1. Update all 16 gambling template headers
   - Find and replace "GAMBLING ACT 2005" with "GAMBLING ACT 2005, SCHEDULE 9"
   - Can be automated via sed command

2. Create unit test
   - Validate all 16 templates cite Schedule 9

3. Generate sample notices

**Deliverables**:
- [ ] 16 gambling templates updated
- [ ] Unit test passing
- [ ] Sample PDFs generated

**Acceptance Criteria**:
- All 16 gambling templates begin with "GAMBLING ACT 2005, SCHEDULE 9"
- No other changes to template content

**Effort**: 2 hours (can be scripted)

---

#### Day 2-3: Gambling Licensing Objectives
**Issues Addressed**: CRIT-004

**Tasks**:
1. Add licensing objectives paragraph to all 16 gambling templates
   - Insert after premises description, before inspection details
   - State all three objectives: (a) crime prevention, (b) fair conduct, (c) child protection

2. Create unit test
   - Verify all three objectives present in all templates

3. Manual review of template flow
   - Ensure objectives statement positioned logically

**Deliverables**:
- [ ] 16 gambling templates updated with objectives
- [ ] Unit test passing
- [ ] Sample PDFs showing objectives

**Acceptance Criteria**:
- All templates include: "Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime..., (b) ensuring that gambling is conducted in a fair and open way, (c) protecting children and other vulnerable persons..."
- Objectives appear before inspection details in all variants

**Effort**: 4-6 hours

---

#### Day 4-5: Planning Listed Building Consultees
**Issues Addressed**: CRIT-006

**Tasks**:
1. Enhance planning schema
   - Add `HISTORIC_ENGLAND_NOTIFIED` boolean
   - Add `STATUTORY_CONSULTEES` text field
   - Add validation for listed building variant

2. Update 2 planning templates
   - `planning-listed`: Add "notified to Historic England" statement
   - `planning-conservation`: Add "notified to heritage bodies" statement

3. Update UI form
   - Add conditional checkbox for Historic England
   - Add text field for additional consultees
   - Display only for listed/conservation variants

4. Create unit tests
   - Test consultee statement display
   - Test validation enforcement

**Deliverables**:
- [ ] Planning schema enhanced
- [ ] 2 templates updated
- [ ] UI form updated with conditional fields
- [ ] Unit tests passing

**Acceptance Criteria**:
- Listed building template states "has been notified to Historic England"
- Conservation area template states "has been notified to relevant heritage bodies"
- Validation requires Historic England checkbox for listed buildings
- Additional consultees display conditionally if provided

---

### Week 4: GVOL Compliance

#### Day 1-3: GVOL Traffic Commissioner Authority
**Issues Addressed**: CRIT-005

**Tasks**:
1. Redesign GVOL schema
   - Replace `AUTHORITY_NAME` with `TRAFFIC_AREA` enum (8 areas)
   - Replace `AUTHORITY_ADDRESS` with `TRAFFIC_COMMISSIONER_OFFICE`
   - Add `TRAFFIC_COMMISSIONER_EMAIL`

2. Update 2 GVOL templates
   - Replace authority references with Traffic Commissioner
   - Add "Guide to Making Representations" statement

3. Update UI form
   - Replace authority fields with traffic area dropdown
   - Add office address textarea
   - Add help text with example addresses

4. Update schema registry mapping
   - Map new fields to NoticeBase format
   - Ensure backward compatibility

5. Create data migration plan
   - Document existing GVOL notices
   - Plan migration from old fields to new
   - Warn users with existing drafts

**Deliverables**:
- [ ] GVOL schema redesigned with enum
- [ ] 2 GVOL templates updated
- [ ] UI form with traffic area dropdown
- [ ] Schema registry mapping updated
- [ ] Migration plan documented

**Acceptance Criteria**:
- Templates reference "Traffic Commissioner at [office address]"
- Traffic area dropdown presents all 8 areas (Scottish, North Eastern, North Western, West Midlands, East of England, Western, South Eastern & Metropolitan, Wales)
- No generic "AUTHORITY_NAME" in rendered notices
- Migration plan addresses existing drafts

**Risk Mitigation**:
- Breaking schema change; requires careful migration
- Provide grace period for users to update existing drafts
- Document migration in release notes

---

#### Day 4-5: Week 4 Testing & Staging Validation

**Tasks**:
1. Run full unit test suite
   - All gambling templates (16 variants)
   - Planning templates (listed, conservation)
   - GVOL templates (2 variants)

2. Run integration tests
   - Create notices of each type
   - Verify all new fields captured and rendered
   - Test edge cases

3. Manual smoke testing
   - Create gambling notice → verify Schedule 9 and objectives
   - Create listed building notice → verify Historic England statement
   - Create GVOL notice → verify Traffic Commissioner dropdown and rendering

4. Regression testing
   - Verify licensing notices from Milestone 1 still work
   - Verify probate notices from Milestone 1 still work
   - Check no performance degradation

5. Legal counsel review (if needed)
   - Review gambling objectives wording
   - Review planning consultee statements
   - Confirm GVOL authority structure correct

6. Staging deployment
   - Deploy all changes to staging
   - Conduct UAT with product owner

**Deliverables**:
- [ ] Full test suite passing
- [ ] Manual test report
- [ ] Regression test report (no issues)
- [ ] Legal review complete (if required)
- [ ] Staging deployment complete
- [ ] UAT sign-off from product owner

**Acceptance Criteria**:
- All tests passing
- No regressions identified
- Staging environment stable
- Product owner confirms all CRITICAL issues resolved

---

### Milestone 2 Exit Criteria

**Definition of Done**:
- [ ] All remaining CRITICAL issues (CRIT-003 to CRIT-006) resolved
- [ ] Full test suite passing (unit + integration + manual)
- [ ] Legal counsel review complete
- [ ] Staging environment stable and tested
- [ ] Zero critical bugs in staging
- [ ] All 8 CRITICAL issues from Milestones 1-2 verified working

**Go/No-Go Decision Point**:
- If ALL exit criteria met → Proceed to Milestone 3 (HIGH priority issues)
- If ANY exit criteria not met → Resolve before pilot preparation

**Estimated Completion**: End of Week 4

---

## Milestone 3: High Priority Enhancements
**Duration**: Weeks 5-6
**Status Gate**: Pilot-ready state
**Team Allocation**: 1-2 Engineers, 0.5 QA, 0.25 Legal

### Week 5: Statutory Enhancements

#### Day 1: Licensing DPS Enhancement
**Issues Addressed**: HIGH-009

**Tasks**:
1. Update licensing templates (2 lines)
   - Add DPS personal licence authority display
   - Use existing `DPS_LICENSING_AUTHORITY` field (already in schema)

2. Unit test

**Deliverables**: Templates updated, tested
**Effort**: 1 hour

---

#### Day 1-2: Gambling Transfer Notice Period
**Issues Addressed**: HIGH-011

**Tasks**:
1. Update 4 gambling transfer templates
   - Add 14-day determination period statement

2. Unit test

**Deliverables**: 4 templates updated, tested
**Effort**: 2 hours

---

#### Day 2: Gambling Review Applicant Category
**Issues Addressed**: HIGH-012

**Tasks**:
1. Enhance gambling schema
   - Add `REVIEW_APPLICANT_CATEGORY` enum

2. Update UI form
   - Add dropdown for category selection

3. Unit test

**Deliverables**: Schema and UI updated, tested
**Effort**: 2 hours

---

#### Day 3: GVOL Existing Licence Number
**Issues Addressed**: HIGH-013

**Tasks**:
1. Add field to GVOL schema
2. Update variation template
3. Update UI form
4. Unit test

**Deliverables**: Schema, template, UI updated
**Effort**: 2 hours

---

#### Day 4-5: Planning EIA Environmental Statement Inspection
**Issues Addressed**: HIGH-014

**Tasks**:
1. Enhance planning schema
   - Add `ENVIRONMENTAL_STATEMENT_LOCATION`
   - Add `ENVIRONMENTAL_STATEMENT_TIMES`

2. Update planning-eia template
   - Add "may be inspected free of charge at [location] during [times]"

3. Update UI form
   - Add conditional fields for EIA variant

4. Unit tests

**Deliverables**:
- [ ] Schema enhanced
- [ ] Template updated
- [ ] UI form updated
- [ ] Tests passing

**Effort**: 4 hours

---

### Week 6: Workflow & Compliance Infrastructure

#### Day 1-2: Newspaper Circulation Validation
**Issues Addressed**: HIGH-015

**Tasks**:
1. Enhance licensing schema
   - Add `NEWSPAPER_NAME`, `NEWSPAPER_CIRCULATION_AREA`, `NEWSPAPER_CIRCULATES_LOCALLY`

2. Enhance gambling schema (same fields)

3. Update UI forms for both
   - Add newspaper fields with validation
   - Add checkbox with mandatory confirmation

4. Create unit tests
   - Test validation enforces confirmation
   - Test required fields

**Deliverables**:
- [ ] Both schemas enhanced
- [ ] UI forms updated for licensing and gambling
- [ ] Validation enforces newspaper circulation confirmation
- [ ] Tests passing

**Effort**: 6 hours

---

#### Day 3: GDPR Redaction Guidance
**Issues Addressed**: HIGH-016

**Tasks**:
1. Create PrivacyGuidance component
   - Design info box with icon
   - List personal data minimization guidelines
   - Add link to full privacy policy

2. Integrate in ConfirmStep
   - Display at top of form
   - Visible for all notice types

3. Test display on all variants

**Deliverables**:
- [ ] PrivacyGuidance component created
- [ ] Integrated in wizard flow
- [ ] Displays correctly on all notice types

**Effort**: 4 hours

---

#### Day 4-5: Licensing Interim Steps Notice Type
**Issues Addressed**: HIGH-010

**Tasks**:
1. Add notice type definition
   - Update `noticeTypes.ts`

2. Create interim steps schema
   - Add validation for required fields (`INTERIM_STEPS_DESCRIPTION`, `REVIEW_REFERENCE`)

3. Create interim steps template
   - Full statutory wording for s.53C

4. Register in schema registry

5. Create unit tests

6. Create E2E test

**Deliverables**:
- [ ] Notice type defined
- [ ] Schema created with validation
- [ ] Template created
- [ ] Registry updated
- [ ] Tests passing
- [ ] Can create interim steps notice end-to-end

**Effort**: 1 day (8 hours)

---

### Milestone 3 Exit Criteria

**Definition of Done**:
- [ ] All HIGH priority issues (HIGH-009 to HIGH-016) resolved
- [ ] Newspaper circulation validation enforced
- [ ] GDPR guidance displayed in wizard
- [ ] Interim steps notice type functional
- [ ] Full test suite passing
- [ ] No regressions from Milestones 1-2
- [ ] Staging deployment complete

**Go/No-Go Decision Point**:
- If ALL exit criteria met → Proceed to Milestone 4
- If ANY exit criteria not met → Resolve before pilot

**Estimated Completion**: End of Week 6

---

## Milestone 4: Workflow & Validation Improvements
**Duration**: Weeks 7-8
**Status Gate**: Enhanced user experience and compliance automation
**Team Allocation**: 1 Engineer, 0.5 QA

### Week 7: Template Versioning & Validation Fixes

#### Day 1-2: Template Versioning System
**Issues Addressed**: HIGH-017

**Tasks**:
1. Create database migration
   - `notice_template_versions` table
   - Link `notices.template_version_id`

2. Run migration on staging

3. Create seed script
   - Populate initial versions from current templates
   - Document statutory basis for each

4. Update notice creation logic
   - Store template version ID on notice creation

5. Create admin UI for version history (optional)

**Deliverables**:
- [ ] Migration created and tested
- [ ] Seed script populates all current templates
- [ ] Notice creation links to template version
- [ ] Version history queryable

**Effort**: 1.5 days

---

#### Day 3: Validation Rule Fixes
**Issues Addressed**: MED-019, MED-020, MED-021

**Tasks**:
1. Fix licensing 10-working-day calculation
   - Adjust start date to day after application
   - Change `>` to `>=`

2. Fix GVOL 21-day validation
   - Change `!==` to `<` (minimum, not exact)

3. Update validation messages for clarity

4. Create unit tests for date calculations

**Deliverables**:
- [ ] 3 validation rules fixed
- [ ] Unit tests passing
- [ ] Edge cases tested

**Effort**: 4 hours

---

#### Day 4-5: OCR Auto-Calculate Deadlines
**Issues Addressed**: MED-024

**Tasks**:
1. Enhance legalDetails.ts
   - Add logic to calculate deadline from application date
   - Use notice type to determine days (28 for licensing, 21 for planning, etc.)

2. Add confidence score to metadata

3. Create unit tests
   - Test calculation for each notice type
   - Test that manual deadline not overwritten

4. Integration test OCR flow

**Deliverables**:
- [ ] Auto-calculation logic implemented
- [ ] Respects notice type rules
- [ ] Unit tests passing
- [ ] OCR extraction includes calculated deadline with confidence score

**Effort**: 6 hours

---

### Week 8: Audit Trail & Draft Management

#### Day 1-2: Publication Hash for Audit Trail
**Issues Addressed**: MED-026

**Tasks**:
1. Create database migration
   - Add `publication_hash` column
   - Create trigger function for SHA-256 hash on publication

2. Run migration on staging

3. Test trigger
   - Create notice → publish → verify hash generated
   - Test hash is immutable after publication

4. Add hash display in UI (optional)
   - Show hash in notice details for admins

**Deliverables**:
- [ ] Migration created and tested
- [ ] Trigger generates SHA-256 hash on publication
- [ ] Hash immutable after publication
- [ ] Can verify notice text integrity via hash

**Effort**: 6 hours

---

#### Day 3: Draft Expiry Warnings
**Issues Addressed**: MED-025

**Tasks**:
1. Enhance draftStore.ts
   - Add timestamp checking on draft load
   - Calculate days since application date

2. Create warning banner component

3. Display warning if application date > 9 working days old
   - "The 10-working-day newspaper publication window may have expired. Verify compliance before proceeding."

4. Test with old draft

**Deliverables**:
- [ ] Draft store checks timestamp
- [ ] Warning banner displays for old drafts
- [ ] User can dismiss warning and proceed

**Effort**: 4 hours

---

#### Day 4-5: Planning Departure Explanation & Final Testing
**Issues Addressed**: HIGH-018

**Tasks**:
1. Update planning-departure template
   - Add explanatory text: "This application is a departure from the Development Plan and has been notified to the Secretary of State."

2. Week 8 comprehensive testing
   - Run full test suite (unit + integration + E2E)
   - Manual smoke testing of all notice types
   - Performance testing (load time, render time)
   - Security audit (RLS policies, data access)

3. Prepare for QA phase

**Deliverables**:
- [ ] Planning departure template enhanced
- [ ] Full test suite passing
- [ ] Manual test report
- [ ] Performance benchmarks acceptable
- [ ] Security audit complete

---

### Milestone 4 Exit Criteria

**Definition of Done**:
- [ ] Template versioning system operational
- [ ] Validation rules fixed and tested
- [ ] OCR auto-calculation working
- [ ] Publication hash audit trail implemented
- [ ] Draft expiry warnings functional
- [ ] Full test suite passing (100+ tests)
- [ ] No critical or high severity bugs
- [ ] Performance within acceptable limits
- [ ] Security audit complete

**Go/No-Go Decision Point**:
- If ALL exit criteria met → Proceed to Milestone 5 (QA & Legal Review)
- If ANY exit criteria not met → Resolve before proceeding

**Estimated Completion**: End of Week 8

---

## Milestone 5: QA, Testing & Legal Review
**Duration**: Weeks 9-10
**Status Gate**: Production-ready quality assurance
**Team Allocation**: 1 QA Engineer (full-time), 1 Engineer (support), 0.5 Legal Counsel

### Week 9: Comprehensive QA

#### Day 1-2: End-to-End Testing Campaign

**Tasks**:
1. Execute full E2E test suite
   - Licensing notices (all 6 variants + interim steps)
   - Gambling notices (all 16 variants)
   - GVOL notices (2 variants)
   - Planning notices (all variants including EIA, listed, conservation)
   - Probate notices

2. Test all statutory compliance elements
   - Use regulatory validation checklists (from spec)
   - Verify every mandatory statement present
   - Verify conditional fields work correctly

3. Test multi-jurisdiction scenarios
   - Create boundary premises licensing notice
   - Verify multiple authorities display correctly

4. Test newspaper circulation validation
   - Attempt to create notice without confirmation → should fail
   - Create valid notice → should succeed

5. Document all test results

**Deliverables**:
- [ ] E2E test report covering all 35+ notice types
- [ ] Regulatory validation checklist completed
- [ ] All tests passing or issues documented
- [ ] Screenshots of sample notices

**Acceptance Criteria**:
- Zero critical bugs blocking pilot
- All HIGH priority bugs resolved
- MEDIUM bugs documented and triaged

---

#### Day 3: Accessibility & Usability Testing

**Tasks**:
1. Accessibility audit
   - WCAG 2.1 AA compliance check
   - Keyboard navigation testing
   - Screen reader compatibility (NVDA/JAWS)
   - Color contrast validation

2. Usability testing
   - Test wizard flow with realistic data
   - Time how long it takes to create each notice type
   - Identify friction points

3. Mobile responsiveness testing
   - Test on tablet and mobile devices
   - Verify forms usable on smaller screens

**Deliverables**:
- [ ] Accessibility audit report
- [ ] Usability test report with timing data
- [ ] Mobile compatibility report
- [ ] List of UX improvements for future

**Acceptance Criteria**:
- Core functionality accessible via keyboard
- Forms usable on tablets (desktops is primary target)
- Average notice creation time < 15 minutes

---

#### Day 4-5: Performance & Security Testing

**Tasks**:
1. Performance testing
   - Load testing: 50 concurrent users creating notices
   - Database query optimization
   - Template rendering speed
   - PDF generation speed

2. Security testing
   - Verify RLS policies work correctly
   - Test data access permissions
   - Audit SQL injection vectors
   - Check XSS vulnerabilities

3. Data integrity testing
   - Test publication hash immutability
   - Test audit log completeness
   - Test template version linkage

**Deliverables**:
- [ ] Performance test report with benchmarks
- [ ] Security audit report
- [ ] Data integrity verification report
- [ ] List of optimizations for future

**Acceptance Criteria**:
- Notice creation completes in < 5 seconds (excluding OCR)
- PDF generation in < 3 seconds
- No security vulnerabilities found
- All audit logs complete and immutable

---

### Week 10: Legal Review & Documentation

#### Day 1-3: Legal Counsel Review

**Tasks**:
1. Prepare legal review package
   - Rendered sample of every notice type (35+ samples)
   - Statutory reference mapping document
   - Comparison of old vs new wording for critical fixes
   - List of all template changes made

2. Legal counsel review
   - Schedule review meetings
   - Address any questions or concerns
   - Make minor wording adjustments if needed

3. Obtain formal legal sign-off
   - Written confirmation that templates meet statutory requirements
   - Document any caveats or recommendations

**Deliverables**:
- [ ] Legal review package delivered
- [ ] Legal counsel review complete
- [ ] Formal legal sign-off obtained
- [ ] Any final wording adjustments made

**Acceptance Criteria**:
- Legal counsel confirms all CRITICAL issues resolved
- Legal counsel confirms templates comply with all cited statutes
- Written sign-off obtained for audit trail

---

#### Day 4-5: Documentation & Pilot Preparation

**Tasks**:
1. Update documentation
   - Update CLAUDE.md with new schema fields
   - Update README.md with new notice types
   - Document all template changes
   - Create migration guide for existing users

2. Create pilot materials
   - User guide for pilot councils
   - Training presentation/video
   - Sample data for testing
   - Support escalation process

3. Set up monitoring
   - Error tracking (Sentry or similar)
   - Usage analytics
   - Performance monitoring
   - Audit log monitoring

4. Prepare pilot launch plan
   - Identify 2-3 pilot councils
   - Schedule onboarding calls
   - Prepare feedback survey

**Deliverables**:
- [ ] All documentation updated
- [ ] Pilot user guide complete
- [ ] Training materials ready
- [ ] Monitoring tools configured
- [ ] Pilot councils identified and confirmed

**Acceptance Criteria**:
- Documentation accurate and complete
- Pilot materials ready for distribution
- Monitoring captures all critical events
- 2-3 pilot councils committed

---

### Milestone 5 Exit Criteria

**Definition of Done**:
- [ ] Full E2E test suite passing
- [ ] Regulatory validation checklists 100% complete
- [ ] Accessibility audit complete (no critical issues)
- [ ] Performance benchmarks met
- [ ] Security audit complete (no vulnerabilities)
- [ ] Legal counsel review and sign-off obtained
- [ ] All documentation updated
- [ ] Pilot materials prepared
- [ ] Monitoring tools configured
- [ ] Pilot councils confirmed and scheduled

**Go/No-Go Decision Point**:
**CRITICAL GATE**: Legal sign-off REQUIRED to proceed to pilot

- If legal sign-off obtained AND all QA complete → Proceed to Milestone 6 (Pilot)
- If legal sign-off not obtained → Resolve concerns and re-submit
- If critical QA issues → Resolve before pilot

**Estimated Completion**: End of Week 10

---

## Milestone 6: Controlled Pilot Launch
**Duration**: Week 11
**Status Gate**: Real-world validation with friendly councils
**Team Allocation**: 1 Engineer (on-call), 1 QA (monitoring), 1 Product Owner (liaison)

### Week 11: Pilot Launch & Monitoring

#### Day 1: Pilot Deployment

**Tasks**:
1. Deploy to production with feature flag
   - Enable only for pilot council accounts
   - All other councils see "coming soon" message

2. Conduct onboarding sessions
   - Walk through wizard flow
   - Demonstrate each notice type relevant to council
   - Provide user guide and support contact

3. Set up monitoring dashboard
   - Real-time error tracking
   - Usage metrics
   - Notice publication success rate

**Deliverables**:
- [ ] Production deployment complete
- [ ] Feature flag configured for pilot councils
- [ ] Onboarding sessions conducted
- [ ] Monitoring dashboard live

---

#### Day 2-3: Active Monitoring & Support

**Tasks**:
1. Monitor pilot usage daily
   - Track notices created
   - Monitor error rates
   - Review audit logs

2. Provide immediate support
   - Respond to pilot user questions within 2 hours
   - Resolve any issues immediately
   - Document all feedback

3. Daily check-ins with pilot councils
   - Email check-in each morning
   - Quick call if issues arise

**Deliverables**:
- [ ] Daily monitoring reports
- [ ] Support ticket log
- [ ] Feedback log

---

#### Day 4-5: Feedback Collection & Iteration

**Tasks**:
1. Collect structured feedback
   - Send feedback survey to pilot users
   - Schedule feedback call with each council
   - Ask specific questions about statutory compliance and usability

2. Analyze feedback
   - Identify common issues or confusion points
   - Prioritize any fixes needed before full launch

3. Make minor adjustments if needed
   - Fix any critical bugs found during pilot
   - Clarify confusing UI elements
   - Update help text if needed

4. Prepare go-live decision

**Deliverables**:
- [ ] Feedback survey results
- [ ] Feedback call notes
- [ ] Analysis report with recommendations
- [ ] Any hotfix deployments

---

### Milestone 6 Exit Criteria

**Definition of Done**:
- [ ] At least 2 pilot councils actively using platform
- [ ] At least 10 notices published successfully by pilot users
- [ ] Zero critical bugs reported
- [ ] User satisfaction score > 8/10
- [ ] Feedback collected and analyzed
- [ ] Any critical hotfixes deployed
- [ ] Legal validity of pilot notices confirmed (no challenges)

**Go/No-Go Decision Point**:
**CRITICAL GATE**: Pilot success REQUIRED to proceed to full launch

- If pilot successful (criteria above met) → Proceed to Milestone 7 (Production Launch)
- If critical issues identified → Resolve and extend pilot
- If user satisfaction low → Iterate and improve before full launch

**Estimated Completion**: End of Week 11

---

## Milestone 7: Production Rollout
**Duration**: Week 12
**Status Gate**: General availability for all councils
**Team Allocation**: Full team (2 Engineers, 1 QA, 1 Product Owner, 0.5 Legal on standby)

### Week 12: Full Production Launch

#### Day 1: Production Deployment

**Tasks**:
1. Remove feature flags
   - Enable platform for all councils
   - Publish release notes

2. Deploy final version
   - Merge all hotfixes from pilot
   - Full production deployment

3. Enable self-service onboarding
   - Activate sign-up flow
   - Activate email verification

4. Announce launch
   - Email existing contacts
   - Post on website and social media
   - Notify trade associations (LGA, NALC, etc.)

**Deliverables**:
- [ ] Production deployment complete
- [ ] Feature flags removed
- [ ] Self-service onboarding active
- [ ] Launch announcement sent

---

#### Day 2-3: Launch Monitoring & Support Surge

**Tasks**:
1. Intensive monitoring
   - Monitor error rates hourly
   - Track sign-ups and notices published
   - Watch for any pattern of issues

2. Provide rapid support
   - Respond to all support tickets within 4 hours
   - Escalate critical issues immediately
   - Document common questions for FAQ

3. Publish FAQ updates
   - Add answers to common questions
   - Update user guide based on feedback

**Deliverables**:
- [ ] Hourly monitoring reports
- [ ] Support ticket response log (< 4 hour response time)
- [ ] Updated FAQ and user guide

---

#### Day 4-5: Post-Launch Review & Stabilization

**Tasks**:
1. Conduct post-launch review
   - Analyze launch metrics
   - Review all issues encountered
   - Identify patterns or systemic issues

2. Create post-launch report
   - Summary of launch success
   - Key metrics (sign-ups, notices published, satisfaction)
   - Lessons learned
   - Recommendations for next sprint

3. Plan next iteration
   - Prioritize DESIRABLE enhancements
   - Plan future feature development
   - Establish ongoing template review process

4. Celebrate success!

**Deliverables**:
- [ ] Post-launch review meeting held
- [ ] Post-launch report published
- [ ] Next sprint planned
- [ ] Team recognition and celebration

---

### Milestone 7 Exit Criteria

**Definition of Done**:
- [ ] Platform live for all councils
- [ ] Zero critical bugs in production
- [ ] At least 20 councils signed up
- [ ] At least 50 notices published
- [ ] Average user satisfaction > 8.5/10
- [ ] Support response time < 4 hours
- [ ] Uptime > 99.5%
- [ ] Post-launch review complete

**Production Readiness Achieved**: Yes

**Estimated Completion**: End of Week 12

---

## Resource Allocation Summary

### By Week

| Week | Engineers | QA | Product Owner | Legal | Designer | Total FTE |
|------|-----------|----|--------------:|------:|---------:|----------:|
| 1-2  | 1 FTE     | 0.25 | 0.25 | 0.25 | 0 | 1.75 |
| 3-4  | 1 FTE     | 0.25 | 0.25 | 0.25 | 0 | 1.75 |
| 5-6  | 1-2 FTE   | 0.5  | 0.25 | 0.25 | 0.25 | 2.25-3.25 |
| 7-8  | 1 FTE     | 0.5  | 0.25 | 0 | 0 | 1.75 |
| 9-10 | 0.5 FTE   | 1 FTE| 0.5 | 0.5 | 0 | 2.5 |
| 11   | 0.5 FTE   | 0.5  | 1 FTE | 0 (standby) | 0 | 2.0 |
| 12   | 1 FTE     | 0.5  | 1 FTE | 0 (standby) | 0 | 2.5 |

### By Role (Total Effort)

- **Engineers**: 9.5-10.5 person-weeks
- **QA**: 3.75 person-weeks
- **Product Owner**: 3.5 person-weeks
- **Legal Counsel**: 1.25 person-weeks
- **Designer**: 0.25 person-weeks

**Total Project Effort**: Approximately 18-19 person-weeks

---

## Risk Management Timeline

### Week-by-Week Risk Monitoring

**Weeks 1-2**:
- **Risk**: Legal counsel unavailable for review
- **Mitigation**: Pre-schedule legal review in Week 1 Day 1

**Weeks 3-4**:
- **Risk**: GVOL schema change breaks existing drafts
- **Mitigation**: Create migration script; warn users with banner

**Weeks 5-6**:
- **Risk**: Handlebars template engine doesn't support `each` helper
- **Mitigation**: Verify in Week 5 Day 1; upgrade if needed

**Weeks 7-8**:
- **Risk**: Template versioning migration fails
- **Mitigation**: Test thoroughly on staging; have rollback plan

**Weeks 9-10**:
- **Risk**: Legal counsel requests wording changes
- **Mitigation**: Allow 2-3 days buffer for revisions

**Week 11**:
- **Risk**: Pilot councils find critical compliance issue
- **Mitigation**: Immediate hotfix; extend pilot if needed

**Week 12**:
- **Risk**: Launch traffic overwhelms servers
- **Mitigation**: Gradual rollout; monitor capacity; scale if needed

---

## Contingency Planning

### Buffer Time Allocation

**Built-in Buffers**:
- Week 2 Day 4-5: Testing buffer (can absorb Week 1 overruns)
- Week 4 Day 4-5: Testing buffer (can absorb Week 3 overruns)
- Week 10 Day 4-5: Documentation buffer (can extend QA if needed)

**If Timeline Slips**:
- **1-2 days**: Use testing buffer days, work overtime if needed
- **3-5 days**: Delay pilot launch by 1 week (Milestone 6 → Week 12, Milestone 7 → Week 13)
- **1+ week**: Re-scope project; defer DESIRABLE enhancements; focus on CRITICAL + HIGH only

### Escalation Triggers

**Escalate to CTO if**:
- Legal sign-off delayed beyond Week 10
- Critical bug found in Week 11 pilot that requires > 2 days to fix
- Pilot councils report statutory non-compliance

**Escalate to Legal Counsel if**:
- Pilot council receives complaint about notice validity
- Uncertainty about statutory interpretation arises

**Escalate to Product Owner if**:
- Scope creep threatens timeline
- Additional requirements discovered mid-sprint

---

## Communication Plan

### Internal Status Updates

**Daily Standups** (Weeks 1-10):
- 15-minute sync each morning
- What did you do yesterday?
- What will you do today?
- Any blockers?

**Weekly Sprint Reviews** (Fridays):
- Demo completed work
- Review milestone exit criteria
- Plan next week

**Bi-Weekly Stakeholder Updates** (End of Weeks 2, 4, 6, 8, 10):
- Email update to CTO, Legal, Product leadership
- Summary of progress
- Highlight any risks or blockers
- Confirm on-track for timeline

### External Communication (Pilot Councils)

**Week 10**: Pilot invitation emails sent
**Week 11 Day 1**: Onboarding calls
**Week 11 Daily**: Check-in emails
**Week 11 Day 5**: Feedback survey
**Week 12 Day 1**: Launch announcement

---

## Success Criteria & KPIs

### Milestone Completion Metrics

| Milestone | Target Date | Definition of Done | Status |
|-----------|-------------|-------------------|--------|
| M1: Critical Licensing | End Week 2 | All licensing & probate fixes complete | - |
| M2: Gambling & GVOL | End Week 4 | All critical issues resolved | - |
| M3: High Priority | End Week 6 | Pilot-ready state | - |
| M4: Workflow Improvements | End Week 8 | Enhanced UX & automation | - |
| M5: QA & Legal | End Week 10 | Legal sign-off obtained | - |
| M6: Pilot | End Week 11 | Pilot successful | - |
| M7: Production Launch | End Week 12 | General availability | - |

### Quality Metrics

- **Test Coverage**: > 80% for all new code
- **Bug Severity**: Zero critical bugs at each milestone gate
- **Legal Compliance**: 100% of regulatory checklist items met
- **Performance**: Notice creation < 15 minutes, rendering < 5 seconds

### Adoption Metrics (Post-Launch)

- **Week 12**: 20+ councils signed up
- **Month 1**: 50+ notices published
- **Month 3**: 50+ active councils
- **Month 12**: 500+ notices/month

---

## Appendix: Milestone Checklists

### Milestone 1 Checklist (End Week 2)

**Critical Licensing Act Fixes**
- [ ] CRIT-001: False statement warning in 5 licensing templates
- [ ] CRIT-002: Responsible authorities statement in 6 licensing templates
- [ ] CRIT-007: Probate template full s.27 wording
- [ ] CRIT-008: Multi-jurisdiction support in licensing schema and templates
- [ ] Unit tests passing (100% coverage for changes)
- [ ] Integration tests passing
- [ ] Legal counsel review complete
- [ ] Staging deployment successful

### Milestone 2 Checklist (End Week 4)

**Gambling & GVOL Compliance**
- [ ] CRIT-003: Schedule 9 in 16 gambling templates
- [ ] CRIT-004: Licensing objectives in 16 gambling templates
- [ ] CRIT-006: Consultee statements in planning templates
- [ ] CRIT-005: GVOL Traffic Commissioner schema and templates
- [ ] Full test suite passing
- [ ] No regressions from Milestone 1
- [ ] Staging stable and tested

### Milestone 3 Checklist (End Week 6)

**High Priority Enhancements**
- [ ] HIGH-009: DPS licensing authority in templates
- [ ] HIGH-010: Interim steps notice type complete
- [ ] HIGH-011: Gambling transfer 14-day period
- [ ] HIGH-012: Gambling review applicant category
- [ ] HIGH-013: GVOL existing licence number
- [ ] HIGH-014: Planning EIA inspection details
- [ ] HIGH-015: Newspaper circulation validation
- [ ] HIGH-016: GDPR redaction guidance
- [ ] All tests passing

### Milestone 4 Checklist (End Week 8)

**Workflow Improvements**
- [ ] HIGH-017: Template versioning system operational
- [ ] MED-019, 020, 021: Validation rules fixed
- [ ] MED-024: OCR auto-calculate deadlines
- [ ] MED-025: Draft expiry warnings
- [ ] MED-026: Publication hash audit trail
- [ ] HIGH-018: Planning departure explanation
- [ ] Performance and security testing complete

### Milestone 5 Checklist (End Week 10)

**QA & Legal Review**
- [ ] E2E testing complete (all 35+ notice types)
- [ ] Regulatory validation checklists 100% complete
- [ ] Accessibility audit complete
- [ ] Performance benchmarks met
- [ ] Security audit complete
- [ ] Legal counsel review and sign-off obtained
- [ ] Documentation updated
- [ ] Pilot materials prepared
- [ ] Monitoring configured

### Milestone 6 Checklist (End Week 11)

**Pilot Launch**
- [ ] Pilot deployment complete (feature flagged)
- [ ] 2-3 pilot councils onboarded
- [ ] At least 10 notices published by pilot users
- [ ] Zero critical bugs reported
- [ ] User satisfaction > 8/10
- [ ] Feedback collected and analyzed
- [ ] Go-live decision approved

### Milestone 7 Checklist (End Week 12)

**Production Launch**
- [ ] Full production deployment
- [ ] Feature flags removed
- [ ] Self-service onboarding active
- [ ] Launch announcement sent
- [ ] 20+ councils signed up
- [ ] 50+ notices published
- [ ] Zero critical bugs
- [ ] Uptime > 99.5%
- [ ] Post-launch review complete

---

## Document Control

**Version**: 1.0
**Date**: 4 November 2025
**Next Review**: Weekly during implementation
**Owner**: Product Owner

**Change Log**:
- v1.0 (4 Nov 2025): Initial timeline published

**Approval Required**:
- [ ] CTO (resource allocation)
- [ ] Legal Counsel (legal review timeline)
- [ ] Product Owner (milestone priorities)

---

**END OF TIMELINE**

**Next Action**: Week 1 Day 1 kickoff meeting with full team

# Civic Notices Platform — Residual Risks and Mitigation Plan

**Document Version**: 1.0
**Date**: 4 November 2025
**Audit Reference**: Baseline Pre-Implementation Compliance Assessment
**Status**: Risk Register for Production Deployment Planning

---

## Executive Summary

This document identifies **residual risks** that remain after implementation of the statutory remediation plan, plus **emergent risks** discovered during the baseline compliance audit. It provides mitigation strategies and monitoring protocols for each identified risk.

### Risk Summary Dashboard

| Risk Category | Total Risks | CRITICAL | HIGH | MEDIUM | LOW | Mitigation Status |
|---------------|-------------|----------|------|--------|-----|-------------------|
| **Legal & Compliance** | 6 | 2 | 3 | 1 | 0 | 🟡 Planned |
| **Technical & Implementation** | 5 | 1 | 2 | 2 | 0 | 🟡 Planned |
| **Operational & Process** | 4 | 0 | 2 | 2 | 0 | 🟡 Planned |
| **Third-Party & External** | 3 | 0 | 1 | 1 | 1 | 🟢 Monitored |
| **Reputational & Business** | 3 | 1 | 1 | 1 | 0 | 🟡 Planned |
| **TOTAL** | **21** | **4** | **9** | **7** | **1** | |

**Legend**:
- 🔴 Unmitigated: No mitigation plan in place
- 🟡 Planned: Mitigation strategy defined, not yet implemented
- 🟢 Monitored: Mitigation active, requires ongoing monitoring
- ✅ Resolved: Risk eliminated or reduced below monitoring threshold

---

## CRITICAL RISKS

### RISK-001: Legal Challenge to Published Notices (Pre-Remediation)

**Category**: Legal & Compliance
**Severity**: CRITICAL
**Probability**: HIGH (95%+) if deployed without fixes
**Impact**: SEVERE — Judicial review, notice invalidation, council liability

**Description**:
If the platform is deployed before remediation of 8 CRITICAL statutory compliance issues, published notices will be procedurally defective under:
- Licensing Act 2003 (missing false statement warnings, responsible authorities)
- Gambling Act 2005 (missing Schedule 9, licensing objectives)
- GVOL Act 1995 (incorrect authority structure)
- Planning Acts (missing consultee statements)
- Trustee Act 1925 (incomplete protection wording)

**Consequence**:
- Notices could be challenged in court as invalid
- Licensing/planning decisions made based on defective notices susceptible to judicial review
- Council exposed to costs, damages, reputational harm
- Applicants may claim procedural unfairness

**Mitigation Strategy**:
✅ **PRIMARY MITIGATION** (Blocks deployment):
1. ❌ **DO NOT DEPLOY** platform until all 8 CRITICAL issues remediated
2. ✅ Obtain legal counsel written sign-off on all templates (Week 10)
3. ✅ Conduct pilot with 2-3 friendly councils before general availability (Week 11)
4. ✅ Monitor pilot notices for any legal challenges during first 90 days

**Residual Risk After Mitigation**: LOW
- After remediation + legal sign-off + successful pilot → risk reduced to <5%

**Monitoring**:
- Track all notices published during pilot
- Weekly check for judicial review applications or ombudsman complaints
- Escalation protocol if any challenge received

**Status**: 🔴 **UNMITIGATED** (remediation not yet started)

---

### RISK-002: Breaking Schema Change Disrupts Existing Users (GVOL Migration)

**Category**: Technical & Implementation
**Severity**: CRITICAL (during migration window)
**Probability**: MEDIUM-HIGH (60-70%) if migration not planned
**Impact**: HIGH — Data loss, user frustration, abandoned applications

**Description**:
CRIT-005 (Traffic Commissioner structure) requires breaking schema change:
- Old fields: AUTHORITY_NAME, AUTHORITY_ADDRESS (generic)
- New fields: TRAFFIC_AREA (enum), TRAFFIC_COMMISSIONER_OFFICE (specific)

If users have saved GVOL drafts when migration occurs:
- Drafts will fail validation (missing required fields)
- Users must re-enter data
- May lose work if not warned in advance

**Consequence**:
- User frustration and complaints
- Potential draft abandonment
- Support ticket volume spike
- Negative perception of platform reliability

**Mitigation Strategy**:
✅ **Pre-Deployment Actions** (Week 4):
1. Query production database for existing GVOL drafts:
   ```sql
   SELECT COUNT(*), council_id, created_at
   FROM notice_drafts
   WHERE notice_type LIKE '%gvol%'
   AND status = 'draft'
   GROUP BY council_id;
   ```
2. **If drafts exist**: Email affected councils 1 week before deployment (template in docs/GVOL_MIGRATION_PLAN.md)
3. Provide grace period: Allow users to complete/publish existing drafts before migration
4. Deploy draft load error handling:
   ```typescript
   function loadDraft(draftId: string): Draft | null {
     // Detect old GVOL schema and show migration banner
     if (parsed.noticeType?.includes('gvol') && !parsed.TRAFFIC_AREA) {
       showMigrationWarning('Your GVOL draft uses an older format...');
       return null; // Force user to start fresh
     }
   }
   ```

**Residual Risk After Mitigation**: LOW-MEDIUM
- Users warned in advance: frustration minimized
- Grace period: work not lost
- Clear migration messaging: users understand why

**Monitoring**:
- Track support tickets tagged "GVOL" or "migration" for 2 weeks post-deployment
- Monitor draft abandonment rate (target: <5%)
- Survey affected users for feedback

**Status**: 🟡 **MITIGATION PLANNED** (documented in GVOL_MIGRATION_PLAN.md)

---

### RISK-004: Misinterpretation of Statutory Requirements by Development Team

**Category**: Legal & Compliance
**Severity**: CRITICAL
**Probability**: MEDIUM (30-40%)
**Impact**: SEVERE — Non-compliant templates despite remediation effort

**Description**:
Some statutory regulations are open to interpretation (e.g., "responsible authorities" service requirement, EIA consultation start date). If development team implements fixes based on incorrect interpretation:
- Templates may still be non-compliant despite remediation
- Legal counsel may reject templates in Week 10 review
- Rework required, timeline延长

**Consequence**:
- Delayed launch (weeks or months)
- Wasted development effort
- Budget overrun
- Loss of pilot council confidence

**Mitigation Strategy**:
✅ **Proactive Validation** (Throughout implementation):
1. **Week 1**: Legal counsel preliminary review of remediation spec (2-hour consultation)
2. **Week 2**: Developer Q&A session with legal counsel (clarify ambiguous requirements)
3. **Week 5**: Mid-point legal review of implemented templates (catch errors early)
4. **Week 10**: Final legal sign-off before pilot

✅ **Regulatory Reference Materials**:
- Provide development team with APPENDIX: Statutory Reference Library (in CIVIC_NOTICES_REMEDIATION_SPEC.md)
- Link to original Acts and Regulations (legislation.gov.uk)
- Reference Law Society guidance for probate notices
- Consult with licensing officers from pilot councils

✅ **Pair Programming**:
- Assign one developer to focus on statutory wording (not just code)
- Cross-review between developers before submitting for legal review

**Residual Risk After Mitigation**: LOW
- Multiple checkpoints catch errors before final sign-off
- External validation reduces interpretation risk

**Monitoring**:
- Track legal counsel feedback during Week 5 review
- Document any interpretation clarifications for future reference

**Status**: 🟡 **MITIGATION PLANNED** (legal review schedule in REMEDIATION_TIMELINE.md)

---

### RISK-017: Reputational Damage from Failed Pilot

**Category**: Reputational & Business
**Severity**: CRITICAL (for market adoption)
**Probability**: MEDIUM (20-30%) if pilot not carefully managed
**Impact**: HIGH — Loss of market confidence, councils reject platform

**Description**:
If pilot councils encounter:
- Statutory compliance issues (missed during remediation)
- Critical bugs or system failures
- Poor usability causing notice publication delays
- Legal challenges to pilot notices

Then:
- Pilot councils may publicly criticize platform
- Other councils hear negative feedback, refuse adoption
- Platform gains reputation as "not ready" or "risky"
- Market penetration fails

**Consequence**:
- Business model fails (no revenue from subscriptions)
- Development investment wasted
- Platform must be withdrawn from market

**Mitigation Strategy**:
✅ **Pilot Selection Criteria** (Week 5):
1. Choose "friendly" councils:
   - Existing relationship/partnership
   - Willing to provide detailed feedback
   - Understand this is controlled pilot (not full production)
   - Small volume of notices (reduce exposure)
2. Target: 2-3 councils, <50 notices total during pilot month

✅ **Pilot Success Criteria** (Week 11):
- Define clear success metrics before pilot starts:
  - Zero statutory compliance issues raised
  - <3 critical bugs per 100 notices
  - Average publication time <15 minutes
  - User satisfaction score >8/10
- Daily monitoring during pilot
- Rapid response support (< 2 hour SLA for critical issues)

✅ **Pilot Termination Protocol**:
- If critical compliance issue discovered → immediate pilot pause
- Root cause analysis within 24 hours
- Remediation + re-testing before pilot resumes
- Transparent communication with pilot councils

✅ **Positive Launch Messaging**:
- Secure pilot council testimonials before general availability
- Case studies and success metrics for marketing
- Invite pilot councils to co-present at industry events

**Residual Risk After Mitigation**: LOW
- Controlled pilot reduces exposure
- Success criteria ensure readiness before scaling
- Positive testimonials counter any negative feedback

**Monitoring**:
- Daily pilot metrics dashboard
- Weekly feedback sessions with pilot councils
- Post-pilot retrospective and lessons learned

**Status**: 🟡 **MITIGATION PLANNED** (pilot protocol in REMEDIATION_TIMELINE.md)

---

## HIGH RISKS

### RISK-005: Handlebars Template Engine Limitations (Multi-Jurisdiction)

**Category**: Technical & Implementation
**Severity**: HIGH
**Probability**: LOW-MEDIUM (15-25%)
**Impact**: HIGH — CRIT-008 remediation blocked, multi-jurisdiction support fails

**Description**:
CRIT-008 (multi-jurisdiction support) requires Handlebars `{{#each}}` helper to iterate over array of additional licensing authorities. If current Handlebars version doesn't support `each` helper or has bugs:
- Multi-jurisdiction rendering will fail
- Development timeline延长 to upgrade/patch Handlebars
- May require architectural rework (different template engine)

**Consequence**:
- Boundary premises notices cannot be published
- Major feature gap for urban areas (Westminster/Camden/City of London)
- Pilot councils may reject platform if they have boundary premises

**Mitigation Strategy**:
✅ **Pre-Implementation Verification** (Week 1 Day 1):
1. Check Handlebars version: `npm list handlebars`
2. Test `{{#each}}` helper with sample data:
   ```javascript
   const template = Handlebars.compile('{{#each items}}{{name}}{{#unless @last}}, {{/unless}}{{/each}}');
   const result = template({ items: [{name: 'A'}, {name: 'B'}] });
   // Expected: "A, B"
   ```
3. If not supported:
   - Upgrade Handlebars to latest version
   - Test for breaking changes in existing templates
   - If upgrade breaks templates → consider alternative (Mustache, custom renderer)

✅ **Contingency Plan**:
- If `{{#each}}` unavailable: Implement custom Handlebars helper
- If custom helper fails: Pre-render multi-jurisdiction text in schema mapping function

**Residual Risk After Mitigation**: VERY LOW
- Early testing (Day 1) catches issue before development starts
- Multiple fallback options available

**Monitoring**:
- Regression tests for `{{#each}}` helper after any Handlebars upgrade
- E2E tests for multi-jurisdiction notices

**Status**: 🟡 **MITIGATION PLANNED** (verification task in IMPLEMENTATION_NOTES.md)

---

### RISK-006: Legal Counsel Unavailable for Review (Week 10)

**Category**: Third-Party & External
**Severity**: HIGH
**Probability**: MEDIUM (25-35%)
**Impact**: MEDIUM-HIGH — Pilot launch delayed 1-4 weeks

**Description**:
Week 10 legal counsel review is **critical gate** before pilot launch. If legal counsel:
- Is unavailable (holiday, court commitments, other priorities)
- Takes longer than expected (5-10 days estimate may slip to 2-3 weeks)
- Requests significant rework based on review

Then pilot launch (Week 11) is delayed.

**Consequence**:
- Pilot councils disappointed by delay
- Timeline extends beyond 12 weeks
- Budget overrun if extended development period
- Market launch postponed

**Mitigation Strategy**:
✅ **Early Engagement** (Week 1):
1. Contact legal counsel Day 1 of implementation
2. Confirm availability for Week 10 review (reserve calendar time)
3. Provide advance notice of review materials scope
4. Agree on turnaround time (5 business days)

✅ **Phased Review**:
- Week 5: Mid-point review (catch major issues early)
- Week 10: Final sign-off (should be faster if Week 5 review done)

✅ **Parallel Track**:
- If legal counsel delayed → continue with technical QA and E2E testing
- Pilot launch can be postponed 1-2 weeks without losing progress

✅ **Backup Legal Resource**:
- Identify backup legal counsel (external firm) if primary counsel unavailable
- Pre-qualify backup to review specific notice types if needed

**Residual Risk After Mitigation**: LOW-MEDIUM
- Early engagement secures calendar time
- Phased review reduces Week 10 workload
- Backup resource available if needed

**Monitoring**:
- Week 5: Confirm Week 10 appointment still available
- Week 8: Send pre-review materials to legal counsel
- Week 9: Final reminder and logistics confirmation

**Status**: 🟡 **MITIGATION PLANNED** (engagement protocol in REMEDIATION_TIMELINE.md)

---

### RISK-007: Pilot Council Discovers Critical Compliance Issue

**Category**: Legal & Compliance
**Severity**: HIGH
**Probability**: LOW-MEDIUM (10-20%)
**Impact**: HIGH — Pilot paused, public notice issues, rework required

**Description**:
Despite comprehensive remediation and legal review, pilot council may discover:
- Missing statutory requirement not identified in audit
- Local authority-specific compliance concern
- Real-world edge case not covered in testing
- Regulatory interpretation difference

Example: Council's licensing officer says "We can't use this because..."

**Consequence**:
- Pilot immediately paused (cannot publish defective notices)
- Emergency remediation required
- Loss of pilot council confidence
- Potential public notices already published may need correction/republication
- Legal exposure if defective notice already relied upon

**Mitigation Strategy**:
✅ **Pre-Pilot Validation** (Week 9-10):
1. Share sample rendered notices with pilot council licensing/planning officers BEFORE pilot starts
2. Request feedback: "Would these notices meet your statutory requirements?"
3. Address any concerns before pilot launch

✅ **Pilot Protocol**:
- Start with low-risk notice types (not urgent applications)
- Pilot council reviews each notice before publication (double-check)
- Daily check-in calls during first week
- Escalation hotline for compliance concerns

✅ **Rapid Response Plan**:
- If issue discovered:
  - Immediately pause new notice publications
  - Assess severity (affects pilot only vs. all councils)
  - Emergency fix within 24-48 hours if critical
  - Re-validate with legal counsel
  - Resume pilot or extend testing period

✅ **Insurance/Indemnity**:
- Review terms of service and liability clauses
- Ensure platform provider has professional indemnity insurance
- Clarify council vs. platform responsibility for notice content

**Residual Risk After Mitigation**: LOW
- Pre-pilot validation catches council-specific concerns
- Controlled pilot limits exposure
- Rapid response minimizes impact

**Monitoring**:
- Daily pilot feedback log
- Track all council questions/concerns
- Post-pilot survey: "Were there any compliance concerns we didn't address?"

**Status**: 🟡 **MITIGATION PLANNED** (pilot protocol in REMEDIATION_TIMELINE.md)

---

### RISK-010: Scope Creep During Implementation

**Category**: Operational & Process
**Severity**: HIGH
**Probability**: MEDIUM-HIGH (40-50%)
**Impact**: MEDIUM — Timeline延长, budget overrun, incomplete remediation

**Description**:
During implementation, team may be tempted to add:
- "While we're at it" improvements
- New features requested by stakeholders
- Performance optimizations
- UX enhancements beyond scope

This diverts attention from statutory compliance fixes and extends timeline.

**Consequence**:
- CRITICAL issues not completed in 2 weeks as planned
- Pilot launch delayed
- Budget exceeded
- Team burnout

**Mitigation Strategy**:
✅ **Strict Scope Control**:
1. Product Owner acts as gatekeeper
2. "No new features" rule during remediation phase
3. Feature requests captured in backlog for post-launch
4. Weekly scope review meetings

✅ **Clear Priorities**:
- IMMEDIATE → HIGH → MEDIUM → DESIRABLE
- IMMEDIATE issues MUST be done before moving to HIGH
- No work on DESIRABLE until MEDIUM complete

✅ **Change Control Process**:
- Any scope addition requires:
  - Written justification (why it's critical now)
  - Timeline impact assessment
  - CTO approval
- Default answer to scope additions: "Post-launch"

**Residual Risk After Mitigation**: MEDIUM
- Scope creep is common in software projects
- Requires ongoing vigilance

**Monitoring**:
- Daily standup: "Are we working on anything not in the spec?"
- Weekly sprint review: Velocity tracking
- Burndown chart: Flag if velocity drops

**Status**: 🟡 **MITIGATION PLANNED** (change control process defined)

---

### RISK-011: UI Form Complexity Reduces Usability

**Category**: Operational & Process
**Severity**: HIGH
**Probability**: MEDIUM (30-40%)
**Impact**: MEDIUM — User confusion, abandoned notices, support burden

**Description**:
Remediation adds many new fields to schemas:
- Responsible authorities URL (CRIT-002)
- Multi-jurisdiction authorities (CRIT-008)
- Traffic area dropdown (CRIT-005)
- Historic England checkbox (CRIT-006)
- Newspaper validation fields (HIGH-015)

Result: Forms become cluttered, users overwhelmed, error rate increases.

**Consequence**:
- Users abandon notices mid-flow
- High error rate → support tickets
- Negative user feedback: "Too complicated"
- Licensing officers prefer paper forms

**Mitigation Strategy**:
✅ **Progressive Disclosure**:
- Show fields conditionally (only when relevant)
- Example: Multi-jurisdiction fields only if "boundary premises" checkbox ticked
- Collapsible sections for optional fields

✅ **Inline Help Text**:
- Every new field has:
  - Clear label
  - Help text (what it's for, why it's needed)
  - Example value
- Tooltips for statutory basis (link to Act/Regulation)

✅ **User Testing** (Week 6):
- Test wizard with actual licensing officers
- Observe: Where do they get stuck? What fields are confusing?
- Iterate based on feedback before pilot

✅ **Contextual Guidance**:
- "Why are we asking this?" tooltips
- Links to example completed notices

**Residual Risk After Mitigation**: LOW-MEDIUM
- Good UX design can handle form complexity
- User testing validates approach

**Monitoring**:
- Track wizard abandonment rate by step
- Heatmaps: Which fields do users hover over (confused)?
- Support ticket analysis: Common user questions

**Status**: 🟡 **MITIGATION PLANNED** (UX review in Week 6)

---

### RISK-013: Regulatory Changes During Development

**Category**: Legal & Compliance
**Severity**: HIGH (if change is major)
**Probability**: LOW (5-10%) during 12-week window
**Impact**: MEDIUM-HIGH — Rework required, timeline延长

**Description**:
UK Government introduces:
- Amendment to Licensing Act 2003 Regulations
- New statutory notice requirements
- Court ruling affecting notice wording
- Guidance update from Department for Business & Trade

During 12-week implementation window, requiring rework.

**Consequence**:
- Templates need updating (again)
- Legal review must be redone
- Timeline extends
- Moving target frustration

**Mitigation Strategy**:
✅ **Monitoring Protocol**:
1. Subscribe to gov.uk alerts:
   - Licensing Act 2003 updates
   - Gambling Act 2005 updates
   - Planning legislation changes
2. Weekly check of:
   - legislation.gov.uk (new SIs)
   - gov.uk consultations
   - LACORS/LGA guidance

✅ **Template Versioning System** (HIGH-017):
- If change occurs → create new template version
- Existing notices use old version (valid when published)
- New notices use updated version
- Audit trail preserved

✅ **Contingency Buffer**:
- 12-week timeline includes buffer for minor adjustments
- If major change → escalate to CTO for timeline re-assessment

**Residual Risk After Mitigation**: LOW
- Probability of major change in 12 weeks is low
- Template versioning handles changes gracefully

**Monitoring**:
- Weekly regulatory scan by Product Owner
- Escalation protocol if change detected

**Status**: 🟡 **MITIGATION PLANNED** (monitoring protocol defined, versioning in HIGH-017)

---

## MEDIUM RISKS

### RISK-008: Performance Degradation from Schema Complexity

**Category**: Technical & Implementation
**Severity**: MEDIUM
**Probability**: LOW (10-15%)
**Impact**: MEDIUM — Slower notice rendering, user frustration

**Description**:
New schema fields add complexity:
- More validation rules
- More conditional template logic ({{#if}} blocks)
- Larger data payloads

May result in slower rendering times, especially if:
- Database queries inefficient
- Template engine struggles with nested conditionals
- Frontend validation is slow

**Consequence**:
- Notice preview takes >5 seconds to render (target: <2 seconds)
- Users perceive platform as "slow"
- Concurrent usage may cause server strain

**Mitigation Strategy**:
✅ **Performance Testing** (Week 7-8):
- Load testing: 50 concurrent notice creations
- Rendering benchmarks: <2 seconds per notice
- Database query optimization: Add indexes if needed

✅ **Caching**:
- Cache rendered templates (immutable once published)
- Cache validation results for repeated checks

✅ **Monitoring**:
- Application Performance Monitoring (APM) tool
- Track P95 response times
- Alert if rendering >5 seconds

**Residual Risk After Mitigation**: VERY LOW
- New fields are optional, minimal impact
- Performance testing catches issues early

**Status**: 🟡 **MITIGATION PLANNED** (performance testing in Week 7-8)

---

### RISK-012: Support Ticket Volume Spike During Pilot

**Category**: Operational & Process
**Severity**: MEDIUM
**Probability**: MEDIUM-HIGH (50-60%)
**Impact**: MEDIUM — Team distraction, support burden

**Description**:
Pilot councils will inevitably encounter:
- User questions about new fields
- Edge cases not covered in documentation
- Bugs not found in testing
- Feature requests

Support ticket volume may spike 5-10x during pilot month.

**Consequence**:
- Development team pulled away from post-pilot work
- Support response SLA breached
- Council frustration if tickets not resolved quickly

**Mitigation Strategy**:
✅ **Dedicated Support Resource** (Week 11):
- Assign one team member to full-time support during pilot
- Daily triage of tickets
- Escalation to development team only for critical bugs

✅ **Self-Service Documentation**:
- User guides for each notice type
- Video tutorials (screen recordings)
- FAQ based on pilot feedback
- Searchable knowledge base

✅ **Proactive Onboarding**:
- Train pilot council users before go-live (1-hour session)
- Provide test environment for practice
- Check-in calls: Days 1, 3, 7, 14, 30

✅ **Ticket Categorization**:
- Critical bugs → immediate escalation
- Feature requests → post-launch backlog
- User questions → answered via docs or training

**Residual Risk After Mitigation**: LOW-MEDIUM
- Support spike is expected, planned for
- Self-service docs reduce ticket volume

**Monitoring**:
- Daily support ticket dashboard
- Track resolution time by category
- Weekly retrospective: What could be better documented?

**Status**: 🟡 **MITIGATION PLANNED** (support protocol in pilot plan)

---

### RISK-014: Test Coverage Gaps Allow Bugs Through

**Category**: Technical & Implementation
**Severity**: MEDIUM
**Probability**: MEDIUM (25-35%)
**Impact**: MEDIUM — Bugs in production, rework required

**Description**:
Despite comprehensive test plan, some bugs may slip through:
- Edge cases not covered in unit tests
- Integration test scenarios incomplete
- E2E tests don't catch UI bugs
- Real-world data combinations not tested

**Consequence**:
- Bugs discovered during pilot (embarrassing)
- Hotfixes required
- User frustration

**Mitigation Strategy**:
✅ **Comprehensive Test Coverage** (Throughout):
- Unit tests: 100% of CRITICAL template/schema changes
- Integration tests: Schema → Template pipelines
- E2E tests: All wizard flows
- Regression tests: Ensure old notices still render

✅ **Code Review**:
- Peer review of all changes before merge
- Checklist: "Have you tested edge cases?"

✅ **Staging Environment**:
- Deploy to staging before pilot
- Internal team "dogfooding" (create notices themselves)
- Test with realistic data (not just "Test User")

**Residual Risk After Mitigation**: LOW-MEDIUM
- No test plan is 100% perfect
- Pilot will find some bugs

**Monitoring**:
- Track bugs discovered in pilot
- Classify: Critical vs. minor
- Post-pilot: Add test cases for any bugs found

**Status**: 🟡 **MITIGATION PLANNED** (test plan in CIVIC_NOTICES_TEST_PLAN.md)

---

### RISK-015: Budget Overrun

**Category**: Operational & Process
**Severity**: MEDIUM
**Probability**: MEDIUM (30-40%)
**Impact**: MEDIUM — Project pause, incomplete delivery

**Description**:
12-week timeline assumes:
- No major blockers
- Legal review completed on schedule
- Minimal rework required

If timeline extends due to:
- Scope creep (RISK-010)
- Legal counsel delays (RISK-006)
- Major bugs requiring rework (RISK-014)

Then development costs exceed budget.

**Consequence**:
- Project must be paused for additional funding approval
- Development team reassigned to other projects
- Incomplete delivery

**Mitigation Strategy**:
✅ **Contingency Budget**:
- Build in 20% contingency for overruns
- Pre-approved by CTO

✅ **Weekly Budget Tracking**:
- Burn rate vs. planned rate
- Forecast completion cost at current velocity
- Early warning if trending over budget

✅ **Prioritization**:
- If budget concerns arise:
  - Focus on IMMEDIATE + HIGH only
  - Defer MEDIUM + DESIRABLE to post-launch
  - Deliver MVP for pilot

**Residual Risk After Mitigation**: LOW-MEDIUM
- Contingency budget absorbs minor overruns
- Prioritization ensures core delivery

**Monitoring**:
- Weekly finance review with Product Owner
- Escalate to CTO if >10% over planned spend

**Status**: 🟡 **MITIGATION PLANNED** (budget tracking process defined)

---

### RISK-016: GDPR Breach During Pilot

**Category**: Legal & Compliance
**Severity**: MEDIUM
**Probability**: LOW (5-10%)
**Impact**: HIGH — ICO investigation, fines, reputational damage

**Description**:
Despite GDPR considerations, pilot users may:
- Publish home addresses instead of business addresses
- Include excessive personal data in notices
- Expose sensitive information (health, criminal records)

If pilot notice contains GDPR breach, platform may be held responsible.

**Consequence**:
- Information Commissioner's Office (ICO) complaint
- Investigation and potential fine
- Media coverage ("Data breach on council notice platform")
- Councils refuse platform adoption

**Mitigation Strategy**:
✅ **GDPR Guidance Component** (HIGH-016):
- Prominent privacy warning in wizard (Step 3)
- Before data entry: "Use business addresses, not home addresses"
- Before publication: "Review for personal data - does this need to be public?"

✅ **Pilot Council Training**:
- GDPR awareness session before pilot
- Emphasize data minimisation
- Review first few notices together

✅ **Data Protection Impact Assessment** (DPIA):
- Conduct DPIA before pilot launch
- Document risks and mitigations
- Get DPO sign-off

✅ **Post-Publication Review**:
- Sample audit of published notices (first 50)
- Check for personal data issues
- Proactive correction if needed

**Residual Risk After Mitigation**: LOW
- Guidance makes users aware
- Pilot review catches issues early

**Monitoring**:
- Random sample audit weekly during pilot
- Track any privacy complaints
- Annual DPIA review

**Status**: 🟡 **MITIGATION PLANNED** (HIGH-016 + DPIA in Week 9)

---

## LOW RISKS

### RISK-009: Database Migration Failure (Template Versioning)

**Category**: Technical & Implementation
**Severity**: LOW
**Probability**: VERY LOW (1-2%)
**Impact**: MEDIUM — Rollback required, pilot delayed

**Description**:
HIGH-017 (template versioning system) requires new database tables and triggers. If migration fails:
- Production database left in inconsistent state
- Rollback required
- Data loss risk

**Mitigation Strategy**:
✅ **Testing**:
- Test migration on staging database first
- Create rollback script
- Backup production before migration

✅ **Blue-Green Deployment**:
- Deploy new schema to separate database
- Switch over only when verified
- Instant rollback capability

**Residual Risk After Mitigation**: VERY LOW

**Status**: 🟢 **MONITORED** (standard practice, low concern)

---

## EMERGENT RISKS (Discovered During Audit)

### RISK-018: False Statement Warning Wording Inconsistency (Existing Notice)

**Category**: Legal & Compliance
**Severity**: MEDIUM
**Probability**: N/A (current state)
**Impact**: MEDIUM — Existing template partially non-compliant

**Description**:
Audit discovered that `licensing-premises-new` template (line 31) has false statement warning, but:
- **Wording is INCOMPLETE**
- Missing: "level 5 fine" specification
- Current: "...liable on summary conviction to a fine"
- Required: "...liable on summary conviction for the offence is a level 5 fine"

This means even the ONE template that HAS the warning is not using exact statutory wording.

**Consequence**:
- If notices have already been published using this template → they are slightly non-compliant
- Risk of challenge is LOW (substantive warning is present, just not exact wording)
- BUT must be fixed during remediation

**Mitigation Strategy**:
✅ **Immediate Remediation** (CRIT-001):
- Fix ALL 6 licensing templates, including the partial one
- Ensure exact Reg 25(1)(d) wording

✅ **Audit of Published Notices**:
- Query database: How many notices published with current template?
- Assess risk: Were any challenged?
- Consider: Republication if notices are still within consultation period

**Residual Risk After Mitigation**: VERY LOW
- Once fixed, risk eliminated
- Existing notices: Risk is minimal (warning was present)

**Status**: 🔴 **UNMITIGATED** (awaits CRIT-001 remediation)

---

### RISK-019: MED-021 (GVOL 21-Day Validation) Prevents Valid Notices

**Category**: Legal & Compliance
**Severity**: MEDIUM
**Probability**: MEDIUM-HIGH (if councils want >21 days)
**Impact**: MEDIUM — User frustration, workaround needed

**Description**:
Current validation enforces EXACTLY 21 days for GVOL notices (`diff !== 21`). Regulation requires MINIMUM 21 days. If council wants 22 or 28-day notice period (e.g., to align with staff holiday schedules):
- Validation incorrectly rejects notice
- User frustrated, contacts support
- Workaround: Temporarily disable validation (risky)

**Consequence**:
- User cannot publish valid notice
- Support ticket burden
- Negative user experience

**Mitigation Strategy**:
✅ **Quick Fix** (MED-021):
- Change `!== 21` to `< 21`
- Update message: "...at least 21 days..."
- Test with 21, 22, 28, 30 day periods

✅ **Included in Week 4**:
- Simple change, can be bundled with other validation fixes

**Residual Risk After Mitigation**: VERY LOW
- Simple logic fix
- No side effects

**Status**: 🟡 **MITIGATION PLANNED** (MED-021 in Week 4)

---

### RISK-020: MED-022 (EIA Consultation Calculation) May Be Incorrect

**Category**: Legal & Compliance
**Severity**: MEDIUM (if interpretation wrong)
**Probability**: LOW-MEDIUM (needs verification)
**Impact**: HIGH — Non-compliant EIA notices

**Description**:
Audit found that planning EIA validation uses `applicationDate` as start point, but EIA Regulations 2017, Reg 19(3)(e) may require `publicationDate` as start point for consultation period.

Regulatory language: "period of not less than 30 days **from the date on which the notice is published**"

Current code uses: `calendarDaysBetween(applicationDate, repsDeadline)`

**If interpretation is wrong**:
- EIA notices would have consultation periods that start too early
- Non-compliance with EIA Regulations 2017

**Consequence**:
- EIA notices could be challenged as procedurally defective
- Judicial review risk for major development projects
- HIGH IMPACT because EIA applies to major, contentious projects

**Mitigation Strategy**:
✅ **Regulatory Interpretation Verification** (Week 2):
1. Consult with planning law specialist
2. Review EIA Regulations 2017, Reg 19(3)(e) exact wording
3. Check LGA/RTPI guidance on EIA consultation start date
4. Confirm with pilot council planning officers

✅ **If Change Needed** (MED-022):
```typescript
const startDate = variant === 'planning-eia' ? publicationDate : applicationDate;
if (startDate && repsDeadline) {
  const diff = calendarDaysBetween(startDate, repsDeadline);
  if (diff < 30) {
    issues.push({ ... });
  }
}
```

✅ **Document Interpretation**:
- If applicationDate is correct → document why (for future audits)
- If publicationDate is correct → fix code + document

**Residual Risk After Mitigation**: LOW
- Verification resolves uncertainty
- Fix is straightforward if needed

**Status**: 🟡 **MITIGATION PLANNED** (regulatory verification in Week 2)

---

## Risk Monitoring and Governance

### Weekly Risk Review

**Schedule**: Every Monday, 30 minutes
**Attendees**: Product Owner, Lead Engineer, QA Lead

**Agenda**:
1. Review risk register
2. Update probability/impact based on new information
3. Check mitigation progress
4. Identify new risks
5. Escalate any CRITICAL risks to CTO

---

### Escalation Matrix

| Risk Severity | Escalate To | Timeframe |
|---------------|-------------|-----------|
| CRITICAL | CTO + Legal Counsel | Immediate (same day) |
| HIGH | Product Owner | Within 24 hours |
| MEDIUM | Lead Engineer | Within 1 week |
| LOW | Track in weekly review | No escalation needed |

---

### Post-Pilot Risk Assessment

**Schedule**: Week 12 (after pilot completion)

**Deliverable**: Updated risk register with:
- Which risks materialized during pilot?
- How effective were mitigations?
- New risks discovered during pilot?
- Residual risks for general availability launch?

---

## Conclusion

This risk register identifies **21 risks** across 5 categories, with **4 CRITICAL** risks requiring immediate attention before any deployment. All CRITICAL risks have defined mitigation strategies, and most will be reduced to LOW after remediation and pilot testing.

**Key Takeaways**:

1. **DO NOT DEPLOY** until 8 CRITICAL statutory issues remediated (RISK-001)
2. **GVOL migration** requires careful planning to avoid user disruption (RISK-002)
3. **Legal counsel engagement** must begin Week 1 to avoid delays (RISK-006)
4. **Pilot selection and protocol** are critical to avoid reputational damage (RISK-007, RISK-017)
5. **Ongoing monitoring** required during pilot for new risks

**Risk Posture**: 🟡 **ELEVATED** (pre-remediation) → 🟢 **ACCEPTABLE** (post-remediation + pilot)

---

**Document Owner**: Product Owner + CTO
**Review Frequency**: Weekly during implementation, monthly post-launch
**Next Review**: After completion of Phase 1 (Critical Fixes) — Week 3

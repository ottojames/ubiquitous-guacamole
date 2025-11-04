# Civic Notices Platform — Remediation Specification Pack

**Date**: 4 November 2025
**Version**: 1.0
**Status**: Ready for CivicDev Implementation

---

## Document Overview

This remediation specification pack consists of four comprehensive documents that transform the statutory compliance audit findings into actionable development specifications:

### 1. CIVIC_NOTICES_REMEDIATION_SPEC.md
**Purpose**: Complete technical specification for all 32 compliance issues
**Contents**:
- Executive summary and scope
- Prioritized issue catalog (IMMEDIATE, HIGH, MEDIUM, DESIRABLE)
- Detailed technical specifications for each issue
  - Affected components
  - Current vs. required behavior
  - Exact code changes required
  - Acceptance criteria
  - Testing requirements
  - Effort estimates
  - Risk assessments
- Comprehensive testing requirements
- Rollout criteria and success metrics
- Statutory reference library

**Use Case**: Engineers implementing fixes; QA testing; legal review

**Key Sections**:
- 8 IMMEDIATE priority issues (CRIT-001 to CRIT-008) - pages 5-42
- 10 HIGH priority issues (HIGH-009 to HIGH-018) - pages 42-50
- 8 MEDIUM priority issues (MED-019 to MED-026) - pages 50-54
- 6 DESIRABLE enhancements (Issues 027-032) - page 54
- Testing requirements - pages 54-58
- Regulatory validation checklists - pages 58-59

---

### 2. CIVIC_NOTICES_REMEDIATION_TIMELINE.md
**Purpose**: 12-week milestone-based implementation schedule
**Contents**:
- Week-by-week breakdown of all work
- 7 milestones with clear exit criteria
- Resource allocation by week and role
- Detailed task breakdowns for each milestone
- Risk management timeline
- Communication plan
- Success criteria and KPIs
- Comprehensive checklists for each milestone

**Use Case**: Project planning; sprint planning; stakeholder updates; tracking progress

**Key Milestones**:
- **Milestone 1** (Weeks 1-2): Critical Licensing Act Fixes
- **Milestone 2** (Weeks 3-4): Gambling & GVOL Compliance
- **Milestone 3** (Weeks 5-6): High Priority Enhancements (Pilot-Ready)
- **Milestone 4** (Weeks 7-8): Workflow & Validation Improvements
- **Milestone 5** (Weeks 9-10): QA, Testing & Legal Review
- **Milestone 6** (Week 11): Controlled Pilot Launch
- **Milestone 7** (Week 12): Production Rollout

---

### 3. CIVIC_NOTICES_DEPENDENCIES_AND_RISKS.md
**Purpose**: Comprehensive dependency mapping and risk register
**Contents**:
- Cross-domain dependencies (issues affecting multiple components)
- Technical dependencies (sequencing requirements)
- Legal & compliance dependencies (external validations)
- Risk register (23 identified risks with mitigations)
- Decision log (open questions and assumptions)
- Escalation matrix
- Monitoring and review process

**Use Case**: Risk management; dependency tracking; decision-making; escalations

**Key Sections**:
- 6 cross-domain dependencies (CD-001 to CD-006)
- 8 technical dependencies (TD-001 to TD-008)
- 7 legal & compliance dependencies (LD-001 to LD-007)
- 23 risks cataloged by severity:
  - 7 CRITICAL risks
  - 9 HIGH risks
  - 5 MEDIUM risks
  - 2 LOW risks
- 5 open questions requiring resolution
- 5 assumptions requiring validation
- 5 decisions locked in

---

### 4. AUDIT_SUMMARY.md
**Purpose**: Executive overview of audit findings
**Contents**: (Pre-existing document)
- Overall assessment (CONDITIONAL ADOPTION)
- 8 critical findings summary
- Timeline estimate (8-12 weeks)
- Professional verdict

**Use Case**: Executive briefing; stakeholder communication

---

## Quick Start Guide

### For Product Owners
1. **Read First**: AUDIT_SUMMARY.md (executive overview)
2. **Then Read**: CIVIC_NOTICES_REMEDIATION_TIMELINE.md (Milestone overview section)
3. **Use For**: Sprint planning, stakeholder updates, go/no-go decisions

### For Engineers
1. **Read First**: CIVIC_NOTICES_REMEDIATION_SPEC.md (technical specifications)
2. **Reference**: CIVIC_NOTICES_REMEDIATION_TIMELINE.md (task sequencing)
3. **Check**: CIVIC_NOTICES_DEPENDENCIES_AND_RISKS.md (before starting each issue)
4. **Use For**: Implementation, code reviews, testing

### For QA Engineers
1. **Read First**: CIVIC_NOTICES_REMEDIATION_SPEC.md (Testing Requirements section)
2. **Reference**: Regulatory validation checklists in spec
3. **Use For**: Test plan creation, test case execution, validation

### For Legal Counsel
1. **Read First**: AUDIT_SUMMARY.md (critical findings)
2. **Then Read**: CIVIC_NOTICES_REMEDIATION_SPEC.md (IMMEDIATE priority issues)
3. **Use For**: Template review (scheduled Week 10), statutory interpretation

### For CTO / Technical Leadership
1. **Read First**: AUDIT_SUMMARY.md + CIVIC_NOTICES_REMEDIATION_TIMELINE.md (Executive Overview)
2. **Then Read**: CIVIC_NOTICES_DEPENDENCIES_AND_RISKS.md (Risk Register)
3. **Use For**: Resource allocation, risk acceptance, go/no-go decisions

---

## Critical Path Summary

### Phase 1: Critical Fixes (Weeks 1-4)
**Status Gate**: MUST COMPLETE before pilot
**Issues**: CRIT-001 to CRIT-008 (8 critical issues)
**Outcome**: All statutory compliance gaps resolved

**Key Deliverables**:
- 5 licensing templates with false statement warning
- Responsible authorities statement in 6 licensing templates
- Schedule 9 reference in 16 gambling templates
- Licensing objectives in 16 gambling templates
- Traffic Commissioner structure in GVOL templates
- Consultee statements in planning templates
- Full s.27 wording in probate template
- Multi-jurisdiction support in licensing

**Exit Criteria**:
- All 8 CRITICAL issues resolved and tested
- Legal counsel review and sign-off obtained
- Zero critical bugs in staging
- Ready for pilot preparation

---

### Phase 2: High Priority Enhancements (Weeks 5-6)
**Status Gate**: Pilot-ready state
**Issues**: HIGH-009 to HIGH-018 (10 high priority issues)
**Outcome**: Enhanced compliance and user experience

**Key Deliverables**:
- Interim steps notice type
- Newspaper circulation validation
- GDPR redaction guidance
- Template versioning system
- Environmental statement inspection details
- Transfer notice period statements

**Exit Criteria**:
- All HIGH priority issues resolved
- Full test suite passing
- No regressions from Phase 1
- Pilot materials prepared

---

### Phase 3: QA & Pilot (Weeks 7-11)
**Status Gate**: Production-ready quality
**Issues**: MEDIUM priority (validation fixes, workflow improvements)
**Outcome**: Validated with real councils, ready for general availability

**Key Deliverables**:
- Validation rule fixes (10 working days, 21 days)
- OCR auto-calculate deadlines
- Publication hash audit trail
- Draft expiry warnings
- Comprehensive QA testing
- Legal sign-off
- Successful pilot with 2-3 councils

**Exit Criteria**:
- Legal counsel formal sign-off obtained
- Pilot councils report zero compliance issues
- User satisfaction > 8/10
- Zero critical bugs in production

---

### Phase 4: Production Launch (Week 12)
**Status Gate**: General availability
**Outcome**: Platform live for all councils

**Key Deliverables**:
- Full production deployment
- Self-service onboarding enabled
- Launch announcement
- Monitoring and support operational

**Exit Criteria**:
- 20+ councils signed up
- 50+ notices published
- Zero critical bugs
- Uptime > 99.5%

---

## Issue Prioritization Matrix

| Priority | Count | Timeline | Description |
|----------|-------|----------|-------------|
| **IMMEDIATE** | 8 | Weeks 1-4 | Must-fix before any pilot; legal risk of defective notices |
| **HIGH** | 10 | Weeks 5-6 | Should-fix for pilot; significant non-compliance risk |
| **MEDIUM** | 8 | Weeks 7-8 | Important UX and automation; desirable for launch |
| **DESIRABLE** | 6 | Post-launch | Future enhancements for continuous improvement |

**Total Issues**: 32

---

## Resource Requirements

### Team Composition (Minimum)
- **1x Lead Full-Stack Engineer** (React 19 + Express + Supabase + PostgreSQL)
- **1x QA Engineer** (Manual + automated testing)
- **1x Product Owner** (Regulatory liaison, sprint planning)
- **0.5x Legal Counsel** (Template review, statutory interpretation)
- **0.5x Designer** (UI enhancements, GDPR guidance component)

### Total Effort Estimate
- **Engineers**: 9.5-10.5 person-weeks
- **QA**: 3.75 person-weeks
- **Product Owner**: 3.5 person-weeks
- **Legal Counsel**: 1.25 person-weeks
- **Designer**: 0.25 person-weeks

**Total Project Effort**: Approximately 18-19 person-weeks over 12 calendar weeks

---

## Critical Success Factors

### 1. Legal Counsel Sign-Off (Week 10)
**CRITICAL GATE**: Cannot proceed to pilot without legal approval
- Schedule review in Week 1
- Provide preliminary materials Week 9
- Allow buffer for revisions Week 10 Days 4-5

### 2. GVOL Schema Migration (Week 4)
**BREAKING CHANGE**: Handle existing drafts carefully
- Query production for existing GVOL drafts
- Contact affected users 1 week before deployment
- Provide migration script or manual instructions

### 3. Handlebars Verification (Week 5 Day 1)
**BLOCKING DEPENDENCY**: Multi-jurisdiction requires `each` helper
- Test template engine capabilities
- Upgrade if needed
- Have refactor plan ready

### 4. Pilot Council Commitment (Week 9)
**VALIDATION REQUIREMENT**: Need 2-3 councils for real-world testing
- Identify candidates Week 1
- Send invitations Week 8
- Confirm commitment Week 9

### 5. Zero Critical Bugs (Throughout)
**QUALITY GATE**: No critical bugs at any milestone gate
- Comprehensive testing at each milestone
- Fix critical bugs immediately (within 24 hours)
- Re-test after fixes

---

## Risk Highlights

### Top 5 Risks Requiring Active Management

1. **RISK-001: Legal Challenge to Published Notices** (CRITICAL)
   - Mitigation: Complete all critical fixes before pilot
   - Status: Under active management

2. **RISK-002: Breaking Schema Change Affects Existing Drafts** (CRITICAL)
   - Mitigation: Migration script + user communication
   - Status: Must address Week 4

3. **RISK-004: Legal Counsel Unavailable for Review** (HIGH)
   - Mitigation: Pre-schedule Week 1, send prelim materials Week 9
   - Status: Schedule immediately

4. **RISK-006: Pilot Council Finds Critical Compliance Issue** (HIGH)
   - Mitigation: Thorough legal review, immediate hotfix process
   - Status: Acceptable risk; pilot designed to catch

5. **RISK-008: Scope Creep During Development** (MEDIUM)
   - Mitigation: Strict scope control by product owner
   - Status: Requires discipline

**Full Risk Register**: See CIVIC_NOTICES_DEPENDENCIES_AND_RISKS.md

---

## Decision Points

### Week 1 Day 1: Kickoff
- Confirm team allocation
- Schedule legal review for Week 10
- Identify pilot council candidates
- Verify Handlebars version (or schedule for Week 5)

### Week 2 End: Milestone 1 Gate
**Go/No-Go**: Proceed to Milestone 2?
- All CRIT-001, CRIT-002, CRIT-007, CRIT-008 resolved?
- Legal counsel prelim review positive?
- Staging deployment successful?

### Week 4 End: Milestone 2 Gate
**Go/No-Go**: Proceed to high priority enhancements?
- All remaining CRITICAL issues resolved?
- Zero critical bugs?
- GVOL migration planned?

### Week 6 End: Milestone 3 Gate
**Go/No-Go**: Proceed to pilot preparation?
- All HIGH priority issues resolved?
- Pilot materials ready?
- Pilot councils confirmed?

### Week 10 End: Milestone 5 Gate
**CRITICAL GO/NO-GO**: Proceed to pilot launch?
- Legal counsel formal sign-off obtained?
- Full QA complete with zero critical bugs?
- Monitoring tools configured?
- If NO → resolve blockers, do NOT proceed

### Week 11 End: Milestone 6 Gate
**CRITICAL GO/NO-GO**: Proceed to production launch?
- Pilot successful (2+ councils, 10+ notices, satisfaction > 8/10)?
- Zero critical bugs reported?
- Feedback incorporated or triaged?
- If NO → extend pilot or iterate

---

## Key Contacts & Escalations

### Internal Team
- **Product Owner**: [Name] - Sprint planning, scope, priorities
- **Lead Engineer**: [Name] - Technical decisions, implementation
- **QA Lead**: [Name] - Testing strategy, quality gates
- **Legal Counsel**: [Name] - Statutory interpretation, template review

### External Stakeholders
- **Pilot Council 1**: [Name, Council, Contact]
- **Pilot Council 2**: [Name, Council, Contact]
- **Pilot Council 3**: [Name, Council, Contact]

### Escalation Path
1. **Technical Issues**: Lead Engineer → CTO
2. **Legal Issues**: Legal Counsel → CTO → External Specialist
3. **Timeline Issues**: Product Owner → CTO
4. **Quality Issues**: QA Lead → Product Owner → CTO

---

## Documentation Maintenance

### Review Schedule
- **Daily**: Standup updates during implementation
- **Weekly**: Risk review (Fridays), update registers
- **Bi-Weekly**: Stakeholder updates (end of Weeks 2, 4, 6, 8, 10)
- **Milestone Gates**: Comprehensive review at each milestone exit

### Version Control
- All specification documents tracked in git
- Update version number and date when significant changes made
- Maintain change log in each document

### Post-Launch Review
- Week 12 end: Comprehensive retrospective
- Document lessons learned
- Update templates for future projects

---

## Success Metrics

### Compliance Metrics (Primary)
- **Zero** legal challenges to published notices (Year 1)
- **100%** of notices linked to template version (audit trail)
- **100%** pass rate on regulatory re-audit

### Quality Metrics (Secondary)
- **< 5%** notice rejection rate (require correction)
- **< 15 minutes** average time to publish notice
- **> 8.5/10** user satisfaction score

### Adoption Metrics (Tertiary)
- **50+ councils** using platform (Month 12)
- **500+ notices/month** published (Month 12)
- **< 2 per month** compliance-related support tickets

---

## Next Steps

### Immediate Actions (Week 1 Day 1)
1. [ ] Kickoff meeting with full team
2. [ ] Review this remediation pack
3. [ ] Schedule legal counsel review for Week 10
4. [ ] Identify 5-6 pilot council candidates
5. [ ] Allocate QA resource for Weeks 9-10
6. [ ] Verify Handlebars version and capabilities
7. [ ] Set up project tracking (sprints, boards)
8. [ ] Create development branches

### Week 1 Day 2
1. [ ] Begin CRIT-001 (licensing false statement warnings)
2. [ ] Engineer 1 starts template updates
3. [ ] Engineer creates unit test suite
4. [ ] QA prepares test plan

### Weekly Rhythm
- **Monday**: Sprint planning, review week's tasks
- **Daily**: 15-min standup
- **Friday**: Sprint review, demo completed work, risk review
- **Bi-Weekly Friday**: Stakeholder update email

---

## Document Quick Reference

| Document | Pages | Primary Use Case |
|----------|-------|------------------|
| AUDIT_SUMMARY.md | 2 | Executive briefing |
| CIVIC_NOTICES_REMEDIATION_SPEC.md | 75 | Engineering implementation |
| CIVIC_NOTICES_REMEDIATION_TIMELINE.md | 50 | Project planning & tracking |
| CIVIC_NOTICES_DEPENDENCIES_AND_RISKS.md | 45 | Risk management & dependencies |
| REMEDIATION_PACK_README.md | 8 | Overview & quick start (this doc) |

**Total Specification Pack**: 180 pages of comprehensive guidance

---

## Approval & Sign-Off

### Required Approvals Before Work Begins

- [ ] **CTO**: Technical approach, resource allocation, timeline
- [ ] **Legal Counsel**: Awareness of legal review requirement Week 10
- [ ] **Product Owner**: Scope, priorities, milestone definitions
- [ ] **Finance**: Budget approval for 12-week team allocation

**Approval Date**: ________________

**Approved By**:
- CTO: _________________________ Date: _______
- Legal Counsel: ________________ Date: _______
- Product Owner: ________________ Date: _______

---

## Final Note

This remediation specification pack represents a comprehensive, production-ready plan to resolve all 32 identified statutory compliance issues and bring the Civic Notices Platform to full production readiness within 12 weeks.

**The specification is:**
- **Complete**: Every issue addressed with concrete fixes
- **Actionable**: Engineers can implement immediately without further clarification
- **Realistic**: Timeline based on effort estimates and includes buffers
- **Risk-Aware**: 23 risks identified with mitigation strategies
- **Regulatory-Compliant**: All fixes mapped to specific statutory references
- **Auditable**: Comprehensive checklists for regulatory re-audit

**Key Principle**: Quality over speed. Do not compromise statutory compliance to meet timeline. If delays occur, adjust timeline rather than skip critical fixes.

---

**Remediation Specification Complete — Ready for CivicDev implementation and Regulatory re-audit.**

**Document Version**: 1.0
**Date**: 4 November 2025
**Next Review**: After Milestone 1 completion (Week 2)

---

*End of Remediation Specification Pack*

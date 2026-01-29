# Phase 4: Remediation Roadmap

**Project:** Civic Notices Portal  
**Date:** 2025-01-29  
**Author:** Claude (Automated Audit)  
**Phase:** Remediation Planning — The Blueprint for Launch

---

## Executive Summary

### Current State
- **Overall PRD Completion:** 45%
- **Core Publishing:** 60% (works, but PDF generation broken)
- **Notice Types:** 89% complete (34 of 38)
- **Critical Blockers:** 6 items preventing production use
- **Technical Debt Items:** 38 catalogued

### Minimum Viable Launch Path
**4 weeks of focused work** can produce a **launchable Licensing vertical** with:
- ✅ Working notice publishing (Licensing Act 2003)
- ✅ Functional payment flow (Stripe)
- ✅ Council portal with approval workflow
- ✅ Basic firm dashboard
- ✅ Email notifications working
- ✅ PDF proof-of-publication certificates

### What Gets Deferred
- Kanban pipeline UI (defer to Q2)
- Client portal (defer to Q2)
- Gazette API integration (defer to Q2)
- D-TRO integration (defer to Q3)
- GIS/mapping features (defer to Q3)

---

## Impact/Effort Matrix

```
                          LOW EFFORT                    HIGH EFFORT
                    ┌───────────────────────┬───────────────────────┐
                    │                       │                       │
     HIGH           │    🎯 QUICK WINS      │    💎 BIG BETS        │
     IMPACT         │    (Do First)         │    (Plan Carefully)   │
                    │                       │                       │
                    │ • Fix PDF generation  │ • Kanban Pipeline UI  │
                    │ • Council notification│ • Client Portal       │
                    │ • Re-enable admin     │ • Gazette API         │
                    │ • Emergency TRO type  │ • D-TRO integration   │
                    │ • Team invitations    │ • GIS/Map drawing     │
                    │                       │                       │
                    ├───────────────────────┼───────────────────────┤
                    │                       │                       │
     LOW            │    📋 FILL-INS        │    ⏸️ AVOID/DEFER     │
     IMPACT         │    (Do When Time)     │    (Skip for MVP)     │
                    │                       │                       │
                    │ • Console.log cleanup │ • Council SSO         │
                    │ • Form field TODOs    │ • Phone call triggers │
                    │ • HTML sanitization   │ • Full scraper impl   │
                    │ • Mock data removal   │ • Property-newspaper  │
                    │                       │   AI mapper           │
                    │                       │                       │
                    └───────────────────────┴───────────────────────┘
```

---

## Prioritized Fix List

### P0 — Critical Blockers (Fix This Week)
*Production launch is impossible without these.*

| ID | Issue | Location | Effort | ROI | Dependencies |
|----|-------|----------|--------|-----|-------------|
| **FIX-001** | PDF generation broken (all 6 templates) | `src/next/publish/templates/*.ts` | **M** | 🔴 Critical | None |
| **FIX-002** | Council notification missing | `server/routes/publish.ts:255` | **S** | 🔴 Critical | Email service |
| **FIX-003** | Admin panel disabled | `server/index.ts:108` | **S** | 🔴 Critical | Auth cleanup |
| **FIX-004** | PDF certificate on payment | `server/routes/stripe.ts:208` | **S** | 🔴 Critical | FIX-001 |
| **FIX-005** | councilNotification.ts broken | `src/lib/councilNotification.ts` | **S** | 🔴 Critical | Type fixes |
| **FIX-006** | Team invitation TODO | `server/routes/firm.ts:171` | **M** | 🟠 High | Email service |

### P1 — High Priority (Fix in Weeks 2-3)
*Required for credible launch, major feature gaps.*

| ID | Issue | Location | Effort | ROI | Dependencies |
|----|-------|----------|--------|-----|-------------|
| **FIX-007** | 10+ form field TODOs | `NewPublishFlow.tsx:1761-1776` | **M** | 🟠 High | None |
| **FIX-008** | Emergency TRO type missing | Schema registry | **XS** | 🟠 High | None |
| **FIX-009** | npm security vulnerabilities (28) | `package.json` | **S** | 🟠 High | None |
| **FIX-010** | Stripe integration in direct publish | `server/routes/publish.ts:366` | **S** | 🟠 High | Stripe config |
| **FIX-011** | ONS boundary data for council matching | `councilMatcher.ts:148` | **L** | 🟠 High | Data sourcing |
| **FIX-012** | Email templates extraction | `server/services/email.ts` | **M** | 🟡 Medium | None |

### P2 — Medium Priority (Fix in Week 4+)
*Quality and polish items, not blockers.*

| ID | Issue | Location | Effort | ROI | Dependencies |
|----|-------|----------|--------|-----|-------------|
| **FIX-013** | 3,459 console.log statements | Various | **M** | 🟡 Medium | None |
| **FIX-014** | Mock data in production code | Firm components | **S** | 🟡 Medium | Real data sources |
| **FIX-015** | HTML sanitization TODO | `PreviewPane.tsx:13` | **S** | 🟡 Medium | None |
| **FIX-016** | Template service missing renderers | `templateService.ts:200` | **M** | 🟡 Medium | FIX-001 |
| **FIX-017** | Scraper implementations incomplete | `server/jobs/scrapers/*.ts` | **L** | 🟡 Medium | None |
| **FIX-018** | 24 unused dependencies | `package.json` | **S** | 🟢 Low | npm audit |
| **FIX-019** | 19 ESLint warnings | Various components | **XS** | 🟢 Low | None |

### P3 — Low Priority (Backlog)
*Nice-to-haves, can ship without these.*

| ID | Issue | Location | Effort | ROI | Dependencies |
|----|-------|----------|--------|-----|-------------|
| **FIX-020** | Bulk upload API | `BulkUpload.tsx:132` | **M** | 🟢 Low | None |
| **FIX-021** | Hardcoded 'Officer' username | `RepresentationsList.tsx:174` | **XS** | 🟢 Low | Auth context |
| **FIX-022** | Debug flag in production | `AddressSearch.tsx:120` | **XS** | 🟢 Low | None |
| **FIX-023** | Dead code cleanup (`src/app/api/`) | Various | **S** | 🟢 Low | None |

---

## Effort Estimation Guide

| Size | Time | Typical Scope |
|------|------|---------------|
| **XS** | <1 hour | Config change, single line, simple addition |
| **S** | 1-4 hours | Single function, one file, isolated fix |
| **M** | 4-8 hours | Multiple files, one feature area, some testing |
| **L** | 1-3 days | Cross-cutting, multiple integrations, significant testing |
| **XL** | 3-5+ days | Architectural change, new feature domain, major refactor |

---

## Dependency Graph

```
                    ┌─────────────────────────────────────┐
                    │          WEEK 1 FOUNDATION          │
                    └─────────────────────────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
    ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
    │   FIX-001     │       │   FIX-003     │       │   FIX-009     │
    │ PDF Generation│       │ Admin Panel   │       │ Security      │
    │    (M)        │       │    (S)        │       │ Vulns (S)     │
    └───────┬───────┘       └───────────────┘       └───────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌───────────────┐ ┌───────────────┐
│   FIX-004     │ │   FIX-016     │
│ PDF Certificate│ │ Template Svc │
│    (S)        │ │    (M)        │
└───────────────┘ └───────────────┘


                    ┌─────────────────────────────────────┐
                    │       WEEK 2 NOTIFICATIONS          │
                    └─────────────────────────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
    ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
    │   FIX-002     │       │   FIX-005     │       │   FIX-006     │
    │ Council Notif │◄──────│ Notif Types   │       │ Team Invite   │
    │    (S)        │       │    (S)        │       │    (M)        │
    └───────────────┘       └───────────────┘       └───────────────┘


                    ┌─────────────────────────────────────┐
                    │       WEEK 3 FORM COMPLETION        │
                    └─────────────────────────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
    ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
    │   FIX-007     │       │   FIX-008     │       │   FIX-010     │
    │ Form Fields   │       │ Emergency TRO │       │ Stripe Direct │
    │    (M)        │       │    (XS)       │       │    (S)        │
    └───────────────┘       └───────────────┘       └───────────────┘


                    ┌─────────────────────────────────────┐
                    │       WEEK 4 POLISH & SHIP          │
                    └─────────────────────────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
    ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
    │   FIX-013     │       │   FIX-014     │       │   FIX-018     │
    │ Console Logs  │       │ Mock Data     │       │ Unused Deps   │
    │    (M)        │       │    (S)        │       │    (S)        │
    └───────────────┘       └───────────────┘       └───────────────┘
```

---

## 4-Week Sprint Plan

### 🗓️ Week 1: Foundation Fixes
**Goal:** Get the core pipeline working end-to-end

| Day | Task | ID | Size | Acceptance Criteria |
|-----|------|----|----|---------------------|
| Mon | Create PDF generation API endpoint | FIX-001 | M | `/api/certificates/generate/:type` returns PDF |
| Mon | Wire all 6 templates to new endpoint | FIX-001 | M | No more "server-only" errors |
| Tue | Re-enable admin panel routes | FIX-003 | S | `/api/admin/*` routes accessible |
| Tue | Add auth guards to admin routes | FIX-003 | S | Only admins can access |
| Wed | Run npm audit fix (safe fixes) | FIX-009 | S | High/critical vulns resolved |
| Wed | Evaluate textract alternative | FIX-009 | S | Document decision |
| Thu | Wire PDF certificate to Stripe webhook | FIX-004 | S | Payment success → PDF generated |
| Fri | Buffer / testing | — | — | E2E tests passing |

**Week 1 Deliverables:**
- [ ] PDF generation works for all notice types
- [ ] Admin panel functional
- [ ] Security vulnerabilities addressed
- [ ] Payment → PDF flow complete

---

### 🗓️ Week 2: Notifications & Team Features
**Goal:** Councils get notified, firms can invite team members

| Day | Task | ID | Size | Acceptance Criteria |
|-----|------|----|----|---------------------|
| Mon | Fix councilNotification.ts types | FIX-005 | S | No TypeScript errors |
| Mon | Implement council email notification | FIX-002 | S | Email sent on notice publish |
| Tue | Test notification flow end-to-end | FIX-002 | S | Council receives email |
| Wed | Implement team invitation system | FIX-006 | M | Invitation email sent |
| Thu | Build invitation acceptance flow | FIX-006 | M | User can accept invite |
| Fri | Buffer / testing | — | — | All notification tests pass |

**Week 2 Deliverables:**
- [ ] Councils notified when notices submitted
- [ ] Team invitations working
- [ ] Email templates reviewed

---

### 🗓️ Week 3: Form Completion & Notice Types
**Goal:** All notice forms complete, all types publishable

| Day | Task | ID | Size | Acceptance Criteria |
|-----|------|----|----|---------------------|
| Mon | Add DPS_NAME field | FIX-007 | S | Field appears in licensing forms |
| Mon | Add APPLICANT_ADDRESS field | FIX-007 | S | Field appears in all forms |
| Tue | Complete remaining 8 form fields | FIX-007 | M | All TODOs resolved |
| Wed | Add Emergency TRO notice type | FIX-008 | XS | Type selectable in publish flow |
| Wed | Wire Stripe to direct publish path | FIX-010 | S | Payment works without checkout |
| Thu | Test all 34 notice types publish | — | M | Each type can complete flow |
| Fri | Buffer / bug fixes | — | — | QA all notice types |

**Week 3 Deliverables:**
- [ ] All form fields implemented
- [ ] 35 notice types (including Emergency TRO)
- [ ] All notice types publishable

---

### 🗓️ Week 4: Polish & Ship
**Goal:** Production-ready quality, soft launch

| Day | Task | ID | Size | Acceptance Criteria |
|-----|------|----|----|---------------------|
| Mon | Remove 3,459 console.logs | FIX-013 | M | No debug output in prod |
| Mon | Implement proper logging | FIX-013 | M | Use winston or pino |
| Tue | Replace mock data with real sources | FIX-014 | S | No MOCK_ in production |
| Tue | Add HTML sanitization | FIX-015 | S | DOMPurify or similar |
| Wed | Remove unused dependencies | FIX-018 | S | 24 deps removed |
| Wed | Fix ESLint warnings | FIX-019 | XS | 0 warnings |
| Thu | Full E2E test suite run | — | M | >90% passing |
| Fri | Staging deployment + smoke test | — | M | Deploy to preview URL |

**Week 4 Deliverables:**
- [ ] Production-quality codebase
- [ ] Clean dependencies
- [ ] E2E tests passing
- [ ] Staging environment ready

---

## Quick Wins (<1 Day Each)

These can be done anytime, by anyone, no dependencies:

| Task | Time | Impact |
|------|------|--------|
| Add Emergency TRO to noticeTypes.ts | 30 min | Completes TRO coverage |
| Fix hardcoded 'Officer' username | 15 min | UX improvement |
| Remove debug flag in AddressSearch | 5 min | Code quality |
| Fix 19 ESLint warnings | 1 hour | CI cleanliness |
| Delete `src/app/api/` dead code | 30 min | Reduces confusion |
| Add HTML sanitization (DOMPurify) | 2 hours | Security fix |
| Update vulnerable qs/body-parser | 1 hour | Security (npm audit fix) |

---

## Decision Points

### 🤔 Otto Needs to Decide:

#### 1. **Admin Panel Strategy**
> The admin panel is disabled pending "Phase 5 Authentication Unification."

**Options:**
- A) Re-enable with current auth (quick, but technical debt)
- B) Skip admin panel for MVP (acceptable if manual DB access works)
- C) Invest in auth unification first (delays launch by 1-2 weeks)

**Recommendation:** Option A — re-enable with basic protection, defer unification.

---

#### 2. **PDF Generation Approach**
> All 6 template PDFs broken. Need server-side solution.

**Options:**
- A) Use pdfkit (already in deps) — full control, more code
- B) Use html-pdf / puppeteer — render HTML to PDF
- C) Use external service (e.g., DocRaptor) — easiest, has cost

**Recommendation:** Option A — pdfkit is already installed, no new deps.

---

#### 3. **textract Security Vulnerability**
> Critical xmldom vulnerability in textract dependency chain.

**Options:**
- A) Accept risk (low likelihood, internal use only)
- B) Replace textract with pdf-parse + mammoth (more work)
- C) Remove file parsing feature entirely (scope reduction)

**Recommendation:** Option B — already have pdf-parse, mammoth installed.

---

#### 4. **Scope: Kanban vs. Launch**
> Kanban pipeline is a PRD core feature but requires 1-2 weeks.

**Options:**
- A) Build Kanban before launch (delays 2 weeks)
- B) Launch without Kanban, add in fast-follow (recommended)
- C) Build simple list-view workflow tracker (compromise)

**Recommendation:** Option B — launch with basic dashboard, Kanban in v1.1.

---

#### 5. **Vertical Focus**
> PRD describes 3 verticals: Licensing, Probate, GVOL. All 60%+ schemas done.

**Options:**
- A) Launch all verticals (broader market, more testing)
- B) Launch Licensing only (deepest expertise, lowest risk)
- C) Launch Licensing + Planning (natural adjacency)

**Recommendation:** Option B — nail Licensing first, expand from success.

---

## Success Metrics

### Definition of Done (Per Fix)

- [ ] Code change implemented
- [ ] TypeScript compiles (`tsc --noEmit`)
- [ ] Unit tests pass (`npm run test`)
- [ ] E2E tests pass (relevant flows)
- [ ] No new lint warnings
- [ ] Tested in development environment
- [ ] PR reviewed (or AI-assisted review)

### Launch Readiness Checklist

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| TypeScript Errors | 0 | 0 | `npx tsc --noEmit` |
| ESLint Warnings | 19 | 0 | `npm run lint` |
| Security Vulns (High+) | 9 | 0 | `npm audit` |
| E2E Tests Passing | ~70% | >90% | `npx playwright test` |
| API Endpoints Working | ~90% | 100% | Manual testing |
| PDF Generation | 0/6 | 6/6 | Test each template |
| Notice Types Testable | 34 | 35 | Publish each type |
| Core Flows Working | 3/5 | 5/5 | See below |

### Core Flows to Verify

1. **Firm Registration** → Create account → Dashboard access ✅ (working)
2. **Notice Publishing** → Select type → Fill form → Pay → Published ⚠️ (PDF broken)
3. **Council Approval** → View pending → Approve/Reject → Status updated ✅ (working)
4. **Public Viewing** → Search → View notice → Submit representation ✅ (working)
5. **Team Management** → Invite member → Accept → Access granted ❌ (TODO)

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| PDF generation harder than estimated | Medium | High | Spike first, prototype day 1 |
| Auth unification blocks admin | Low | High | Re-enable with basic guards |
| Unknown integration issues | Medium | Medium | Daily testing, not end-of-week |
| Scope creep during fixes | High | Medium | Strict PR scope, defer extras |
| Team availability | Low | High | Document everything, enable async |

---

## Appendix: What Launching Means

### Minimum Viable Launch (Week 4)
- Licensing Act 2003 notices (6 types) fully working
- Payment flow complete with proof-of-publication PDF
- Council portal with approval workflow
- Firm dashboard with basic team management
- Email notifications for key events
- Mobile-responsive public notice viewing

### Not Included in MVP
- Kanban/pipeline visualization
- Client-facing portal (white-label)
- Gazette API (probate)
- D-TRO export (TRO)
- GIS/mapping features
- Council SSO
- SMS/phone notifications
- Bulk upload

### Path to Full Product (Post-Launch)

| Quarter | Focus | Key Features |
|---------|-------|-------------|
| Q1 (now) | MVP Launch | Licensing vertical, core flows |
| Q2 | Expansion | Planning + Probate verticals, Kanban UI, Client Portal |
| Q3 | Enterprise | TRO + GVOL verticals, GIS features, Council SSO |
| Q4 | Scale | Performance, analytics dashboard, bulk operations |

---

## Summary: The MVP Path

```
┌─────────────────────────────────────────────────────────────────┐
│                    MINIMUM PATH TO LAUNCH                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Week 1: Fix PDF + Admin + Security         ████████░░  80%    │
│  Week 2: Notifications + Team               ████████░░  80%    │
│  Week 3: Forms + Notice Types               ████████░░  80%    │
│  Week 4: Polish + Ship                      ████████░░  80%    │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Total Effort: ~160 hours (4 weeks × 40h)                       │
│  Critical Fixes: 6 items                                        │
│  Quick Wins: 7 items                                            │
│  Deferred: Kanban, Client Portal, Gazette, D-TRO, GIS           │
│                                                                 │
│  🎯 Result: Launchable Licensing platform                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

*This roadmap was generated from audit phases 0-3. Update IMPLEMENTATION-STATUS.md as fixes are completed.*

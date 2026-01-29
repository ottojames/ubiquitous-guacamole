# Phase 0: Discovery Audit Report
**Project:** Ralph's Civic Notices  
**Date:** 2025-01-29  
**Auditor:** Automated Discovery (Clawdbot)

---

## Executive Summary

This is a substantial full-stack TypeScript application for managing UK public/civic notices. The codebase is **140,335 lines** across **657 files**, with active development (525 commits in 30 days). The project has extensive documentation but also significant technical debt markers.

---

## 0.1 Project Inventory

### File Counts by Type

| Extension | Files | Lines of Code |
|-----------|-------|---------------|
| `.ts`     | 395   | 71,050        |
| `.tsx`    | 238   | 67,113        |
| `.js`     | 24    | 2,172         |
| `.jsx`    | 0     | 0             |
| **Total** | **657** | **140,335** |

### Entry Points

| Entry Point | Size | Purpose |
|-------------|------|--------|
| `src/main.tsx` | 970 bytes | React app entry |
| `server/index.ts` | 5,637 bytes | Express API server |

### Route Structure

#### Server Routes (`server/routes/`) - 36 route files

| Route File | Size | Domain |
|------------|------|--------|
| `notices.ts` | 69KB | **HOTSPOT** - Core notice CRUD |
| `representations.ts` | 27KB | Public representations |
| `publish.ts` | 18KB | Notice publishing workflow |
| `team.ts` | 17KB | Team management |
| `analytics.ts` | 16KB | Analytics endpoints |
| `firm.ts` | 14KB | Law firm management |
| `registration.ts` | 13KB | User registration |
| `address.ts` | 13KB | Address lookup |
| `subscriptions.ts` | 12KB | Stripe subscriptions |
| `internal-comments.ts` | 11KB | Internal notes |
| `templates.ts` | 11KB | Notice templates |
| `firm-templates.ts` | 10KB | Firm-specific templates |
| `council.ts` | 9KB | Council management |
| `workflow.ts` | 9KB | Workflow automation |
| `drafts.ts` | 10KB | Draft notices |
| + 21 more route files | | |

#### Frontend Pages (`src/pages/`) - 34 files + subdirectories

| Page | Size | Purpose |
|------|------|--------|
| `Home.tsx` | 53KB | **HOTSPOT** - Landing page |
| `NoticeDetailPage.tsx` | 47KB | Notice view/edit |
| `Notices.tsx` | 39KB | Notice listing |
| `SubmitRepresentation.tsx` | 27KB | Public submission form |
| `ConferenceLanding.tsx` | 27KB | Marketing page |
| `Pricing.tsx` | 25KB | Pricing page |
| `Login.tsx` | 24KB | Authentication |
| `EmailAlerts.tsx` | 26KB | Alert management |
| `ApiDocs.tsx` | 20KB | API documentation |
| `SampleNotice.tsx` | 19KB | Sample notice view |

**Subdirectories:**
- `admin/` - 7 files (admin dashboard)
- `auth/` - 6 files (authentication flows)
- `council/` - 26 files (council portal)
- `firm/` - 10 files (law firm portal)
- `legal/` - 3 files (legal pages)
- `onboarding/` - 3 files (user onboarding)

---

## 0.2 Documentation Inventory

### ✅ Documentation Present

| Document | Location | Status |
|----------|----------|--------|
| README.md | Root | ✅ Present (1.7KB) |
| Progress Log | `progress.txt` | ✅ Active (252 changes in 30 days) |
| PRD | `PRD.md` | ✅ Present (423 changes in 30 days) |
| API Documentation | `docs/api.md` | ✅ Present (17KB) |
| Architecture | `docs/architecture/` | ✅ Directory (14 files) |
| Research | `docs/research/` | ✅ Directory (22 files) |

### PRD & Planning Files Found

- `PRD.md` - Main product requirements
- `PRD-COMPLETE-council-fixes.md` - Completed council fixes
- `PRD-COMPLETE-28012026-council-ux.md` - Completed UX work
- `PRD-new-notice-types.md` - New notice types PRD
- `PRD-AUDIT-CODEBASE.md` - Codebase audit PRD
- `COMPLETED_PRD.md` - Archive of completed work
- `CHANGELOG.md` - Change log

### Specialized Documentation

- `docs/idox-export-format.md` - Integration spec
- `.claude/docs/playwright-test-templates.md` - Testing templates
- `.claude/docs/ux-audit-checklist.md` - UX guidelines
- `patches/CRIT-*.md` - 8 critical patch validation docs

---

## 0.3 Known Issues Collection

### TODOs Found: 28 instances

#### Critical/Blocking TODOs

| Location | TODO |
|----------|------|
| `server/index.ts:108` | Re-enable after Phase 5 Authentication Unification |
| `server/routes/publish.ts:255` | Send notification to council (requires email) |
| `server/routes/publish.ts:366` | Integrate with Stripe |
| `server/routes/stripe.ts:208` | Generate PDF certificate |
| `server/routes/firm.ts:171` | Implement invitation system |
| `server/services/councilMatcher.ts:148` | Import council boundary data from ONS |

#### Template System TODOs (Pattern: server-only PDF generation)

| File | Issue |
|------|-------|
| `src/next/publish/templates/licensing.ts:118` | Move PDF to API endpoint |
| `src/next/publish/templates/planning.ts:104` | Move PDF to API endpoint |
| `src/next/publish/templates/gambling.ts:178` | Move PDF to API endpoint |
| `src/next/publish/templates/tro.ts:108` | Move PDF to API endpoint |
| `src/next/publish/templates/gvol.ts:58` | Move PDF to API endpoint |
| `src/next/publish/templates/probate.ts:34` | Move PDF to API endpoint |

#### Data Field TODOs (`NewPublishFlow.tsx`)

10+ TODOs for missing form fields: APPLICANT_ADDRESS, ACTIVITY_SCHEDULE, OPERATING_HOURS, DPS_NAME, etc.

### Console.log Statements: 3,459 instances

**Assessment:** Excessive logging. Most appear to be debug statements that should be removed or converted to proper logging.

**Sample Production Code Logs:**
- `server/middleware/adminAuth.ts:95` - Admin access logging
- `server/index.ts:128` - Server startup
- `server/jobs/emailJobs.ts` - 15+ cron job logs
- `server/jobs/alertDeliveryJob.ts` - Alert processing logs

### Debug Flags Found

- `src/components/common/AddressSearch.tsx:120` - `window.__CN_DEBUG_ADDRESS__` flag
- `NewPublishFlow.tsx` - Multiple `[🔥 DEBUG]` console logs

### FIXMEs/HACKs/XXX/BUGs: 1 instance

- `scripts/testing/test-error-state-visibility.ts:68` - BUG marker (intentional test)

---

## 0.4 Git History Analysis

### Recent Activity (Last 30 Days)

| Metric | Value |
|--------|-------|
| Total Commits | **525** |
| Commits per Day | ~17.5 |
| Contributors | Unable to determine (git shortlog returned empty) |

### Most Frequently Changed Files (Hotspots)

| Changes | File | Risk Assessment |
|---------|------|----------------|
| 423 | `PRD.md` | Documentation - Low risk |
| 252 | `progress.txt` | Documentation - Low risk |
| 34 | `src/pages/Pricing.tsx` | ⚠️ High churn |
| 24 | `src/pages/Login.tsx` | ⚠️ High churn |
| 22 | `src/pages/Home.tsx` | ⚠️ High churn (53KB file) |
| 18 | `NewPublishFlow.tsx` | ⚠️ High churn |
| 16 | `server/index.ts` | ⚠️ Core file, high churn |
| 15 | `src/App.tsx` | ⚠️ Root component |
| 12 | `UnifiedAuthContext.tsx` | ⚠️ Auth system |
| 12 | `AccountManagement.tsx` | Admin page |

### Recent Commit Themes

1. **Research & Documentation** - Extensive market research (TRO, CPO, licensing consultants)
2. **Council Integration** - Council data, departments, notification system
3. **TypeScript Fixes** - Sprint to fix production build issues
4. **UI/UX** - Pricing, Login, Home page refinements

---

## Baseline Metrics Summary

| Metric | Value |
|--------|-------|
| Total Source Files | 657 |
| Total Lines of Code | 140,335 |
| TypeScript Files | 633 (96%) |
| JavaScript Files | 24 (4%) |
| Server Routes | 36 |
| Frontend Pages | 34+ |
| TODOs | 28 |
| Console.logs | 3,459 |
| Commits (30 days) | 525 |
| Documentation Files | 40+ |

---

## Risk Areas Identified

### 🔴 High Risk

1. **`server/routes/notices.ts` (69KB)** - Massive route file, likely needs decomposition
2. **`src/pages/Home.tsx` (53KB)** - Very large component with high churn
3. **`NewPublishFlow.tsx`** - Complex flow with 10+ incomplete TODOs
4. **Console.log overload** - 3,459 instances indicates missing logging strategy

### 🟡 Medium Risk

1. **PDF generation architecture** - 6 template files with identical TODOs about moving to API
2. **Authentication** - TODO to re-enable after Phase 5 unification
3. **Stripe integration** - Incomplete (TODO in publish.ts)
4. **Council notification system** - Incomplete (TODO in publish.ts)

### 🟢 Low Risk

1. **Documentation** - Extensive and well-maintained
2. **Test infrastructure** - Multiple test scripts and Cypress setup present
3. **Type safety** - 96% TypeScript coverage

---

## Recommendations for Next Phases

### Phase 1: Architecture Analysis
- Map dependency graph for `notices.ts` and `Home.tsx`
- Document the publish flow state machine
- Analyze authentication system

### Phase 2: Code Quality
- Audit console.log usage and implement proper logging
- Review debug flag usage
- Analyze error handling patterns

### Phase 3: Security Review
- Audit authentication middleware
- Review Stripe integration
- Check data validation

---

*Report generated automatically by Clawdbot audit system*

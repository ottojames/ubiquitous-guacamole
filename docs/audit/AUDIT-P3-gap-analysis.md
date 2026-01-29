# Phase 3: Gap Analysis Report

**Project:** Civic Notices Portal  
**Date:** 2025-01-29  
**Auditor:** Claude (Automated)  
**Phase:** Gap Analysis — PRD vs Reality

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Overall PRD Completion** | **~45%** |
| Notice Types Defined | 34 of ~38 required (89%) |
| Core Features Built | ~60% |
| Professional Portal Features | ~20% |
| TRO Workflow Features | ~15% |
| Critical Blockers | 6 |
| Technical Debt Items | 38 |
| Missing PRD Features | 25+ |

**Bottom Line:** The platform has strong foundations — notice types, schemas, database migrations, and basic publishing flow are in place. However, the **Professional Portal** vision (Kanban workflow, client portal, multi-vertical expansion) and **TRO Workflow** requirements are largely unimplemented. The current state is a working **MVP for basic notice publishing**, not the comprehensive workflow management platform described in the PRDs.

---

## 1. PRD Compliance Check

### 1.1 PRD: Professional Portal Expanded

**Target:** £4.5M ARR platform serving Licensing Consultants, Probate Practitioners, and GVOL Operators.

| Feature Area | PRD Requirement | Implementation Status | Gap |
|--------------|-----------------|----------------------|-----|
| **Visual Pipeline/Kanban** | Drag-and-drop case progression | ❌ Not built | No Kanban UI; only UpcomingDeadlines widget |
| **Deadline Engine** | Multi-level alerts (14d, 7d, 48h, missed) | ⚠️ Partial | DB fields exist, basic component, no SMS/call |
| **White-Label Client Portal** | Consultant branding, client status view | ❌ Not built | No client portal code found |
| **Gazette API (Probate)** | Direct London Gazette submission | ❌ Not built | No Gazette integration |
| **Property-Newspaper Mapper** | Auto-suggest papers by postcode | ⚠️ Partial | Council data exists, matcher incomplete |
| **Multi-Vertical Pricing** | Licensing/Probate/GVOL tiers | ⚠️ Partial | Stripe works, tiers in DB, no vertical separation |
| **Licensing Workflow (10-stage)** | Full application lifecycle | ⚠️ Partial | Workflow API exists, no UI |
| **Probate Workflow (6-stage)** | Estate administration flow | ⚠️ Schema only | Notice type exists, no workflow |
| **GVOL Workflow (5-stage)** | O-licence application flow | ⚠️ Schema only | Notice type exists, no workflow |
| **Claims Tracker (Probate)** | Creditor claims management | ❌ Not built | Not implemented |
| **5-Year Renewal Tracker (GVOL)** | Proactive renewal reminders | ❌ Not built | Not implemented |
| **Traffic Area Mapper (GVOL)** | Auto-identify correct Traffic Area | ❌ Not built | Only basic references in code |

**Professional Portal Completion: ~20%**

---

### 1.2 PRD: TRO Workflow

**Target:** Council-facing TRO management system for £2.25M ARR.

| Feature Area | PRD Requirement | Implementation Status | Gap |
|--------------|-----------------|----------------------|-----|
| **TRO Type Selection** | Permanent, Temporary, Experimental, Emergency | ⚠️ 3 of 4 | Missing Emergency TRO type |
| **Template Library** | Pre-built templates for common TRO types | ⚠️ Partial | Basic TRO template exists |
| **Rich Text Editor** | Legal schedule text editing | ✅ Implemented | Available in form builders |
| **Document Upload** | Supporting plans, maps, schedules | ✅ Implemented | Upload system works |
| **Interactive Map (GIS)** | Draw restriction areas on map | ❌ Not built | No GIS/drawing functionality |
| **Address Lookup** | Find roads by name/postcode | ✅ Implemented | Address system works |
| **GeoJSON Export** | For D-TRO compliance | ❌ Not built | No GeoJSON export |
| **Statutory Consultee Register** | Pre-configured contacts | ❌ Not built | Not implemented |
| **Automated Notifications** | Email/letter templates | ⚠️ Partial | Email exists, no letter generation |
| **21-Day Countdown** | Automatic deadline tracking | ⚠️ DB only | Fields exist, no UI |
| **Online Objection Form** | Public-facing submission | ⚠️ Repurposed | Representations system could work |
| **Objection Register** | Log all objections with timestamp | ✅ Could use | Representations table applicable |
| **Notice Generator** | Auto-generate Notice of Intention | ⚠️ Partial | Template exists, no Notice of Intent |
| **D-TRO API Integration** | DfT repository sync | ❌ Not built | No D-TRO integration |
| **Council SSO** | SAML/OAuth integration | ❌ Not built | Only Supabase auth |

**TRO Workflow Completion: ~15%**

---

## 2. Notice Type Coverage

### 2.1 Defined Notice Types (34 total)

| Category | Types Defined | Status | Notes |
|----------|---------------|--------|-------|
| **Licensing Act 2003** | 6 | ✅ Complete | Premises (new/variation/review), Club (new/variation/review) |
| **Gambling Act 2005** | 16 | ✅ Complete | Betting, Bingo, AGC, FEC × (new/variation/review/transfer) |
| **GVOL** | 2 | ✅ Complete | New, Variation |
| **Planning** | 6 | ✅ Complete | Major, EIA, Listed, Conservation, PRoW, Departure |
| **Probate** | 1 | ✅ Complete | Trustee Act s.27 |
| **TRO** | 3 | ⚠️ Missing 1 | Permanent, Temporary, Experimental (missing Emergency) |

### 2.2 Schema Implementation Status

| Schema File | Lines | Completeness |
|-------------|-------|-------------|
| licensing.ts | 10,349 | ✅ Full Zod schema with validation |
| gambling.ts | 8,978 | ✅ Full Zod schema with validation |
| gvol.ts | 6,457 | ✅ Full Zod schema with validation |
| planning.ts | 5,775 | ✅ Full Zod schema with validation |
| probate.ts | 3,712 | ✅ Full Zod schema with validation |
| tro.ts | 4,894 | ✅ Full Zod schema with validation |
| registry.ts | 3,716 | ✅ Builder pattern working |

### 2.3 Template Implementation Status

| Template File | HTML Template | PDF Generation | Status |
|---------------|---------------|----------------|--------|
| licensing.ts | ✅ Implemented | 🔴 Throws error | PDF broken |
| gambling.ts | ✅ Implemented | 🔴 Throws error | PDF broken |
| gvol.ts | ✅ Implemented | 🔴 Throws error | PDF broken |
| planning.ts | ✅ Implemented | 🔴 Throws error | PDF broken |
| probate.ts | ✅ Implemented | 🔴 Throws error | PDF broken |
| tro.ts | ✅ Implemented | 🔴 Throws error | PDF broken |

**Critical:** All 6 PDF generators throw "PDF rendering is server-only. TODO: move PDF generation to an API endpoint."

---

## 3. Technical Debt Mapping

### 3.1 Critical (P0) — Blocking Production Use

| ID | Location | Issue | Impact | Effort |
|----|----------|-------|--------|--------|
| TD-001 | `server/index.ts:108` | Admin routes commented out | No admin panel access | M |
| TD-002 | `src/next/publish/templates/*.ts` | All 6 PDF generators broken | No proof-of-publication PDFs | L |
| TD-003 | `server/routes/publish.ts:255` | Council notification TODO | Councils not notified of notices | S |
| TD-004 | `server/routes/stripe.ts:208` | PDF certificate TODO | No payment confirmation PDF | M |
| TD-005 | `src/lib/councilNotification.ts` | WIP - needs type fixes | Notification system broken | S |
| TD-006 | `server/routes/firm.ts:171` | Team invitation TODO | Cannot invite team members | M |

### 3.2 High (P1) — Significant Feature Gaps

| ID | Location | Issue | Impact | Effort |
|----|----------|-------|--------|--------|
| TD-007 | NewPublishFlow.tsx:1761-1776 | 10+ form fields with TODO placeholders | Incomplete notice data capture | M |
| TD-008 | `server/services/councilMatcher.ts:148` | ONS boundary data TODO | Inaccurate council matching | L |
| TD-009 | Various | No Kanban/Pipeline UI | Missing PRD core feature | XL |
| TD-010 | Various | No Client Portal | Missing PRD core feature | XL |
| TD-011 | Various | No Gazette API integration | Probate vertical incomplete | L |
| TD-012 | Various | No D-TRO integration | TRO workflow incomplete | L |
| TD-013 | Various | Emergency TRO type missing | TRO coverage incomplete | S |

### 3.3 Medium (P2) — Quality Issues

| ID | Location | Issue | Impact | Effort |
|----|----------|-------|--------|--------|
| TD-014 | Various | 3,459 console.log statements | Debug noise, performance | M |
| TD-015 | Firm components | Mock data fallbacks in production code | Data integrity | S |
| TD-016 | `src/features/publish/PreviewPane.tsx:13` | HTML sanitization TODO | Security risk | S |
| TD-017 | `src/lib/templateService.ts:200` | Missing notice type renderers | Incomplete template coverage | M |
| TD-018 | `server/jobs/scrapers/*.ts` | Incomplete scraper implementations | Automated council data broken | M |

### 3.4 Low (P3) — Nice to Have

| ID | Location | Issue | Impact | Effort |
|----|----------|-------|--------|--------|
| TD-019 | `src/pages/firm/BulkUpload.tsx:132` | Bulk upload API TODO | Feature incomplete | M |
| TD-020 | `src/components/council/RepresentationsList.tsx:174` | Hardcoded 'Officer' username | Minor UX issue | XS |
| TD-021 | `src/components/common/AddressSearch.tsx:120` | Debug flag in production | Code quality | XS |

---

## 4. Test Coverage Analysis

### 4.1 Test File Counts

| Test Type | Files | Location |
|-----------|-------|----------|
| E2E Tests (Playwright) | 84 | `/e2e/` |
| Server Unit Tests | 4 | `/server/__tests__/` |
| Component Tests | 37 | Various in `/src/` |
| **Total** | **125** | — |

### 4.2 E2E Test Coverage by Area

| Area | Test Files | Coverage |
|------|------------|----------|
| Address/Postcode | 12 | ✅ Heavy coverage |
| Admin Panel | 2 | ⚠️ Basic coverage |
| Council Portal | ~8 | ✅ Good coverage |
| Firm Portal | ~5 | ⚠️ Basic coverage |
| Homepage | 4 | ✅ Good coverage |
| Notice Flow | ~10 | ✅ Good coverage |
| Login/Auth | 3 | ⚠️ Basic coverage |
| Publish Flow | Multiple | ✅ Good coverage |

### 4.3 Test Gap Analysis

| Feature | Tests Exist | Notes |
|---------|-------------|-------|
| Notice Type Schemas | ✅ Yes | templates.test.ts |
| API Endpoints | ⚠️ Partial | Only 4 server test files |
| Workflow System | ❌ No | No workflow tests found |
| Payment Flow | ❌ No | No Stripe tests |
| Email System | ❌ No | No email tests |
| Webhook System | ❌ No | No webhook tests |
| Client Portal | N/A | Feature not built |
| Kanban Dashboard | N/A | Feature not built |

**Test Coverage Estimate:** ~40% of implemented features have tests.

---

## 5. Feature→Code Mapping

### 5.1 Core Publishing Flow

| PRD Feature | Implementation | Files |
|-------------|----------------|-------|
| Notice Type Selection | ✅ Complete | `src/next/publish/config/noticeTypes.ts` |
| Form Builder | ✅ Complete | `src/next/publish/flow/NewPublishFlow.tsx` |
| Schema Validation | ✅ Complete | `src/next/publish/schema/*.ts` |
| Template Rendering | ✅ HTML works | `src/next/publish/templates/*.ts` |
| PDF Generation | 🔴 Broken | Templates throw errors |
| Payment Integration | ⚠️ Conditional | `server/routes/stripe.ts` |
| Notice Storage | ✅ Complete | `server/routes/notices.ts`, Supabase |

### 5.2 Council Integration

| PRD Feature | Implementation | Files |
|-------------|----------------|-------|
| Council Data | ⚠️ 10 councils | `/councils/*.json`, `src/data/councils/` |
| Council Notification | 🔴 WIP | `src/lib/councilNotification.ts` (broken) |
| Council Portal | ✅ Working | `src/pages/council/*.tsx` |
| Approval Workflow | ✅ Working | `server/routes/council.ts` |
| Representations | ✅ Working | `server/routes/representations.ts` |

### 5.3 Firm Portal

| PRD Feature | Implementation | Files |
|-------------|----------------|-------|
| Dashboard | ✅ Basic | `src/pages/firm/Dashboard.tsx` |
| Team Management | ⚠️ Partial | `src/pages/firm/Team.tsx`, invitation TODO |
| Client Management | ⚠️ UI only | `src/pages/firm/Clients.tsx` |
| Templates | ✅ Working | `src/pages/firm/Templates.tsx` |
| Billing | ✅ Basic | `src/pages/firm/Billing.tsx` |
| Settings | ✅ Working | `src/pages/firm/Settings.tsx` |

### 5.4 Workflow System

| PRD Feature | Implementation | Files |
|-------------|----------------|-------|
| Workflow Config | ✅ DB + API | `server/routes/workflow.ts`, migrations |
| Stage Transitions | ✅ API | `transition_notice_stage` RPC |
| Deadline Tracking | ⚠️ DB only | `deadline_date` field exists |
| Visual Pipeline (Kanban) | ❌ Not built | — |
| Alert Cascade | ❌ Not built | — |

### 5.5 Missing Features (Not Started)

| PRD Feature | Notes |
|-------------|-------|
| Client Portal | No code found |
| Gazette API Integration | No implementation |
| D-TRO Integration | No implementation |
| GIS/Map Drawing | No implementation |
| Council SSO | No implementation |
| SMS Notifications | No implementation |
| Phone Call Triggers | No implementation |
| Property-Newspaper AI | Basic matcher only |
| Claims Tracker (Probate) | No implementation |
| Renewal Tracker (GVOL) | No implementation |
| Emergency TRO | Type not defined |

---

## 6. Priority Matrix

### 6.1 Quick Wins (High Impact, Low Effort)

| Item | Impact | Effort | Priority |
|------|--------|--------|----------|
| Fix PDF generation (move to API) | High | S-M | P0 |
| Implement council notification | High | S | P0 |
| Add Emergency TRO type | Medium | XS | P1 |
| Fix councilNotification.ts types | Medium | S | P1 |
| Remove debug console.logs | Low | M | P2 |

### 6.2 Big Bets (High Impact, High Effort)

| Item | Impact | Effort | Priority |
|------|--------|--------|----------|
| Build Kanban Pipeline UI | Critical | XL | P1 |
| Build Client Portal | Critical | XL | P1 |
| Gazette API Integration | High | L | P2 |
| D-TRO Integration | High | L | P2 |
| GIS/Map Features | Medium | L | P3 |

### 6.3 Fill-Ins (Low Impact, Low Effort)

| Item | Impact | Effort | Priority |
|------|--------|--------|----------|
| Fix hardcoded 'Officer' username | Low | XS | P3 |
| Remove debug flags | Low | XS | P3 |
| Complete form field TODOs | Medium | M | P2 |

### 6.4 Avoid/Defer (Low Impact, High Effort)

| Item | Impact | Effort | Priority |
|------|--------|--------|----------|
| Council SSO | Low (MVP) | L | Defer |
| Phone call triggers | Low (MVP) | L | Defer |
| Full scraper implementation | Low | L | Defer |

---

## 7. Completion Summary

### 7.1 By PRD Document

| PRD | Stated Goal | Completion | Notes |
|-----|-------------|------------|-------|
| **Professional Portal Expanded** | £4.5M ARR multi-vertical platform | **~20%** | Foundation only; missing Kanban, Client Portal, Gazette |
| **TRO Workflow** | Council TRO management for £2.25M ARR | **~15%** | Notice types exist; missing GIS, D-TRO, workflows |
| **Core Platform** (implied) | Basic notice publishing | **~70%** | Publishing works; PDF/notifications broken |

### 7.2 Overall Assessment

```
┌────────────────────────────────────────────────────────────────┐
│                    PRD COMPLETION OVERVIEW                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Database/Schema      ████████████████████░░░░  85%           │
│  Notice Types         ████████████████████░░░░  89%           │
│  API Endpoints        ██████████████████░░░░░░  75%           │
│  Core Publishing      ██████████████░░░░░░░░░░  60%           │
│  Council Portal       ████████████████░░░░░░░░  70%           │
│  Firm Portal          ██████████░░░░░░░░░░░░░░  45%           │
│  Workflow System      ██████████░░░░░░░░░░░░░░  40% (API only)│
│  Client Portal        ░░░░░░░░░░░░░░░░░░░░░░░░   0%           │
│  Kanban UI            ░░░░░░░░░░░░░░░░░░░░░░░░   0%           │
│  External Integrations██████░░░░░░░░░░░░░░░░░░  25%           │
│  TRO Features         ████░░░░░░░░░░░░░░░░░░░░  15%           │
│  Test Coverage        ████████░░░░░░░░░░░░░░░░  40%           │
│                                                                │
│  ─────────────────────────────────────────────────────────────│
│  OVERALL              █████████░░░░░░░░░░░░░░░  ~45%          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 8. Recommendations

### 8.1 Immediate Actions (This Week)

1. **Fix PDF Generation** — Create `/api/certificates/generate/:type` endpoint
2. **Fix Council Notification** — Complete `councilNotification.ts` with proper types
3. **Re-enable Admin Panel** — Or document why it's disabled and timeline
4. **Add Emergency TRO** — Simple addition to notice types

### 8.2 Short-Term (Next 2-4 Weeks)

1. **Complete Form Field TODOs** — DPS_NAME, APPLICANT_ADDRESS, etc.
2. **Build Minimal Workflow UI** — Even a list view of stages would help
3. **Implement Team Invitation** — Core firm portal feature
4. **Clean Up Console Logs** — Replace with proper logging

### 8.3 Medium-Term (1-3 Months)

1. **Build Kanban Pipeline** — Core PRD feature for Professional Portal
2. **Build Client Portal MVP** — Even basic status view adds value
3. **Gazette API Integration** — Unlock Probate vertical
4. **D-TRO Integration** — Unlock TRO vertical

### 8.4 Decision Points

1. **Re-scope Professional Portal?** — Current velocity suggests 12-18 months to complete as specified. Consider phased launch by vertical.
2. **Prioritize B2B vs B2G?** — Firm Portal (B2B) is further along than Council/TRO (B2G). Consider focusing resources.
3. **Build vs Buy for Client Portal?** — Significant effort; evaluate white-label solutions.

---

## Appendix A: TODO/FIXME Inventory

| File | Line | TODO |
|------|------|------|
| server/index.ts | 108 | Re-enable after Phase 5 Authentication Unification |
| server/routes/publish.ts | 255 | Send notification to council |
| server/routes/publish.ts | 366 | Integrate with Stripe |
| server/routes/stripe.ts | 208 | Generate PDF certificate |
| server/routes/firm.ts | 171 | Implement invitation system |
| server/services/councilMatcher.ts | 148 | Import council boundary data from ONS |
| src/next/publish/schema/licensing.ts | 162 | Add DPS_NAME field to UI |
| src/next/publish/templates/licensing.ts | 118 | Move PDF to API endpoint |
| src/next/publish/templates/planning.ts | 104 | Move PDF to API endpoint |
| src/next/publish/templates/gambling.ts | 178 | Move PDF to API endpoint |
| src/next/publish/templates/tro.ts | 108 | Move PDF to API endpoint |
| src/next/publish/templates/gvol.ts | 58 | Move PDF to API endpoint |
| src/next/publish/templates/probate.ts | 34 | Move PDF to API endpoint |
| NewPublishFlow.tsx | 1761-1776 | 10 form field placeholders |
| src/features/publish/PreviewPane.tsx | 13 | Sanitize HTML |
| src/components/council/RepresentationsList.tsx | 174 | Get userName from auth context |
| src/lib/templateService.ts | 200 | Add other notice type renderers |
| src/pages/firm/BulkUpload.tsx | 132 | Implement actual bulk upload API |
| server/jobs/scrapers/BaseScraper.ts | 201 | Call geocoding service |
| server/jobs/scrapers/WestminsterLicensingScraper.ts | 16 | Implement actual HTML parsing |

---

## Appendix B: Mock Data in Production Code

| File | Issue |
|------|-------|
| src/components/firm/UpcomingDeadlines.tsx | Uses mock deadline data as fallback |
| src/components/firm/QuickPublishWidget.tsx | Uses mock client data |
| src/components/firm/RecentRepresentations.tsx | Uses mock representation data |
| src/components/AddressLookup.tsx | Exports mockProvider used in production |
| src/lib/supabase.ts | Creates dummy client for showcase deployments |

---

*Report generated automatically by Phase 3 Gap Analysis Audit*

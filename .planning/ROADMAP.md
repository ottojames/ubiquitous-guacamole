# Project Roadmap

**Project:** Ralph's Civic Notices
**Goal:** Full platform ready for council demo
**Depth:** Comprehensive (8 phases)
**Created:** 2026-01-22

---

## Overview

Transform the partially-built civic notices platform into a demo-ready state by verifying and connecting existing components. The codebase has substantial infrastructure (32 notice types, council/firm portals, email service, payment integration) but lacks end-to-end verification. This roadmap focuses on testing, fixing, and connecting what exists rather than building new features.

---

## Phase 1: Council Template System

**Goal:** Councils can create and use templates for all 30+ notice types

**Dependencies:** None (foundation phase)

**Requirements:** TMPL-01, TMPL-02, TMPL-03, TMPL-04

**Success Criteria:**

1. Council staff can create a template for any notice type their department manages
2. Template text editor correctly shows available placeholders for the selected notice type
3. Saving a template persists it to database with correct department_id
4. Using a template pre-fills the notice editor with template values
5. Template validation warnings appear for missing required fields

**Existing Assets:**
- `src/pages/council/Templates.tsx` - Template management UI
- `src/pages/council/TemplateTextEditor.tsx` - Rich text editor
- `src/pages/council/TemplateValidationWarnings.tsx` - Validation display
- `src/next/publish/config/departmentNoticeTypes.ts` - Type mapping
- `server/routes/templates.ts` - API endpoints

---

## Phase 2: Department Isolation

**Goal:** Each council department only sees notices and data relevant to their function

**Dependencies:** Phase 1 (templates must work before testing isolation)

**Requirements:** DEPT-01, DEPT-02, DEPT-03, DEPT-04, DEPT-05

**Success Criteria:**

1. Licensing department dashboard shows only Licensing Act and Gambling Act notices
2. Planning department dashboard shows only TCPA 1990 notices
3. Traffic department dashboard shows only TRO and GVOL notices
4. Department switcher correctly changes context for multi-department users
5. Direct API calls cannot access other department data (RLS enforcement verified)

**Existing Assets:**
- `supabase/migrations/20260121100001_department_isolation_rls.sql` - RLS policies
- `src/pages/council/DepartmentSwitcher.tsx` - Context switcher
- `src/next/publish/config/departmentNoticeTypes.ts` - Category mapping
- `server/middleware/auth.ts` - Auth middleware with department context

---

## Phase 3: Publish to Council Flow

**Goal:** Notices submitted by publishers correctly route to the right council and department

**Dependencies:** Phase 2 (isolation must work for routing to be verifiable)

**Requirements:** FLOW-01, FLOW-02, FLOW-03

**Success Criteria:**

1. Publisher completes 4-step wizard and submits notice
2. Notice is geocoded from premises postcode
3. Council is determined from postcode (via council boundary matching)
4. Department is assigned based on notice type category
5. Notice appears in correct department's pending submissions queue

**Existing Assets:**
- `src/next/publish/flow/NewPublishFlow.tsx` - Publish wizard
- `server/services/councilMatcher.ts` - Council matching service
- `src/pages/council/PendingSubmissions.tsx` - Council queue
- `server/lib/geocode.ts` - Postcodes.io integration

---

## Phase 4: Representations Flow

**Goal:** Public can submit representations and council can manage them

**Dependencies:** Phase 3 (notices must exist for representations)

**Requirements:** FLOW-04, FLOW-05, FLOW-06, FLOW-07

**Success Criteria:**

1. Public user can submit support/objection/comment on any active notice
2. Representation stored with correct notice reference and metadata
3. Council staff sees representations filtered to their department's notices only
4. Council staff can mark representation as reviewed (timestamp + reviewer recorded)
5. Council staff can assign representation to team member

**Existing Assets:**
- `src/components/notice/RepresentationForm.tsx` - Public submission form
- `src/pages/council/Representations.tsx` - Council management UI
- `src/components/council/AssignRepresentationModal.tsx` - Assignment modal
- `server/routes/representations.ts` - API endpoints
- `supabase/migrations/20260121000005_submissions_representations.sql` - Schema

---

## Phase 5: Email Notifications

**Goal:** All email notifications trigger correctly at the right moments

**Dependencies:** Phase 4 (representations trigger notifications)

**Requirements:** EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-04, EMAIL-05, EMAIL-06

**Success Criteria:**

1. Publisher receives confirmation email when notice is published
2. Representor receives confirmation email when representation is submitted
3. Council staff receives notification when representation is submitted on their notice
4. Area alert subscribers receive email when new notice appears in their radius
5. Deadline reminders send at configured intervals (48h, 24h before deadline)
6. New alert subscriptions require email verification before activation

**Existing Assets:**
- `server/services/email.ts` - All email templates implemented
- `server/jobs/emailJobs.ts` - Cron job definitions
- `server/jobs/alertDeliveryJob.ts` - Area alert delivery
- Resend integration configured

---

## Phase 6: End-to-End User Flows

**Goal:** Each user type can complete their primary workflow from start to finish

**Dependencies:** Phase 5 (emails are part of complete flows)

**Requirements:** USER-01, USER-02, USER-03

**Success Criteria:**

1. **Publisher flow:** Navigate to publish > select type > upload document > confirm details > pay > receive confirmation > see notice on public site
2. **Resident flow:** Search by postcode > view map > click notice > read details > submit representation > receive confirmation
3. **Council flow:** Login > see dashboard > view pending notices > see representations > mark reviewed > view audit log

**Existing Assets:**
- All page components exist
- Navigation configured
- Auth context implemented

---

## Phase 7: Firm Portal

**Goal:** Law firms can manage clients and submit notices on their behalf

**Dependencies:** Phase 6 (core flows must work for firm extension)

**Requirements:** USER-04, FIRM-01, FIRM-02, FIRM-03

**Success Criteria:**

1. Firm user can add clients with contact details
2. Firm user can select client when starting publish flow
3. Notice is associated with client record
4. Firm subscription status gates portal access
5. Billing aggregates to firm account (not per-notice)

**Existing Assets:**
- `src/pages/firm/` - Complete portal structure
- `src/pages/firm/Clients.tsx` - Client management
- `server/routes/firm-*.ts` - API endpoints
- Stripe subscription model exists

---

## Phase 8: Polish and Demo Prep

**Goal:** Platform is presentation-ready for council demonstrations

**Dependencies:** Phase 7 (all features must work)

**Requirements:** None (polish phase, no new requirements)

**Success Criteria:**

1. Demo data loaded for realistic presentation (sample notices, representations, users)
2. Performance acceptable (page loads < 2s, map renders < 3s)
3. No console errors during demo flows
4. Mobile responsive for key pages (home, notice detail, representation form)
5. Error states handled gracefully (not blank screens)

**Existing Assets:**
- `supabase/migrations/20251021000009_seed_data.sql` - Seed data exists
- Error boundaries implemented
- Responsive design partially implemented

---

## Progress

| Phase | Status | Plans | Completed |
|-------|--------|-------|-----------|
| 1 - Templates | Not Started | 0 | 0 |
| 2 - Isolation | Not Started | 0 | 0 |
| 3 - Publish Flow | Not Started | 0 | 0 |
| 4 - Representations | Not Started | 0 | 0 |
| 5 - Email | Not Started | 0 | 0 |
| 6 - User Flows | Not Started | 0 | 0 |
| 7 - Firm Portal | Not Started | 0 | 0 |
| 8 - Polish | Not Started | 0 | 0 |

**Overall:** 0/28 requirements complete

---

## Phase Ordering Rationale

1. **Templates first:** Foundation for council value proposition. If councils can't create templates, the portal has no utility.

2. **Isolation second:** Security-critical for council adoption. Without verified isolation, councils won't trust the platform with sensitive data.

3. **Publish flow third:** Core product functionality. Publishers are the revenue source; their flow must work.

4. **Representations fourth:** Completes the civic participation loop. Notice → Public → Council.

5. **Email fifth:** Notifications tie the system together. Users need feedback that their actions worked.

6. **User flows sixth:** Integration testing. Verifies all components work together from user perspective.

7. **Firm portal seventh:** Revenue expansion. Firms are B2B customers with higher LTV but narrower use case.

8. **Polish last:** Demo prep. Only matters once everything works.

---

*Roadmap created: 2026-01-22*
*Next step: `/gsd:plan-phase 1` to create detailed plan for Templates phase*

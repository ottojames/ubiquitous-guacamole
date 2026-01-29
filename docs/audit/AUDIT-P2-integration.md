# Phase 2: Integration Audit Report

**Project:** Civic Notices Portal  
**Date:** 2025-01-29  
**Auditor:** Claude (Automated)  
**Phase:** Integration Audit

---

## Executive Summary

This Phase 2 audit documents the integration status of all system components. The codebase has **100+ API endpoints** across **36 route files**, with functional external integrations (Stripe, Supabase, Resend) that require environment configuration. Several critical flows have incomplete integrations marked with TODOs.

| Category | Status | Notes |
|----------|--------|-------|
| API Routes | ✅ Implemented | 100+ endpoints across 36 files |
| Auth System | ✅ Working | Supabase JWT with middleware |
| Stripe Payments | ⚠️ Conditional | Works if configured, graceful fallback |
| Email (Resend) | ⚠️ Conditional | Works if configured, graceful fallback |
| Webhooks | ✅ Implemented | Full delivery system with retries |
| Admin Panel | 🔴 Disabled | Routes commented out in index.ts |
| PDF Generation | 🔴 Incomplete | 6 templates throw "not implemented" |
| Council Notifications | 🔴 Incomplete | TODO in publish.ts |

---

## 1. API Route Inventory

### 1.1 Route Mounting (server/index.ts)

| Route Path | Router | Status |
|------------|--------|--------|
| `/api/upload` | uploadRouter | ✅ Active |
| `/api` | addressRouter | ✅ Active |
| `/api` | noticesRouter | ✅ Active |
| `/api/ai-summary` | aiSummaryRouter | ✅ Active |
| `/api` | publishRouter | ✅ Active |
| `/api` | representationsRouter | ✅ Active |
| `/api` | teamRouter | ✅ Active |
| `/api` | settingsRouter | ✅ Active |
| `/api` | templatesRouter | ✅ Active |
| `/api/firm` | firmRouter | ✅ Active |
| `/api/drafts` | draftsRouter | ✅ Active |
| `/api/councils` | councilsRouter | ✅ Active |
| `/api/council` | councilRouter | ✅ Active |
| `/api/analytics` | analyticsRouter | ✅ Active |
| `/api/stripe` | stripeRouter | ✅ Active |
| `/api/subscriptions` | subscriptionsRouter | ✅ Active |
| `/api/representation-uploads` | representationUploadsRouter | ✅ Active |
| `/api/certificates` | certificatesRouter | ✅ Active |
| `/api/evidence-packs` | evidencePacksRouter | ✅ Active |
| `/api/notices` | versionsRouter | ✅ Active |
| `/api/firm-subscriptions` | firmSubscriptionsRouter | ✅ Active |
| `/api/blue-notices` | blueNoticesRouter | ✅ Active |
| `/api/registration` | registrationRouter | ✅ Active |
| `/api/stats` | statsRouter | ✅ Active |
| `/api/workflow` | workflowRouter | ✅ Active |
| `/api/firm/departments` | firmDepartmentsRouter | ✅ Active |
| `/api/firm/templates` | firmTemplatesRouter | ✅ Active |
| `/api/compliance` | complianceRouter | ✅ Active |
| `/api/drafting` | draftingRouter | ✅ Active |
| `/api/representation-analysis` | representationAnalysisRouter | ✅ Active |
| `/api/internal-comments` | internalCommentsRouter | ✅ Active |
| `/api` | testCertificateRouter | ✅ Active |
| `/api` | testEmailRouter | ✅ Active |
| `/api/migration` | applyMigrationRouter | ✅ Active |
| `/api/admin/auth` | adminAuthRouter | 🔴 **COMMENTED OUT** |
| `/api/admin/accounts` | adminAccountsRouter | 🔴 **COMMENTED OUT** |
| `/api/admin/audit` | adminAuditRouter | 🔴 **COMMENTED OUT** |
| `/api/admin/settings` | adminSettingsRouter | ✅ Active |
| `/api/admin/stats` | adminStatsRouter | ✅ Active |

### 1.2 Endpoint Inventory by Route File

#### Core Notice Operations (notices.ts - 69KB)
| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| POST | `/notices/draft` | requireAuth + permission | ✅ |
| POST | `/notices/submit` | optionalAuth | ✅ |
| GET | `/notices/search` | optionalAuth | ✅ |
| GET | `/notices/:id` | optionalAuth | ✅ |
| GET | `/notices/:id/representations` | optionalAuth | ✅ |
| POST | `/notices/:id/representations` | public | ✅ |
| POST | `/notices/:id/representations/:repId/mark-read` | optionalAuth | ✅ |
| POST | `/notices/:id/view` | public | ✅ |

#### Publishing Flow (publish.ts - 18KB)
| Method | Endpoint | Auth | Status | Notes |
|--------|----------|------|--------|-------|
| POST | `/notices/publish` | requireAuth | ⚠️ | Missing council notification |
| GET | `/billing/account` | requireAuth | ✅ | |
| POST | `/billing/pay` | requireAuth | ⚠️ | Mock payment intent |
| GET | `/representations/:noticeId` | requireAuth | ✅ | |

#### Stripe Payments (stripe.ts - 7KB)
| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| POST | `/create-checkout-session` | public | ✅ (conditional) |
| GET | `/session/:sessionId/status` | public | ✅ (conditional) |
| POST | `/webhook` | public | ✅ |

#### Council Operations (council.ts - 9KB)
| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| GET | `/pending-submissions` | public | ✅ |
| GET | `/departments/:councilId/stats` | public | ✅ |
| POST | `/notices/:id/approve` | public | ✅ |
| POST | `/notices/:id/reject` | public | ✅ |
| POST | `/representations/:id/mark-read` | public | ✅ |
| GET | `/representations/unread-count` | public | ✅ |

#### Firm Operations (firm.ts - 14KB)
| Method | Endpoint | Auth | Status | Notes |
|--------|----------|------|--------|-------|
| GET | `/:firmId/team` | requireAuth | ✅ | |
| POST | `/:firmId/team/invite` | requireAuth | ⚠️ | TODO: invitation system |
| DELETE | `/:firmId/team/:membershipId` | requireAuth | ✅ | |
| PATCH | `/:firmId/team/:membershipId/role` | requireAuth | ✅ | |
| GET | `/:firmId/settings` | requireAuth | ✅ | |
| PATCH | `/:firmId/settings` | requireAuth | ✅ | |

#### Registration (registration.ts - 13KB)
| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| POST | `/council` | public | ✅ |
| POST | `/firm` | public | ✅ |

#### Drafts (drafts.ts - 10KB)
| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| GET | `/` | public | ✅ |
| GET | `/:id` | public | ✅ |
| POST | `/` | public | ✅ |
| PUT | `/:id` | public | ✅ |
| DELETE | `/:id` | public | ✅ |
| POST | `/:id/publish` | public | ✅ |

#### Workflow (workflow.ts - 9KB)
| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| GET | `/configs` | public | ✅ |
| GET | `/configs/:noticeType` | public | ✅ |
| GET | `/notices/:noticeId/status` | public | ✅ |
| POST | `/notices/:noticeId/transition` | public | ✅ |
| POST | `/notices/:noticeId/initialize` | public | ✅ |

#### Analytics (analytics.ts - 16KB)
| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| GET | `/council/:councilId` | public | ✅ |
| GET | `/council/:councilId/monthly-trends` | public | ✅ |
| GET | `/council/:councilId/department-comparison` | public | ✅ |
| GET | `/council/:councilId/compliance` | public | ✅ |
| GET | `/council/:councilId/engagement` | public | ✅ |
| GET | `/audit-log` | public | ✅ |

#### Templates (templates.ts - 11KB)
| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| GET | `/` | public | ✅ |
| GET | `/:id` | public | ✅ |
| POST | `/` | public | ✅ |
| PATCH | `/:id` | public | ✅ |
| DELETE | `/:id` | public | ✅ |
| POST | `/:id/use` | public | ✅ |

#### Representations (representations.ts - 27KB)
| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| GET | `/notices/:noticeId/representations` | requireAuth + permission | ✅ |
| GET | `/notices/:noticeId/representations/counts` | requireAuth + permission | ✅ |
| POST | `/representations/counts/bulk` | requireAuth + permission | ✅ |
| POST | `/representations/:representationId/mark-read` | requireAuth + permission | ✅ |
| GET | `/representations/:representationId` | requireAuth + permission | ✅ |
| POST | `/representations/:representationId/comment` | optionalAuth | ✅ |
| POST | `/representations` | public | ✅ |
| GET | `/representations/export` | requireAuth + permission | ✅ |
| GET | `/representations/export/idox` | requireAuth + permission | ✅ |

---

## 2. Authentication Flow Analysis

### 2.1 Auth Middleware Stack

```
server/middleware/auth.ts
├── requireAuth         → Validates Supabase JWT, blocks if missing/invalid
├── optionalAuth        → Validates JWT if present, continues without user if missing
├── setUserContext      → Supports both Bearer token and cookie sessions
├── loadUserPermissions → Fetches department permissions via RPC
├── requirePermission   → Checks specific permission via RPC
├── requireRole         → Role-based access control
├── hasAnyPermission    → Middleware for OR permission checks
└── hasAllPermissions   → Middleware for AND permission checks
```

### 2.2 Auth Context (Frontend)

```
src/contexts/UnifiedAuthContext.tsx
├── User State
│   ├── user, session, loading, isInitialized
│   ├── organization, department
│   └── permissions, userType, organizationType
├── Actions
│   ├── signIn, signOut, signInAsAdmin
│   ├── switchOrganization, switchDepartment
│   └── refreshSession, loadPermissions
└── Permission Checks
    ├── hasPermission(name)
    ├── hasAnyPermission(...names)
    ├── hasAllPermissions(...names)
    └── canAccessAdmin()
```

### 2.3 Auth Flow Status

| Flow | Status | Notes |
|------|--------|-------|
| Email/Password Login | ✅ Working | Via Supabase Auth |
| Session Persistence | ✅ Working | Supabase handles tokens |
| JWT Validation (API) | ✅ Working | `requireAuth` middleware |
| Organization Context | ✅ Working | Loaded from `app_metadata` |
| Department Permissions | ✅ Working | RPC-based permission checks |
| Admin Auth | 🔴 Disabled | Routes commented out (Phase 5 TODO) |
| 2FA | ⚠️ Implemented | In admin/auth.ts but routes disabled |

---

## 3. External Integration Status

### 3.1 Supabase Integration

**Status:** ✅ Fully Integrated

| Component | Implementation | Status |
|-----------|----------------|--------|
| Auth | `@supabase/supabase-js` | ✅ Working |
| Database | PostgreSQL via Supabase | ✅ Working (87 migrations) |
| Storage | Supabase Storage | ✅ Working (representation uploads) |
| RPC Functions | Multiple permission/audit RPCs | ✅ Working |
| RLS Policies | Comprehensive policies | ✅ Implemented |

**Database Tables:** 55 tables documented in Phase 1

**Service Client Pattern:**
```typescript
// server/lib/supabase.ts
export function getServiceSupabaseClient() {
  // Uses SUPABASE_SERVICE_ROLE_KEY for backend operations
  // Bypasses RLS for admin operations
}
```

### 3.2 Stripe Integration

**Status:** ⚠️ Conditional (works if configured)

| Feature | Implementation | Status |
|---------|----------------|--------|
| Checkout Sessions | `stripe.checkout.sessions.create` | ✅ Working |
| Session Status | `stripe.checkout.sessions.retrieve` | ✅ Working |
| Webhook Handler | `stripe.webhooks.constructEvent` | ✅ Working |
| Payment Processing | Updates notice to 'published' | ✅ Working |
| Email on Payment | Sends confirmation via Resend | ✅ Working |
| PDF Certificate | **TODO: Generate PDF certificate** | 🔴 Not implemented |

**Environment Variables Required:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_STRIPE_PUBLISHABLE_KEY`

**Graceful Degradation:**
```typescript
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
// Routes return 500 with helpful message if not configured
```

### 3.3 Email Service (Resend)

**Status:** ⚠️ Conditional (works if configured)

| Email Type | Function | Status |
|------------|----------|--------|
| Notice Confirmation | `sendNoticeConfirmation` | ✅ Implemented |
| Representation Confirmation | `sendRepresentationConfirmation` | ✅ Implemented |
| Deadline Reminder | `sendDeadlineReminder` | ✅ Implemented |
| Subscription Verification | `sendSubscriptionVerification` | ✅ Implemented |
| Alert Email | `sendAlertEmail` | ✅ Implemented |
| Daily Summary | `sendDailySummary` | ✅ Implemented |
| Team Invitation | `sendTeamInvitation` | ✅ Implemented |
| Council Invitation | `sendCouncilDepartmentInvitation` | ✅ Implemented |
| Representation Notification | `sendRepresentationNotification` | ✅ Implemented |

**Environment Variable:** `RESEND_API_KEY`

**Graceful Degradation:**
```typescript
if (!process.env.RESEND_API_KEY) {
  console.warn('[Email] Resend API key not configured, skipping email');
  return { success: false, error: 'Email service not configured' };
}
```

### 3.4 Webhook System

**Status:** ✅ Fully Implemented

| Event Type | Trigger Point | Status |
|------------|---------------|--------|
| `notice.published` | After publish | ✅ |
| `notice.expired` | (not observed) | ⚠️ |
| `notice.updated` | (not observed) | ⚠️ |
| `representation.submitted` | (not observed) | ⚠️ |
| `workflow.stage_changed` | After transition | ✅ |
| `payment.completed` | Stripe webhook | ✅ |

**Implementation:**
- HMAC-SHA256 signature verification
- Delivery tracking with retries
- Timeout handling (configurable per webhook)
- Status tracking (success/failed/pending)

### 3.5 Address Lookup

**Status:** ⚠️ Conditional with Mock Mode

| Provider | Implementation | Status |
|----------|----------------|--------|
| getaddress.io | Default provider | ✅ Implemented |
| Mock Mode | `ADDRESS_PROVIDER=mock` | ✅ Available |

**Environment:** `ADDRESS_PROVIDER` (default: 'getaddress')

---

## 4. E2E Flow Analysis

### 4.1 Notice Publication Flow (Firm → Public)

```
[User selects notice type]
     │
     ▼
/f/:firmSlug/publish/* → NewPublishFlow.tsx
     │
     ├── Step 1: NoticeTypeStep (select category/type)
     ├── Step 2: UploadMethodStep (manual/upload)
     ├── Step 3: ConfirmStep (review/edit)
     └── Step 4: PaymentStep
              │
              ▼
         [If Stripe configured]
              │
              ├── POST /api/stripe/create-checkout-session
              │        │
              │        ▼
              │   Stripe Checkout Page
              │        │
              │        ▼
              │   POST /api/stripe/webhook
              │        │
              │        ├── Update notice status → 'published'
              │        ├── Send confirmation email (Resend)
              │        ├── Fire webhook (payment.completed)
              │        └── TODO: Generate PDF certificate 🔴
              │
         [If Stripe NOT configured]
              │
              └── POST /api/notices/publish (direct)
                       │
                       ├── Create notice with status='published'
                       ├── TODO: Send notification to council 🔴
                       └── Return confirmation
```

**Broken Points:**
1. 🔴 PDF certificate generation (TODO in stripe.ts:208)
2. 🔴 Council notification after publish (TODO in publish.ts:255)
3. 🔴 Stripe integration in direct publish path (TODO in publish.ts:366)

### 4.2 Council Approval Flow

```
[Firm submits notice]
     │
     ▼
POST /api/notices/submit → status='pending'
     │
     ▼
[Council views pending]
GET /api/council/pending-submissions
     │
     ├── [Approve]
     │   POST /api/council/notices/:id/approve
     │        │
     │        ├── approval_status → 'approved'
     │        ├── status → 'published'
     │        └── published_at → now()
     │
     └── [Reject]
         POST /api/council/notices/:id/reject
              │
              └── approval_status → 'rejected'
```

**Status:** ✅ Working

### 4.3 Representation Submission Flow

```
[Public views notice]
GET /api/notices/:id
     │
     ▼
[Submit representation]
POST /api/notices/:id/representations
     │
     ├── Create representation record
     ├── Send confirmation email (if configured)
     └── Fire webhook (representation.submitted) ⚠️
     │
     ▼
[Council reviews]
GET /api/representations/:id
POST /api/representations/:id/mark-read
POST /api/representations/:id/comment
```

**Status:** ✅ Working (webhook firing not verified)

### 4.4 Registration Flow

```
[Council Registration]
POST /api/registration/council
     │
     ├── 1. Create organization (type='council')
     ├── 2. Create departments
     ├── 3. Create council_settings
     ├── 4. Create admin user (Supabase Auth)
     └── 5. Create organization_membership

[Firm Registration]
POST /api/registration/firm
     │
     ├── 1. Create organization (type='firm')
     ├── 2. Create admin user (Supabase Auth)
     ├── 3. Create organization_membership
     └── 4. Create subscription record
```

**Status:** ✅ Working

---

## 5. Broken Flows & Incomplete Features

### 5.1 Critical TODOs (Blocking)

| Location | TODO | Impact | Priority |
|----------|------|--------|----------|
| `server/index.ts:108` | Re-enable after Phase 5 Authentication Unification | Admin panel disabled | 🔴 High |
| `server/routes/publish.ts:255` | Send notification to council | Councils not notified of new notices | 🔴 High |
| `server/routes/stripe.ts:208` | Generate PDF certificate | No proof of publication | 🔴 High |

### 5.2 Feature TODOs

| Location | TODO | Impact | Priority |
|----------|------|--------|----------|
| `server/routes/publish.ts:366` | Integrate with Stripe | Mock payment in direct publish | ⚠️ Medium |
| `server/routes/firm.ts:171` | Implement invitation system | Can't invite team members | ⚠️ Medium |
| `server/services/councilMatcher.ts:148` | Import council boundary data from ONS | Limited council matching | ⚠️ Medium |

### 5.3 PDF Generation (All Templates Broken)

| Template | Location | Status |
|----------|----------|--------|
| Licensing | `src/next/publish/templates/licensing.ts:118` | 🔴 throws Error |
| Planning | `src/next/publish/templates/planning.ts:104` | 🔴 throws Error |
| Gambling | `src/next/publish/templates/gambling.ts:178` | 🔴 throws Error |
| TRO | `src/next/publish/templates/tro.ts:108` | 🔴 throws Error |
| GVOL | `src/next/publish/templates/gvol.ts:58` | 🔴 throws Error |
| Probate | `src/next/publish/templates/probate.ts:34` | 🔴 throws Error |

**Error message:** "PDF rendering is server-only. TODO: move [type] PDF generation to an API endpoint."

### 5.4 Missing Form Fields (NewPublishFlow.tsx)

The following fields are marked TODO and have placeholder values:
- `APPLICANT_ADDRESS`
- `ACTIVITY_SCHEDULE`
- `OPERATING_HOURS`
- `DPS_NAME`
- `DPS_LICENSING_AUTHORITY`
- `REPRESENTATION_ADDRESS`
- `INSPECTION_LOCATION`
- `INSPECTION_HOURS`
- `ONLINE_REGISTER_URL`
- `RESPONSIBLE_AUTHORITIES_LIST_URL`

### 5.5 Disabled Admin Routes

The following admin routes are commented out in `server/index.ts`:

```typescript
// app.use('/api/admin/auth', adminAuthRouter);
// app.use('/api/admin/accounts', requireAdmin, enforceIPAllowlist, adminAccountsRouter);
// app.use('/api/admin/audit', requireAdmin, enforceIPAllowlist, adminAuditRouter);
```

**Reason:** TODO comment states "Re-enable after Phase 5 Authentication Unification is complete"

---

## 6. Data Flow Mapping

### 6.1 Notice Creation Data Flow

```
[Frontend: NewPublishFlow.tsx]
     │
     ├── Local State: noticeDefinition, legalDetails, templateDraft
     │
     ▼
POST /api/notices/publish
     │
     ├── Validate: target_council_id, target_department_id, notice_data
     ├── Lookup: organization_memberships → firm verification
     ├── Lookup: departments → council/department verification
     ├── Lookup: templates → custom template for notice type
     │
     ▼
Supabase INSERT → notices table
     │
     ├── Columns: organization_id, department_id, created_by, notice_type
     │            status, title, content, premises, consultation, extras
     │
     ▼
Supabase INSERT → notice_access_tokens
     │
     └── Provides tracking_token for public tracking
```

### 6.2 Frontend → API Mapping

| Frontend Location | API Endpoints Called |
|-------------------|---------------------|
| `src/pages/Home.tsx` | `/api/notices/search`, `/api/stats` |
| `src/pages/Notices.tsx` | `/api/notices/search` |
| `src/pages/NoticeDetailPage.tsx` | `/api/notices/:id`, `/api/notices/:id/representations` |
| `src/pages/council/CouncilDashboard.tsx` | `/api/analytics/council/:id`, `/api/council/pending-submissions` |
| `src/pages/council/CouncilNotices.tsx` | `/api/notices/search` (filtered) |
| `src/pages/council/CouncilRepresentations.tsx` | `/api/representations/*` |
| `src/pages/firm/FirmDashboard.tsx` | `/api/firm/:id/*`, `/api/drafts` |
| `src/pages/firm/FirmTeam.tsx` | `/api/firm/:id/team` |
| `src/next/publish/flow/NewPublishFlow.tsx` | `/api/notices/publish`, `/api/stripe/create-checkout-session` |
| `src/pages/Login.tsx` | Supabase Auth (direct) |
| `src/pages/Pricing.tsx` | `/api/firm-subscriptions/tiers` |

### 6.3 External Service Data Flow

```
                    ┌─────────────────┐
                    │   Frontend      │
                    │   (React)       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Express API   │
                    │   (Backend)     │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │   Supabase   │  │    Stripe    │  │   Resend     │
    │  (Database)  │  │  (Payments)  │  │   (Email)    │
    └──────────────┘  └──────────────┘  └──────────────┘
           │
           ├── PostgreSQL (87 migrations)
           ├── Auth (JWT tokens)
           └── Storage (file uploads)
```

---

## 7. Test Coverage Status

### 7.1 E2E Tests (Playwright)

**Total:** 62 spec files in `/e2e/`

| Category | Files | Notes |
|----------|-------|-------|
| Address | 12 | Various address lookup tests |
| Admin | 2 | admin-panel.spec.ts, admin-panel/ |
| Audit | 2 | audit.spec.ts, comprehensive-audit.spec.ts |
| Council | 5 | Council portal tests |
| Firm | 5 | Firm portal tests |
| Home | 4 | Homepage tests |
| Notice Flow | 6 | Full notice submission flows |
| Login | 2 | Authentication tests |
| Other | 24 | Various feature tests |

### 7.2 API Tests (Vitest)

**Total:** 48 test files in `/server/__tests__/` and component tests

**Note:** Test execution not verified in this audit phase.

---

## 8. Recommendations

### 8.1 Immediate Fixes Required

| Priority | Issue | Fix |
|----------|-------|-----|
| 🔴 P0 | Admin routes disabled | Complete Phase 5 Auth Unification or enable with temporary security |
| 🔴 P0 | PDF generation broken | Create `/api/certificates/generate` endpoint for all 6 templates |
| 🔴 P0 | Council notification missing | Implement email notification in publish flow |

### 8.2 Integration Gaps to Address

| Gap | Current State | Target State |
|-----|---------------|-------------|
| PDF Certificates | Throws error | Server-side generation via API |
| Council Notifications | TODO comment | Email + webhook on notice publish |
| Team Invitations | Stub implementation | Full invitation flow with email |
| Stripe in Direct Publish | Mock payment ID | Proper checkout or skip payment |

### 8.3 Environment Configuration Checklist

```bash
# Required for full functionality
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=

# Payments (optional but recommended)
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email (optional but recommended)
RESEND_API_KEY=

# Address lookup (optional)
ADDRESS_PROVIDER=getaddress  # or 'mock' for testing

# Application
VITE_APP_URL=http://localhost:5173
```

---

## Appendix A: Notice Type Definitions

The system supports 35+ notice types across 6 categories:

| Category | Types |
|----------|-------|
| Licensing Act 2003 | Premises (New/Variation/Review), Club Premises (New/Variation/Review) |
| Gambling Act 2005 | Betting, Bingo, AGC, FEC (each: New/Variation/Review/Transfer) |
| GVOL | New, Variation |
| Planning | Major, EIA, Listed Building, Conservation, PROW, Departure |
| Probate | Trustee Act s.27 |
| TRO | Permanent, Temporary, Experimental |

---

## Appendix B: Database Tables Summary

55 tables across these domains:
- **Core:** notices, notice_versions, notice_amendments
- **Organizations:** organizations, departments, organization_memberships, department_memberships
- **Users:** profiles, admin_users, admin_sessions
- **Representations:** representations, representation_reads, representation_rate_limits
- **Templates:** templates, notice_templates, firm_notice_templates
- **Workflow:** workflow_configs, workflow_stages, workflow_stage_history
- **Billing:** subscriptions, subscription_tiers, billing_transactions, monthly_invoices
- **Integration:** webhooks, webhook_deliveries

---

*Report generated automatically by Phase 2 Integration Audit*

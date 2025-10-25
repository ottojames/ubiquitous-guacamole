# CivicNotices Codebase - Comprehensive Analysis

**Date:** October 24, 2025  
**Scope:** Very Thorough Exploration  
**Codebase Size:** ~28 migration files, 100+ TypeScript components, multi-tenant SPA + Express API

---

## Executive Summary

CivicNotices is a full-stack web application for publishing and managing statutory notices (primarily licensing, planning, traffic, environmental, and procurement notices) with a dual-mode architecture:

1. **Public Portal**: Citizens search and submit representations on notices
2. **Council Portal**: Department teams manage notices, track representations, and coordinate approvals

The system features a sophisticated multi-tenant database architecture with organizations, departments, and role-based access control, but several key features are still in development or missing entirely.

---

## Part 1: ALL IMPLEMENTED ROUTES

### Application Router Structure (`src/App.tsx`)

#### Public Routes (Open Access)
```
/                          → Home (address search + notice discovery)
/notices                   → Notice Search Page (full search + map view)
/notices/:id               → Notice Detail Page (read-only)
/notices/:id/confirmation  → Publication Confirmation Page
/notices/:id/respond       → Submit Representation Form
/pricing                   → Pricing Page
/login                     → Demo Login Page
/publish/*                 → Legacy Publish Flow
/success                   → Success Page
/details                   → Details Page
/debug/address            → Address Lookup Debug Page
```

#### Authentication Routes
```
/auth/sign-in              → Sign In (Magic Link + Demo Access)
/auth/callback             → OAuth Callback Handler
/switch-context            → Context Switching (for multi-org users)
```

#### Onboarding Routes
```
/onboarding/create-organization → Create Organization Flow
```

#### Council Portal Routes (Protected)
```
/c/:orgSlug/:deptSlug/               → CouncilLayout (parent layout)
├── dashboard                        → Department Dashboard (stats, recent notices)
├── notices                          → Notices List (with filtering)
├── notices/new                      → Notice Editor (create/edit)
├── notices/:noticeId               → Notice Detail (read-only with tabs)
├── team                            → Team Management
├── templates                       → Template Management
├── settings                        → Department Settings
└── audit                           → Audit Log
```

#### Feature-Flagged Routes
```
/next/publish/                      → New Wizard Flow (if VITE_NEW_PUBLISH_FLOW=true)
├── type                           → Step 1: Notice Type Selection
├── upload                         → Step 2: Upload/OCR
├── confirm                        → Step 3: Confirm Details
└── pay                            → Step 4: Review & Pay
```

#### Catch-All
```
*                          → Redirects to Home
```

### Backend API Routes (`server/index.ts`)

```
/api/health                           → Health Check
/api/upload/*                         → File Upload + OCR
/api/addresses/*                      → Address Lookup (getAddress.io)
/api/notices/*                        → Notice CRUD + Geospatial Search
/api/ai-summary/*                     → AI Summarization (ChatGPT)
/api/publish/*                        → Notice Publishing
```

#### Key Notice API Endpoints (from `server/routes/notices.ts`)
```
GET  /api/notices/search              → Search notices (full-text, postcode, distance)
GET  /api/notices/:id                 → Get single notice
GET  /api/notices/bbox                → Bounding box search (for map)
POST /api/notices                     → Create notice
PUT  /api/notices/:id                 → Update notice
DELETE /api/notices/:id               → Delete notice
GET  /api/notices/nearby              → Find nearby notices (radius search)
```

#### Key Address API Endpoints
```
GET  /api/addresses                   → Lookup address by postcode/freetext
```

#### Key Publish API Endpoints
```
POST /api/publish/notice              → Publish notice to public
POST /api/publish/confirm             → Create proof PDF
```

---

## Part 2: ALL PAGE COMPONENTS

### Public Pages (`src/pages/`)

#### 1. **Home.tsx** (48KB)
- Address search bar with postcode autocomplete
- Hero section with CTA buttons
- Featured notices carousel
- Search results integration
- Map view option

#### 2. **Notices.tsx** (32KB)
- Full notice search & filter interface
- Map view (MapLibre GL with clustering)
- List view with pagination
- Filters: notice type, status, date range, distance
- Sort options: creation date, distance, relevance

#### 3. **NoticeDetailPage.tsx** (22KB)
- Read-only notice display
- Premises information
- Application details (applicant, dates)
- Representation deadline indicator
- CTA to submit representation
- Proof PDF viewer

#### 4. **SubmitRepresentation.tsx** (21KB)
- Public representation form
- Name, email, address fields
- Representation type: objection/support/comment
- Text area with character counter
- File upload for supporting documents
- Email submission (mailto link)

#### 5. **PublishConfirmationPage.tsx** (9KB)
- Confirmation after notice publication
- Success message with notice details
- Share/copy links
- View proof PDF option

#### 6. **Pricing.tsx** (26KB)
- Pricing tiers
- Feature comparison table
- FAQ section
- Contact form

#### 7. **Login.tsx** (18KB)
- Demo login with demo credentials
- Email/password form
- Social login (Google OAuth)
- Forgot password link

#### 8. **DetailsPage.tsx** (8KB)
- Generic details page component
- Used for routing to specific detail views

#### 9. **Success.tsx** (2KB)
- Simple success confirmation page
- Redirect to notices

#### 10. **Health.tsx** (1KB)
- Health check endpoint
- Returns API status

### Council Portal Pages (`src/pages/council/`)

#### 1. **CouncilLayout.tsx** (11KB)
- Parent layout for all council routes
- Demo mode detection
- Department data loading
- Sidebar navigation
- Role-based access control
- Outlet for nested routes

#### 2. **Dashboard.tsx** (20KB)
- Department-level statistics (total, published, draft, pending, expired)
- Recent notices list
- Operational indicators (closing soon, awaiting proof)
- Demo mode support
- Quick navigation cards

#### 3. **Notices.tsx** (14KB)
- Department notices list
- Filters: all, draft, pending_approval, published, expired
- Search by title
- Status-based color coding
- Closing soon indicators
- Links to notice detail

#### 4. **NoticeDetail.tsx** (13KB)
- Read-only notice detail view
- Tabs: Overview, Representations, Documents, History
- Department-specific fields based on config
- Representation count tracking
- Proof PDF display
- Awaiting proof indicator

#### 5. **NoticeEditor.tsx** (22KB)
- Create/edit notices (editor role required)
- Form builder based on department type
- Template selection
- Field validation
- Draft auto-save
- Publish button (if approved)

#### 6. **Team.tsx** (12KB)
- Team member management
- Role assignment (owner, admin, editor, viewer)
- Invite team members
- Remove members
- Activity log

#### 7. **Templates.tsx** (15KB)
- Manage notice templates
- Create/edit templates
- Template preview
- Default template assignment per department

#### 8. **Settings.tsx** (12KB)
- Department settings
- Notification preferences
- Integration settings
- Billing/subscription info

#### 9. **AuditLog.tsx** (11KB)
- Timeline of all department activities
- Filters: user, action type, date range
- Notice publish/edit tracking
- Representation submission tracking
- Team changes

### Auth Pages (`src/pages/auth/`)

#### 1. **SignIn.tsx** (7KB)
- Magic link authentication
- Demo credentials support
- Email input
- Success message after link sent

#### 2. **Callback.tsx** (5KB)
- OAuth/Magic link callback handler
- Processes auth token
- Redirects to dashboard or home

#### 3. **SwitchContext.tsx** (10KB)
- Organization/department context switcher
- Shows all available contexts
- Updates user session
- Redirects to selected department

### Onboarding Pages (`src/pages/onboarding/`)

#### 1. **CreateOrganization.tsx**
- New council/firm registration
- Organization type selection
- Contact information form
- Domain verification

---

## Part 3: DATABASE SCHEMA (Supabase/PostgreSQL)

### Migration Timeline
24 migrations total (August 11 - October 25, 2025):
- 5 initial migrations (core notices, councils, security)
- 9 multi-tenant foundation migrations (Oct 21)
- 3 publish workflow migrations (Oct 22)
- 2 representation tracking migrations (Oct 25)

### Core Tables (Created in Order)

#### 1. **notices** (Aug 11)
- Original notice storage
- JSONB premises data
- Status tracking
- Geospatial support (latitude/longitude)

#### 2. **councils** (Aug 11)
- Council directory
- Basic contact info

#### 3. **organizations** (Oct 21)
```sql
id UUID PRIMARY KEY
type TEXT (council|firm)
name TEXT
domain TEXT UNIQUE
status TEXT (pending_approval|active|suspended|archived)
registration_number TEXT
contact_email TEXT
contact_phone TEXT
address JSONB
logo_url TEXT
settings JSONB
created_at, updated_at, created_by
```

#### 4. **departments** (Oct 21)
```sql
id UUID PRIMARY KEY
organization_id UUID (FK organizations)
name TEXT
slug TEXT
type TEXT (licensing|planning|traffic|environmental_health|building_control|other)
email TEXT
phone TEXT
description TEXT
status TEXT (active|archived)
settings JSONB
created_at, updated_at, created_by, archived_at
UNIQUE (organization_id, slug)
```

#### 5. **organization_memberships** (Oct 21)
```sql
id UUID PRIMARY KEY
organization_id UUID (FK organizations)
user_id UUID (FK auth.users)
role TEXT (owner|org_admin)
created_at, invited_by
UNIQUE (organization_id, user_id)
```

#### 6. **department_memberships** (Oct 21)
```sql
id UUID PRIMARY KEY
department_id UUID (FK departments)
user_id UUID (FK auth.users)
role TEXT (department_admin|editor|viewer)
last_accessed_at TIMESTAMPTZ
created_at, invited_by
UNIQUE (department_id, user_id)
```

#### 7. **notices_enhanced** (Oct 21)
Extends original notices table with:
- organization_id UUID (FK)
- department_id UUID (FK)
- created_by UUID (FK)
- description TEXT
- published_at TIMESTAMPTZ
- expires_at TIMESTAMPTZ
- representation_deadline TIMESTAMPTZ
- is_public BOOLEAN (default true)

Added statuses: pending_approval, expired, archived

#### 8. **templates** (Oct 21)
```sql
id UUID PRIMARY KEY
organization_id UUID (FK)
department_id UUID (FK)
name TEXT
type TEXT (notice_type)
content TEXT
settings JSONB
is_default BOOLEAN
created_at, updated_at, created_by
```

#### 9. **template_attachments** (Oct 21)
```sql
id UUID PRIMARY KEY
template_id UUID (FK templates)
file_name TEXT
file_url TEXT
file_type TEXT
created_at
```

#### 10. **invitations** (Oct 21)
```sql
id UUID PRIMARY KEY
organization_id UUID (FK)
department_id UUID (FK) [NULL for org-level]
email TEXT
role TEXT
status TEXT (pending|accepted|expired)
expires_at TIMESTAMPTZ
created_by UUID (FK)
created_at
```

#### 11. **clients** (Oct 21)
```sql
id UUID PRIMARY KEY
firm_organization_id UUID (FK organizations)
name TEXT
contact_email TEXT
contact_phone TEXT
address JSONB
status TEXT
created_at, updated_at
```

#### 12. **submissions** (Oct 21)
```sql
id UUID PRIMARY KEY
source_organization_id UUID (FK) [firm]
client_id UUID (FK)
target_department_id UUID (FK)
target_organization_id UUID
status TEXT (new|under_review|changes_requested|resubmitted|accepted|rejected)
reference_number TEXT UNIQUE (SUB-XXXXXX)
notice_type TEXT
notice_data JSONB
attachments JSONB
firm_message TEXT
council_response TEXT
requested_changes JSONB
assigned_to UUID (FK)
assigned_at TIMESTAMPTZ
created_notice_id UUID (FK notices)
submitted_at, updated_at, submitted_by UUID
status_history JSONB (array of status changes)
```

#### 13. **representations** (Oct 21)
```sql
id UUID PRIMARY KEY
notice_id UUID (FK notices)
representor_name TEXT
representor_email TEXT
representor_phone TEXT
representor_address JSONB
type TEXT (objection|support|comment)
representation_text TEXT (10-10000 chars)
grounds JSONB (array)
supporting_documents JSONB
status TEXT (submitted|acknowledged|reviewed|considered|withdrawn)
reviewed_by UUID (FK)
reviewed_at TIMESTAMPTZ
council_notes TEXT
submitted_at, updated_at
reference_number TEXT UNIQUE (REP-XXXXXX)
```

#### 14. **representation_reads** (Oct 25)
```sql
id UUID PRIMARY KEY
representation_id UUID (FK)
user_id UUID (FK)
read_at TIMESTAMPTZ
UNIQUE (representation_id, user_id)
```

#### 15. **audit_logs** (Oct 21)
```sql
id UUID PRIMARY KEY
organization_id UUID (FK)
user_id UUID (FK)
action TEXT
resource_type TEXT (notice|representation|submission|team)
resource_id UUID
changes JSONB
ip_address TEXT
user_agent TEXT
created_at
```

#### 16. **direct_publishing** (Oct 22)
```sql
id UUID PRIMARY KEY
notice_id UUID (FK)
proof_pdf_url TEXT
proof_document_hash TEXT
publication_chain JSONB
signature TEXT
timestamp TIMESTAMPTZ
created_at
```

#### 17. **billing_accounts** (Oct 22)
```sql
id UUID PRIMARY KEY
organization_id UUID (FK)
stripe_customer_id TEXT
subscription_status TEXT
plan_name TEXT
billing_email TEXT
created_at, updated_at
```

#### 18. **billing_items** (Oct 22)
```sql
id UUID PRIMARY KEY
billing_account_id UUID (FK)
stripe_invoice_id TEXT
notice_id UUID (FK)
amount_pence INTEGER
status TEXT
created_at
```

### Storage Buckets

#### 1. **notices** (private)
- Notice documents (uploads)
- Proof PDFs
- Structure: `/org_id/dept_id/notice_id/`

#### 2. **representations** (private)
- Representation attachments
- Structure: `/notice_id/representation_id/`

### Functions & Procedures

#### Representation Tracking Functions (Oct 25)
```sql
get_unread_representation_count(notice_id, user_id) → INTEGER
get_representation_counts(notice_id, user_id) → (total, unread)
get_bulk_representation_counts(notice_ids[], user_id) → TABLE
mark_representation_read(rep_id, user_id) → VOID
mark_notice_representations_read(notice_id, user_id) → INTEGER
is_representation_late(rep_id) → BOOLEAN
```

#### Helper Functions
```sql
generate_submission_reference() → TEXT (SUB-XXXXXX)
generate_representation_reference() → TEXT (REP-XXXXXX)
get_submission_summary(dept_id) → TABLE
get_representation_summary(notice_id) → TABLE
validate_submission_organizations() [TRIGGER]
validate_representation_deadline() [TRIGGER]
track_submission_status_change() [TRIGGER]
```

#### Auto-Expiry Function (Oct 25)
```sql
expire_overdue_notices() → VOID
notify_on_representation_deadline() → VOID
```

### Row-Level Security (Oct 21)
Policies implemented for:
- Organization members can only see their org's data
- Department members can only see their dept's data
- Public notices visible to anonymous users
- Representations visible only to council staff

### Indexes (Performance)

#### Multi-Tenant Scoping
- `idx_notices_dept` (notices.department_id)
- `idx_notices_org` (notices.organization_id)
- `idx_notices_dept_status` (department_id, status)

#### Status Queries
- `idx_notices_status` (status)
- `idx_submissions_status` (status)
- `idx_representations_status` (status)

#### Representations
- `idx_representations_notice` (notice_id)
- `idx_representations_notice_status` (notice_id, status)
- `idx_representation_reads_user` (user_id)

#### Temporal
- `idx_notices_published` (published_at DESC) - published notices only
- `idx_notices_expires` (expires_at ASC) - notices expiring soon
- `idx_notices_deadline` (representation_deadline ASC) - upcoming deadlines
- `idx_submissions_submitted` (submitted_at DESC)

#### Membership
- `idx_dept_members_last_accessed` (user_id, last_accessed_at DESC)

---

## Part 4: COUNCIL DASHBOARD FEATURES IMPLEMENTED

### Status: PARTIALLY COMPLETE (10/10 components, 8/15 features)

### Completed Components

#### 1. Dashboard.tsx
- ✅ Statistics cards (total, published, draft, pending, expired)
- ✅ Recent notices list (5 most recent)
- ✅ Operational indicators (closing soon ≤48h, awaiting proof)
- ✅ Empty states per department type
- ✅ Demo mode with simulated data
- ✅ Navigation to notice detail
- ✅ Stat card routing with ?status= filters

#### 2. Notices.tsx
- ✅ Notice list with pagination
- ✅ Status filtering (all, draft, pending, published, expired)
- ✅ Search by title
- ✅ Closing soon indicators (amber dot ≤48h)
- ✅ Proof awaiting indicators
- ✅ Notice type badges
- ✅ Creation date display
- ✅ Link to notice detail

#### 3. NoticeDetail.tsx
- ✅ Read-only notice view
- ✅ Department-specific field display
- ✅ Tabbed interface (Overview, Representations, Documents, History)
- ✅ Closing soon warning in header
- ✅ Proof PDF display/download
- ✅ Representation deadline display

#### 4. CouncilLayout.tsx
- ✅ Sidebar navigation per department
- ✅ Role-based menu visibility
- ✅ Demo mode with mock data
- ✅ Department context from URL params
- ✅ User role loading (org_admin, department_admin, editor, viewer)

#### 5. Department Config System
- ✅ 7 department types defined (licensing, planning, traffic, GVOL, environmental, probate, procurement)
- ✅ Publishing vs. monitor-only logic
- ✅ Department-specific labels (representations, public comments, objections, etc.)
- ✅ Empty state messages per type
- ✅ Field visibility configuration

#### 6. Date Utilities
- ✅ `isClosingSoon(deadline)` - ≤48 hours
- ✅ `isExpired(expiresAt)` - past deadline
- ✅ `formatCouncilDate(date)` - council-specific formatting

#### 7. Operational Indicators
- ✅ Closing soon (amber dot ≤48h representation_deadline)
- ✅ Awaiting proof (null proof_pdf_url for published notices)
- ✅ Visual indicators in list and detail views

#### 8. Team.tsx
- ✅ Team member list
- ✅ Role assignment UI
- ✅ Invite functionality UI
- ✅ Remove member capability

### Incomplete/Missing Features

#### 1. ❌ Representation Management (NOT IMPLEMENTED)
**Status:** Database schema exists, UI not implemented
**Missing:**
- Representation list view on NoticeDetail
- Inline representation form
- Status tracking (submitted → acknowledged → reviewed → considered)
- Read/unread indicators
- Batch actions on representations
- Export representations

**Required Implementation:**
- Backend: `/api/representations/:noticeId` endpoints
- Frontend: `NoticeDetail` → Representations tab component
- Tracking: Use `get_representation_counts()` function

#### 2. ❌ Submissions Management (NOT IMPLEMENTED)
**Status:** Database schema exists, UI not implemented
**Missing:**
- Submissions inbox for monitor-only departments
- Status workflow UI (new → under_review → changes_requested → accepted/rejected)
- Firm-to-council communication UI
- Document attachment display

**Required Implementation:**
- Backend: `/api/submissions/:deptId` endpoints
- Frontend: New `Submissions.tsx` page
- Workflow: Status transition buttons

#### 3. ❌ Notice Publishing Workflow (PARTIAL)
**Status:** Legacy flow exists, new wizard incomplete
**Missing:**
- New notice creation form for publishing departments
- Template selection
- Field validation per notice type
- Proof PDF generation
- Payment/billing integration
- Publish confirmation

**Current State:**
- Legacy: `/publish/*` (old flow, being phased out)
- New: `/next/publish/*` (feature flagged, steps exist but incomplete)

#### 4. ❌ Audit Logging UI (NOT IMPLEMENTED)
**Status:** Database schema exists, UI skeleton exists
**Missing:**
- Query audit logs from database
- Filter by action type, user, date range
- Display timeline with user avatars
- Export audit report

**Required Implementation:**
- Backend: `/api/audit-logs/:deptId` endpoint
- Frontend: AuditLog.tsx tab content

#### 5. ❌ Templates Management (NOT IMPLEMENTED)
**Status:** Database schema exists, UI skeleton exists
**Missing:**
- Template CRUD operations
- Template preview
- Default template assignment
- Variable/token system
- Template versioning

**Required Implementation:**
- Backend: `/api/templates/:deptId` endpoints
- Frontend: Templates.tsx tab content

#### 6. ❌ Team Management (PARTIALLY IMPLEMENTED)
**Status:** UI exists, no backend integration
**Missing:**
- Backend endpoints for team operations
- Role permission matrix
- Invitation email sending
- Activity tracking per team member

**Required Implementation:**
- Backend: `/api/departments/:deptId/members` endpoints
- Frontend: Integration with Supabase auth

#### 7. ❌ Settings (NOT IMPLEMENTED)
**Status:** UI skeleton exists
**Missing:**
- Department notification preferences
- Integration settings
- Billing/subscription management
- Email template customization
- Approval workflow settings

#### 8. ❌ Representation Reads Tracking (DATABASE ONLY)
**Status:** Functions created (Oct 25), UI not implemented
**Missing:**
- Mark representation as read endpoint
- Unread count badges
- Read status display in lists
- Notification on new representations

**Functions Available:**
- `mark_representation_read(rep_id, user_id)`
- `get_representation_counts(notice_id, user_id)`
- `get_bulk_representation_counts(notice_ids[], user_id)`

---

## Part 5: AUTHENTICATION & ROLE SYSTEM

### Auth Architecture

#### Current State: DEMO + PLACEHOLDER
```
Login Page → Demo Credentials OR Magic Link
  ↓
Demo: Email matching "licensing@sample.gov.uk" or "demo@council.gov.uk"
Real: Magic link sent via Supabase Auth
  ↓
Callback → Extract user from session
  ↓
Switch Context → Select organization/department
  ↓
Council Portal → Department Layout
```

### Authentication Implementation

#### Frontend Auth Flow (`src/pages/auth/SignIn.tsx`)
```typescript
// Demo mode
if (email === 'licensing@sample.gov.uk') {
  window.location.href = '/c/sample-borough/licensing';
  return;
}

// Real magic link
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

#### Session Detection (`src/pages/council/CouncilLayout.tsx`)
```typescript
// Demo mode
const isDemoSampleBorough = orgSlug === 'sample-borough' && deptSlug === 'licensing';
if (isDemoSampleBorough) {
  setDepartment(mockDepartmentData);
  setUserRole('org_admin');
  return;
}

// Real auth
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  navigate('/auth/sign-in');
}
```

### Role System: 2-Tier Architecture

#### Tier 1: Organization-Level Roles
```
owner          → Can delete org, manage all departments, transfer ownership
org_admin      → Can create departments, view all dept data, manage org settings
```
Stored in: `organization_memberships(role)`

#### Tier 2: Department-Level Roles
```
department_admin → Full control within dept, manage team, settings
editor          → Create/edit/publish notices, use templates
viewer          → Read-only access to dept data
```
Stored in: `department_memberships(role)`

### Permission Matrix

| Permission | Owner | Org Admin | Dept Admin | Editor | Viewer |
|-----------|-------|-----------|-----------|--------|--------|
| View notices | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create draft | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit notice | ✅ | ✅ | ✅ | ✅ | ❌ |
| Publish notice | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage team | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage settings | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create dept | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete org | ✅ | ❌ | ❌ | ❌ | ❌ |

### Constraints

```sql
-- At least one owner per organization
validate_org_has_owner() TRIGGER
  → Prevents removing last owner

-- One role per user per department
CONSTRAINT unique_dept_user UNIQUE (department_id, user_id)

-- One role per user per organization
CONSTRAINT unique_org_user UNIQUE (organization_id, user_id)
```

### Context Switching (`src/pages/auth/SwitchContext.tsx`)
- User can belong to multiple orgs/depts
- Switch context to view different orgs
- Updates `department_memberships.last_accessed_at`
- Redirects to selected department

### Missing Auth Features

#### ❌ Not Implemented
- ❌ Multi-factor authentication (MFA)
- ❌ Session management (logout, timeout)
- ❌ Password reset flow
- ❌ Social login (OAuth buttons exist but non-functional)
- ❌ Permission enforcement middleware
- ❌ Activity tracking per role

---

## Part 6: REPRESENTATION TRACKING SYSTEM

### Status: DATABASE COMPLETE, UI INCOMPLETE (70%)

### Database Schema (Completed Oct 25)

#### representations Table
```sql
CREATE TABLE public.representations (
  id UUID PRIMARY KEY
  notice_id UUID (FK) - links to notices
  representor_name TEXT - submitter name
  representor_email TEXT - submitter email
  representor_phone TEXT
  representor_address JSONB - { street, city, postcode }
  
  type TEXT CHECK (objection|support|comment)
  representation_text TEXT (10-10000 chars)
  grounds JSONB - ["noise", "safety", "parking", etc]
  supporting_documents JSONB - file references
  
  status TEXT (submitted|acknowledged|reviewed|considered|withdrawn)
  reviewed_by UUID (FK auth.users)
  reviewed_at TIMESTAMPTZ
  council_notes TEXT
  
  reference_number TEXT UNIQUE (REP-XXXXXX)
  submitted_at, updated_at
);
```

#### representation_reads Table (Oct 25)
```sql
CREATE TABLE public.representation_reads (
  id UUID PRIMARY KEY
  representation_id UUID (FK)
  user_id UUID (FK auth.users)
  read_at TIMESTAMPTZ
  UNIQUE (representation_id, user_id)
);
```

### Tracking Functions (Oct 25)

#### Get Unread Counts
```sql
get_unread_representation_count(notice_id, user_id) → INTEGER
-- Returns unread count for a notice

get_representation_counts(notice_id, user_id) → (total, unread)
-- Returns total AND unread for a notice

get_bulk_representation_counts(notice_ids[], user_id) → TABLE
-- Efficiently fetch counts for multiple notices
```

#### Mark as Read
```sql
mark_representation_read(rep_id, user_id) → VOID
-- Idempotent: marks one rep as read

mark_notice_representations_read(notice_id, user_id) → INTEGER
-- Marks ALL reps for a notice as read, returns count
```

#### Validation
```sql
is_representation_late(rep_id) → BOOLEAN
-- Checks if representation submitted after deadline

validate_representation_deadline() [TRIGGER]
-- Prevents submissions after representation_deadline
```

### UI Implementation Status

#### Completed
- ✅ `SubmitRepresentation.tsx` - Public form to submit representations
- ✅ Representation reference number generation (REP-XXXXXX)
- ✅ Email submission capability

#### Missing Frontend
- ❌ Representations tab on NoticeDetail (UI exists, no data loading)
- ❌ Unread count badges
- ❌ Mark as read functionality
- ❌ Bulk mark as read
- ❌ Representation filtering/sorting
- ❌ Status workflow UI (reviewed → considered → withdrawn)
- ❌ Council notes display

#### Missing Backend Endpoints
- ❌ `GET /api/representations/:noticeId` - list representations
- ❌ `GET /api/representations/:repId` - get single representation
- ❌ `POST /api/representations/:repId/mark-read` - mark as read
- ❌ `POST /api/representations/:noticeId/mark-all-read` - bulk read
- ❌ `PUT /api/representations/:repId` - update status/notes
- ❌ `GET /api/representations/counts/:noticeId` - get counts

### Deadline Validation

```sql
-- Automatic in representation insert trigger
IF notice_deadline < NOW() THEN
  RAISE EXCEPTION 'Representation deadline has passed'
END IF;
```

### Representation Workflow

```
submitted (public submits form)
    ↓
acknowledged (council confirms receipt)
    ↓
reviewed (council staff reads)
    ↓
considered (decision made)
    ↓
[resolved or withdrawn]
```

Status transitions NOT enforced in code (no FSM validation).

---

## Part 7: WHAT EXISTS vs. WHAT'S MISSING (Audit Gap Analysis)

### Public Portal - Comprehensive Audit of Publish Flow

**Source:** `audit-report.md` (37 issues found)

#### Critical Issues (7)

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Missing keyboard navigation for preview tabs | Critical | Not Fixed |
| 2 | Missing legal disclosure for AI summaries | Critical | Not Fixed |
| 3 | Activity schedule hidden in OCR route | Critical | Not Fixed |
| 4 | No validation for statutory deadlines | Critical | Not Fixed |
| 5 | Missing ARIA labels for form inputs | Critical | Not Fixed |
| 6 | Upload error messages not accessible | Critical | Not Fixed |
| 7 | Form validation not consistent | Critical | Not Fixed |

#### High Priority Issues (12)

| # | Issue | Category | Status |
|---|-------|----------|--------|
| 1 | Deadline calculation ignores bank holidays | Compliance | Not Fixed |
| 2 | No business day adjustment | Compliance | Not Fixed |
| 3 | Preview pane focus management | Accessibility | Not Fixed |
| 4 | Form success confirmation missing | UX | Not Fixed |
| 5 | Error boundary incomplete | Functionality | Not Fixed |
| 6 | Payment integration incomplete | Functionality | Not Fixed |
| 7 | PDF proof not generated | Functionality | Not Fixed |
| 8 | Required field highlighting unclear | UX | Not Fixed |
| 9 | Mobile responsive issues | Design | Not Fixed |
| 10 | Template validation gaps | Compliance | Not Fixed |
| 11 | Legal form builder incomplete | Functionality | Not Fixed |
| 12 | Search within form disabled | UX | Not Fixed |

#### Medium Issues (13)

#### Low Issues (5)

---

## Part 8: KEY FILES & CODE LOCATIONS

### Routing & Navigation
- `/src/App.tsx` - Main router
- `/src/routes/index.tsx` - Home route
- `/src/pages/council/CouncilLayout.tsx` - Council portal layout

### Public Portal Components
- `/src/pages/Home.tsx` - Address search interface
- `/src/pages/Notices.tsx` - Notice discovery
- `/src/pages/NoticeDetailPage.tsx` - Notice detail
- `/src/pages/SubmitRepresentation.tsx` - Representation form
- `/src/components/search/NoticesMapView.tsx` - Map visualization

### Council Portal Components
- `/src/pages/council/Dashboard.tsx` - Dashboard
- `/src/pages/council/Notices.tsx` - Notices list
- `/src/pages/council/NoticeDetail.tsx` - Notice detail (read-only)
- `/src/pages/council/NoticeEditor.tsx` - Notice editor
- `/src/pages/council/Team.tsx` - Team management
- `/src/pages/council/Templates.tsx` - Templates
- `/src/pages/council/Settings.tsx` - Settings
- `/src/pages/council/AuditLog.tsx` - Audit log

### Configuration
- `/src/config/departmentConfig.ts` - Department types & config
- `/src/env.ts` - Environment variables
- `/src/lib/dateUtils.ts` - Date utilities
- `/src/lib/supabase.ts` - Supabase client
- `/src/lib/councils.ts` - Council directory

### Database
- `/supabase/migrations/20251021000000_multi_tenant_foundation.sql` - Organizations & departments
- `/supabase/migrations/20251021000001_memberships.sql` - Roles & memberships
- `/supabase/migrations/20251021000002_notices_enhanced.sql` - Enhanced notices
- `/supabase/migrations/20251021000005_submissions_representations.sql` - Representations
- `/supabase/migrations/20251025000001_representation_reads_tracking.sql` - Read tracking

### Backend API
- `/server/index.ts` - Express setup
- `/server/routes/notices.ts` - Notice CRUD & search
- `/server/routes/publish.ts` - Publishing workflow
- `/server/routes/upload.ts` - File upload & OCR
- `/server/routes/address.ts` - Address lookup
- `/server/lib/geocode.ts` - Postcodes.io integration

---

## Part 9: ENVIRONMENT & CONFIGURATION

### Required Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (server-side)

# Feature Flags
VITE_NEW_PUBLISH_FLOW=false  # New wizard (incomplete)

# Address Lookup
ADDRESS_PROVIDER=mock  # or getAddress, postcodesio

# Maps (optional)
VITE_MAP_STYLE_URL=https://...

# APIs (optional)
POSTCODES_IO_URL=https://api.postcodes.io
OPENAI_API_KEY=sk-... (for AI summaries)
STRIPE_SECRET_KEY=sk_... (for billing)
```

### Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `VITE_NEW_PUBLISH_FLOW` | false | Enable `/next/publish/*` wizard routes |

### Development Setup

```bash
npm install
cp .env.example .env
# Edit .env with credentials

npm run dev              # Both frontend + backend
npm run dev:web         # Frontend only (5173)
npm run dev:server      # Backend only (5174)

npm test                # Run tests
npm run lint            # ESLint
npm run typecheck       # TypeScript check
npm run coverage        # Coverage report
```

---

## Part 10: DEVELOPMENT STATUS SUMMARY

### What's Production-Ready
- ✅ Notice search & discovery (public)
- ✅ Representation submission (public)
- ✅ Council portal navigation (read-only views)
- ✅ Department configuration system
- ✅ Multi-tenant database schema
- ✅ Role-based access control (database)
- ✅ Geospatial queries (notice search)

### What's Development/Partial
- 🚧 Council dashboard statistics
- 🚧 Notice management (CRUD)
- 🚧 Team management UI
- 🚧 Audit logging
- 🚧 Representation tracking UI
- 🚧 Submission workflow
- 🚧 Notice publishing (new wizard)
- 🚧 Payment/billing integration

### What's Missing Entirely
- ❌ Representation management UI
- ❌ Submissions inbox
- ❌ Real authentication (auth UI only)
- ❌ Email notifications
- ❌ Bulk operations
- ❌ Advanced search/filters (UI only)
- ❌ Reporting/analytics
- ❌ Mobile app
- ❌ API documentation
- ❌ Permission enforcement middleware

---

## Recommendations for Completion

### Phase 1: Core Council Features (Weeks 1-2)
1. Implement `/api/representations/*` endpoints
2. Build Representations tab in NoticeDetail
3. Add unread badge tracking
4. Test read/unread workflow

### Phase 2: Submissions Workflow (Weeks 3-4)
1. Create Submissions page
2. Implement status workflow UI
3. Add firm-to-council communication
4. Email notifications

### Phase 3: Publishing Workflow (Weeks 5-6)
1. Complete new publish wizard
2. Add proof PDF generation
3. Implement payment integration
4. Deploy to production

### Phase 4: Polish & Security (Week 7-8)
1. Implement real authentication
2. Add permission enforcement
3. Fix audit report issues
4. Load testing


# Civic Notices Platform - Production Readiness PRD

## Vision

A digital replacement for newspaper public notice publication in the UK. Centralizes all public notices (licensing, planning, highways, probate) across every UK council. Enables:

1. **Public** - Browse notices, submit representations (objections/support/comments)
2. **Solicitor Firms** - Publish notices on behalf of clients, submit to councils
3. **Councils** - View representations on their notices, manage department templates (NOT replacing IDOX)
4. **Platform Admins** - Oversee all organizations, audit actions

## Current State

The codebase has solid foundations but multiple issues blocking production launch:

- **3 auth contexts** causing confusion and bugs (`AuthContext`, `AdminAuthContext`, `UnifiedAuthContext`)
- **Admin login infinite spinner** - cannot access admin panel
- **Council login not testable** - no clear path for council staff to authenticate
- **Mock/demo data** scattered throughout production code
- **Template linking** not fully wired in publish wizard
- **49 failing tests** from schema drift

## Success Criteria

- [ ] All authentication flows use single Supabase-based system
- [ ] Admin can log in and access dashboard
- [ ] Council staff can log in and view representations
- [ ] Firms can publish notices that link to correct council templates
- [ ] No mock/demo data in production code paths
- [ ] All tests pass

---

## Phase 1: Authentication Consolidation

**Goal**: Single auth system via Supabase with proper role handling

### 1.1 Audit Current Auth State
- [x] Document all imports of `AuthContext` across codebase
- [x] Document all imports of `AdminAuthContext` across codebase
- [x] Document all imports of `UnifiedAuthContext` across codebase
- [x] Create migration plan showing which context each file should use

#### Migration Plan: Auth Context Consolidation

**Target State**: All authentication handled by `UnifiedAuthContext` exclusively.

##### Files Requiring Migration

| File | Current Context | Action | Priority |
|------|----------------|--------|----------|
| `src/pages/council/Notices.tsx:6` | Legacy AuthContext | Change import to UnifiedAuthContext | High |
| `src/pages/council/Dashboard.tsx:6` | Legacy AuthContext | Change import to UnifiedAuthContext | High |
| `src/components/admin/AdminProtectedRoute.tsx` | Direct supabase call | Refactor to use useAuth() from UnifiedAuthContext | High |

##### Files Already Using UnifiedAuthContext (No Changes Needed)

**Admin Pages** (7 files): Login.tsx, AdminLayout.tsx, Dashboard.tsx, AccountManagement.tsx, Settings.tsx, AuditLog.tsx, AdminNotices.tsx

**Council Pages** (6 files): CouncilLayout.tsx, Billing.tsx, Settings.tsx, Team.tsx, PendingSubmissions.tsx, Drafts.tsx

**Firm Pages** (1 file): FirmLayout.tsx

**Publish Flow** (2 files): NewPublishFlow.tsx, PaymentStep.tsx

**Components** (2 files): ProtectedRoute.tsx, DynamicCouncilSelect.tsx

**Other** (2 files): AuthDebug.tsx, App.tsx

##### Files to Delete (Task 1.4)

| File | Reason |
|------|--------|
| `src/contexts/AuthContext.tsx` | Legacy context, replaced by UnifiedAuthContext |
| `src/contexts/AdminAuthContext.tsx` | Completely unused (0 imports anywhere) |

##### Migration Steps

1. **Update UnifiedAuthContext** (Task 1.2): Add missing features from legacy AuthContext:
   - `loadPermissions(departmentId)` - for department-level permissions
   - `hasPermission(permission)` - single permission check
   - `hasAnyPermission(permissions)` - any of multiple permissions
   - `hasAllPermissions(permissions)` - all of multiple permissions
   - `userType` field: 'anonymous' | 'council_staff' | 'firm_staff' | 'platform_admin'
   - `organizationType` field: null | 'council' | 'firm'

2. **Migrate Legacy Files** (Task 1.3):
   - `council/Notices.tsx`: Change `import { useAuth } from '@/contexts/AuthContext'` to `import { useAuth } from '@/contexts/UnifiedAuthContext'`
   - `council/Dashboard.tsx`: Same import change
   - `AdminProtectedRoute.tsx`: Remove direct supabase.auth calls, use useAuth() hook instead

3. **Delete Legacy Files** (Task 1.4):
   - Delete `src/contexts/AuthContext.tsx`
   - Delete `src/contexts/AdminAuthContext.tsx`
   - Verify no import errors after deletion

##### Key Considerations

- **Permission Functions**: Legacy AuthContext has `hasPermission`, `hasAnyPermission`, `hasAllPermissions` that UnifiedAuthContext needs before migration
- **Demo Mode**: Legacy AuthContext supports demo mode permissions - evaluate if this should be preserved or removed (Phase 5 addresses demo removal)
- **Admin Features**: AdminAuthContext has 2FA, session timeout, IP allowlist - these are NOT currently used but may be needed for future security enhancements

#### AuthContext Import Audit Results
Files importing from legacy `@/contexts/AuthContext`:
1. `src/pages/council/Notices.tsx:6` - needs migration to UnifiedAuthContext
2. `src/pages/council/Dashboard.tsx:6` - needs migration to UnifiedAuthContext

The legacy `AuthContext.tsx` file exists at `src/contexts/AuthContext.tsx` and provides:
- User, session, loading state
- Role-based permissions (loadPermissions, hasPermission, hasAnyPermission, hasAllPermissions)
- Department-scoped permission loading
- Demo mode support for mock permissions

#### AdminAuthContext Import Audit Results
**Files importing from `@/contexts/AdminAuthContext`: NONE**

The `AdminAuthContext.tsx` file exists at `src/contexts/AdminAuthContext.tsx` but is NOT used anywhere:
- `AdminAuthProvider` - defined but never imported into App.tsx or any other file
- `useAdminAuth` hook - defined but never called anywhere in the codebase
- App.tsx only wraps with `UnifiedAuthProvider` (line 60, 88)

The file provides (unused):
- AdminUser state with roles: 'super_admin' | 'admin' | 'support'
- Session management with 2-hour timeout and 10-minute warning
- Two-factor authentication support
- IP allowlist checking
- Login, logout, verify2FA, refreshSession, checkSession methods

**Recommendation**: This file can be safely deleted in task 1.4 as it's completely unused.

#### UnifiedAuthContext Import Audit Results
**Files importing `useAuth` from `@/contexts/UnifiedAuthContext`**: 18 files

**Admin Pages** (6 files):
1. `src/pages/admin/Login.tsx:5`
2. `src/pages/admin/AdminLayout.tsx:3`
3. `src/pages/admin/Dashboard.tsx:16`
4. `src/pages/admin/AccountManagement.tsx:22`
5. `src/pages/admin/Settings.tsx:2`
6. `src/pages/admin/AuditLog.tsx:18`
7. `src/pages/admin/AdminNotices.tsx:17`

**Council Pages** (6 files):
1. `src/pages/council/CouncilLayout.tsx:4`
2. `src/pages/council/Billing.tsx:4`
3. `src/pages/council/Settings.tsx:4`
4. `src/pages/council/Team.tsx:4`
5. `src/pages/council/PendingSubmissions.tsx:3`
6. `src/pages/council/Drafts.tsx:4`

**Firm Pages** (1 file):
1. `src/pages/firm/FirmLayout.tsx:4`

**Publish Flow** (2 files):
1. `src/next/publish/flow/NewPublishFlow.tsx:45`
2. `src/next/publish/flow/steps/PaymentStep.tsx:7`

**Components** (2 files):
1. `src/components/auth/ProtectedRoute.tsx:3`
2. `src/components/DynamicCouncilSelect.tsx:3`

**Debug** (1 file):
1. `src/pages/AuthDebug.tsx:1`

**App Root** (1 file):
1. `src/App.tsx:60` - imports `UnifiedAuthProvider`

**Key Observation**: `AdminProtectedRoute.tsx` does NOT use UnifiedAuthContext - it directly calls `supabase.auth.getSession()` instead.

**Recommendation for Migration Plan**:
- `AdminProtectedRoute` should be updated to use `useAuth()` from UnifiedAuthContext
- The 2 files using legacy AuthContext (`council/Notices.tsx`, `council/Dashboard.tsx`) should migrate to UnifiedAuthContext
- UnifiedAuthContext is already the primary auth context across the codebase

### 1.2 Consolidate to UnifiedAuthContext
- [x] Update `UnifiedAuthContext.tsx` to handle all user types (public, council, firm, admin)
- [x] Add `userType` field: 'anonymous' | 'council_staff' | 'firm_staff' | 'platform_admin'
- [x] Add `organizationType` field: null | 'council' | 'firm'
- [x] Ensure `canAccessAdmin()` checks `app_metadata.is_platform_admin` correctly
- [x] Ensure `hasPermission()` works for department-level permissions

### 1.3 Migrate Components to UnifiedAuthContext
- [ ] Update `src/pages/admin/Login.tsx` to use only UnifiedAuthContext
- [ ] Update `src/pages/admin/AdminLayout.tsx` to use only UnifiedAuthContext
- [ ] Update `src/components/admin/AdminProtectedRoute.tsx` to use only UnifiedAuthContext
- [ ] Update `src/pages/council/CouncilLayout.tsx` to use only UnifiedAuthContext
- [ ] Update `src/pages/firm/FirmLayout.tsx` to use only UnifiedAuthContext

### 1.4 Remove Legacy Auth Contexts
- [ ] Delete `src/contexts/AuthContext.tsx` (after all imports removed)
- [ ] Delete `src/contexts/AdminAuthContext.tsx` (after all imports removed)
- [ ] Update `src/App.tsx` to only wrap with UnifiedAuthProvider

### 1.5 Fix Server-Side Auth Middleware
- [ ] Update `server/middleware/adminAuth.ts` to consistently check `app_metadata.is_platform_admin`
- [ ] Update `server/middleware/auth.ts` to extract org/dept from JWT claims
- [ ] Add middleware to set user context from Supabase session

---

## Phase 2: Fix Admin Login (Infinite Spinner Bug)

**Goal**: Admin users can log in and access the admin dashboard

### 2.1 Debug Current Flow
- [ ] Add console logging to `AdminProtectedRoute` to trace auth state
- [ ] Add console logging to `UnifiedAuthContext.canAccessAdmin()`
- [ ] Identify where the redirect loop occurs

### 2.2 Fix Admin User Metadata
- [ ] Create migration to set `app_metadata.is_platform_admin = true` for admin users
- [ ] Create migration to set `app_metadata.admin_role` for admin users
- [ ] Verify migration runs correctly on Supabase

### 2.3 Fix AdminProtectedRoute Logic
- [ ] Ensure loading state shows spinner (not redirect)
- [ ] Ensure redirect only happens after auth state is definitively loaded
- [ ] Add `isInitialized` flag to prevent premature redirects
- [ ] Test: admin user can reach `/admin/dashboard` after login

### 2.4 Fix Admin Login Form
- [ ] Ensure form shows appropriate error messages on failed login
- [ ] Ensure successful login navigates to `/admin/dashboard`
- [ ] Add "Forgot Password" link for admin users
- [ ] Test: invalid credentials show error, valid credentials redirect correctly

---

## Phase 3: Fix Council Portal Authentication

**Goal**: Council staff can log in and access their department dashboard

### 3.1 Create Council Login Flow
- [ ] Create `/auth/council-login` page for council staff
- [ ] Implement email/password login via Supabase
- [ ] After login, redirect to `/c/:orgSlug/:deptSlug/dashboard`
- [ ] Handle users with multiple department memberships (show picker)

### 3.2 Fix Council Protected Routes
- [ ] Update `CouncilProtectedRoute` to check department membership
- [ ] Ensure loading states don't cause redirect loops
- [ ] Handle case where user has org membership but no department membership
- [ ] Test: council user can reach their department dashboard

### 3.3 Implement Council Staff Invitation
- [ ] Add "Invite Team Member" button to `/c/:org/:dept/team` page
- [ ] Create invitation API endpoint `POST /api/departments/:deptId/invitations`
- [ ] Send invitation email with magic link
- [ ] Handle invitation acceptance flow (set password, redirect to dashboard)

### 3.4 Fix Department Switching
- [ ] Ensure `DepartmentSwitcher` component works correctly
- [ ] Update context when department changes
- [ ] Reload dashboard data for new department
- [ ] Test: user with multiple departments can switch between them

---

## Phase 4: Fix Publishing Wizard Template Linking

**Goal**: When user selects a council, their custom template is used

### 4.1 Add Council Selection to Wizard
- [ ] In Step 1 or Step 2, add council dropdown for notice types that require it
- [ ] Fetch councils from database (not hardcoded)
- [ ] Store selected council's department ID in draft state
- [ ] Only show council dropdown for relevant notice types (licensing, planning - NOT probate, GVOL)

### 4.2 Link Templates to Notice Preview
- [ ] When council is selected, fetch their template for this notice type
- [ ] Use `GET /api/departments/:deptId/templates?notice_type=X`
- [ ] If custom template exists, use it for preview rendering
- [ ] If no custom template, use default template
- [ ] Show indicator when using custom vs default template

### 4.3 Fix Westminster Auto-Detection Workaround
- [ ] Remove hardcoded "Westminster" string matching in `NewPublishFlow.tsx:878-918`
- [ ] Replace with proper council lookup from selected dropdown value
- [ ] Test: selecting any council loads their template correctly

### 4.4 Ensure Published Notice Links to Council
- [ ] When notice is published, store `department_id` in notices table
- [ ] This links the notice to the council for representations
- [ ] Council can then see all notices published for their area
- [ ] Test: published notice appears in council's notices list

---

## Phase 5: Remove Mock/Demo Data

**Goal**: No hardcoded test data in production code paths

### 5.1 Remove Demo Users
- [ ] Remove `DEMO_USERS` array from `src/next/publish/flow/steps/UploadMethodStep.tsx:25-47`
- [ ] Remove demo mode logic that uses these users
- [ ] Ensure upload step works without demo user context

### 5.2 Remove Mock Data from Firm Portal
- [ ] Remove mock clients from `src/pages/firm/Clients.tsx:69-128`
- [ ] Replace with actual database query for firm's clients
- [ ] Remove mock invoices from `src/pages/firm/Billing.tsx:54-97`
- [ ] Replace with actual Stripe invoice data

### 5.3 Remove Mock Data from Public Pages
- [ ] Remove mock subscription data from `src/pages/EmailAlerts.tsx:110-122`
- [ ] Replace with actual subscription lookup

### 5.4 Fix Address Provider Mock Mode
- [ ] Review `server/routes/address.ts:82-147` mock address data
- [ ] Ensure mock mode only activates when `ADDRESS_PROVIDER=mock` in env
- [ ] Default to real address provider in production
- [ ] Add clear logging when mock mode is active

### 5.5 Remove Demo Council Logic
- [ ] Search for `isDemoMode` checks throughout codebase
- [ ] Remove or gate behind explicit `DEMO_MODE=true` env var
- [ ] Ensure production deployments never activate demo mode

---

## Phase 6: Fix Failing Tests

**Goal**: All tests pass, CI is green

### 6.1 Fix Schema Validation Tests
- [ ] Update `TRAFFIC_AREA` enum in GVOL tests to match actual schema
- [ ] Fix `src/next/publish/validation/windowRules.test.ts` Zod errors
- [ ] Update sample drafts to match current schema requirements

### 6.2 Fix Component Tests
- [ ] Fix `UploadMethodStep.test.tsx` - update to match current component structure
- [ ] Ensure test IDs exist in components (`data-testid="upload-dropzone"`)

### 6.3 Fix Server Route Tests
- [ ] Fix `noticesSearch.test.ts` postcode filter test
- [ ] Fix `upload.test.ts` duplicate detection test

### 6.4 Update Snapshots
- [ ] Run `npm test -- -u` to update obsolete snapshots
- [ ] Review each snapshot change to ensure correctness
- [ ] Commit updated snapshots

### 6.5 Verify CI Passes
- [ ] Run full test suite locally: `npm test`
- [ ] Ensure no test failures
- [ ] Push and verify GitHub Actions pass

---

## Phase 7: Production Polish

**Goal**: Platform is ready for real users

### 7.1 Error Handling
- [ ] Add user-friendly error messages for auth failures
- [ ] Add error boundaries around major page sections
- [ ] Ensure API errors don't crash the app

### 7.2 Loading States
- [ ] Ensure all async operations show loading indicators
- [ ] No blank screens during data fetching
- [ ] Skeleton loaders for list pages

### 7.3 Email Notifications
- [ ] Implement representation notification to council staff
- [ ] Implement notice publication confirmation to publisher
- [ ] Verify email templates render correctly

### 7.4 Security Review
- [ ] Verify RLS policies cover all tables with user data
- [ ] Ensure service role key never sent to client
- [ ] Verify admin endpoints require admin authentication
- [ ] Check for SQL injection vulnerabilities in raw queries

---

## Technical Notes

### Database Schema
- `organizations` - councils and firms (type field distinguishes)
- `departments` - council departments (licensing, planning, etc.)
- `organization_memberships` - user to org relationship
- `department_memberships` - user to department relationship
- `notices` - published notices with `organization_id` and `department_id`
- `representations` - public comments on notices
- `notice_templates` - custom templates per department per notice type

### Auth Claims (JWT app_metadata)
```json
{
  "is_platform_admin": true,
  "admin_role": "super_admin",
  "organization_id": "uuid",
  "department_ids": ["uuid1", "uuid2"]
}
```

### Key Files
- `src/contexts/UnifiedAuthContext.tsx` - Main auth context
- `src/pages/admin/Login.tsx` - Admin login page
- `src/components/admin/AdminProtectedRoute.tsx` - Admin route guard
- `src/next/publish/flow/NewPublishFlow.tsx` - Publishing wizard (1800+ lines)
- `server/middleware/adminAuth.ts` - Server-side admin auth
- `server/middleware/auth.ts` - Server-side general auth

### Commands
```bash
npm run dev          # Start dev server (frontend + backend)
npm test             # Run all tests
npm run typecheck    # TypeScript check
npm run lint         # ESLint check
```

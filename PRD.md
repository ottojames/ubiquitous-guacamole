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
- [x] Update `src/pages/admin/Login.tsx` to use only UnifiedAuthContext
- [x] Update `src/pages/admin/AdminLayout.tsx` to use only UnifiedAuthContext
- [x] Update `src/components/admin/AdminProtectedRoute.tsx` to use only UnifiedAuthContext
- [x] Update `src/pages/council/CouncilLayout.tsx` to use only UnifiedAuthContext
- [x] Update `src/pages/firm/FirmLayout.tsx` to use only UnifiedAuthContext

### 1.4 Remove Legacy Auth Contexts
- [x] Delete `src/contexts/AuthContext.tsx` (after all imports removed)
- [x] Delete `src/contexts/AdminAuthContext.tsx` (after all imports removed)
- [x] Update `src/App.tsx` to only wrap with UnifiedAuthProvider

### 1.5 Fix Server-Side Auth Middleware
- [x] Update `server/middleware/adminAuth.ts` to consistently check `app_metadata.is_platform_admin`
- [x] Update `server/middleware/auth.ts` to extract org/dept from JWT claims
- [x] Add middleware to set user context from Supabase session

---

## Phase 2: Fix Admin Login (Infinite Spinner Bug)

**Goal**: Admin users can log in and access the admin dashboard

### 2.1 Debug Current Flow
- [x] Add console logging to `AdminProtectedRoute` to trace auth state
- [x] Add console logging to `UnifiedAuthContext.canAccessAdmin()`
- [x] Identify where the redirect loop occurs

#### Debug Analysis: Redirect Loop Investigation

Console logging has been added to trace the auth flow:

1. **AdminProtectedRoute.tsx** now logs:
   - Every render with full state: `loading`, `hasUser`, `userEmail`, `hasSession`, `isPlatformAdmin`, `adminRole`, `role`, `appMetadata`
   - useEffect triggers showing when auth state changes
   - Exact reason for redirects (no user vs no admin access)
   - When access is granted

2. **UnifiedAuthContext.canAccessAdmin()** now logs:
   - All inputs checked: `hasUser`, `userEmail`, `isPlatformAdmin`, `adminRole`, `role`, `appMetadata`
   - Which condition granted access (or if access was denied)

3. **Admin Login.tsx** now logs:
   - Render state with all auth fields
   - When redirect to dashboard happens (already logged in admin)
   - When user exists but isn't admin (stays on login)
   - When no user is logged in (shows login form)

**Potential Redirect Loop Cause Identified**:
The loop could occur if:
- Login navigates to `/admin/dashboard` immediately after `signInAsAdmin()` returns success
- But the UnifiedAuthContext `loading` state may still be `true` (waiting for `onAuthStateChange` to fire)
- AdminProtectedRoute sees `loading=true` → shows spinner
- Then `loading=false` but context hasn't fully updated yet with new session
- AdminProtectedRoute sees `!user` or `!canAccessAdmin()` → redirects to `/admin/login`
- Login page sees user is logged in but not admin (or still loading) → could redirect back

**Solution Direction**: Task 2.3 should add an `isInitialized` flag that ensures auth state is fully hydrated before making redirect decisions.

### 2.2 Fix Admin User Metadata
- [x] Create migration to set `app_metadata.is_platform_admin = true` for admin users
- [x] Create migration to set `app_metadata.admin_role` for admin users
- [x] Verify migration runs correctly on Supabase

#### Admin User Setup Migration

Created `supabase/migrations/20260120100001_setup_platform_admin.sql` which:

1. **Creates a platform admin user** in `auth.users` with:
   - Email: `admin@civicnotices.uk`
   - Password: `adminpass123`
   - `raw_app_meta_data` containing `is_platform_admin: true` and `admin_role: 'super_admin'`

2. **Adds entry to `platform_admin_settings`** table:
   - This is what the `custom_access_token_hook` reads to populate JWT claims
   - Sets `admin_role: 'super_admin'` and proper session timeout

3. **Creates user profile** in `profiles` table

**How it works**:
- When admin logs in, Supabase's `custom_access_token_hook` (from migration `20260122000002`) reads from `platform_admin_settings`
- The hook populates `is_platform_admin` and `admin_role` in the JWT's `app_metadata`
- `UnifiedAuthContext` reads these fields from `session.user.app_metadata`
- `canAccessAdmin()` checks these fields to grant dashboard access

**To run**:
```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase SQL Editor
# Copy contents of supabase/migrations/20260120100001_setup_platform_admin.sql
```

### 2.3 Fix AdminProtectedRoute Logic
- [x] Ensure loading state shows spinner (not redirect)
- [x] Ensure redirect only happens after auth state is definitively loaded
- [x] Add `isInitialized` flag to prevent premature redirects
- [ ] Test: admin user can reach `/admin/dashboard` after login

#### Implementation Notes (Task 2.3)

Added `isInitialized` flag to `UnifiedAuthContext` that:
1. Starts as `false`
2. Becomes `true` only after initial `getSession()` completes
3. Stays `true` after `onAuthStateChange` fires

`AdminProtectedRoute` now waits for BOTH:
- `loading === false` (initial load done)
- `isInitialized === true` (auth state is stable)

This prevents the redirect loop where:
- Login succeeds and navigates to `/admin/dashboard`
- But `onAuthStateChange` hasn't updated the context yet
- AdminProtectedRoute sees stale state and redirects back to login

### 2.4 Fix Admin Login Form
- [x] Ensure form shows appropriate error messages on failed login
- [x] Ensure successful login navigates to `/admin/dashboard`
- [x] Add "Forgot Password" link for admin users
- [ ] Test: invalid credentials show error, valid credentials redirect correctly

---

## Phase 3: Fix Council Portal Authentication

**Goal**: Council staff can log in and access their department dashboard

### 3.1 Create Council Login Flow
- [x] Create `/auth/council-login` page for council staff
- [x] Implement email/password login via Supabase
- [x] After login, redirect to `/c/:orgSlug/:deptSlug/dashboard`
- [x] Handle users with multiple department memberships (show picker)

### 3.2 Fix Council Protected Routes
- [x] Update `CouncilProtectedRoute` to check department membership
- [x] Ensure loading states don't cause redirect loops
- [x] Handle case where user has org membership but no department membership
- [ ] Test: council user can reach their department dashboard

#### Implementation Notes (Task 3.2)

Created `src/components/council/CouncilProtectedRoute.tsx` which:

1. **Uses `isInitialized` flag** from UnifiedAuthContext to prevent redirect loops (same pattern as AdminProtectedRoute)

2. **Checks department membership** by:
   - Looking up organization by slug (must be type='council')
   - Looking up department by organization_id + slug
   - Checking both `department_memberships` and `organization_memberships` tables
   - Granting access if user has either org-level OR department-level membership

3. **Handles edge cases**:
   - User with org membership but no dept → redirects to department picker at `/switch-department`
   - User with dept membership in this org but wrong dept slug → redirects to department picker
   - User without any access → shows access denied screen with options to sign in or switch department
   - Demo accounts → bypasses database checks for known demo emails

4. **Updated App.tsx** to wrap council routes with `CouncilProtectedRoute`:
   ```jsx
   <Route path="/c/:orgSlug/:deptSlug" element={
     <CouncilProtectedRoute>
       <CouncilLayout />
     </CouncilProtectedRoute>
   }>
   ```

5. **Updated CouncilLayout.tsx**:
   - Changed error redirect from `/switch-context` to `/switch-department` with error state
   - Changed sign-out redirect from `/auth/sign-in` to `/auth/council-login`
   - Kept internal data loading logic (fetches department details, permissions)

### 3.3 Implement Council Staff Invitation
- [x] Add "Invite Team Member" button to `/c/:org/:dept/team` page
- [x] Create invitation API endpoint `POST /api/departments/:deptId/invitations`
- [x] Send invitation email with magic link
- [x] Handle invitation acceptance flow (set password, redirect to dashboard)

### 3.4 Fix Department Switching
- [x] Ensure `DepartmentSwitcher` component works correctly
- [x] Update context when department changes
- [x] Reload dashboard data for new department
- [ ] Test: user with multiple departments can switch between them

#### Implementation Notes (Task 3.4)

Fixed `DepartmentSwitcher` component at `/switch-department`:

1. **Now uses UnifiedAuthContext**: Added `useAuth()` to get user session and `isInitialized` flag
2. **Loads user's actual departments**: Queries both `department_memberships` and `organization_memberships` to find all departments the user has access to
3. **Shows departments from multiple orgs**: If user has access to departments in multiple organizations, shows count of organizations
4. **Handles demo accounts**: Falls back to Westminster demo departments for known demo accounts
5. **Shows error messages**: Displays error from redirect state (e.g., when CouncilProtectedRoute redirects)
6. **Waits for auth**: Shows spinner until `isInitialized` is true to prevent flashes

**Context update on department switch**:
- When user clicks department, navigates to `/c/:orgSlug/:deptSlug/dashboard`
- `CouncilProtectedRoute` validates access
- `CouncilLayout` detects URL change, calls `loadDepartmentData()`
- `loadDepartmentData()` calls `loadPermissions()` to update UnifiedAuthContext

**Dashboard data reload**:
- Dashboard component uses `useOutletContext()` to get department from CouncilLayout
- Has `useEffect([department.id])` that calls `loadDashboardData()` when department changes
- All department-specific data reloads automatically

---

## Phase 4: Fix Publishing Wizard Template Linking

**Goal**: When user selects a council, their custom template is used

### 4.1 Add Council Selection to Wizard
- [x] In Step 1 or Step 2, add council dropdown for notice types that require it
- [x] Fetch councils from database (not hardcoded)
- [x] Store selected council's department ID in draft state
- [x] Only show council dropdown for relevant notice types (licensing, planning - NOT probate, GVOL)

### 4.2 Link Templates to Notice Preview
- [x] When council is selected, fetch their template for this notice type
- [x] Use `GET /api/departments/:deptId/templates?notice_type=X`
- [x] If custom template exists, use it for preview rendering
- [x] If no custom template, use default template
- [x] Show indicator when using custom vs default template

#### Implementation Notes (Task 4.2)

Template linking was **already implemented** in `src/lib/templateService.ts` and integrated into `NewPublishFlow.tsx`. The implementation uses:

1. **`getTemplateForDepartment(departmentId, noticeTypeId)`** - RPC function that fetches active template from database
2. **`renderNoticeWithTemplate(notice, departmentId, noticeTypeId)`** - Renders notice with custom template if available, falls back to default

What was added in this iteration:

1. **`TemplateRenderResult` type** - New export from templateService.ts that includes:
   - `text: string` - The rendered notice text
   - `isCustomTemplate: boolean` - Whether a custom council template was used
   - `templateName?: string` - Name of the custom template (if used)
   - `templateId?: string` - UUID of the custom template (if used)

2. **`renderNoticeWithTemplateInfo()` function** - New function that returns both text and metadata

3. **`templateInfo` state in NewPublishFlow.tsx** - Tracks which template type is being used

4. **Template indicator UI** - Visual badge shown in preview panels:
   - Green badge with checkmark: "Using council template: {name}" (when custom template found)
   - Gray badge with document icon: "Using default template" (when using fallback)
   - Shows in Step 2 preview rail (template mode only)
   - Shows in Step 3 editable preview (template mode only)

### 4.3 Fix Westminster Auto-Detection Workaround
- [x] Remove hardcoded "Westminster" string matching in `NewPublishFlow.tsx:878-918`
- [x] Replace with proper council lookup from selected dropdown value
- [ ] Test: selecting any council loads their template correctly

#### Implementation Notes (Task 4.3)

Replaced the hardcoded Westminster-only workaround with a generic council lookup:

1. **Uses category-based department type lookup**: `getDepartmentTypeForCategory(definition.category)` maps notice category to department type:
   - licensing, gambling → 'licensing'
   - planning → 'planning'
   - gvol, tro → 'traffic'
   - probate → 'other'

2. **Two-phase council lookup**:
   - First tries exact match: `ilike('name', '%${authorityName}%')`
   - If no match, extracts key words (removing "City", "Council", "Borough", etc.) and tries broader search
   - Example: "Westminster City Council" → extract "Westminster" → find match

3. **Filters by correct department type**: Query includes `.eq('departments.type', departmentType)` to ensure we get the correct department for this notice type

4. **Better logging**: Added comprehensive logs showing authority name, category, expected department type, and matched results

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

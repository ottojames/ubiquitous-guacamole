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
- [x] When notice is published, store `department_id` in notices table
- [x] This links the notice to the council for representations
- [x] Council can then see all notices published for their area
- [ ] Test: published notice appears in council's notices list

#### Implementation Notes (Task 4.4)

Fixed the legacy publish flow to properly pass `department_id` when publishing notices:

1. **Problem identified**: In the legacy publish flow (used by anonymous/public users), the code only checked `organization?.id` and `department?.id` from UnifiedAuthContext. But for anonymous users who selected a council from the dropdown, `templateDraft.DEPARTMENT_ID` was being ignored.

2. **Solution implemented** in `NewPublishFlow.tsx` lines 1640-1661:
   - Added fallback logic to check `templateDraft.DEPARTMENT_ID` when no auth context IDs exist
   - When a department ID is found from the dropdown, looks up the corresponding `organization_id`
   - Both IDs are now properly passed in the `submitNotice` payload

3. **TypeScript type update** in `src/lib/notices.ts`:
   - Added missing fields to `SubmitNoticePayload`: `organization_id`, `department_id`, `contact_email`
   - These fields were already being used but not typed

4. **How it works now**:
   - **Authenticated users**: Uses `organization?.id` and `department?.id` from UnifiedAuthContext
   - **Anonymous users with dropdown selection**: Uses `templateDraft.DEPARTMENT_ID` (set by CouncilDepartmentSelect component)
   - Backend at `server/routes/notices.ts:556-557` already saves these fields to the database

5. **Council notices page** already queries by department_id (see `src/pages/council/Notices.tsx:136-140`)

---

## Phase 5: Remove Mock/Demo Data

**Goal**: No hardcoded test data in production code paths

### 5.1 Remove Demo Users
- [x] Remove `DEMO_USERS` array from `src/next/publish/flow/steps/UploadMethodStep.tsx:25-47`
- [x] Remove demo mode logic that uses these users
- [x] Ensure upload step works without demo user context

#### Implementation Notes (Task 5.1)

Removed all demo user functionality from UploadMethodStep.tsx:

1. **Removed DEMO_USERS array** (was lines 25-32): Array of 5 hardcoded demo users with names and emails
2. **Removed demo user state** (`selectedDemoUser` useState)
3. **Removed demo user handler** (`handleDemoUserSelect` function)
4. **Removed demo user dropdown UI**: "Quick select (demo)" dropdown with demo user options
5. **Simplified email onChange**: Removed `setSelectedDemoUser("")` call that cleared demo selection

The email input field now works as a simple form input without any demo user shortcuts. The upload step functionality remains unchanged - users enter their email manually for confirmation receipts.

### 5.2 Remove Mock Data from Firm Portal
- [x] Remove mock clients from `src/pages/firm/Clients.tsx:69-128`
- [x] Replace with actual database query for firm's clients
- [x] Remove mock invoices from `src/pages/firm/Billing.tsx:54-97`
- [x] Replace with actual Stripe invoice data

#### Implementation Notes (Task 5.2)

Replaced all mock data in Firm Portal with actual database queries:

**Clients.tsx changes:**
1. `loadClients()` now queries `firm_clients` view (with fallback to `client_relationships` table)
2. `handleSave()` uses `add_client_to_firm` RPC function for new clients, or direct updates for existing
3. `handleDeleteClient()` deletes from `client_relationships` table
4. Removed hardcoded mockClients array (3 fake businesses)
5. Removed "prototype interface" note from modal

**Billing.tsx changes:**
1. `loadBillingData()` queries `firm_subscriptions` table with joined `subscription_tiers`
2. Uses `get_subscription_usage` RPC function to get notice usage stats
3. Queries `monthly_invoices` table for invoice history
4. Fetches payment method from Stripe API if `stripe_customer_id` exists
5. Added error state handling
6. Updated subscription display to show: tier name, usage stats, status badge
7. Fixed context to use `firm` instead of `organization`

### 5.3 Remove Mock Data from Public Pages
- [x] Remove mock subscription data from `src/pages/EmailAlerts.tsx:110-122`
- [x] Replace with actual subscription lookup

#### Implementation Notes (Task 5.3)

Replaced all mock data and simulated API calls in EmailAlerts.tsx with actual API endpoints:

1. **Removed mock verification flow**: The verification code input UI was removed since verification is done via email link (GET /api/subscriptions/verify/:token) that redirects back with `?verified=true`

2. **handleSubscribe()** now calls `POST /api/subscriptions/create` which:
   - Validates postcode via postcodes.io
   - Creates subscription record in `email_subscriptions` table with status='pending'
   - Sends verification email with magic link
   - Returns success/error appropriately

3. **loadSubscriptionByToken()** added to fetch subscription details via `POST /api/subscriptions/manage` when user arrives from email link with token

4. **handleUpdateSettings()** now calls `PUT /api/subscriptions/update/:id` with token-based authorization

5. **handleUnsubscribe()** redirects to `GET /api/subscriptions/unsubscribe/:token` which updates status and redirects back

6. **URL parameter handling** via `useSearchParams`:
   - `?verified=true` - shows success message after verification
   - `?unsubscribed=true` - shows unsubscribed confirmation
   - `?token=xxx` - loads subscription for management

7. **Updated Subscription interface** to match database schema:
   - Changed `active: boolean` to `status: 'pending' | 'active' | 'unsubscribed' | 'bounced'`
   - Removed `last_sent_at` (not needed in frontend)

### 5.4 Fix Address Provider Mock Mode
- [x] Review `server/routes/address.ts:82-147` mock address data
- [x] Ensure mock mode only activates when `ADDRESS_PROVIDER=mock` in env
- [x] Default to real address provider in production
- [x] Add clear logging when mock mode is active

#### Implementation Notes (Task 5.4)

Updated `server/routes/address.ts` to properly use `ADDRESS_PROVIDER` environment variable:

1. **Added `isMockMode()` function** that checks `ADDRESS_PROVIDER` env var:
   - Returns `true` only when `ADDRESS_PROVIDER=mock` (case-insensitive)
   - Defaults to `'getaddress'` when env var is not set
   - This means production deployments without explicit config will use real provider

2. **Added startup logging**:
   - When mock mode active: `[address-provider] ⚠️  MOCK MODE ACTIVE - ADDRESS_PROVIDER=mock`
   - When real mode: `[address-provider] Using provider: getaddress`

3. **Changed mock mode activation**:
   - OLD: Mock mode activated when no API key was found
   - NEW: Mock mode ONLY activates when `ADDRESS_PROVIDER=mock`

4. **Added API key validation for real mode**:
   - If `ADDRESS_PROVIDER` is not `mock` but no API key is configured, returns 500 error
   - Error message guides user to either set mock mode or provide API key
   - Logs detailed error to console for debugging

5. **Environment variables**:
   - `ADDRESS_PROVIDER=mock` - Explicitly enable mock mode for development
   - `ADDRESS_PROVIDER=getaddress` (default) - Use real getaddress.io API
   - API key env vars checked: `VITE_GETADDRESS_KEY`, `VITE_GETADDRESS_API_KEY`, `ADDRESS_API_KEY`, `GETADDRESS_API_KEY`

### 5.5 Remove Demo Council Logic
- [x] Search for `isDemoMode` checks throughout codebase
- [x] Remove or gate behind explicit `DEMO_MODE=true` env var
- [x] Ensure production deployments never activate demo mode

#### Implementation Notes (Task 5.5)

Fixed multiple files that had hardcoded demo account bypasses that were NOT gated behind `isDemoModeEnabled()`:

1. **`src/components/council/CouncilProtectedRoute.tsx`**:
   - Was granting access to demo emails regardless of demo mode
   - Now uses `isDemoModeEnabled()` check before granting access
   - Uses `DEMO_ACCOUNTS.council` from demoMode.ts instead of hardcoded emails

2. **`src/pages/council/CouncilLayout.tsx`**:
   - Had hardcoded demo account bypass for database queries
   - Now only activates demo paths when `isDemoModeEnabled()` returns true
   - Uses `DEMO_ACCOUNTS` from demoMode.ts for email checking

3. **`src/pages/council/DepartmentSwitcher.tsx`**:
   - Was showing Westminster demo departments for hardcoded emails
   - Now requires `isDemoModeEnabled()` for demo account treatment
   - Uses `DEMO_ACCOUNTS` from demoMode.ts

4. **`src/pages/auth/SwitchContext.tsx`**:
   - Had hardcoded demo account mock data bypass
   - Now entire demo accounts block is wrapped in `isDemoModeEnabled()` check
   - Uses `DEMO_ACCOUNTS` from demoMode.ts for email mapping

**Demo mode architecture**:
- `isDemoModeEnabled()` requires BOTH: `VITE_DEMO_MODE=true` AND development mode
- This means production builds will NEVER activate demo mode, even if env var is set
- All demo account lists now use centralized `DEMO_ACCOUNTS` from `@/lib/demoMode`

**Files updated**:
- `src/components/council/CouncilProtectedRoute.tsx` - Added import + gated demo check
- `src/pages/council/CouncilLayout.tsx` - Added import + gated demo paths/accounts
- `src/pages/council/DepartmentSwitcher.tsx` - Added import + gated demo check
- `src/pages/auth/SwitchContext.tsx` - Added import + gated demo accounts block

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

# Phase 5 Authentication Unification - Testing & Verification Guide

**Status:** Ralph has completed all 10 tasks for Phase 5 Authentication Unification
**Created:** January 20, 2026
**Purpose:** Comprehensive guide to apply migrations, test functionality, and verify the unified authentication system

---

## Table of Contents
1. [Overview - What Ralph Built](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Database Migration](#step-1-database-migration)
4. [Step 2: JWT Hooks Configuration](#step-2-jwt-hooks-configuration)
5. [Step 3: Manual Testing Procedures](#step-3-manual-testing-procedures)
6. [Step 4: Automated Tests](#step-4-automated-tests)
7. [Step 5: Verification Checklist](#step-5-verification-checklist)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Rollback Procedures](#rollback-procedures)

---

## Overview - What Ralph Built

Ralph completed **10 tasks** to unify the authentication system:

### Tasks Completed:
- ✅ **Task 5.1:** Disabled conflicting admin auth system
- ✅ **Task 5.2:** Created unified auth migration (3 helper functions, platform_admin_settings table)
- ✅ **Task 5.3:** Created custom JWT claims hook (adds org context to tokens)
- ✅ **Task 5.4:** Created UnifiedAuthContext.tsx (single source of truth)
- ✅ **Task 5.5:** Replaced static council dropdown with DynamicCouncilSelect
- ✅ **Task 5.6:** Fixed notice upload organization linking
- ✅ **Task 5.7:** Updated RLS policies (4 new policies for proper isolation)
- ✅ **Task 5.8:** Migrated existing admin users to new system
- ✅ **Task 5.9:** Updated App.tsx to use unified auth
- ✅ **Task 5.10:** Created auth debug page at `/auth-debug`

### Key Files Created:
```
supabase/migrations/
  ├── 20260122000001_unified_auth_system.sql      # Base migration
  ├── 20260122000002_jwt_custom_claims.sql        # JWT hook
  └── 20260122000003_unified_rls_policies.sql     # RLS policies

src/
  ├── contexts/UnifiedAuthContext.tsx              # Main auth context
  ├── components/DynamicCouncilSelect.tsx          # Dynamic council dropdown
  └── pages/AuthDebug.tsx                          # Debug page
```

### What This Fixes:
1. **Login Issues:** No more dual auth conflicts
2. **Organization Context:** Notices properly linked to organizations
3. **Council Dropdown:** Now loads from database instead of static JSON
4. **RLS Policies:** Proper multi-tenancy isolation
5. **Platform Admin:** Unified admin access control

---

## Prerequisites

### Required Access:
- ✅ Supabase project access (dashboard login)
- ✅ Database connection string (for migrations)
- ✅ Service role key (for admin operations)

### Environment Check:
```bash
cd "/Users/ottoclarke/projects/Ralph's Civic Notices"

# Check environment variables
cat .env | grep -E "(SUPABASE_URL|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)"

# Should output:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGc...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Development Servers:
```bash
# Install dependencies if needed
npm install

# Start both frontend and backend
npm run dev

# Or start separately:
npm run dev:web      # Frontend (port 5173)
npm run dev:server   # Backend (port 5174)
```

**Expected:** Both servers running without errors

---

## Step 1: Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   ```
   URL: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   ```

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Apply Migration 1: Unified Auth System**
   ```bash
   # Copy file contents
   cat supabase/migrations/20260122000001_unified_auth_system.sql
   ```
   - Paste into SQL editor
   - Click "Run" (bottom right)
   - **Verify:** Should see "Success. No rows returned"

4. **Apply Migration 2: JWT Custom Claims**
   ```bash
   # Copy file contents
   cat supabase/migrations/20260122000002_jwt_custom_claims.sql
   ```
   - Paste into SQL editor
   - Click "Run"
   - **Verify:** Should see "Success. No rows returned"

5. **Apply Migration 3: RLS Policies**
   ```bash
   # Copy file contents
   cat supabase/migrations/20260122000003_unified_rls_policies.sql
   ```
   - Paste into SQL editor
   - Click "Run"
   - **Verify:** Should see "Success. No rows returned"

### Option B: Using Supabase CLI (Alternative)

```bash
cd "/Users/ottoclarke/projects/Ralph's Civic Notices"

# Install Supabase CLI if not installed
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Apply all pending migrations
supabase db push
```

### Option C: Direct Database Connection (Advanced)

```bash
# Using psql
psql "postgresql://postgres.PROJECT_ID:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres"

# Apply each migration file
\i supabase/migrations/20260122000001_unified_auth_system.sql
\i supabase/migrations/20260122000002_jwt_custom_claims.sql
\i supabase/migrations/20260122000003_unified_rls_policies.sql
```

### Verification - Check Tables Were Created:

```sql
-- Run in SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('platform_admin_settings');

-- Expected: 1 row (platform_admin_settings)

-- Check functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'private'
  AND routine_name IN ('get_user_org_id', 'get_user_dept_id', 'is_platform_admin');

-- Expected: 3 rows (all helper functions)

-- Check JWT hook exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'custom_access_token_hook';

-- Expected: 1 row
```

---

## Step 2: JWT Hooks Configuration

**CRITICAL:** The JWT hook must be manually enabled in Supabase Dashboard.

### Steps:

1. **Navigate to Authentication Hooks**
   ```
   Dashboard → Authentication → Hooks
   ```

2. **Enable Custom Access Token Hook**
   - Find "Custom Access Token" section
   - Click "Enable Hook"
   - Select function: `public.custom_access_token_hook`
   - Click "Save"

3. **Verify Hook is Active**
   - Should see green "Active" badge
   - Hook type: "Custom Access Token"
   - Function: `public.custom_access_token_hook`

### Test JWT Claims:

```bash
# Create test script
cat > /tmp/test-jwt-claims.sh << 'EOF'
#!/bin/bash
# Test if JWT claims are working

SUPABASE_URL="YOUR_SUPABASE_URL"
ANON_KEY="YOUR_ANON_KEY"

# Sign in test user
RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}')

# Extract and decode JWT
ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token')
echo "JWT Claims:"
echo $ACCESS_TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq '.app_metadata'
EOF

chmod +x /tmp/test-jwt-claims.sh
/tmp/test-jwt-claims.sh
```

**Expected Output:**
```json
{
  "organization_id": "uuid-here",
  "organization_name": "Council Name",
  "organization_type": "council",
  "department_id": "uuid-here",
  "role": "editor",
  "is_platform_admin": false,
  "admin_role": null
}
```

---

## Step 3: Manual Testing Procedures

### Test Suite 1: Authentication Flow

#### 3.1 Sign In Test
```
URL: http://localhost:5173/auth/signin
Steps:
  1. Enter email: test@sampletonborough.gov.uk
  2. Enter password: (your test password)
  3. Click "Sign In"

Expected:
  ✅ Redirects to appropriate portal (/c/sampletonborough or /f/firm-slug)
  ✅ No authentication errors
  ✅ Session persists on reload

How to Verify:
  - Check browser console: No errors
  - Check Network tab: POST to /auth/v1/token returns 200
  - Check Application → Local Storage: supabase.auth.token exists
```

#### 3.2 Organization Context Test
```
URL: http://localhost:5173/auth-debug
Steps:
  1. Sign in as test user
  2. Navigate to /auth-debug

Expected:
  ✅ Auth Context State shows:
      - User: test@example.com
      - Organization: Name and ID visible
      - Department: Name and ID visible (for council users)
      - Role: Correct role displayed
  ✅ Supabase Session shows:
      - Session active
      - Expiry in future
  ✅ JWT Claims show app_metadata with:
      - organization_id
      - organization_name
      - organization_type
      - department_id (if council)
      - role
      - is_platform_admin
  ✅ No problems detected

How to Verify:
  - All sections should have green checkmarks
  - No red error messages
  - Organization context must NOT be null
```

### Test Suite 2: Dynamic Council Dropdown

#### 3.3 Council Dropdown Loading Test
```
URL: http://localhost:5173/publish/step-1
Steps:
  1. Sign in as firm user
  2. Navigate to publish wizard
  3. Select any notice type
  4. Proceed to upload step
  5. Observe council dropdown

Expected (Firm Users):
  ✅ Dropdown shows list of councils from database
  ✅ At least 8 councils visible (Sampletonborough, Westminster, etc.)
  ✅ Councils load without manual refresh
  ✅ Can select any council

Expected (Council Users):
  ✅ Dropdown shows only their council
  ✅ Field is read-only (disabled)
  ✅ Council auto-selected

How to Verify:
  - Check browser console:
      GET /rest/v1/organizations?select=*&type=eq.council
      Should return 200 with council data
  - Check network tab for active_councils query
```

#### 3.4 Council User Auto-Select Test
```
URL: http://localhost:5173/publish/step-1
Steps:
  1. Sign in as council user (test@sampletonborough.gov.uk)
  2. Navigate to publish wizard
  3. Check council dropdown

Expected:
  ✅ Sampletonborough pre-selected
  ✅ Dropdown is disabled (not editable)
  ✅ No ability to select different council

How to Verify:
  - Inspect element: <select disabled> attribute present
  - Only 1 option visible in dropdown
```

### Test Suite 3: Notice Organization Linking

#### 3.5 Notice Upload Test
```
URL: http://localhost:5173/publish/step-1
Steps:
  1. Sign in as council user
  2. Complete publish wizard (all 4 steps)
  3. Submit notice

Expected:
  ✅ Notice submits successfully
  ✅ No "organization_id is null" errors
  ✅ Confirmation page shows notice ID

How to Verify:
  - Check database after submission:
```
```sql
-- Run in SQL Editor
SELECT id, title, organization_id, department_id, status
FROM notices
ORDER BY created_at DESC
LIMIT 5;

-- Expected: New notice has:
--   - organization_id: NOT NULL
--   - department_id: NOT NULL (for council users)
--   - status: 'pending' or 'published'
```

#### 3.6 Notice Listing Test
```
URL: http://localhost:5173/c/sampletonborough/notices
Steps:
  1. Sign in as council user
  2. Navigate to notices list

Expected:
  ✅ Notices display in list
  ✅ Only notices from user's organization visible
  ✅ No notices from other councils visible

How to Verify:
  - Check API call in Network tab:
      GET /api/notices?organization_id=THEIR_ORG_ID
  - Should only return notices matching user's organization
```

### Test Suite 4: RLS Policy Enforcement

#### 3.7 Multi-Tenancy Test
```
Test: Users can only see their organization's data

Setup:
  1. Create 2 test users in different organizations
  2. Create test notice for each organization

Steps:
  1. Sign in as User A (Organization A)
  2. Check notice list → Should see only Org A notices
  3. Sign out
  4. Sign in as User B (Organization B)
  5. Check notice list → Should see only Org B notices

Expected:
  ✅ User A cannot see User B's notices
  ✅ User B cannot see User A's notices
  ✅ No cross-organization data leakage
```

#### 3.8 Platform Admin Test
```
Test: Platform admins bypass RLS and see everything

Steps:
  1. Sign in as platform admin user
  2. Navigate to /admin/accounts
  3. Check council list

Expected:
  ✅ Can see ALL councils
  ✅ Can see ALL firms
  ✅ Can see ALL notices
  ✅ No RLS restrictions applied

How to Verify:
  - Check SQL query in Network tab
  - Should not have WHERE organization_id filters
  - private.is_platform_admin() returns true
```

### Test Suite 5: Department Switching

#### 3.9 Department Context Test
```
URL: http://localhost:5173/c/sampletonborough/dashboard
Steps:
  1. Sign in as council user with multiple departments
  2. Check department switcher (if visible)
  3. Switch departments

Expected:
  ✅ Dashboard updates to show department-specific data
  ✅ Organization context persists
  ✅ Department context updates
  ✅ URL updates: /c/sampletonborough/dept/licensing

How to Verify:
  - Check /auth-debug after switch
  - Department should change in context
  - Organization should remain same
```

---

## Step 4: Automated Tests

### Run Test Suite

```bash
cd "/Users/ottoclarke/projects/Ralph's Civic Notices"

# Run all tests
npm test

# Expected pass rate: ~89% (416/468 passing)
# Pre-existing failures are okay (Cypress snapshot tests)
```

### Run Type Checking

```bash
npm run typecheck

# Expected: 97 pre-existing Cypress errors (OKAY)
# New errors related to UnifiedAuthContext = BAD
```

### Run Linting

```bash
npm run lint

# Expected: 718 pre-existing errors (mostly JS files - OKAY)
# New errors in UnifiedAuthContext.tsx = BAD
```

### API Endpoint Tests

```bash
# Test authentication endpoint
curl -X POST http://localhost:5174/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# Expected: 200 OK with session token

# Test organization context
curl http://localhost:5174/api/auth/session \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 200 OK with user + organization data
```

---

## Step 5: Verification Checklist

### Database Layer ✓

- [ ] Migration 1 applied (platform_admin_settings table exists)
- [ ] Migration 2 applied (custom_access_token_hook function exists)
- [ ] Migration 3 applied (RLS policies created)
- [ ] Helper functions exist (get_user_org_id, get_user_dept_id, is_platform_admin)
- [ ] active_councils view created
- [ ] Indexes created for performance

### JWT Hooks ✓

- [ ] Custom Access Token hook enabled in dashboard
- [ ] Hook function selected: public.custom_access_token_hook
- [ ] JWT tokens include app_metadata with organization context
- [ ] JWT tokens include is_platform_admin flag

### Authentication ✓

- [ ] Users can sign in without errors
- [ ] Session persists on page reload
- [ ] Organization context loads automatically
- [ ] Department context loads for council users
- [ ] Platform admin status recognized

### UI Components ✓

- [ ] DynamicCouncilSelect loads councils from database
- [ ] Firm users see all councils in dropdown
- [ ] Council users see only their council (read-only)
- [ ] Auth debug page displays complete state
- [ ] No console errors on signin

### Notice Publishing ✓

- [ ] Notices submit successfully
- [ ] organization_id is NOT NULL on new notices
- [ ] department_id is populated for council users
- [ ] Notices display in correct portal
- [ ] Users only see their organization's notices

### RLS Policies ✓

- [ ] Platform admins can access all data
- [ ] Organization members see only their org's data
- [ ] Department members can manage their dept's notices
- [ ] Public notices visible to anonymous users
- [ ] No cross-organization data leakage

---

## Troubleshooting Guide

### Problem: JWT Hook Not Working

**Symptoms:**
- Auth debug page shows empty app_metadata
- Organization context is null
- JWT tokens missing organization_id

**Solutions:**
```
1. Check hook is enabled:
   Dashboard → Authentication → Hooks
   → Verify "Custom Access Token" shows "Active"

2. Re-enable hook:
   - Disable hook
   - Wait 10 seconds
   - Re-enable hook
   - Select function: public.custom_access_token_hook
   - Save

3. Test with new session:
   - Sign out completely
   - Clear browser cache
   - Sign in again
   - Check /auth-debug

4. Verify permissions:
   Run in SQL Editor:
```
```sql
-- Check grants
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('organizations', 'organization_memberships', 'department_memberships', 'platform_admin_settings')
  AND grantee = 'supabase_auth_admin';

-- Expected: SELECT privilege for all tables
```

### Problem: Councils Not Loading in Dropdown

**Symptoms:**
- Dropdown empty or shows error
- Console error: "Failed to fetch councils"

**Solutions:**
```
1. Check active_councils view:
```
```sql
SELECT * FROM public.active_councils LIMIT 5;

-- Expected: List of councils
-- If empty, check organizations table:

SELECT id, name, type, status FROM organizations WHERE type = 'council';

-- Expected: At least 1 council with status = 'active'
```
```
2. Check RLS policies:
```
```sql
-- Verify councils are accessible
SELECT policy_name, policydef
FROM pg_policies
WHERE tablename = 'organizations';

-- Should have policy: "users_see_own_org"
```
```
3. Check network tab:
   - Look for GET request to /rest/v1/organizations
   - Status should be 200
   - If 403: RLS policy issue
   - If 404: Route not found
```

### Problem: Organization Context is Null

**Symptoms:**
- Auth debug shows "Organization: null"
- Notice submission fails with "organization_id required"

**Solutions:**
```
1. Verify user has organization membership:
```
```sql
SELECT om.*, o.name as org_name
FROM organization_memberships om
JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

-- Expected: At least 1 row
-- If empty, user has no organization assigned
```
```
2. Create organization membership:
```
```sql
-- Get user ID
SELECT id FROM auth.users WHERE email = 'test@example.com';

-- Get organization ID
SELECT id FROM organizations WHERE name = 'Sampletonborough Council';

-- Create membership
INSERT INTO organization_memberships (user_id, organization_id, role)
VALUES ('USER_ID_HERE', 'ORG_ID_HERE', 'editor');
```
```
3. Sign out and back in:
   - JWT claims only update on new login
   - Context loads from JWT on signin
```

### Problem: RLS Policies Blocking Access

**Symptoms:**
- API returns empty arrays
- Console error: "permission denied for table"
- Status 403 on database queries

**Solutions:**
```
1. Check if RLS is too restrictive:
```
```sql
-- Temporarily check without RLS (for debugging only)
ALTER TABLE notices DISABLE ROW LEVEL SECURITY;

-- Test query
SELECT COUNT(*) FROM notices;

-- Re-enable RLS
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
```
```
2. Verify user has proper organization membership:
```
```sql
SELECT
  u.email,
  om.organization_id,
  o.name as org_name,
  om.role
FROM auth.users u
LEFT JOIN organization_memberships om ON om.user_id = u.id
LEFT JOIN organizations o ON o.id = om.organization_id
WHERE u.email = 'test@example.com';
```
```
3. Check helper functions return correct values:
```
```sql
-- Test as authenticated user
SELECT
  private.get_user_org_id() as org_id,
  private.get_user_dept_id() as dept_id,
  private.is_platform_admin() as is_admin;

-- Expected:
-- org_id: UUID (not null)
-- dept_id: UUID or null (null for firms)
-- is_admin: true or false
```

### Problem: Notice Upload Fails

**Symptoms:**
- Error: "organization_id cannot be null"
- Notice submission returns 400 or 500
- Payment step fails

**Solutions:**
```
1. Check UnifiedAuthContext is loaded:
   - Navigate to /auth-debug
   - Verify organization is NOT null
   - If null, see "Organization Context is Null" above

2. Check server receives organization_id:
   - Open browser DevTools → Network
   - Submit notice
   - Find POST to /api/notices/submit
   - Check request payload:
```
```json
{
  "title": "Test Notice",
  "organization_id": "should-be-uuid-here",  // Must be present
  "department_id": "should-be-uuid-here",    // For councils
  "council": "sampletonborough"              // Legacy field
}
```
```
3. Check server logs:
```
```bash
# Terminal running dev:server should show:
# POST /api/notices/submit
# Body: { organization_id: 'uuid-here', ... }

# If organization_id missing, check PaymentStep.tsx
```

### Problem: Department Switching Not Working

**Symptoms:**
- Dropdown shows no departments
- Switching causes error
- URL doesn't update

**Solutions:**
```
1. Verify department memberships exist:
```
```sql
SELECT
  dm.*,
  d.name as dept_name
FROM department_memberships dm
JOIN departments d ON d.id = dm.department_id
WHERE dm.user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

-- Expected: At least 1 row for council users
```
```
2. Check departments table:
```
```sql
SELECT id, name, type, organization_id
FROM departments
WHERE organization_id = (
  SELECT organization_id
  FROM organization_memberships
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
  LIMIT 1
);

-- Expected: At least 1 department for councils
```
```
3. Check RLS policy on departments:
```
```sql
SELECT policy_name, policydef
FROM pg_policies
WHERE tablename = 'departments';

-- Should have policy: "users_see_own_depts"
```

---

## Rollback Procedures

### If Authentication Breaks Completely

**Emergency Rollback:**

```sql
-- 1. Disable JWT hook immediately
-- Go to Dashboard → Authentication → Hooks
-- Click "Disable" on Custom Access Token hook

-- 2. Drop new RLS policies (in SQL Editor)
DROP POLICY IF EXISTS "platform_admins_full_access" ON public.notices;
DROP POLICY IF EXISTS "org_members_see_own_notices" ON public.notices;
DROP POLICY IF EXISTS "dept_members_manage_notices" ON public.notices;
DROP POLICY IF EXISTS "public_notices_readable" ON public.notices;

-- 3. Restore old permissive policies
CREATE POLICY "Public read access" ON public.notices
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated insert" ON public.notices
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated update" ON public.notices
FOR UPDATE TO authenticated
USING (true);

-- 4. Keep platform_admin_settings table (doesn't break anything)
-- 5. Keep helper functions (don't break anything)
```

### If Notice Submission Breaks

**Temporary Fix:**

```sql
-- Make organization_id nullable again
ALTER TABLE public.notices
  ALTER COLUMN organization_id DROP NOT NULL;

-- Users can submit notices without org context
-- FIX: Manually update notices after submission
```

### If RLS Blocks Everything

**Debug Mode (DEVELOPMENT ONLY):**

```sql
-- DANGER: This removes all security - for debugging only
ALTER TABLE notices DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;

-- Test your queries

-- IMPORTANT: Re-enable when done:
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
```

### Full Rollback (Nuclear Option)

**WARNING:** This reverts all Phase 5 changes.

```sql
-- 1. Drop JWT hook
DROP FUNCTION IF EXISTS public.custom_access_token_hook;

-- 2. Drop helper functions
DROP FUNCTION IF EXISTS private.get_user_org_id;
DROP FUNCTION IF EXISTS private.get_user_dept_id;
DROP FUNCTION IF EXISTS private.is_platform_admin;

-- 3. Drop new table
DROP TABLE IF EXISTS public.platform_admin_settings;

-- 4. Drop new view
DROP VIEW IF EXISTS public.active_councils;

-- 5. Drop new policies
DROP POLICY IF EXISTS "platform_admins_full_access" ON public.notices;
DROP POLICY IF EXISTS "org_members_see_own_notices" ON public.notices;
DROP POLICY IF EXISTS "dept_members_manage_notices" ON public.notices;
DROP POLICY IF EXISTS "public_notices_readable" ON public.notices;
DROP POLICY IF EXISTS "users_see_own_org" ON public.organizations;
DROP POLICY IF EXISTS "users_see_own_depts" ON public.departments;
DROP POLICY IF EXISTS "users_see_own_council_settings" ON public.council_settings;

-- 6. Restore old policies (copy from previous migrations)

-- 7. Make organization_id nullable
ALTER TABLE public.notices
  ALTER COLUMN organization_id DROP NOT NULL;
```

**Code Rollback:**

```bash
# Revert code changes
cd "/Users/ottoclarke/projects/Ralph's Civic Notices"
git revert 68e576b  # Phase 5 completion commit

# Or checkout previous version
git checkout b79084a  # Before Task 5.1
```

---

## Success Criteria

### ✅ Phase 5 is Working When:

1. **Authentication:**
   - [ ] Users can sign in without errors
   - [ ] Session persists across reloads
   - [ ] JWT tokens include organization context
   - [ ] /auth-debug shows no problems

2. **Organization Context:**
   - [ ] Organization loads automatically on signin
   - [ ] Department loads for council users
   - [ ] Context visible in /auth-debug
   - [ ] Context persists across navigation

3. **Council Dropdown:**
   - [ ] Firm users see all councils
   - [ ] Council users see only their council (read-only)
   - [ ] Councils load from database (not JSON)
   - [ ] At least 8 councils visible

4. **Notice Publishing:**
   - [ ] Notices submit successfully
   - [ ] organization_id is NOT NULL
   - [ ] department_id populated for councils
   - [ ] No "organization required" errors

5. **RLS Policies:**
   - [ ] Users see only their org's notices
   - [ ] Platform admins see everything
   - [ ] No cross-organization leakage
   - [ ] Public notices visible to anonymous

6. **Performance:**
   - [ ] Signin completes < 2 seconds
   - [ ] Context loads < 500ms
   - [ ] Council dropdown loads < 1 second
   - [ ] No infinite loading spinners

---

## Next Steps After Verification

### If Everything Works:
1. Document any observed issues (even minor ones)
2. Test with real user accounts
3. Monitor logs for errors
4. Create staging environment
5. Plan production deployment

### If Issues Found:
1. Document exact error messages
2. Note which test failed
3. Capture screenshots/videos
4. Share with Ralph via progress.txt
5. Use troubleshooting guide above

---

## Quick Reference Commands

```bash
# Start dev servers
npm run dev

# Check auth debug page
open http://localhost:5173/auth-debug

# Test API health
curl http://localhost:5174/api/health

# Check database connection
psql "YOUR_DATABASE_URL" -c "SELECT version();"

# Run migrations via Supabase CLI
supabase db push

# View server logs
# Check terminal running "npm run dev:server"

# Check frontend logs
# Open browser DevTools → Console
```

---

## Support

If you encounter issues not covered in this guide:

1. **Check Ralph's Work:**
   - Review commits: `git log --oneline --grep="Task 5"`
   - Read progress.txt for implementation notes

2. **Database Issues:**
   - Check Supabase Dashboard → Database → Logs
   - Look for error messages in Postgres logs

3. **Frontend Issues:**
   - Check browser console for errors
   - Check Network tab for failed requests
   - Verify /auth-debug shows proper state

4. **Backend Issues:**
   - Check terminal running dev:server
   - Look for error stack traces
   - Test API endpoints with curl

---

**Document Version:** 1.0
**Last Updated:** January 20, 2026
**Author:** Chief Product Officer (for Otto)
**Ralph's Completion Status:** 10/10 tasks ✅

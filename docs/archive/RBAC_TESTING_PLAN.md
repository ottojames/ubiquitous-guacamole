# RBAC System Testing Plan

## Prerequisites

Before testing, ensure the RBAC migration has been run successfully:

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Copy the contents of `supabase/migrations/20251025000003_rbac_permissions.sql`
5. Paste into SQL Editor and run
6. Verify success (should see "Migration completed" or similar message)

### Option 2: Via Command Line
```bash
PGPASSWORD="94EZXtBLTgr8VVIL" psql \
  -h aws-1-eu-west-2.pooler.supabase.com \
  -p 5432 \
  -U postgres.puemqhpqxgrvrukyrfkm \
  -d postgres \
  -f supabase/migrations/20251025000003_rbac_permissions.sql
```

### Verify Migration Success
```sql
-- Check roles table exists
SELECT * FROM roles;

-- Check permissions table exists
SELECT * FROM permissions;

-- Check org_admin has all 21 permissions
SELECT COUNT(*) FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'org_admin');
-- Should return 21
```

---

## Phase 1: Database Verification Tests

### Test 1.1: Verify Roles Created
**Expected**: 4 roles with correct hierarchy levels

```sql
SELECT name, level, display_name FROM roles ORDER BY level;
```

**Expected Output**:
```
name         | level | display_name
-------------|-------|---------------------------
org_admin    | 1     | Organization Administrator
dept_admin   | 2     | Department Administrator
officer      | 3     | Licensing Officer
viewer       | 4     | Read-Only Viewer
```

✅ Pass / ❌ Fail: _______

---

### Test 1.2: Verify Permissions Created
**Expected**: 21 permissions across 6 resources

```sql
SELECT resource, COUNT(*) as permission_count
FROM permissions
GROUP BY resource
ORDER BY resource;
```

**Expected Output**:
```
resource         | permission_count
-----------------|------------------
audit            | 1
notices          | 6
representations  | 4
settings         | 2
team             | 4
templates        | 4
```

✅ Pass / ❌ Fail: _______

---

### Test 1.3: Verify Role-Permission Mappings
**Expected**: Each role has correct number of permissions

```sql
SELECT r.name, r.display_name, COUNT(rp.permission_id) as perm_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name, r.display_name
ORDER BY r.level;
```

**Expected Output**:
```
name        | display_name                 | perm_count
------------|------------------------------|------------
org_admin   | Organization Administrator   | 21 (all)
dept_admin  | Department Administrator     | 19
officer     | Licensing Officer            | 10
viewer      | Read-Only Viewer             | 6
```

✅ Pass / ❌ Fail: _______

---

### Test 1.4: Verify RPC Functions Exist
**Expected**: 3 helper functions created

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('user_has_permission', 'get_user_permissions', 'get_user_role')
ORDER BY routine_name;
```

**Expected Output**:
```
routine_name
------------------------
get_user_permissions
get_user_role
user_has_permission
```

✅ Pass / ❌ Fail: _______

---

## Phase 2: Demo User Testing (Org Admin)

### Test 2.1: Access Demo Dashboard
**Steps**:
1. Ensure dev server is running: `npm run dev`
2. Open browser to http://localhost:5173
3. Click "Demo Login" or navigate to `/auth/demo-login`
4. Select "Sample Borough Council"

**Expected**:
- Redirects to `/c/sample-borough/licensing/dashboard`
- No console errors
- Dashboard loads successfully

✅ Pass / ❌ Fail: _______

**Console Check** (Open browser DevTools → Console):
- Look for permission loading logs
- Should NOT see errors like "user_has_permission not found"

**Console Output**: _______________________________________

---

### Test 2.2: Verify Org Admin Permissions Loaded
**Steps**:
1. While on dashboard, open browser Console
2. Type: `window.localStorage.getItem('auth-storage')`
3. Look for permissions array in the output

**Expected**:
- Should see array with 21 permissions
- All permission names should be present (notices.create, notices.read, etc.)

✅ Pass / ❌ Fail: _______

**Permissions Count**: _______ / 21

---

### Test 2.3: Dashboard - Create Notice Button Visible
**Steps**:
1. View Dashboard page
2. Look for "+ Create Notice" button in top right

**Expected**:
- Button IS visible (org_admin has `notices.create` permission)
- Button is not disabled
- Clicking opens notice creation flow

✅ Pass / ❌ Fail: _______

---

### Test 2.4: Notices Page - Create Notice Button Visible
**Steps**:
1. Navigate to Notices page (sidebar)
2. Look for "+ Create Notice" button

**Expected**:
- Button IS visible
- Same behavior as dashboard button

✅ Pass / ❌ Fail: _______

---

### Test 2.5: Team Page - Access Granted
**Steps**:
1. Navigate to Team page (sidebar)
2. Check page content loads

**Expected**:
- Page loads successfully
- "Invite Team Member" form IS visible (org_admin has `team.manage` permission)
- Can see team member list

✅ Pass / ❌ Fail: _______

---

### Test 2.6: Settings Page - Access Granted
**Steps**:
1. Navigate to Settings page (sidebar)
2. Check page content loads

**Expected**:
- Page loads successfully
- Form fields are editable (org_admin has `settings.update` permission)
- "Save" button is present and enabled

✅ Pass / ❌ Fail: _______

---

## Phase 3: Create Test Users with Different Roles

### Test 3.1: Create Viewer Test User
**Steps**:
```sql
-- Insert test user into department_memberships
-- Note: You'll need an actual user_id from Supabase Auth
INSERT INTO department_memberships (department_id, user_id, role)
VALUES (
  'demo-sample-borough-id',  -- Sample Borough department
  'YOUR_TEST_USER_ID_HERE',  -- From Supabase Auth
  'viewer'
);
```

**Or use Team page**:
1. As org_admin, go to Team page
2. Invite user with email: `viewer@test.com`
3. Select role: "Viewer"
4. User receives invitation

✅ Pass / ❌ Fail: _______

---

### Test 3.2: Create Officer Test User
```sql
INSERT INTO department_memberships (department_id, user_id, role)
VALUES (
  'demo-sample-borough-id',
  'YOUR_OFFICER_USER_ID_HERE',
  'officer'
);
```

✅ Pass / ❌ Fail: _______

---

### Test 3.3: Create Dept Admin Test User
```sql
INSERT INTO department_memberships (department_id, user_id, role)
VALUES (
  'demo-sample-borough-id',
  'YOUR_DEPT_ADMIN_USER_ID_HERE',
  'dept_admin'
);
```

✅ Pass / ❌ Fail: _______

---

## Phase 4: Viewer Role Testing

### Test 4.1: Viewer - Dashboard Access
**Steps**:
1. Login as viewer user
2. Navigate to dashboard

**Expected**:
- Dashboard loads
- Stats cards ARE visible (has `notices.read`)
- "+ Create Notice" button is HIDDEN (lacks `notices.create`)

✅ Pass / ❌ Fail: _______

---

### Test 4.2: Viewer - Notices Page
**Expected**:
- Can view notices list (has `notices.read`)
- "+ Create Notice" button is HIDDEN
- Cannot edit or delete notices

✅ Pass / ❌ Fail: _______

---

### Test 4.3: Viewer - Team Page
**Expected**:
- Shows message: "You don't have permission to manage team members"
- OR team list is visible but invite form is hidden

✅ Pass / ❌ Fail: _______

---

### Test 4.4: Viewer - Settings Page
**Expected**:
- Shows message: "You don't have permission to manage department settings"

✅ Pass / ❌ Fail: _______

---

## Phase 5: Officer Role Testing

### Test 5.1: Officer - Dashboard
**Expected**:
- Dashboard loads
- "+ Create Notice" button IS visible (has `notices.create`)

✅ Pass / ❌ Fail: _______

---

### Test 5.2: Officer - Can Create Notice
**Steps**:
1. Click "+ Create Notice"
2. Fill out notice form
3. Submit

**Expected**:
- Form opens successfully
- Can submit and create notice

✅ Pass / ❌ Fail: _______

---

### Test 5.3: Officer - Team Management Restricted
**Expected**:
- Team page shows permission denied (lacks `team.manage`)

✅ Pass / ❌ Fail: _______

---

### Test 5.4: Officer - Settings Restricted
**Expected**:
- Settings page shows permission denied (lacks `settings.update`)

✅ Pass / ❌ Fail: _______

---

## Phase 6: Dept Admin Role Testing

### Test 6.1: Dept Admin - Full Notice Access
**Expected**:
- Can create, edit, delete, publish notices
- All notice buttons visible

✅ Pass / ❌ Fail: _______

---

### Test 6.2: Dept Admin - Team Management Access
**Expected**:
- Can access Team page
- Can invite team members (has `team.invite`)
- Can update member roles (has `team.update`)

✅ Pass / ❌ Fail: _______

---

### Test 6.3: Dept Admin - Settings Access
**Expected**:
- Can access and edit Settings page (has `settings.update`)

✅ Pass / ❌ Fail: _______

---

## Phase 7: Browser Console Testing

### Test 7.1: No JavaScript Errors
**Steps**:
1. Open Console (F12)
2. Navigate through all pages as different roles
3. Check for errors

**Expected**:
- No red error messages related to permissions
- No "undefined" or "null" errors when checking permissions

✅ Pass / ❌ Fail: _______

**Errors Found**: _______________________________________

---

### Test 7.2: Permission Loading Logs
**Steps**:
1. Logout and login as any user
2. Watch console during navigation to dashboard

**Expected**:
- Should see permission loading complete
- No RPC function errors

✅ Pass / ❌ Fail: _______

---

## Phase 8: Database RPC Function Testing

### Test 8.1: Test user_has_permission Function
```sql
SELECT user_has_permission(
  'YOUR_VIEWER_USER_ID',
  'demo-sample-borough-id',
  'notices.create'
) as has_create_permission;
-- Expected: false (viewer doesn't have this)

SELECT user_has_permission(
  'YOUR_VIEWER_USER_ID',
  'demo-sample-borough-id',
  'notices.read'
) as has_read_permission;
-- Expected: true (viewer has this)
```

✅ Pass / ❌ Fail: _______

---

### Test 8.2: Test get_user_permissions Function
```sql
SELECT * FROM get_user_permissions(
  'YOUR_VIEWER_USER_ID',
  'demo-sample-borough-id'
);
```

**Expected**: Returns 6 rows for viewer (notices.read, representations.read, etc.)

✅ Pass / ❌ Fail: _______

**Permission Count**: _______ / 6 (for viewer)

---

### Test 8.3: Test get_user_role Function
```sql
SELECT * FROM get_user_role(
  'YOUR_VIEWER_USER_ID',
  'demo-sample-borough-id'
);
```

**Expected**: Returns 'viewer'

✅ Pass / ❌ Fail: _______

**Returned Role**: _______

---

## Phase 9: Security Testing

### Test 9.1: Direct URL Access
**Steps**:
1. As viewer user, try to access Settings by typing URL directly
2. Try `/c/sample-borough/licensing/settings`

**Expected**:
- Either shows "permission denied" message
- Or redirects away from settings

✅ Pass / ❌ Fail: _______

---

### Test 9.2: Button Disabled vs Hidden
**Steps**:
1. Inspect page source as viewer
2. Search for "Create Notice" button

**Expected**:
- Button should NOT be in DOM at all (not just hidden with CSS)
- Using conditional rendering, not just `display: none`

✅ Pass / ❌ Fail: _______

---

## Test Results Summary

**Phase 1 - Database Verification**: _____ / 4 tests passed
**Phase 2 - Demo User (Org Admin)**: _____ / 6 tests passed
**Phase 3 - Create Test Users**: _____ / 3 tests passed
**Phase 4 - Viewer Role**: _____ / 4 tests passed
**Phase 5 - Officer Role**: _____ / 4 tests passed
**Phase 6 - Dept Admin Role**: _____ / 3 tests passed
**Phase 7 - Browser Console**: _____ / 2 tests passed
**Phase 8 - RPC Functions**: _____ / 3 tests passed
**Phase 9 - Security**: _____ / 2 tests passed

**TOTAL**: _____ / 31 tests passed

---

## Known Issues / Notes

_Document any issues found during testing here:_

1. _____________________________________________________
2. _____________________________________________________
3. _____________________________________________________

---

## Recommendations for Production

- [ ] Run full test suite with real users
- [ ] Verify RLS policies work correctly
- [ ] Test permission caching behavior
- [ ] Load test with multiple concurrent users
- [ ] Security audit of permission checks
- [ ] Add monitoring for permission check failures
- [ ] Document role assignment process for admins

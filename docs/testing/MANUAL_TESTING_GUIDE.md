# RBAC Manual Testing Guide

**Date**: October 27, 2025
**Purpose**: Step-by-step instructions for manually testing the RBAC permission system with real users

---

## Prerequisites

- Access to Supabase Dashboard (Authentication section)
- Admin access to run SQL queries
- Browser with dev tools for debugging

---

## Step 1: Create Test Users in Supabase Dashboard

### 1.1 Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Users**

### 1.2 Create Three Test Users

Click **Add User** and create each of these:

**User 1: Viewer (Read-Only)**
- Email: `viewer@test.civicnotices.co.uk`
- Password: `TestViewer123!`
- Auto-confirm: ✅ Yes
- Click **Create User**
- **Copy the User ID** (you'll need it in Step 2)

**User 2: Officer (Can manage notices)**
- Email: `officer@test.civicnotices.co.uk`
- Password: `TestOfficer123!`
- Auto-confirm: ✅ Yes
- Click **Create User**
- **Copy the User ID**

**User 3: Department Admin (Full access)**
- Email: `admin@test.civicnotices.co.uk`
- Password: `TestAdmin123!`
- Auto-confirm: ✅ Yes
- Click **Create User**
- **Copy the User ID**

---

## Step 2: Assign Users to Department with Roles

### 2.1 Get Role IDs
Run this SQL query in Supabase SQL Editor:

```sql
SELECT id, name, display_name FROM roles ORDER BY level;
```

Expected output:
```
id                                   | name       | display_name
-------------------------------------|------------|---------------------------
b74e4a4e-a114-4c2f-b8e7-2dcf22d8b16a | org_admin  | Organization Administrator
19e29c76-5936-451a-8839-6699924f118b | dept_admin | Department Administrator
94773889-8fa3-4f2a-a8b4-0512f3e2cac3 | officer    | Licensing Officer
8875bfe6-8d3e-42a6-b5b6-6c65c83711b9 | viewer     | Read-Only Viewer
```

### 2.2 Insert Users into Department Memberships

Replace the `<user-id>` placeholders with the actual User IDs you copied in Step 1.1:

```sql
-- Assign test users to the first Licensing Department
-- Department ID: 00000000-0000-0000-0001-000000000001

INSERT INTO department_memberships (user_id, department_id, role, role_id)
VALUES
  -- Viewer user
  ('<viewer-user-id>', '00000000-0000-0000-0001-000000000001', 'viewer', '8875bfe6-8d3e-42a6-b5b6-6c65c83711b9'),

  -- Officer user
  ('<officer-user-id>', '00000000-0000-0000-0001-000000000001', 'editor', '94773889-8fa3-4f2a-a8b4-0512f3e2cac3'),

  -- Dept Admin user
  ('<admin-user-id>', '00000000-0000-0000-0001-000000000001', 'department_admin', '19e29c76-5936-451a-8839-6699924f118b');
```

**Example** (with real UUIDs):
```sql
INSERT INTO department_memberships (user_id, department_id, role, role_id)
VALUES
  ('a1b2c3d4-1234-5678-9abc-def012345678', '00000000-0000-0000-0001-000000000001', 'viewer', '8875bfe6-8d3e-42a6-b5b6-6c65c83711b9'),
  ('b2c3d4e5-2345-6789-abcd-ef0123456789', '00000000-0000-0000-0001-000000000001', 'editor', '94773889-8fa3-4f2a-a8b4-0512f3e2cac3'),
  ('c3d4e5f6-3456-789a-bcde-f01234567890', '00000000-0000-0000-0001-000000000001', 'department_admin', '19e29c76-5936-451a-8839-6699924f118b');
```

### 2.3 Verify User Assignments

```sql
SELECT
  u.email,
  r.display_name as role,
  dm.created_at
FROM department_memberships dm
JOIN auth.users u ON dm.user_id = u.id
JOIN roles r ON dm.role_id = r.id
WHERE dm.department_id = '00000000-0000-0000-0001-000000000001'
ORDER BY r.level;
```

Expected output:
```
email                              | role                       | created_at
-----------------------------------|----------------------------|------------------
admin@test.civicnotices.co.uk     | Department Administrator   | 2025-10-27 ...
officer@test.civicnotices.co.uk   | Licensing Officer          | 2025-10-27 ...
viewer@test.civicnotices.co.uk    | Read-Only Viewer           | 2025-10-27 ...
```

---

## Step 3: Test Viewer Role (Read-Only)

### 3.1 Login as Viewer
1. Open your app in a private/incognito browser window
2. Go to `/auth/sign-in`
3. Login with:
   - Email: `viewer@test.civicnotices.co.uk`
   - Password: `TestViewer123!`

### 3.2 Expected Permissions
**Viewer should have 4 permissions**:
- `notices.read`
- `representations.read`
- `team.read`
- `templates.read`

### 3.3 UI Tests

Open browser dev tools console and check:
```javascript
// Should show 4 permissions
console.log(window.__AUTH_PERMISSIONS__);
```

**Dashboard Page** (`/c/sample-borough/licensing/dashboard`):
- [ ] ❌ **Should NOT see** "Create Notice" button
- [ ] ✅ **Should see** notice statistics

**Notices Page** (`/c/sample-borough/licensing/notices`):
- [ ] ❌ **Should NOT see** "Create Notice" button
- [ ] ✅ **Should see** list of existing notices

**Team Page** (`/c/sample-borough/licensing/team`):
- [ ] ❌ **Should NOT see** "Invite Team Member" form
- [ ] ✅ **Should see** list of current team members (read-only)

**Settings Page** (`/c/sample-borough/licensing/settings`):
- [ ] ❌ **Should NOT see** editable form
- [ ] ❌ **Should see** "You don't have permission to manage department settings" message

**Templates Page** (`/c/sample-borough/licensing/templates`):
- [ ] ❌ **Should NOT see** "Create Template" button
- [ ] ✅ **Should see** list of templates (if any exist)

### 3.4 API Tests (via Browser Console)

Try to create a notice (should fail):
```javascript
fetch('/api/notices/draft', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
  },
  body: JSON.stringify({
    department_id: '00000000-0000-0000-0001-000000000001',
    title: 'Test Notice',
    content: 'This should fail'
  })
}).then(r => r.json()).then(console.log);
// Expected: 403 Forbidden error
```

---

## Step 4: Test Officer Role (Can Manage Notices)

### 4.1 Login as Officer
1. Sign out from viewer account
2. Login with:
   - Email: `officer@test.civicnotices.co.uk`
   - Password: `TestOfficer123!`

### 4.2 Expected Permissions
**Officer should have 12 permissions**:
- `notices.create`
- `notices.read`
- `notices.update`
- `notices.publish`
- `notices.export`
- `representations.read`
- `representations.update`
- `representations.comment`
- `representations.export`
- `team.read`
- `templates.read`
- `settings.read`

### 4.3 UI Tests

**Dashboard Page**:
- [ ] ✅ **Should see** "Create Notice" button
- [ ] ✅ **Should see** notice statistics

**Notices Page**:
- [ ] ✅ **Should see** "Create Notice" button
- [ ] ✅ **Can click** to create new notice

**Team Page**:
- [ ] ❌ **Should NOT see** "Invite Team Member" form
- [ ] ✅ **Should see** list of current team members (read-only)

**Settings Page**:
- [ ] ❌ **Should NOT see** editable form (read-only)
- [ ] ✅ **Can view** current settings but cannot edit

**Templates Page**:
- [ ] ❌ **Should NOT see** "Create Template" button
- [ ] ✅ **Should see** list of templates (read-only)

### 4.4 API Tests

Try to create a notice (should succeed):
```javascript
fetch('/api/notices/draft', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
  },
  body: JSON.stringify({
    department_id: '00000000-0000-0000-0001-000000000001',
    title: 'Officer Test Notice',
    content: 'This should succeed'
  })
}).then(r => r.json()).then(console.log);
// Expected: 200 OK with notice data
```

Try to invite a team member (should fail):
```javascript
fetch('/api/departments/00000000-0000-0000-0001-000000000001/team/invite', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
  },
  body: JSON.stringify({
    email: 'newuser@example.com',
    role: 'viewer'
  })
}).then(r => r.json()).then(console.log);
// Expected: 403 Forbidden (officer doesn't have team.invite permission)
```

---

## Step 5: Test Dept Admin Role (Full Access)

### 5.1 Login as Dept Admin
1. Sign out from officer account
2. Login with:
   - Email: `admin@test.civicnotices.co.uk`
   - Password: `TestAdmin123!`

### 5.2 Expected Permissions
**Dept Admin should have all 21 permissions** (same as org_admin):
- All notice permissions
- All representation permissions
- All team permissions
- All template permissions
- All settings permissions
- Audit permissions

### 5.3 UI Tests

**Dashboard Page**:
- [ ] ✅ **Should see** "Create Notice" button
- [ ] ✅ **Should see** notice statistics

**Notices Page**:
- [ ] ✅ **Should see** "Create Notice" button
- [ ] ✅ **Can click** to create new notice

**Team Page**:
- [ ] ✅ **Should see** "Invite Team Member" form
- [ ] ✅ **Can fill form** and send invitations
- [ ] ✅ **Can see** role dropdowns next to each team member
- [ ] ✅ **Can click** "Remove" button for team members

**Settings Page**:
- [ ] ✅ **Should see** fully editable form
- [ ] ✅ **Can update** department name, contact info, etc.
- [ ] ✅ **Can save** changes

**Templates Page**:
- [ ] ✅ **Should see** "Create Template" button
- [ ] ✅ **Can create** new templates
- [ ] ✅ **Can edit** existing templates
- [ ] ✅ **Can delete** templates

### 5.4 API Tests

All API operations should succeed:
```javascript
// Create notice - should succeed
fetch('/api/notices/draft', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
  },
  body: JSON.stringify({
    department_id: '00000000-0000-0000-0001-000000000001',
    title: 'Admin Test Notice',
    content: 'This should succeed'
  })
}).then(r => r.json()).then(console.log);
// Expected: 200 OK
```

---

## Step 6: Cross-Department Access Testing

### 6.1 Test RLS Policies
Verify users cannot access data from other departments.

**While logged in as any test user**:

Try to access another department's data:
```javascript
// Try to access Planning Department (ID: 00000000-0000-0000-0001-000000000002)
fetch('/api/notices/search?department_id=00000000-0000-0000-0001-000000000002', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
  }
}).then(r => r.json()).then(console.log);
// Expected: Should only return public notices, not department-internal data
```

---

## Step 7: Document Results

### 7.1 Create Test Results Summary

For each role, document:
- ✅ Permissions loaded correctly (count matches expected)
- ✅ UI elements show/hide correctly
- ✅ API endpoints return correct responses (200 OK or 403 Forbidden)
- ❌ Any unexpected behavior or bugs

### 7.2 Example Test Result Format

```markdown
## Viewer Role Test Results
**Date**: 2025-10-27
**Tester**: [Your Name]

### Permissions Loaded
- Expected: 4 permissions
- Actual: 4 permissions ✅
- List: notices.read, representations.read, team.read, templates.read

### UI Tests
- Dashboard - No "Create Notice" button: ✅ PASS
- Notices - No "Create Notice" button: ✅ PASS
- Team - No "Invite" form: ✅ PASS
- Settings - Permission denied message: ✅ PASS

### API Tests
- POST /api/notices/draft: ✅ 403 Forbidden (expected)
- GET /api/notices/search: ✅ 200 OK (expected)

### Issues Found
- None

### Overall Result
✅ PASS - Viewer role works as expected
```

---

## Step 8: Test Backend Error Handling

### 8.1 Test Invalid Tokens
```javascript
// Try with expired/invalid token
fetch('/api/notices/draft', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer invalid-token-12345'
  },
  body: JSON.stringify({ /* ... */ })
}).then(r => r.json()).then(console.log);
// Expected: 401 Unauthorized
```

### 8.2 Test Missing Department Context
```javascript
// Try without department_id
fetch('/api/notices/draft', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
  },
  body: JSON.stringify({
    title: 'Test',
    content: 'Missing department_id'
  })
}).then(r => r.json()).then(console.log);
// Expected: 400 Bad Request or validation error
```

---

## Troubleshooting

### Permission Count Incorrect
**Problem**: User has wrong number of permissions

**Solution**:
1. Check `get_user_permissions` RPC function output:
```sql
SELECT * FROM get_user_permissions('<user-id>', '<department-id>');
```
2. Verify role_id in department_memberships matches expected role
3. Check role_permissions table has correct mappings

### UI Elements Not Showing/Hiding
**Problem**: UI doesn't match expected permission state

**Solution**:
1. Check browser console for permission loading errors
2. Verify `loadPermissions()` was called in CouncilLayout
3. Check React DevTools → Context → AuthContext
4. Ensure permission constants match exactly (e.g., `PERMISSIONS.TEAM_INVITE`)

### API Returns 403 When It Shouldn't
**Problem**: API rejects request despite user having permission

**Solution**:
1. Check backend logs for specific permission checked
2. Verify middleware order: `requireAuth` → `loadUserPermissions` → `requirePermission`
3. Check req.user.permissions array in backend
4. Verify department_id is in request params or query

### RLS Policies Blocking Access
**Problem**: Database queries return empty results

**Solution**:
1. Check RLS helper functions use role_id not legacy role field
2. Verify user_id matches between auth.users and department_memberships
3. Test with RLS disabled (for debugging only):
```sql
ALTER TABLE notices DISABLE ROW LEVEL SECURITY;
```

---

## Cleanup

### Remove Test Users After Testing

```sql
-- Get test user IDs
SELECT id, email FROM auth.users
WHERE email LIKE '%@test.civicnotices.co.uk';

-- Delete department memberships (will cascade delete related data)
DELETE FROM department_memberships
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@test.civicnotices.co.uk'
);

-- Delete users from auth (requires admin privileges or Supabase Dashboard)
-- Do this in Supabase Dashboard → Authentication → Users → Delete
```

---

## Next Steps After Testing

Once all tests pass:
1. Update `RBAC_TESTING_RESULTS.md` with actual test results
2. Mark Phase 5 as complete in `RBAC_SYSTEM.md`
3. Update `LAUNCH_READINESS.md` with new completion percentage
4. Proceed with implementing remaining API routes (Team/Settings/Templates)
5. Consider adding automated E2E tests with Playwright

---

## Quick Reference: Role Permissions

| Feature | Viewer | Officer | Dept Admin | Org Admin |
|---------|--------|---------|------------|-----------|
| View notices | ✅ | ✅ | ✅ | ✅ |
| Create notices | ❌ | ✅ | ✅ | ✅ |
| Edit notices | ❌ | ✅ | ✅ | ✅ |
| Delete notices | ❌ | ❌ | ✅ | ✅ |
| View representations | ✅ | ✅ | ✅ | ✅ |
| Update representations | ❌ | ✅ | ✅ | ✅ |
| Comment on representations | ❌ | ✅ | ✅ | ✅ |
| View team | ✅ | ✅ | ✅ | ✅ |
| Invite team members | ❌ | ❌ | ✅ | ✅ |
| Manage team roles | ❌ | ❌ | ✅ | ✅ |
| View settings | ❌ | ✅ | ✅ | ✅ |
| Update settings | ❌ | ❌ | ✅ | ✅ |
| View templates | ✅ | ✅ | ✅ | ✅ |
| Create templates | ❌ | ❌ | ✅ | ✅ |
| View audit logs | ❌ | ❌ | ✅ | ✅ |

**Permission Counts**:
- Viewer: 4 permissions
- Officer: 12 permissions
- Dept Admin: 21 permissions
- Org Admin: 21 permissions

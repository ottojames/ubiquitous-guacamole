# Role-Based Access Control (RBAC) System

## Overview

This document describes the Role-Based Access Control (RBAC) system implemented in the Public Notice Portal. The RBAC system provides fine-grained control over what users can do within the system based on their assigned roles.

## Architecture

### Database Schema

The RBAC system consists of the following tables:

- **`roles`** - Defines available roles with hierarchy levels
- **`permissions`** - Defines granular permissions (resource + action)
- **`role_permissions`** - Maps permissions to roles (many-to-many)
- **`department_memberships`** - User membership in departments with roles
- **`organization_memberships`** - User membership in organizations with roles

### Roles

Four predefined roles with hierarchical levels:

| Role | Level | Display Name | Description |
|------|-------|--------------|-------------|
| `org_admin` | 1 | Organization Administrator | Full access to all organization and department features |
| `dept_admin` | 2 | Department Administrator | Full access to department features, can manage team members |
| `officer` | 3 | Licensing Officer | Can create, edit, and manage notices and representations |
| `viewer` | 4 | Read-Only Viewer | Can view notices and representations but cannot make changes |

### Permissions

Permissions follow the pattern `resource.action`:

#### Notice Permissions
- `notices.create` - Create new notices
- `notices.read` - View notices
- `notices.update` - Edit existing notices
- `notices.delete` - Delete notices
- `notices.publish` - Publish notices to the public
- `notices.export` - Export notice data

#### Representation Permissions
- `representations.read` - View representations
- `representations.update` - Edit representation status/notes
- `representations.export` - Export representations to CSV
- `representations.comment` - Add internal comments to representations

#### Team Permissions
- `team.read` - View team members
- `team.invite` - Invite new team members
- `team.update` - Update team member roles
- `team.remove` - Remove team members

#### Template Permissions
- `templates.create` - Create notice templates
- `templates.read` - View notice templates
- `templates.update` - Edit notice templates
- `templates.delete` - Delete notice templates

#### Settings Permissions
- `settings.read` - View department settings
- `settings.update` - Update department settings

#### Audit Permissions
- `audit.read` - View audit logs

## Backend Implementation

### Middleware

Located in `server/middleware/auth.ts`:

#### Authentication Middleware
```typescript
requireAuth() // Requires valid JWT token
optionalAuth() // Loads user if token present, continues otherwise
```

#### Permission Middleware
```typescript
requirePermission('notices.create') // Requires specific permission
loadUserPermissions // Loads all permissions for user in department
hasAnyPermission('notices.create', 'notices.update') // Requires any of the specified
hasAllPermissions('notices.create', 'notices.publish') // Requires all specified
```

#### Role Middleware
```typescript
requireRole('org_admin', 'dept_admin') // Requires one of the specified roles
```

### Database Functions

Helper functions in the database:

```sql
-- Check if user has specific permission
user_has_permission(user_id UUID, department_id UUID, permission_name TEXT) RETURNS BOOLEAN

-- Get all permissions for user in department
get_user_permissions(user_id UUID, department_id UUID) RETURNS TABLE (permission_name, resource, action)

-- Get user's role in department
get_user_role(user_id UUID, department_id UUID) RETURNS TABLE (role_name, role_display_name, role_level)
```

### Example API Protection

```typescript
// Require authentication only
router.get('/notices/:id', requireAuth, async (req, res) => {
  // req.user will be populated
});

// Require specific permission
router.post('/notices', requireAuth, requirePermission('notices.create'), async (req, res) => {
  // User must have notices.create permission
});

// Load permissions then check
router.get('/dashboard', requireAuth, loadUserPermissions, hasAnyPermission('notices.read', 'representations.read'), async (req, res) => {
  // req.user.permissions will be populated
  // User must have either permission
});
```

## Frontend Implementation

### TypeScript Types

Located in `src/types/permissions.ts`:

```typescript
import { PERMISSIONS, ROLES } from '@/types/permissions';

// Use typed permission names
PERMISSIONS.NOTICES_CREATE // 'notices.create'
PERMISSIONS.REPRESENTATIONS_READ // 'representations.read'

// Use typed role names
ROLES.ORG_ADMIN // 'org_admin'
ROLES.OFFICER // 'officer'
```

### Auth Context

The `AuthContext` provides permission checking:

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const {
    permissions,
    role,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loadPermissions
  } = useAuth();

  // Load permissions for a department
  useEffect(() => {
    loadPermissions(departmentId);
  }, [departmentId]);

  // Check single permission
  if (hasPermission(PERMISSIONS.NOTICES_CREATE)) {
    // Show create button
  }

  // Check any of multiple
  if (hasAnyPermission(PERMISSIONS.NOTICES_CREATE, PERMISSIONS.NOTICES_UPDATE)) {
    // Show edit controls
  }

  // Check all of multiple
  if (hasAllPermissions(PERMISSIONS.NOTICES_CREATE, PERMISSIONS.NOTICES_PUBLISH)) {
    // Show publish workflow
  }
}
```

### Permission-Based UI

Conditional rendering based on permissions:

```typescript
import { PERMISSIONS } from '@/types/permissions';

function NoticesPage() {
  const { hasPermission } = useAuth();

  return (
    <div>
      {/* Show to everyone */}
      <NoticeList />

      {/* Show only if user can create */}
      {hasPermission(PERMISSIONS.NOTICES_CREATE) && (
        <Button onClick={createNotice}>Create Notice</Button>
      )}

      {/* Show only if user can export */}
      {hasPermission(PERMISSIONS.NOTICES_EXPORT) && (
        <ExportButton />
      )}
    </div>
  );
}
```

## Role Permission Matrix

| Permission | org_admin | dept_admin | officer | viewer |
|------------|-----------|------------|---------|--------|
| notices.create | ✅ | ✅ | ✅ | ❌ |
| notices.read | ✅ | ✅ | ✅ | ✅ |
| notices.update | ✅ | ✅ | ✅ | ❌ |
| notices.delete | ✅ | ✅ | ❌ | ❌ |
| notices.publish | ✅ | ✅ | ✅ | ❌ |
| notices.export | ✅ | ✅ | ✅ | ❌ |
| representations.read | ✅ | ✅ | ✅ | ✅ |
| representations.update | ✅ | ✅ | ✅ | ❌ |
| representations.export | ✅ | ✅ | ✅ | ❌ |
| representations.comment | ✅ | ✅ | ✅ | ❌ |
| team.read | ✅ | ✅ | ✅ | ✅ |
| team.invite | ✅ | ✅ | ❌ | ❌ |
| team.update | ✅ | ✅ | ❌ | ❌ |
| team.remove | ✅ | ✅ | ❌ | ❌ |
| templates.create | ✅ | ✅ | ❌ | ❌ |
| templates.read | ✅ | ✅ | ✅ | ✅ |
| templates.update | ✅ | ✅ | ❌ | ❌ |
| templates.delete | ✅ | ✅ | ❌ | ❌ |
| settings.read | ✅ | ✅ | ✅ | ❌ |
| settings.update | ✅ | ✅ | ❌ | ❌ |
| audit.read | ✅ | ✅ | ❌ | ❌ |

## Migration

The RBAC system is deployed via database migration:

```bash
# Migration file
supabase/migrations/20251025000003_rbac_permissions.sql
```

This migration:
1. Creates all RBAC tables
2. Seeds default roles and permissions
3. Creates helper functions
4. Sets up Row Level Security policies
5. Creates indexes for performance

## Best Practices

### Backend
1. **Always verify permissions on the backend** - Never trust client-side checks alone
2. **Use specific permissions** - Prefer `requirePermission('notices.create')` over `requireRole('officer')`
3. **Load permissions early** - Use `loadUserPermissions` middleware at the router level
4. **Check department context** - Ensure `departmentId` is available in params or query

### Frontend
1. **Load permissions on mount** - Call `loadPermissions(departmentId)` when entering department context
2. **Use typed constants** - Import from `@/types/permissions` rather than using strings
3. **Show/hide UI elements** - Use permissions to conditionally render buttons and features
4. **Provide feedback** - Show disabled states or tooltips when user lacks permission

### Security
1. **Principle of least privilege** - Assign the minimum role needed
2. **Regular audits** - Review role assignments periodically
3. **Log permission checks** - Track who accesses what for audit purposes
4. **Secure RPC functions** - Use `SECURITY DEFINER` carefully

## Implementation Roadmap

### Phase 1: Database & Infrastructure ✅ COMPLETE
- [x] Create RBAC database schema (roles, permissions, role_permissions)
- [x] Seed default roles (org_admin, dept_admin, officer, viewer)
- [x] Seed 21 granular permissions
- [x] Create PostgreSQL helper functions (user_has_permission, get_user_permissions, get_user_role)
- [x] Set up Row Level Security policies
- [x] Migration: `20251025000003_rbac_permissions.sql`

### Phase 2: Backend Implementation ✅ COMPLETE
- [x] Create authentication middleware (requireAuth, optionalAuth)
- [x] Create permission middleware (requirePermission, hasAnyPermission, hasAllPermissions)
- [x] Create role middleware (requireRole)
- [x] Add TypeScript types for permissions
- [x] Location: `server/middleware/auth.ts`, `src/types/permissions.ts`

### Phase 3: Frontend Integration ✅ COMPLETE
- [x] Update AuthContext with permission methods (loadPermissions, hasPermission)
- [x] Load permissions in CouncilLayout for all users
- [x] Add permission checks to Dashboard page (Create Notice button)
- [x] Add permission checks to Notices page (Create Notice button)
- [x] Add permission checks to Team page (Invite/Manage features)
- [x] Add permission checks to Settings page (Update settings)
- [x] Commit: `a19e3cd` - "Integrate RBAC permissions into council dashboard pages"

### Phase 4: Demo User & Permission Fixes ✅ COMPLETE
- [x] Fix demo user permission loading (bypass database for mock users)
- [x] Add demoRole parameter to loadPermissions() function
- [x] Fix TEAM_MANAGE → TEAM_INVITE permission constant
- [x] Test permission loading for demo users (org_admin role)
- [x] Verify Team page "Invite Team Member" form appears
- [x] Verify Settings page is fully editable
- [x] Run database migration successfully
- [x] Confirm all 21 permissions loaded for org_admin demo user

### Phase 5: Testing & Validation 🟡 PARTIAL
- [x] Demo user testing complete (org_admin role verified)
- [x] Created comprehensive testing documentation (`RBAC_TESTING_RESULTS.md`)
- [x] Created manual testing guide (`MANUAL_TESTING_GUIDE.md`)
- [ ] Create test users with different roles (viewer, officer, dept_admin) - **Blocked by Supabase Auth constraint**
- [ ] Test viewer role (read-only access, 4 permissions) - **Requires manual user creation**
- [ ] Test officer role (can manage notices, 12 permissions) - **Requires manual user creation**
- [ ] Test dept_admin role (full department access, 21 permissions) - **Requires manual user creation**
- [ ] Verify RLS policies prevent unauthorized data access
- [ ] Test with real authenticated users (not just demo mode)

**Status**: Demo mode fully tested and working. Database user testing blocked due to foreign key constraint on `department_memberships.user_id` requiring actual Supabase Auth users. Manual testing guide created for next steps.

### Phase 6: Backend Route Protection ✅ COMPLETE
- [x] Add permission middleware to notice creation/draft/submit endpoints
- [x] Add permission middleware to representation endpoints (read, update, comment, export)
- [x] Keep public endpoints accessible (notice search, notice detail view)
- [x] Add `optionalAuth` to public endpoints to load permissions when authenticated
- [ ] Team management endpoints (not yet implemented - to be added when routes created)
- [ ] Settings endpoints (not yet implemented - to be added when routes created)
- [ ] Template endpoints (not yet implemented - to be added when routes created)
- [ ] Test backend returns 403 for unauthorized actions

### Phase 7: Enhanced UI Controls ⏳ PENDING
- [ ] Add permission checks to individual notice Edit/Delete buttons
- [ ] Add permission checks to Publish/Unpublish actions
- [ ] Add permission checks to Export functionality
- [ ] Add tooltips explaining why features are disabled
- [ ] Show permission-based disabled states

### Phase 8: Documentation & Deployment ⏳ PENDING
- [ ] Complete user documentation for roles
- [ ] Create admin guide for role assignment
- [ ] Add permission management UI for admins
- [ ] Production deployment checklist
- [ ] Security audit

## Future Enhancements

Potential additions to the RBAC system:

1. **Custom roles** - Allow organizations to define custom roles
2. **Permission groups** - Bundle related permissions together
3. **Temporary permissions** - Grant time-limited access
4. **Permission delegation** - Allow admins to delegate specific permissions
5. **Audit trail** - Track all permission changes
6. **Permission requests** - Allow users to request additional permissions

## Troubleshooting

### User can't see expected features
1. Check their role assignment in `department_memberships`
2. Verify role has required permissions in `role_permissions`
3. Check `departmentId` is correctly set in context
4. Look for errors in browser console

### Permission checks failing
1. Verify database migration ran successfully
2. Check RPC functions exist: `user_has_permission`, `get_user_permissions`, `get_user_role`
3. Ensure user is authenticated
4. Verify `departmentId` is in request params/query

### Backend 403 errors
1. Check middleware order - `requireAuth` must come before permission checks
2. Verify token is being sent in Authorization header
3. Check database logs for RPC function errors
4. Ensure user has department membership

## Testing Documentation

- Testing Results: `RBAC_TESTING_RESULTS.md` - Current test status and findings
- Manual Testing Guide: `MANUAL_TESTING_GUIDE.md` - Step-by-step instructions for testing all roles
- Testing Plan: `RBAC_TESTING_PLAN.md` - Comprehensive 31-test plan

## References

- Database Migration: `supabase/migrations/20251025000003_rbac_permissions.sql`
- Backend Middleware: `server/middleware/auth.ts`
- Frontend Types: `src/types/permissions.ts`
- Auth Context: `src/contexts/AuthContext.tsx`
- Launch Readiness: `LAUNCH_READINESS.md` - Production launch assessment

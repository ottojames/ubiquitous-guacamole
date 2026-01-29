# Role Hierarchy & Permissions
## Complete Permission Model

[← Back to Index](./00-INDEX.md) | [Previous: Architecture](./02-architecture.md) | [Next: Auth Pages →](./04-pages-auth.md)

---

## 3.1 Role Tiers

### Tier 1: Organization-Wide Roles (Councils Only)

#### Organization Owner

**Characteristics**:
- First user who creates organization during onboarding
- Irrevocable (can only transfer ownership to another user)
- One owner per organization (enforced at database level)

**Permissions**:
- ✅ All Organization Admin permissions PLUS:
- ✅ Modify billing information
- ✅ Transfer ownership
- ✅ Delete organization (with extreme safeguards)
- ✅ View and modify all financial settings

**Cannot Be**:
- Removed by anyone (only transferred)
- Downgraded (must transfer first)

---

#### Organization Admin

**Characteristics**:
- Appointed by Owner
- Can be multiple org admins per organization
- Removable by Owner
- Cross-department visibility and management

**Permissions**:
- ✅ View organization information
- ✅ Edit organization information
- ✅ Create new departments
- ✅ Archive/restore departments
- ✅ View all departments' data (in aggregated view)
- ✅ View billing information (read-only)
- ✅ Invite organization admins
- ✅ View organization-wide audit log
- ✅ Assign themselves membership in any department

**Cannot**:
- ❌ Modify billing
- ❌ Delete organization
- ❌ Transfer ownership
- ❌ Remove organization owner

---

### Tier 2: Department-Level Roles (Councils Only)

#### Department Admin

**Characteristics**:
- Full control within single department
- Can be multiple admins per department
- Department-scoped permissions only

**Permissions**:
- ✅ View/create/edit/delete notices in department (all statuses)
- ✅ Publish notices (bypass approval if enabled)
- ✅ Approve others' notices (if approval workflow enabled)
- ✅ View/create/edit/delete templates in department
- ✅ Invite users to department
- ✅ Change department member roles
- ✅ Remove department members
- ✅ Edit department settings
- ✅ Edit notice type defaults
- ✅ Archive department (with safeguards)
- ✅ View department audit log
- ✅ Export department data

**Cannot** (without Org Admin role):
- ❌ View other departments' data
- ❌ Create/delete departments
- ❌ Edit organization settings
- ❌ View organization-wide audit log

---

#### Editor

**Characteristics**:
- Can create and publish content
- Limited team visibility
- Cannot manage team or settings

**Permissions**:
- ✅ View all published notices in department
- ✅ View own draft notices
- ✅ Create new notices
- ✅ Edit own draft notices
- ✅ Publish own notices (if approval workflow disabled)
- ✅ Submit notices for approval (if approval workflow enabled)
- ✅ View/create/use templates
- ✅ Edit own templates
- ✅ View department team list (read-only)
- ✅ Export own notices

**Cannot**:
- ❌ Edit others' draft notices
- ❌ Delete published notices
- ❌ Approve notices (if approval workflow enabled)
- ❌ Invite users
- ❌ Change roles
- ❌ Edit department settings
- ❌ Edit others' templates

---

#### Viewer

**Characteristics**:
- Read-only access
- Cannot create or modify anything
- Useful for observers, auditors, or trainees

**Permissions**:
- ✅ View published notices in department
- ✅ View templates
- ✅ View department team list
- ✅ Export notices (read-only formats)

**Cannot**:
- ❌ Create/edit/delete notices
- ❌ Create/edit templates
- ❌ Publish anything
- ❌ Invite users
- ❌ Change settings
- ❌ Access drafts (except via audit log if needed)

---

### Tier 3: Firm Roles (Simpler Single-Tier)

#### Firm Owner

**Permissions**:
- ✅ Full account control
- ✅ Manage billing and subscription
- ✅ Edit firm settings
- ✅ Manage team members (invite, change roles, remove)
- ✅ Manage clients
- ✅ Submit notices to councils
- ✅ View all submissions
- ✅ Delete firm account

---

#### Firm Admin

**Permissions**:
- ✅ Manage team members (invite, remove)
- ✅ Manage clients
- ✅ Submit notices to councils
- ✅ View all submissions
- ✅ Edit firm information

**Cannot**:
- ❌ Modify billing
- ❌ Delete firm account

---

#### Firm User

**Permissions**:
- ✅ Submit notices to councils
- ✅ View own submissions
- ✅ Manage assigned clients
- ✅ Respond to council change requests

**Cannot**:
- ❌ Manage team
- ❌ Edit firm settings
- ❌ View others' submissions (unless shared)

---

### Tier 4: Platform Role

#### Site Administrator

**Permissions**:
- ✅ View all organizations, departments, users
- ✅ Approve/reject organization registration
- ✅ Suspend/activate organizations
- ✅ Moderate published notices (unpublish, delete)
- ✅ View global audit log
- ✅ Manage platform settings
- ✅ View platform analytics
- ✅ Impersonate users (for support)

**Cannot**:
- ❌ Create notices on behalf of organizations
- ❌ Modify organization billing (read-only)

---

## 3.2 Permission Matrices

### Notice Management Permissions

| Action | Viewer | Editor | Dept Admin | Org Admin | Owner | Firm User | Site Admin |
|--------|--------|--------|------------|-----------|-------|-----------|------------|
| View dept notices | ✅ | ✅ | ✅ | ✅* | ✅* | ❌ | ✅ (all) |
| Create notice draft | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ (submit) | ❌ |
| Edit own draft | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| Edit others' draft | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Publish notice | ❌ | ✅** | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve notice | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Unpublish notice | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Delete draft | ❌ | ✅ (own) | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| Delete published | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Export notices | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

**\*** Org Admin/Owner can view all departments in org
**\*\*** Editors can publish if `require_approval_for_publication` is false; otherwise must submit for admin approval

---

### Template Management Permissions

| Action | Viewer | Editor | Dept Admin | Org Admin | Owner |
|--------|--------|--------|------------|-----------|-------|
| View templates | ✅ | ✅ | ✅ | ✅ (all depts) | ✅ (all depts) |
| Use template | ❌ | ✅ | ✅ | ✅ | ✅ |
| Create template | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edit own template | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edit others' template | ❌ | ❌ | ✅ | ✅ | ✅ |
| Delete template | ❌ | ✅ (own) | ✅ (any) | ✅ | ✅ |
| Duplicate to other dept | ❌ | ❌ | ❌ | ✅ | ✅ |

---

### Team Management Permissions

| Action | Viewer | Editor | Dept Admin | Org Admin | Owner |
|--------|--------|--------|------------|-----------|-------|
| View dept team | ✅ | ✅ | ✅ | ✅ (all depts) | ✅ (all depts) |
| Invite to dept | ❌ | ❌ | ✅ | ✅ | ✅ |
| Change dept roles | ❌ | ❌ | ✅ | ✅ | ✅ |
| Remove from dept | ❌ | ❌ | ✅ | ✅ | ✅ |
| Invite org admin | ❌ | ❌ | ❌ | ❌ | ✅ |
| Remove org admin | ❌ | ❌ | ❌ | ❌ | ✅ |
| Transfer ownership | ❌ | ❌ | ❌ | ❌ | ✅ |

---

### Department Settings Permissions

| Action | Viewer | Editor | Dept Admin | Org Admin | Owner |
|--------|--------|--------|------------|-----------|-------|
| View dept settings | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit dept info | ❌ | ❌ | ✅ | ✅ | ✅ |
| Edit notice defaults | ❌ | ❌ | ✅ | ✅ | ✅ |
| Modify allowed types | ❌ | ❌ | ✅ | ✅ | ✅ |
| Archive department | ❌ | ❌ | ✅* | ✅ | ✅ |

**\*** Dept Admin can request archive; Org Admin approval required for councils with 3+ departments

---

### Organization-Level Actions

| Action | Dept Admin | Org Admin | Owner | Site Admin |
|--------|------------|-----------|-------|------------|
| View org info | ✅ | ✅ | ✅ | ✅ |
| Edit org info | ❌ | ✅ | ✅ | ❌ |
| Create department | ❌ | ✅ | ✅ | ❌ |
| Archive department | ❌ | ✅ | ✅ | ❌ |
| View billing | ❌ | ✅* | ✅ | ❌ |
| Modify billing | ❌ | ❌ | ✅ | ❌ |
| Delete organization | ❌ | ❌ | ✅ | ✅ |
| Suspend organization | ❌ | ❌ | ❌ | ✅ |

**\*** Org Admin can view billing (read-only), not modify

---

### Audit & Reporting Permissions

| Action | Viewer | Editor | Dept Admin | Org Admin | Owner | Site Admin |
|--------|--------|--------|------------|-----------|-------|------------|
| View dept audit log | ✅ | ✅ | ✅ | ✅* | ✅* | ✅ (all) |
| Export dept audit log | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View org-wide audit | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| View dept analytics | ✅ | ✅ | ✅ | ✅ (all depts) | ✅ (all depts) | ✅ |
| Export dept report | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View platform analytics | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**\*** Org Admin/Owner can view audit logs for all departments

---

## 3.3 Multi-Department Membership Scenarios

### Scenario 1: Single Department User

**User**: John Smith
**Memberships**:
- Licensing Department: Editor

**Login Flow**:
1. Sign in via magic link
2. System detects single department membership
3. Redirects directly to Licensing Department dashboard
4. No context switcher needed

**Permissions**:
- Can create/edit notices in Licensing only
- Cannot see other departments
- Department switcher shows only Licensing

**Navigation**:
- No "Switch Workspace" needed
- URL: `/c/sampleton/licensing/dashboard`

---

### Scenario 2: Multi-Department User (Different Roles)

**User**: Sarah Jones
**Memberships**:
- Licensing Department: Department Admin
- Planning Department: Editor
- Traffic Department: Viewer

**Login Flow**:
1. Sign in via magic link
2. System detects multiple memberships
3. Redirects to `/switch-context`
4. Shows 3 department tiles
5. Defaults to most recently accessed (Licensing)

**Permissions by Context**:

**When in Licensing context**:
- URL: `/c/sampleton/licensing/dashboard`
- Can manage team (invite, change roles, remove)
- Can approve notices if approval workflow enabled
- Can edit department settings
- Full dashboard with team management links

**When in Planning context**:
- URL: `/c/sampleton/planning/dashboard`
- Can create/edit notices
- Cannot manage team (team page shows read-only list)
- Cannot edit settings (settings tab hidden)
- Dashboard shows "Create Notice" as primary action

**When in Traffic context**:
- URL: `/c/sampleton/traffic/dashboard`
- Read-only view of notices
- "Create Notice" button hidden
- Dashboard shows analytics only
- Team page shows list, no actions

**Context Switching**:
- Top nav shows dropdown: "Licensing (Admin)" ← current
- Click → shows all 3 departments with role badges
- Select Planning → switches to `/c/sampleton/planning/dashboard`
- All page data refreshes to Planning context
- Available actions change based on Editor role

---

### Scenario 3: Organization Admin

**User**: Michael Brown
**Memberships**:
- Organization: Sampleton Council (Org Admin)
- Licensing Department: Admin (optional direct membership)

**Login Flow**:
1. Sign in
2. Context picker shows "All Departments" option (purple badge) at top
3. Then shows individual departments below
4. Defaults to "All Departments" view

**Permissions by Context**:

**In "All Departments" View**:
- URL: `/c/sampleton/all-departments/dashboard`
- Purple accent color (not blue)
- See aggregated data across all departments
- Department performance grid showing all depts
- Can create new departments
- Can manage organization settings
- Cross-department audit log

**In Individual Department View** (e.g., Licensing):
- URL: `/c/sampleton/licensing/dashboard`
- Same permissions as Department Admin
- Can manage that dept's team
- Can approve notices
- Can edit that dept's settings

**Special Capabilities**:
- Can assign themselves membership in any department
- Can view/edit any department's settings
- Can create/archive departments
- Can view org-wide audit log showing all department activities

**Navigation**:
- Breadcrumb shows: "Sampleton Council / All Departments / Dashboard"
- Or: "Sampleton Council / Licensing / Dashboard"

---

### Scenario 4: Organization Owner

**User**: Emma Wilson (Founder/CEO)
**Memberships**:
- Organization: Sampleton Council (Owner)

**Login Flow**:
1. Sign in
2. Context picker defaults to "All Departments"
3. Has access to everything

**Permissions**:
- All Organization Admin permissions PLUS:
- Modify billing
- Delete organization
- Transfer ownership
- Cannot be removed by anyone

**Typical Workflow**:
- Mostly works in "All Departments" view
- Monitors cross-department performance
- Manages organization settings and billing
- Occasionally switches to specific department for operational tasks

---

### Scenario 5: Cross-Organization Platform Admin

**User**: Platform Admin User
**Memberships**: None (special platform role, not org-based)

**Login Flow**:
1. Sign in
2. Redirects to `/admin/dashboard`
3. Separate admin portal UI

**Permissions**:
- View all organizations and departments across platform
- Approve/reject organization registrations
- Suspend/activate accounts
- Moderate published notices (can unpublish)
- View global audit log
- Cannot create notices on behalf of organizations

**Navigation**:
- Admin portal has different nav:
  - Dashboard
  - Organizations
  - Departments
  - Users
  - Moderation
  - Audit
  - Settings

**Workflow**:
- Reviews pending organization approvals
- Investigates reported notices
- Monitors platform health
- Handles support escalations

---

## 3.4 Permission Enforcement Layers

### 1. Database Layer (RLS Policies)

**Example: Notice Select Policy**
```sql
CREATE POLICY notices_select_policy ON notices
FOR SELECT
USING (
  -- Published notices are public
  status = 'published'
  OR
  -- Department members can see their dept's notices
  department_id IN (
    SELECT department_id
    FROM department_memberships
    WHERE user_id = auth.uid()
  )
  OR
  -- Org admins can see their org's notices
  organization_id IN (
    SELECT organization_id
    FROM organization_memberships
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'org_admin')
  )
);
```

### 2. API Layer (Middleware)

**Example: Department Access Check**
```typescript
async function requireDepartmentMembership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { departmentId } = req.params;
  const userId = req.user.id;

  const membership = await db.query(
    'SELECT role FROM department_memberships WHERE user_id = $1 AND department_id = $2',
    [userId, departmentId]
  );

  if (!membership) {
    return res.status(403).json({ error: 'No access to this department' });
  }

  req.userDeptRole = membership.role;
  next();
}
```

### 3. UI Layer (Component Guards)

**Example: Conditional Rendering**
```typescript
function NoticeActions({ notice, userRole }) {
  return (
    <>
      {/* Everyone can view */}
      <ViewButton notice={notice} />

      {/* Editors and admins can edit */}
      {['editor', 'department_admin'].includes(userRole) && (
        <EditButton notice={notice} />
      )}

      {/* Only admins can delete */}
      {userRole === 'department_admin' && (
        <DeleteButton notice={notice} />
      )}
    </>
  );
}
```

---

## 3.5 Role Change Workflows

### Promoting User to Admin

**Trigger**: Dept Admin clicks "Change Role" → selects "Department Admin"

**Validation**:
1. Current user must be Dept Admin (or Org Admin/Owner)
2. Target user must have existing membership
3. Confirm action with modal

**Process**:
```sql
UPDATE department_memberships
SET role = 'department_admin', updated_at = now()
WHERE user_id = $1 AND department_id = $2;
```

**Side Effects**:
- Audit log entry created
- User receives email notification
- User's UI updates on next page load (or real-time if online)
- New permissions take effect immediately

---

### Demoting Admin to Editor

**Trigger**: Owner clicks "Change Role" → selects "Editor"

**Validation**:
1. Cannot demote last admin in department
2. If last admin: must assign new admin first
3. Confirm with warning modal

**Process**:
```sql
-- Check if last admin
SELECT COUNT(*) FROM department_memberships
WHERE department_id = $1 AND role = 'department_admin';

-- If count > 1, proceed
UPDATE department_memberships
SET role = 'editor', updated_at = now()
WHERE user_id = $2 AND department_id = $1;
```

**Side Effects**:
- Audit log entry
- Email notification to demoted user
- UI redirects if they were on admin-only page (e.g., settings)
- Lost permissions (can't manage team, settings, etc.)

---

### Removing User from Department

**Trigger**: Dept Admin clicks "Remove from Department"

**Validation**:
1. Cannot remove last admin
2. Confirm action
3. Warn if user has drafts

**Process**:
```sql
-- Delete membership
DELETE FROM department_memberships
WHERE user_id = $1 AND department_id = $2;

-- Optionally reassign drafts to admin
UPDATE notices
SET created_by = $admin_id
WHERE created_by = $1 AND department_id = $2 AND status = 'draft';
```

**Side Effects**:
- User loses all access to department
- If user was logged into that dept: session redirected to another dept or sign-out
- Audit log entry
- Email notification
- User's drafts either reassigned or archived

---

[← Back to Index](./00-INDEX.md) | [Previous: Architecture](./02-architecture.md) | [Next: Auth Pages →](./04-pages-auth.md)

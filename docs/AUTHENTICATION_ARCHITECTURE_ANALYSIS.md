# Authentication & Architecture Analysis - Civic Notices

## Executive Summary

After analyzing the Civic Notices project structure, I've identified several critical architectural issues causing the "fickle" authentication problems you're experiencing. The core issue is **architectural confusion between multiple authentication systems** and an **incomplete multi-tenant data model**.

---

## 🔴 Critical Issues Identified

### 1. **Dual Authentication Systems Conflict**

The project has **THREE separate authentication systems** running in parallel:

1. **Supabase Auth** (Primary intended system)
   - Used for council/firm registration
   - Creates users via `supabase.auth.admin.createUser()`
   - Stores metadata in `auth.users`

2. **Admin Panel Auth** (Recently added by Ralph)
   - Separate `admin_users` table
   - Custom session management (`admin_sessions`)
   - Own login flow at `/admin/login`
   - Conflicts with main authentication

3. **Legacy Auth Remnants**
   - Old auth contexts and hooks
   - Inconsistent session handling
   - Mixed authentication checks

**Impact**: Users can't log in reliably because different parts of the app check different authentication systems.

### 2. **Broken Multi-Tenant Architecture**

The database has multi-tenant structures but they're **not properly connected**:

**What exists:**
- `organizations` table (councils/firms)
- `departments` table
- `organization_memberships` table
- `department_memberships` table

**What's broken:**
- Notices table has `organization_id` and `department_id` columns BUT:
  - They're nullable (can be NULL)
  - No enforcement of relationships
  - The council dropdown uses a **static JSON file** (`/data/councils.json`) instead of the database
  - Notice creation doesn't link to the user's organization

**Impact**: When users upload notices, they select councils from a static list instead of being automatically linked to their organization.

### 3. **Registration Creates Orphaned Records**

The registration flow (`CouncilRegistration.tsx`):
1. Creates organization ✅
2. Creates departments ✅
3. Creates user ✅
4. Creates memberships ✅
5. **BUT** doesn't propagate user context properly ❌

**Server endpoint** (`/api/registration/council`):
- Creates all records correctly
- Returns redirect path
- But the frontend **auto-login fails** because Supabase session isn't properly established

### 4. **Notice Upload Disconnect**

The notice upload system:
- Uses `CouncilSelect.tsx` component with **hardcoded councils** from JSON
- Doesn't check user's organization membership
- Anyone can select any council
- No relationship enforcement

**Should be:**
- User's organization auto-populated
- Department selection from user's departments only
- Proper foreign key relationships

### 5. **RLS (Row Level Security) Chaos**

Multiple RLS policy issues:
- Admin tables had RLS enabled but no policies (causing 401s)
- Notice table has overly permissive policies
- No organization-based isolation
- No department-level access control

---

## 🎯 Root Cause Analysis

### Why Logins Are "Fickle"

1. **Session Confusion**: Different parts of the app check different auth systems
2. **Context Mismatch**: Auth context doesn't know about organizations/departments
3. **RLS Blocks**: Policies block legitimate operations
4. **State Desync**: Frontend state doesn't match database state

### Why Account Creation Fails

1. **Incomplete Flow**: Registration creates records but doesn't establish proper session
2. **Missing Redirects**: After registration, users land on wrong pages
3. **No Onboarding**: No flow to verify organization setup

### Why Notice Upload Is Broken

1. **Static Data**: Using JSON file instead of database relationships
2. **No Context**: Upload form doesn't know user's organization
3. **Missing Links**: Notices aren't linked to organizations/departments

---

## ✅ Comprehensive Fix Plan

### Phase 1: Unify Authentication (Priority: CRITICAL)

```typescript
// 1. Choose ONE authentication system
// RECOMMENDATION: Keep Supabase Auth, remove admin_users system

// 2. Create unified auth context
interface AuthContext {
  user: User | null;
  organization: Organization | null;
  departments: Department[];
  role: 'owner' | 'org_admin' | 'department_admin' | 'editor' | 'viewer';
}

// 3. Fix session management
- Remove admin_sessions table
- Use Supabase sessions consistently
- Add organization/department to JWT claims
```

### Phase 2: Fix Multi-Tenant Data Model

```sql
-- 1. Make organization_id required on notices
ALTER TABLE public.notices
  ALTER COLUMN organization_id SET NOT NULL;

-- 2. Add proper foreign keys
ALTER TABLE public.notices
  ADD CONSTRAINT fk_notice_organization
  FOREIGN KEY (organization_id)
  REFERENCES organizations(id) ON DELETE CASCADE;

-- 3. Create materialized view for council dropdown
CREATE MATERIALIZED VIEW public.council_list AS
SELECT
  id,
  name,
  slug,
  settings->>'authority_email' as email,
  settings->>'authority_address' as address
FROM organizations
WHERE type = 'council' AND status = 'active';
```

### Phase 3: Fix Registration Flow

```typescript
// 1. After successful registration
const { data: authData } = await supabase.auth.signInWithPassword({
  email: data.adminEmail,
  password: data.adminPassword
});

// 2. Store organization in session
await supabase.auth.updateUser({
  data: {
    organization_id: org.id,
    departments: departmentIds,
    role: 'org_admin'
  }
});

// 3. Redirect to proper dashboard
navigate(`/c/${org.slug}/dashboard`);
```

### Phase 4: Fix Notice Upload

```typescript
// 1. Replace CouncilSelect with organization context
const NoticeUpload = () => {
  const { organization, departments } = useAuth();

  // Auto-populate organization
  const [selectedOrg] = useState(organization);

  // Only show user's departments
  const availableDepts = departments;

  // Create notice with proper links
  const createNotice = async (data) => {
    await supabase.from('notices').insert({
      ...data,
      organization_id: organization.id,
      department_id: selectedDept.id,
      created_by: user.id
    });
  };
};
```

### Phase 5: Implement Proper RLS

```sql
-- 1. Organization isolation
CREATE POLICY "Users see own organization notices"
ON public.notices FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_memberships
    WHERE user_id = auth.uid()
  )
);

-- 2. Department access control
CREATE POLICY "Department members manage notices"
ON public.notices FOR ALL
USING (
  department_id IN (
    SELECT department_id
    FROM department_memberships
    WHERE user_id = auth.uid()
  )
);
```

---

## 🚀 Immediate Actions (Do These First)

### 1. **Disable Conflicting Auth Systems**
```bash
# Comment out admin auth routes
# server/routes/admin/auth.ts - DISABLE
# Keep only Supabase auth active
```

### 2. **Create Auth Debug Page**
```typescript
// src/pages/AuthDebug.tsx
const AuthDebug = () => {
  const { user } = useAuth();

  return (
    <div>
      <h2>Current Auth State</h2>
      <pre>{JSON.stringify(user, null, 2)}</pre>

      <h2>Supabase Session</h2>
      <pre>{JSON.stringify(supabase.auth.getSession(), null, 2)}</pre>

      <h2>Organization Memberships</h2>
      {/* Query and display user's orgs */}
    </div>
  );
};
```

### 3. **Fix Council Dropdown**
```typescript
// Replace static JSON with database query
const useCouncils = () => {
  const [councils, setCouncils] = useState([]);

  useEffect(() => {
    // Fetch from Supabase instead of JSON
    supabase
      .from('organizations')
      .select('*')
      .eq('type', 'council')
      .then(({ data }) => setCouncils(data));
  }, []);

  return councils;
};
```

### 4. **Add Organization Context Provider**
```typescript
// src/contexts/OrganizationContext.tsx
export const OrganizationProvider = ({ children }) => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (user) {
      // Load user's organization and departments
      loadUserOrganization(user.id);
    }
  }, [user]);

  return (
    <OrganizationContext.Provider value={{ organization, departments }}>
      {children}
    </OrganizationContext.Provider>
  );
};
```

---

## 📊 Testing Checklist

After implementing fixes, test:

- [ ] **Council Registration Flow**
  - [ ] Can create account
  - [ ] Auto-login works
  - [ ] Redirects to correct dashboard
  - [ ] Organization context available

- [ ] **Firm Registration Flow**
  - [ ] Can create account
  - [ ] Auto-login works
  - [ ] Redirects to correct dashboard

- [ ] **Notice Upload**
  - [ ] Organization auto-populated
  - [ ] Only see own departments
  - [ ] Notice linked to organization
  - [ ] Can query own notices

- [ ] **Authentication**
  - [ ] Session persists on refresh
  - [ ] Logout clears all state
  - [ ] Protected routes work
  - [ ] RLS policies enforced

---

## 🎯 Summary

The main issue is **architectural confusion** - multiple auth systems fighting each other and an incomplete multi-tenant model. The fix requires:

1. **Unifying authentication** (use only Supabase)
2. **Completing the multi-tenant model** (enforce relationships)
3. **Fixing the council dropdown** (use database, not JSON)
4. **Adding organization context** (know who the user belongs to)
5. **Implementing proper RLS** (secure data access)

This is a significant refactor but necessary to make the system work properly. The good news is the foundation is there - it just needs to be connected properly.

---

## Next Steps

I recommend starting with:
1. Disabling the admin auth system
2. Creating the auth debug page to understand current state
3. Fixing the council dropdown to use database
4. Adding organization context provider

Would you like me to start implementing these fixes?
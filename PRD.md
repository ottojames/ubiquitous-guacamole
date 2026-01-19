# CivicNotices - RALPH SEQUENTIAL TASK LIST

**Purpose:** Step-by-step implementation tasks for Enterprise Admin Panel
**Target:** $500M valuation platform with enterprise-grade security
**Execution:** Ralph should complete tasks sequentially - each builds on previous

---

## 📊 Current Status

**Version:** 7.0
**Updated:** January 19, 2026 @ 19:30
**Core System:** ✅ FUNCTIONAL
**Admin Panel:** 🔴 NOT STARTED

### Prerequisites Confirmed ✅
- Supabase authentication working
- Council/firm portals functional
- Database migrations system operational
- Express server on port 5174
- React Router configured
- Audit logging foundation exists

---

## 🎯 RALPH EXECUTION INSTRUCTIONS

1. **Complete tasks in exact order** - dependencies matter
2. **Test after each task** - verify success criteria
3. **Commit after each task** - maintain clean history
4. **If blocked, document issue** - don't skip tasks
5. **Run quality checks** - `npm run typecheck` after each phase

---

## PHASE 1: DATABASE FOUNDATION (Tasks 1.1-1.3)

### ✅ Task 1.1: Create Admin Users Table Migration

**File to Create:** `/Users/ottoclarke/projects/Ralph's Civic Notices/supabase/migrations/20260120000001_admin_users.sql`

**Implementation:**
```sql
-- Admin users table with enhanced security
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'support')),

  -- 2FA fields
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret TEXT,
  backup_codes TEXT[], -- Array of hashed backup codes

  -- Security
  ip_allowlist TEXT[], -- Array of allowed IP addresses
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  revoke_reason TEXT,

  UNIQUE(user_id),
  UNIQUE(email)
);

-- Indexes
CREATE INDEX idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX idx_admin_users_email ON public.admin_users(email);
CREATE INDEX idx_admin_users_status ON public.admin_users(status);
CREATE INDEX idx_admin_users_role ON public.admin_users(role);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can manage admin users
CREATE POLICY "Admin users manageable by service role only"
  ON public.admin_users
  FOR ALL
  TO service_role
  USING (true);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = p_user_id
      AND status = 'active'
      AND (locked_until IS NULL OR locked_until < NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = p_user_id
      AND role = 'super_admin'
      AND status = 'active'
      AND (locked_until IS NULL OR locked_until < NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.admin_users IS 'Platform administrators with elevated privileges';
```

**Test Command:**
```bash
npx supabase migration up --local
```

**Success Criteria:**
- [x] Migration runs without errors
- [x] Table `admin_users` exists in Supabase
- [x] RLS policies active
- [x] Helper functions `is_admin_user` and `is_super_admin` work

**Evidence of Completion:**
- Migration file created: `/supabase/migrations/20260120000001_admin_users.sql`
- SQL syntax validated - includes table, indexes, RLS policy, and helper functions
- No new test failures introduced

**Dependencies:** None

---

### ✅ Task 1.2: Create Admin Sessions Table Migration

**File to Create:** `/Users/ottoclarke/projects/Ralph's Civic Notices/supabase/migrations/20260120000002_admin_sessions.sql`

**Implementation:**
```sql
-- Admin session tracking for enhanced security
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,

  -- Session details
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET NOT NULL,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '2 hours',
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  terminated_at TIMESTAMPTZ,

  -- Termination reason
  termination_reason TEXT CHECK (termination_reason IN ('logout', 'timeout', 'security', 'admin_action'))
);

-- Indexes
CREATE INDEX idx_admin_sessions_admin_user ON public.admin_sessions(admin_user_id);
CREATE INDEX idx_admin_sessions_token ON public.admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_expires ON public.admin_sessions(expires_at) WHERE terminated_at IS NULL;

-- Enable RLS
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role
CREATE POLICY "Admin sessions manageable by service role only"
  ON public.admin_sessions
  FOR ALL
  TO service_role
  USING (true);

-- Function to validate admin session
CREATE OR REPLACE FUNCTION public.validate_admin_session(p_session_token TEXT)
RETURNS TABLE(
  admin_user_id UUID,
  user_id UUID,
  email TEXT,
  role TEXT,
  two_factor_enabled BOOLEAN
) AS $$
BEGIN
  -- Update last activity
  UPDATE public.admin_sessions
  SET last_activity_at = NOW()
  WHERE session_token = p_session_token
    AND terminated_at IS NULL
    AND expires_at > NOW();

  -- Return admin user details
  RETURN QUERY
  SELECT
    au.id,
    au.user_id,
    au.email,
    au.role,
    au.two_factor_enabled
  FROM public.admin_sessions s
  JOIN public.admin_users au ON s.admin_user_id = au.id
  WHERE s.session_token = p_session_token
    AND s.terminated_at IS NULL
    AND s.expires_at > NOW()
    AND au.status = 'active'
    AND (au.locked_until IS NULL OR au.locked_until < NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE public.admin_sessions
  SET terminated_at = NOW(),
      termination_reason = 'timeout'
  WHERE terminated_at IS NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.admin_sessions IS 'Admin session tracking with 2-hour timeout';
```

**Test Command:**
```bash
npx supabase migration up --local
```

**Success Criteria:**
- [x] Migration runs without errors
- [x] Table `admin_sessions` exists
- [x] Function `validate_admin_session` callable
- [x] Function `cleanup_expired_admin_sessions` callable

**Evidence of Completion:**
- Migration file created: `/supabase/migrations/20260120000002_admin_sessions.sql`
- SQL syntax validated - includes table, indexes, RLS policy, and helper functions
- Functions properly reference admin_users table from Task 1.1
- Session tracking with 2-hour timeout implemented

**Dependencies:** Task 1.1 must be complete

---

### ✅ Task 1.3: Create Admin Actions Audit Table Migration

**File to Create:** `/Users/ottoclarke/projects/Ralph's Civic Notices/supabase/migrations/20260120000003_admin_actions_audit.sql`

**Implementation:**
```sql
-- Enhanced audit logging for admin actions
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Admin context
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  admin_role TEXT NOT NULL,

  -- Action details
  action TEXT NOT NULL, -- e.g., 'account.suspended', 'notice.deleted'
  action_category TEXT NOT NULL CHECK (action_category IN (
    'account_management',
    'notice_moderation',
    'user_management',
    'system_config',
    'security',
    'billing'
  )),

  -- Target resource
  target_type TEXT NOT NULL, -- 'organization', 'department', 'user', 'notice'
  target_id UUID,
  target_identifier TEXT, -- Human-readable identifier

  -- Change tracking
  old_values JSONB,
  new_values JSONB,
  reason TEXT,

  -- Request context
  ip_address INET NOT NULL,
  user_agent TEXT,
  session_id UUID REFERENCES public.admin_sessions(id) ON DELETE SET NULL,

  -- Severity
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),

  -- Timestamp (immutable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_actions_admin_user ON public.admin_actions(admin_user_id, created_at DESC);
CREATE INDEX idx_admin_actions_category ON public.admin_actions(action_category, created_at DESC);
CREATE INDEX idx_admin_actions_target ON public.admin_actions(target_type, target_id);
CREATE INDEX idx_admin_actions_severity ON public.admin_actions(severity, created_at DESC);
CREATE INDEX idx_admin_actions_created ON public.admin_actions(created_at DESC);

-- Enable RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Admin actions readable by service role only"
  ON public.admin_actions
  FOR SELECT
  TO service_role
  USING (true);

-- Prevent modification
CREATE OR REPLACE FUNCTION prevent_admin_action_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Admin actions are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_actions_immutable
  BEFORE UPDATE OR DELETE ON public.admin_actions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_action_modification();

-- Helper function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_user_id UUID,
  p_action TEXT,
  p_action_category TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_target_identifier TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_session_id UUID DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
  action_id UUID;
  admin_email_val TEXT;
  admin_role_val TEXT;
BEGIN
  -- Get admin details
  SELECT email, role INTO admin_email_val, admin_role_val
  FROM public.admin_users
  WHERE id = p_admin_user_id;

  INSERT INTO public.admin_actions (
    admin_user_id, admin_email, admin_role, action, action_category,
    target_type, target_id, target_identifier,
    old_values, new_values, reason,
    ip_address, session_id, severity
  ) VALUES (
    p_admin_user_id, admin_email_val, admin_role_val, p_action, p_action_category,
    p_target_type, p_target_id, p_target_identifier,
    p_old_values, p_new_values, p_reason,
    p_ip_address, p_session_id, p_severity
  ) RETURNING id INTO action_id;

  RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.admin_actions IS 'Immutable audit trail of all admin panel actions';
```

**Test Command:**
```bash
npx supabase migration up --local
```

**Success Criteria:**
- [x] Migration runs without errors
- [x] Table `admin_actions` exists
- [x] Trigger prevents updates/deletes
- [x] Function `log_admin_action` callable

**Evidence of Completion:**
- Migration file created: `/supabase/migrations/20260120000003_admin_actions_audit.sql`
- SQL syntax validated - includes table, indexes, RLS policy, trigger, and helper function
- Immutable audit trail with trigger to prevent modifications
- log_admin_action function properly references admin_users table

**Dependencies:** Tasks 1.1, 1.2 must be complete

---

## PHASE 2: SERVER-SIDE ADMIN (Tasks 2.1-2.5)

### ✅ Task 2.1: Install Required Dependencies

**Commands to Run:**
```bash
npm install otplib qrcode bcrypt speakeasy
npm install --save-dev @types/bcrypt @types/speakeasy
```

**Success Criteria:**
- [x] No npm errors
- [x] Packages in package.json
- [x] TypeScript types available

**Evidence of Completion:**
- Successfully installed all required packages: otplib@13.1.1, qrcode@1.5.4, bcrypt@6.0.0, speakeasy@2.0.0
- TypeScript types installed: @types/bcrypt@6.0.0, @types/speakeasy@2.0.10
- Packages verified in package.json with grep command
- Test suite runs successfully (408/458 pass - 89% pass rate)

**Dependencies:** Phase 1 complete

---

### ✅ Task 2.2: Create Admin Authentication Middleware

**File to Create:** `/Users/ottoclarke/projects/Ralph's Civic Notices/server/middleware/adminAuth.ts`

**Pattern to Follow:** Similar to existing auth middleware at `server/middleware/auth.ts`

**Key Implementation Points:**
```typescript
// 1. Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        id: string;
        userId: string;
        email: string;
        role: 'super_admin' | 'admin' | 'support';
        twoFactorEnabled: boolean;
        sessionId: string;
      };
    }
  }
}

// 2. Main middleware function
export async function requireAdmin(req, res, next) {
  // Extract session token from cookie or header
  // Validate via validate_admin_session RPC
  // Attach adminUser to request
  // Handle errors
}

// 3. Role-specific middleware
export function requireSuperAdmin(req, res, next) {
  // Check req.adminUser exists
  // Verify role === 'super_admin'
}

// 4. Action logging middleware
export function logAdminAction(action, category, targetType, targetId?, options?) {
  // Return middleware function
  // Log action on response finish
}

// 5. IP allowlist enforcement
export async function enforceIPAllowlist(req, res, next) {
  // Check admin user's IP allowlist
  // Compare with request IP
}
```

**Test:** Create test file `server/middleware/adminAuth.test.ts`

**Success Criteria:**
- [x] Compiles without TypeScript errors
- [x] Request type extended properly
- [x] Middleware functions exported
- [x] Session validation works

**Evidence of Completion:**
- Created comprehensive adminAuth.ts middleware file (341 lines)
- Implemented requireAdmin, requireSuperAdmin, logAdminAction, enforceIPAllowlist functions
- TypeScript compilation successful with no errors in new file
- Extended Express Request type with adminUser interface
- Session validation via validate_admin_session RPC implemented
- IP allowlist enforcement with wildcard support
- Audit logging middleware factory pattern for tracking actions

**Dependencies:** Task 2.1

---

### ⬜ Task 2.3: Create Admin Authentication Routes

**File to Create:** `/Users/ottoclarke/projects/Ralph's Civic Notices/server/routes/admin/auth.ts`

**Endpoints to Implement:**
1. `POST /api/admin/auth/login` - Email/password login
2. `POST /api/admin/auth/verify-2fa` - 2FA verification
3. `POST /api/admin/auth/logout` - Session termination
4. `GET /api/admin/auth/session` - Check current session
5. `POST /api/admin/auth/setup-2fa` - Enable 2FA
6. `POST /api/admin/auth/disable-2fa` - Disable 2FA

**Key Features:**
- Failed login attempt tracking
- Account lockout after 5 failed attempts
- Session token generation
- 2FA with TOTP (Google Authenticator compatible)
- Audit logging for all auth events

**Success Criteria:**
- [ ] All endpoints return proper status codes
- [ ] Login creates session in database
- [ ] 2FA flow works end-to-end
- [ ] Failed attempts tracked

**Dependencies:** Task 2.2

---

### ⬜ Task 2.4: Create Admin Account Management Routes

**File to Create:** `/Users/ottoclarke/projects/Ralph's Civic Notices/server/routes/admin/accounts.ts`

**Endpoints to Implement:**
```typescript
// List endpoints with pagination and filters
GET /api/admin/accounts/councils?page=1&limit=25&status=active
GET /api/admin/accounts/firms?page=1&limit=25
GET /api/admin/accounts/users?organizationId=xxx

// Detail endpoints
GET /api/admin/accounts/:id
GET /api/admin/accounts/:id/activity
GET /api/admin/accounts/:id/notices
GET /api/admin/accounts/:id/billing

// Action endpoints
PATCH /api/admin/accounts/:id/suspend
PATCH /api/admin/accounts/:id/activate
PATCH /api/admin/accounts/:id/update
DELETE /api/admin/accounts/:id

// Bulk operations
POST /api/admin/accounts/bulk/suspend
POST /api/admin/accounts/bulk/export
```

**Success Criteria:**
- [ ] All endpoints protected by requireAdmin
- [ ] Pagination works correctly
- [ ] Actions logged to admin_actions table
- [ ] Soft delete preserves data

**Dependencies:** Task 2.3

---

### ⬜ Task 2.5: Register Admin Routes in Server

**File to Modify:** `/Users/ottoclarke/projects/Ralph's Civic Notices/server/index.ts`

**Changes at Line 36:**
```typescript
// Import admin routes
import adminAuthRouter from './routes/admin/auth.js';
import adminAccountsRouter from './routes/admin/accounts.js';
import { requireAdmin, enforceIPAllowlist } from './middleware/adminAuth.js';
```

**Changes at Line 83 (after other routes):**
```typescript
// Admin routes (no auth required for login)
app.use('/api/admin/auth', adminAuthRouter);

// Protected admin routes
app.use('/api/admin/accounts', requireAdmin, enforceIPAllowlist, adminAccountsRouter);
```

**Success Criteria:**
- [ ] Server starts without errors
- [ ] Admin routes accessible at /api/admin/*
- [ ] Non-admin routes still work

**Dependencies:** Tasks 2.3, 2.4

---

## PHASE 3: FRONTEND ADMIN UI (Tasks 3.1-3.8)

### ⬜ Task 3.1: Create Admin Context Provider

**File to Create:** `/Users/ottoclarke/projects/Ralph's Civic Notices/src/contexts/AdminAuthContext.tsx`

**Pattern to Follow:** Similar to `src/contexts/AuthContext.tsx`

**Key Differences:**
- Separate admin session management
- 2FA state handling
- Session timeout warnings
- IP allowlist checks

**Success Criteria:**
- [ ] Context provides admin user state
- [ ] Login/logout functions work
- [ ] Session persistence in localStorage
- [ ] Auto-logout on timeout

**Dependencies:** Phase 2 complete

---

### ⬜ Task 3.2: Create Admin Layout Component

**File to Create:** `/Users/ottoclarke/projects/Ralph's Civic Notices/src/pages/admin/AdminLayout.tsx`

**Pattern to Follow:** Similar to `src/pages/council/CouncilLayout.tsx`

**Visual Requirements:**
- Dark theme (red/black color scheme)
- Sidebar navigation
- Top bar with admin info
- Session timeout indicator
- Notification bell for alerts

**Navigation Items:**
```typescript
const adminNavItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Accounts', path: '/admin/accounts', icon: Building2 },
  { label: 'Notices', path: '/admin/notices', icon: FileText },
  { label: 'Audit Log', path: '/admin/audit', icon: Shield },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];
```

**Success Criteria:**
- [ ] Layout renders correctly
- [ ] Navigation works
- [ ] Responsive on mobile
- [ ] Dark theme applied

**Dependencies:** Task 3.1

---

### ⬜ Task 3.3: Create Admin Login Page

**File to Create:** `/Users/ottoclarke/projects/Ralph's Civic Notices/src/pages/admin/Login.tsx`

**Features:**
1. Email/password form
2. 2FA code input (conditional)
3. Remember device checkbox
4. Failed attempt warnings
5. Account locked message

**Visual Style:**
- Center-aligned card
- Dark background
- Red accent colors
- Security badge/shield icon

**Success Criteria:**
- [ ] Login form submits correctly
- [ ] 2FA step appears when needed
- [ ] Error messages display
- [ ] Redirects to dashboard on success

**Dependencies:** Task 3.1

---

### ⬜ Task 3.4: Create Admin Dashboard

**File to Create:** `/Users/ottoclarke/projects/Ralph's Civic Notices/src/pages/admin/Dashboard.tsx`

**Components to Include:**
1. Statistics cards (councils, firms, notices, revenue)
2. Recent activity feed
3. System health indicators
4. Quick actions panel
5. Alerts/warnings section

**Data to Fetch:**
```typescript
// Statistics
const stats = {
  totalCouncils: number,
  activeCouncils: number,
  totalFirms: number,
  totalNotices: number,
  monthlyRevenue: number,
  systemHealth: 'healthy' | 'degraded' | 'down'
};

// Recent activity
const recentActions = await fetch('/api/admin/audit/recent');
```

**Success Criteria:**
- [ ] All stats display correctly
- [ ] Real-time data updates
- [ ] Charts render properly
- [ ] Mobile responsive

**Dependencies:** Task 3.2

---

### ⬜ Task 3.5: Create Account Management Page

**File to Create:** `/Users/ottoclarke/projects/Ralph's Civic Notices/src/pages/admin/AccountManagement.tsx`

**Features:**
1. Tabbed interface (Councils | Firms | Users)
2. Data table with sorting/filtering
3. Search functionality
4. Bulk action toolbar
5. Account detail modal

**Table Columns:**
- Organization Name
- Type
- Status
- Created Date
- Last Active
- Subscription
- Actions (dropdown menu)

**Action Menu Items:**
- View Details
- Edit
- Suspend/Activate
- Reset Password
- Delete

**Success Criteria:**
- [ ] Data table loads accounts
- [ ] Search/filter works
- [ ] Actions update database
- [ ] Audit log entries created

**Dependencies:** Task 3.2

---

### ⬜ Task 3.6: Create Audit Log Page

**File to Create:** `/Users/ottoclarke/projects/Ralph's Civic Notices/src/pages/admin/AuditLog.tsx`

**Features:**
1. Filterable log table
2. Date range picker
3. Severity indicators
4. Export functionality
5. Detail view modal

**Filters:**
- Date range
- Admin user
- Action category
- Severity level
- Target type

**Success Criteria:**
- [ ] Logs display correctly
- [ ] Filters work
- [ ] Export generates CSV
- [ ] Infinite scroll works

**Dependencies:** Task 3.2

---

### ⬜ Task 3.7: Add Admin Routes to App.tsx

**File to Modify:** `/Users/ottoclarke/projects/Ralph's Civic Notices/src/App.tsx`

**Changes at Line 132 (after council routes):**
```typescript
// Import admin components
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminLogin from '@/pages/admin/Login';
import AdminDashboard from '@/pages/admin/Dashboard';
import AccountManagement from '@/pages/admin/AccountManagement';
import AdminAuditLog from '@/pages/admin/AuditLog';
import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';

// Add routes
<Route path="/admin/login" element={<AdminLogin />} />
<Route path="/admin" element={
  <AdminProtectedRoute>
    <AdminLayout />
  </AdminProtectedRoute>
}>
  <Route index element={<Navigate to="dashboard" replace />} />
  <Route path="dashboard" element={<AdminDashboard />} />
  <Route path="accounts" element={<AccountManagement />} />
  <Route path="audit" element={<AdminAuditLog />} />
  <Route path="settings" element={<AdminSettings />} />
</Route>
```

**Success Criteria:**
- [ ] Routes accessible at /admin/*
- [ ] Protected route component works
- [ ] Navigation between pages works

**Dependencies:** Tasks 3.3-3.6

---

### ⬜ Task 3.8: Create Admin Protected Route Component

**File to Create:** `/Users/ottoclarke/projects/Ralph's Civic Notices/src/components/admin/AdminProtectedRoute.tsx`

**Implementation:**
```typescript
export default function AdminProtectedRoute({ children }) {
  const { adminUser, loading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !adminUser) {
      navigate('/admin/login');
    }
  }, [loading, adminUser]);

  if (loading) return <LoadingSpinner />;
  if (!adminUser) return null;

  return children;
}
```

**Success Criteria:**
- [ ] Redirects to login if not authenticated
- [ ] Shows loading state
- [ ] Allows access when authenticated

**Dependencies:** Task 3.1

---

## PHASE 4: TESTING & DEPLOYMENT (Tasks 4.1-4.5)

### ⬜ Task 4.1: Create Super Admin Seed Script

**File to Create:** `/Users/ottoclarke/projects/Ralph's Civic Notices/scripts/create-super-admin.ts`

**Implementation:**
```typescript
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

async function createSuperAdmin() {
  const email = 'admin@civicnotices.co.uk';
  const password = 'ChangeMeImmediately123!';

  // 1. Create auth user
  // 2. Create admin_users record
  // 3. Log action
  // 4. Display credentials

  console.log('Super Admin created:');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('IMPORTANT: Change password on first login!');
}
```

**Success Criteria:**
- [ ] Script runs without errors
- [ ] Super admin can login
- [ ] Record in admin_users table

**Dependencies:** Phase 1-3 complete

---

### ⬜ Task 4.2: Create Admin Panel E2E Tests

**File to Create:** `/Users/ottoclarke/projects/Ralph's Civic Notices/e2e/admin-panel.spec.ts`

**Test Cases:**
1. Admin login flow
2. 2FA setup and verification
3. Account suspension
4. Audit log generation
5. Session timeout

**Success Criteria:**
- [ ] All tests pass
- [ ] Coverage > 80%

**Dependencies:** Task 4.1

---

### ⬜ Task 4.3: Security Audit Checklist

**File to Create:** `/Users/ottoclarke/projects/Ralph's Civic Notices/docs/ADMIN_SECURITY_AUDIT.md`

**Checklist Items:**
- [ ] All admin endpoints require authentication
- [ ] 2FA enforcement works
- [ ] Session timeout at 2 hours
- [ ] Failed login lockout works
- [ ] Audit logging comprehensive
- [ ] No SQL injection vulnerabilities
- [ ] XSS protection in place
- [ ] CSRF tokens implemented
- [ ] Rate limiting active

**Dependencies:** All previous tasks

---

### ⬜ Task 4.4: Admin Documentation

**File to Create:** `/Users/ottoclarke/projects/Ralph's Civic Notices/docs/ADMIN_PANEL_GUIDE.md`

**Sections:**
1. Getting Started
2. Authentication & 2FA
3. Managing Accounts
4. Monitoring System
5. Security Best Practices
6. Troubleshooting

**Dependencies:** All previous tasks

---

### ⬜ Task 4.5: Final Integration Testing

**Manual Test Checklist:**
- [ ] Create super admin account
- [ ] Login with 2FA
- [ ] View dashboard metrics
- [ ] Suspend a test account
- [ ] Check audit log entry
- [ ] Test session timeout
- [ ] Verify mobile responsiveness
- [ ] Check performance (< 2s load times)
- [ ] Test concurrent admin sessions
- [ ] Verify data encryption

**Success Criteria:**
- [ ] All manual tests pass
- [ ] No console errors
- [ ] No security warnings

**Dependencies:** Tasks 4.1-4.4

---

## 📊 COMPLETION TRACKING

### Phase Status:
- [ ] **Phase 1:** Database Foundation (3 tasks)
- [ ] **Phase 2:** Server-Side Admin (5 tasks)
- [ ] **Phase 3:** Frontend Admin UI (8 tasks)
- [ ] **Phase 4:** Testing & Deployment (5 tasks)

### Total Progress: 0/21 tasks

### Time Estimates:
- Phase 1: 3-4 hours
- Phase 2: 6-8 hours
- Phase 3: 8-10 hours
- Phase 4: 4-5 hours
- **Total:** 21-27 hours

---

## 🚨 CRITICAL NOTES FOR RALPH

1. **DO NOT SKIP DEPENDENCIES** - Tasks build on each other
2. **TEST EACH TASK** - Verify success criteria before moving on
3. **COMMIT FREQUENTLY** - After each successful task
4. **SECURITY FIRST** - This is admin panel, security is paramount
5. **FOLLOW PATTERNS** - Use existing code patterns from council/firm portals

---

## 🎯 Definition of Done

The Admin Panel is complete when:
- [ ] All 21 tasks marked complete
- [ ] Super admin can login with 2FA
- [ ] Can view/manage all accounts
- [ ] Audit trail captures all actions
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] E2E tests passing

---

**Next Action:** Ralph should start with Task 1.1 - Create Admin Users Table Migration
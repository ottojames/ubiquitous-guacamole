# Fix Admin Panel Functionality

## Overview

The admin panel currently has all UI components in place but lacks proper data wiring and functional implementation. Dashboard metrics show zeros, account management displays no data, several navigation links are broken, and critical features like password reset and account administration are missing backend implementation.

## Problem Statement

The admin panel is essentially a UI shell without proper backend integration:
- **Dashboard**: Shows all zeros instead of real metrics
- **Accounts**: Empty lists for councils, firms, and users despite having data in database
- **Navigation**: Notices link incorrectly redirects to home page
- **Features**: Missing critical admin functions (password reset, account editing, user management)
- **Settings**: UI-only with no persistence or actual configuration
- **Notifications**: Non-functional notification system

Most critically, admins cannot manage user accounts - a core requirement for supporting councils when they have access issues.

## Proposed Solution

Wire up the existing admin UI with real data and implement missing backend functionality to create a fully functional admin panel that allows comprehensive platform administration.

## Technical Approach

### Phase 1: Data Integration (Priority: High)
Fix all data display issues by connecting UI to existing database tables.

### Phase 2: Core Features (Priority: High)
Implement critical admin functions like password reset and account management.

### Phase 3: Settings & Configuration (Priority: Medium)
Add backend for settings persistence and configuration management.

## Acceptance Criteria

### Dashboard Page
- [ ] Display real counts for councils, firms, users, and notices
- [ ] Show actual monthly revenue calculations
- [ ] Display recent admin activity from audit logs
- [ ] Make "3 accounts pending verification" clickable (navigate to accounts page with filter)
- [ ] Show real system health metrics
- [ ] Quick action buttons navigate to correct pages

### Accounts Management
- [ ] **Councils tab**: Display all councils from organizations table (type='council')
- [ ] **Firms tab**: Display all firms from organizations table (type='firm')
- [ ] **Users tab**: Display all users from auth.users table
- [ ] Search functionality works across all tabs
- [ ] Status filters (active/suspended/pending) work correctly
- [ ] Edit account details modal with save functionality
- [ ] Reset password sends secure reset email
- [ ] Suspend/activate account updates status in database
- [ ] Delete account (soft delete with confirmation)
- [ ] Bulk export to CSV functionality
- [ ] Display user's organization memberships
- [ ] Add/remove users from organizations
- [ ] Change user roles within organizations

### Notices Management
- [ ] Fix routing - should navigate to `/admin/notices` not home page
- [ ] Display all notices with pagination
- [ ] Filter by status (draft/pending/published/expired)
- [ ] Search by title, applicant, or location
- [ ] View notice details in modal
- [ ] Approve/reject pending notices
- [ ] Edit notice content (with audit trail)
- [ ] Delete notices (soft delete)

### Audit Log
- [ ] Display actual audit entries from admin_actions table
- [ ] Show admin email, action, target, timestamp
- [ ] Implement filtering by:
  - Date range
  - Admin user
  - Action type
  - Severity level
- [ ] Export audit logs to CSV
- [ ] Real-time updates when new actions occur

### Settings
- [ ] **General Settings**:
  - Platform name configuration
  - Contact information
  - Business hours
  - Maintenance mode toggle
- [ ] **Security Settings**:
  - Password requirements configuration
  - Session timeout settings
  - IP allowlist management
  - 2FA enforcement rules
- [ ] **Notification Settings**:
  - Email notification preferences
  - Alert thresholds (e.g., failed login attempts)
  - Notification channels (email, SMS, webhook)
- [ ] **API Keys**:
  - Generate new API keys
  - View existing keys (masked)
  - Revoke keys
  - Set key permissions and rate limits
- [ ] **Integrations**:
  - Third-party service configurations
  - Webhook endpoints
  - OAuth app settings
- [ ] All settings persist to database
- [ ] Settings changes create audit log entries

### Notifications
- [ ] Bell icon shows count of unread notifications
- [ ] Dropdown displays recent notifications
- [ ] Mark as read functionality
- [ ] Navigate to relevant page on click
- [ ] Clear all notifications option

## Implementation Details

### Database Queries

#### Dashboard Statistics
```typescript
// src/pages/admin/Dashboard.tsx
const fetchDashboardData = async () => {
  // Get real counts
  const { count: councilCount } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'council')
    .eq('status', 'active');

  const { count: firmCount } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'firm');

  const { count: userCount } = await supabase
    .from('auth.users')
    .select('*', { count: 'exact', head: true });

  const { count: noticeCount } = await supabase
    .from('notices')
    .select('*', { count: 'exact', head: true });

  // Get pending verifications
  const { count: pendingCount } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_verification');

  // Get recent activity
  const { data: recentActions } = await supabase
    .from('admin_actions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
};
```

#### Account Management
```typescript
// src/pages/admin/AccountManagement.tsx
const fetchAccounts = async (type: 'council' | 'firm') => {
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select(`
      *,
      organization_memberships (
        user_id,
        role,
        user:auth.users (
          email,
          created_at,
          last_sign_in_at
        )
      )
    `)
    .eq('type', type)
    .order('created_at', { ascending: false });
};

const fetchUsers = async () => {
  const { data: users, error } = await supabase
    .from('auth.users')
    .select(`
      *,
      organization_memberships (
        organization_id,
        role,
        organization:organizations (
          name,
          type
        )
      )
    `)
    .order('created_at', { ascending: false });
};
```

### API Endpoints

#### Password Reset
```typescript
// server/routes/admin/users.ts
router.post('/users/:userId/reset-password', adminAuth, async (req, res) => {
  const { userId } = req.params;

  // Generate secure reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = await bcrypt.hash(resetToken, 10);

  // Store token with expiry
  await supabase
    .from('password_reset_tokens')
    .insert({
      user_id: userId,
      token: hashedToken,
      expires_at: new Date(Date.now() + 3600000) // 1 hour
    });

  // Send reset email
  await sendPasswordResetEmail(user.email, resetToken);

  // Log action
  await logAdminAction(req.adminUser.id, 'password_reset_initiated', userId);

  res.json({ success: true });
});
```

#### Account Editing
```typescript
// server/routes/admin/accounts.ts
router.put('/accounts/:accountId', adminAuth, async (req, res) => {
  const { accountId } = req.params;
  const updates = req.body;

  // Store old values for audit
  const { data: oldData } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', accountId)
    .single();

  // Update account
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', accountId)
    .select()
    .single();

  // Log changes
  await logAdminAction(
    req.adminUser.id,
    'account_updated',
    accountId,
    { old_values: oldData, new_values: data }
  );

  res.json(data);
});
```

### Settings Persistence

```typescript
// Create settings table migration
create table platform_settings (
  id uuid primary key default uuid_generate_v4(),
  category text not null,
  key text not null,
  value jsonb not null,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users,
  unique(category, key)
);

// Settings API
router.put('/settings/:category/:key', adminAuth, async (req, res) => {
  const { category, key } = req.params;
  const { value } = req.body;

  const { data, error } = await supabase
    .from('platform_settings')
    .upsert({
      category,
      key,
      value,
      updated_by: req.adminUser.id
    })
    .select()
    .single();

  await logAdminAction(
    req.adminUser.id,
    'setting_updated',
    `${category}.${key}`,
    { new_value: value }
  );

  res.json(data);
});
```

### Routing Fix

```typescript
// src/App.tsx - Fix notices route
<Route path="/admin/notices" element={
  <AdminProtectedRoute>
    <AdminNotices /> // Create this component
  </AdminProtectedRoute>
} />
```

## Success Metrics

- Dashboard displays accurate real-time metrics
- All account management operations complete successfully
- Audit log captures all admin actions
- Settings persist and apply correctly
- Zero console errors in admin panel
- Page load time < 2 seconds
- All admin actions complete within 3 seconds

## Dependencies & Prerequisites

- Existing database tables (organizations, auth.users, admin_actions)
- Supabase service role key for admin operations
- Email service for password resets
- Current UnifiedAuthContext implementation

## Testing Requirements

### Unit Tests
- [ ] Dashboard statistics calculation
- [ ] Account filtering and search
- [ ] Settings validation
- [ ] Audit log formatting

### Integration Tests
- [ ] Password reset flow end-to-end
- [ ] Account CRUD operations
- [ ] Settings persistence
- [ ] Notification delivery

### E2E Tests
- [ ] Complete admin user journey
- [ ] Account management workflow
- [ ] Settings configuration flow

## Security Considerations

- Implement rate limiting on sensitive operations
- Add confirmation dialogs for destructive actions
- Ensure all admin actions are logged
- Validate all inputs server-side
- Use secure tokens for password reset
- Implement proper RBAC checks

## References & Research

### Internal Files
- Admin components: `src/pages/admin/*.tsx`
- Admin routes: `server/routes/admin/*.ts`
- Database migrations: `supabase/migrations/202601*.sql`
- Auth context: `src/contexts/UnifiedAuthContext.tsx:45-89`

### External Documentation
- Supabase Admin API: https://supabase.com/docs/guides/auth/admin
- React Admin Patterns: https://marmelab.com/react-admin/
- OWASP Admin Interface: https://cheatsheetseries.owasp.org/cheatsheets/Administrative_Interface_Security_Cheat_Sheet.html

### Related Work
- Phase 5 Authentication: `PHASE5_COMPLETE.md`
- Admin test results: `PHASE5_TEST_RESULTS.md:88`
- Test credentials: `TEST_CREDENTIALS.md`
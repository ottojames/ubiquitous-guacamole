# Admin Panel Security - Quick Reference Guide

## Password Reset - Security Checklist

```typescript
// GOOD - Secure implementation
const token = crypto.randomBytes(32).toString('hex');        // 256 bits
const hashedToken = await bcrypt.hash(token, 10);           // Hash for storage
const expiresAt = Date.now() + 15 * 60 * 1000;              // 15 minutes

// BAD - Insecure (DON'T USE)
const token = userId + Date.now();                           // Predictable
const token = md5(email);                                    // Weak hash
const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;    // Too long
```

**Requirements**:
- [ ] 256+ bit random token
- [ ] Hashed with bcrypt/Argon2 (not MD5)
- [ ] 15-30 minute expiration
- [ ] Single-use only
- [ ] Invalidated after use
- [ ] Consistent error messages
- [ ] HTTPS links only
- [ ] Hard-coded domain

---

## RBAC Permission Checks

```typescript
// GOOD - Server-side enforcement
async function updateUser(adminId, userId, updates) {
  // 1. Always check server-side
  const hasPermission = await checkPermission(adminId, 'user:update', userId);
  if (!hasPermission) throw new ForbiddenError();
  
  // 2. Prevent self-modification
  if (adminId === userId && 'role' in updates) {
    throw new ForbiddenError('Cannot modify own role');
  }
  
  // 3. Prevent privilege escalation
  const adminLevel = await getRoleLevel(adminId);
  const targetLevel = await getRoleLevel(userId);
  if (adminLevel <= targetLevel) {
    throw new ForbiddenError('Cannot modify user at your level');
  }
}

// BAD - Client-side only (VULNERABLE)
if (user.role === 'admin') {
  return <EditButton />;  // Easy to remove with browser tools
}
```

---

## Bulk Operations - Safety Pattern

```typescript
// 1. DRY RUN FIRST
const dryRun = await bulkSuspend({
  userIds: [...],
  dryRun: true
});
console.log(`Would suspend: ${dryRun.count} users`);

// 2. SHOW PREVIEW
displayPreview(dryRun.preview);

// 3. REQUIRE CONFIRMATION
const confirmed = await showConfirmationDialog({
  action: 'suspend',
  count: dryRun.count,
  requireCode: true
});

// 4. EXECUTE WITH CODE
const result = await bulkSuspend({
  userIds: [...],
  confirmationCode: userProvidedCode,
  dryRun: false
});
```

---

## Audit Logging Template

```typescript
const auditEntry = {
  // Identity
  timestamp: new Date().toISOString(),
  adminId: currentUserId,
  adminEmail: currentUserEmail,
  adminRole: currentUserRole,
  
  // Action
  action: 'user_updated',  // or user_created, user_deleted, user_suspended
  targetUserId: affectedUserId,
  targetEmail: affectedUserEmail,
  
  // Changes
  changes: [
    { fieldName: 'role', oldValue: 'user', newValue: 'admin' },
    { fieldName: 'status', oldValue: 'active', newValue: 'suspended' }
  ],
  
  // Context
  ipAddress: getClientIP(),
  userAgent: request.headers['user-agent'],
  sessionId: request.sessionId,
  organizationId: targetOrgId,
  
  // Flag for compliance
  complianceRelevant: true  // if role, org, or status changed
};

await auditLog.create(auditEntry);
```

---

## Admin Self-Modification - Prevention

```typescript
// CHECK 1: Prevent self-role-change
if (adminId === targetUserId && 'role' in updates) {
  throw new ForbiddenError('Cannot modify your own role');
}

// CHECK 2: Prevent self-deletion
if (adminId === targetUserId && action === 'delete') {
  throw new ForbiddenError('Cannot delete your own account');
}

// CHECK 3: Prevent privilege escalation
const adminLevel = ROLE_HIERARCHY[adminRole];
const newRoleLevel = ROLE_HIERARCHY[updates.role];
if (newRoleLevel > adminLevel) {
  throw new ForbiddenError('Cannot assign roles higher than your own');
}

// CHECK 4: Require approval for sensitive changes
if (isEscalation(oldRole, newRole)) {
  const approvalNeeded = await checkIfApprovalRequired(action, oldRole, newRole);
  if (approvalNeeded) {
    const approved = await requestApprovalFromSecondAdmin();
    if (!approved) throw new ForbiddenError('Requires 2nd admin approval');
  }
}
```

---

## RBAC Role Hierarchy Reference

```
SUPER_ADMIN (4)
├─ Can: All operations globally
├─ Cannot: Escalate privileges
└─ Limit: < 5 total

    ↓

ADMIN (3)
├─ Can: Manage users in own org
├─ Cannot: Change own role or create other admins
└─ Scope: Organization-wide

    ↓

SUPPORT (2)
├─ Can: View accounts, reset passwords (with approval)
├─ Cannot: Delete, suspend, or change roles
└─ Scope: Specific roles only

    ↓

VIEWER (1)
├─ Can: View accounts and audit logs
├─ Cannot: Modify anything
└─ Scope: Read-only
```

---

## Permission Enum Reference

```typescript
// User Management
'user:create'           // Create new user
'user:read'            // View user details
'user:update'          // Edit user info
'user:delete'          // Delete user account
'user:suspend'         // Suspend user
'user:reset_password'  // Reset password
'user:change_role'     // Modify user role

// Organization
'org:read'             // View organization
'org:update'           // Edit organization
'org:manage_users'     // Manage org users

// Audit & Compliance
'audit:read'           // View audit logs
'audit:export'         // Export audit trail

// System
'system:config'        // System configuration
'system:security'      // Security settings
'role:create'          // Create custom roles
'approval:manage'      // Manage approvals
```

---

## Session Management Defaults

```typescript
// Security-appropriate values
SESSION_DURATION = 120;           // 2 hours
SESSION_TIMEOUT = 15 * 60;        // 15 minutes inactivity
WARNING_THRESHOLD = 10 * 60;      // Warn at 10 min remaining

// For sensitive operations
SENSITIVE_SESSION_DURATION = 30;  // 30 minutes
SENSITIVE_TIMEOUT = 5 * 60;       // 5 minutes inactivity

// Cookie flags
HttpOnly = true;                  // Prevent JS access
Secure = true;                    // HTTPS only
SameSite = 'Strict';             // CSRF protection
```

---

## Error Handling - DO's and DON'Ts

```typescript
// GOOD - Generic, doesn't leak info
if (!account) {
  return { error: 'Unable to process request' };
}

// BAD - Reveals whether account exists
if (!account) {
  return { error: 'User not found' };
}

// GOOD - Same message for all cases
app.post('/forgot-password', (req, res) => {
  sendPasswordResetEmail(req.body.email);  // Works or not, doesn't matter
  return { message: 'If email exists, reset link sent' };
});

// BAD - Different messages leak info
app.post('/forgot-password', (req, res) => {
  if (findUser(req.body.email)) {
    return { message: 'Reset link sent' };
  } else {
    return { error: 'User not found' };  // Reveals it doesn't exist
  }
});
```

---

## Bulk Operation Confirmation Codes

```typescript
// Generate confirmation code
const code = crypto.randomBytes(4).toString('hex').toUpperCase();
// Example: "A3B2C4D1"

// Store temporarily (10 minute expiry)
await tempStore.set(`bulk_confirm_${adminId}`, {
  code,
  action: 'suspend',
  userIds: [...],
  expiresAt: Date.now() + 10 * 60 * 1000
});

// Display to user
showConfirmationCode(code);  // Show in UI
promptForCode();             // Require exact entry

// Verify before execution
const stored = await tempStore.get(`bulk_confirm_${adminId}`);
if (!stored || stored.code !== providedCode) {
  throw new Error('Invalid confirmation code');
}
```

---

## React Form Pattern

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Define schema
const userUpdateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['viewer', 'user', 'admin'])
});

// 2. Use form
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(userUpdateSchema)
});

// 3. Handle submission with error catching
const onSubmit = async (data) => {
  try {
    const response = await updateUser(data);
    if (response.status === 403) {
      setError('You lack permission for this change');
    } else if (response.ok) {
      showSuccess('Updated successfully');
    }
  } catch (err) {
    setError('Network error. Try again.');
  }
};

// 4. Render form
return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <input {...register('email')} />
    {errors.email && <span>{errors.email.message}</span>}
    
    <button type="submit">Save</button>
  </form>
);
```

---

## Testing Checklist

```typescript
describe('Admin Account Management', () => {
  // Password Reset
  test('Password reset token expires after 30 minutes', async () => {});
  test('Token cannot be used twice', async () => {});
  test('Password reset works only with HTTPS', async () => {});
  
  // RBAC
  test('Admin cannot modify own role', async () => {});
  test('Admin cannot delete own account', async () => {});
  test('Permission check is enforced server-side', async () => {});
  test('Privilege escalation is prevented', async () => {});
  
  // Bulk Operations
  test('Bulk delete requires confirmation code', async () => {});
  test('Dry-run does not modify data', async () => {});
  test('Cannot suspend already-suspended users', async () => {});
  
  // Audit Trail
  test('All changes are logged with admin info', async () => {});
  test('Audit logs cannot be modified', async () => {});
  test('Sensitive changes marked for compliance', async () => {});
  
  // Sessions
  test('Session times out after 15 minutes inactivity', async () => {});
  test('Password reset invalidates all sessions', async () => {});
});
```

---

## Deployment Validation

```bash
# 1. Check password reset security
curl -X POST https://api.example.com/password-reset
# Verify: Token is 256 bits, expires properly, single-use works

# 2. Verify RBAC enforcement
# Try to modify own role without 2nd approval - should fail

# 3. Test bulk operations
# Export, suspend, delete with dry-run - should preview correctly

# 4. Audit trail verification
# Make a change, verify it's logged with admin info, timestamp, IP

# 5. Session security
# Verify HttpOnly, Secure, SameSite flags on auth cookie

# 6. Admin self-modification prevention
# Try to delete own account - should fail with clear error
```

---

## Database Schema Hints

```sql
-- Users table (simplified)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  role VARCHAR(50),
  organization_id UUID,
  status VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Audit log (immutable)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  admin_id UUID NOT NULL,
  action VARCHAR(50),
  target_user_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  compliance_relevant BOOLEAN
);
ALTER TABLE audit_logs ADD CONSTRAINT audit_immutable UNIQUE (id);

-- Password reset tokens (temporary)
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  used_at TIMESTAMP
);
CREATE INDEX idx_token_expires ON password_reset_tokens(expires_at);

-- Approval requests
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY,
  requester_id UUID NOT NULL,
  action VARCHAR(100),
  target_user_id UUID,
  status VARCHAR(50),
  approver_id UUID,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

---

## Code Review Checklist

When reviewing admin management code:

- [ ] Password reset uses `crypto.randomBytes(32)`
- [ ] Tokens expire in ≤30 minutes
- [ ] Token checked server-side before accepting
- [ ] All role checks done server-side (not just UI)
- [ ] Admin cannot modify own `role` field
- [ ] Admin cannot delete own account
- [ ] Bulk delete requires confirmation code
- [ ] All changes logged to audit table
- [ ] Audit logs are append-only
- [ ] Sensitive operations require approval
- [ ] Errors don't leak info (consistent messages)
- [ ] Rate limiting on sensitive endpoints
- [ ] HTTPS enforced for sensitive operations
- [ ] Session cookie has HttpOnly + Secure + SameSite

---

**Document Purpose**: Quick lookup during development and code review  
**Keep This**: Handy while implementing security features  
**Reference Full Docs**: See ADMIN_PANEL_USER_MANAGEMENT_RESEARCH.md for complete details

# Admin Panel Security - Quick Reference Card

**For:** Development Team  
**Updated:** January 20, 2026  
**Print this guide for your desk**

---

## 7 Critical Security Patterns

### 1. ALWAYS Validate on Server
```typescript
// ❌ WRONG - Trust client
if (req.body.isAdmin) { /* grant access */ }

// ✅ RIGHT - Validate server-side
const permission = await checkPermission(req.adminUser.id, 'users', 'delete');
if (!permission) { return res.status(403).json({ error: 'Forbidden' }); }
```

### 2. Hash Passwords & Secrets
```typescript
// ❌ WRONG - Store plaintext
user.password = req.body.password;

// ✅ RIGHT - Use bcrypt
user.password = await bcrypt.hash(req.body.password, 10);
```

### 3. Never Trust JWT Alone
```typescript
// ❌ WRONG - Decode JWT and trust payload
const role = jwt.decode(token).role;

// ✅ RIGHT - Validate against database
const user = await getUser(token.userId);
const role = user.role;  // From DB, authoritative
```

### 4. Parameterize Database Queries
```typescript
// ❌ WRONG - SQL injection risk
const user = await db.query(`SELECT * FROM users WHERE id = '${id}'`);

// ✅ RIGHT - Parameterized
const user = await supabase.from('users').select('*').eq('id', id);
```

### 5. Escape HTML Output
```typescript
// ❌ WRONG - XSS risk
<div dangerouslySetInnerHTML={{ __html: userInput }} />;

// ✅ RIGHT - React auto-escapes
<div>{userInput}</div>
```

### 6. Enforce SameSite Cookies
```typescript
// ❌ WRONG - CSRF risk
res.cookie('session', token, { httpOnly: true });

// ✅ RIGHT - CSRF protection
res.cookie('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});
```

### 7. Log Security Events
```typescript
// ❌ WRONG - No audit trail
await suspendUser(userId);

// ✅ RIGHT - Full audit trail
await suspendUser(userId);
await logAdminAction({
  action: 'user_suspended',
  target_id: userId,
  admin_id: req.adminUser.id,
  reason: req.body.reason,
  severity: 'critical'
});
```

---

## Rate Limiting Quick Setup

```typescript
import rateLimit from 'express-rate-limit';

// Strict (login)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts'
});

// Moderate (API)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
});

app.post('/login', loginLimiter, (req, res) => { /* ... */ });
app.use('/api/', apiLimiter);
```

---

## Permission Checking Template

```typescript
export function requirePermission(resource, action) {
  return async (req, res, next) => {
    const hasAccess = await checkPermission(
      req.adminUser.id,
      resource,
      action
    );
    
    if (!hasAccess) {
      await logSecurityEvent('unauthorized_access', req);
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
}

// Apply to endpoints
app.delete('/api/admin/users/:id', 
  requirePermission('users', 'delete'), 
  (req, res) => { /* ... */ }
);
```

---

## Session Timeout Pattern

```typescript
// Create: 2-hour absolute timeout
session.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

// Validate: Check expiry + update activity
if (session.expiresAt < new Date()) {
  terminateSession('timeout');
  return res.status(401).json({ error: 'Session expired' });
}

update session.lastActivityAt = NOW();

// Client-side: Check every 30s
const timeLeft = session.expiresAt - Date.now();
if (timeLeft < 10 * 60 * 1000) {
  showWarning('Session expires in 10 minutes');
}
if (timeLeft <= 0) {
  logout();
}
```

---

## 2FA Verification Pattern

```typescript
// On login
if (user.twoFactorEnabled) {
  const tempToken = generateToken();
  res.json({
    requiresTwoFactor: true,
    tempToken,
    message: 'Enter 6-digit code'
  });
}

// Verify 2FA code
const isValid = speakeasy.totp.verify({
  secret: user.twoFactorSecret,
  encoding: 'base32',
  token: userCode,
  window: 2  // 60-second window
});

if (!isValid) {
  return res.status(401).json({ error: 'Invalid code' });
}

// Create real session
const sessionToken = generateToken();
res.cookie('session', sessionToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});
```

---

## IP Allowlist Pattern

```typescript
// Get admin's allowlist
const allowlist = admin.ipAllowlist;  // ['192.168.1.*', '10.0.0.0/8']

// Check client IP
const clientIP = req.ip;
const allowed = allowlist.some(pattern => {
  if (pattern.includes('*')) {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '[0-9]+')}$`);
    return regex.test(clientIP);
  }
  return clientIP === pattern;
});

if (!allowed) {
  logSecurityEvent('ip_denied', { ip: clientIP });
  return res.status(403).json({ error: 'Access denied' });
}
```

---

## Audit Logging Template

```typescript
await logAdminAction({
  admin_user_id: req.adminUser.id,
  action: 'user_deleted',           // What happened
  category: 'account_management',   // Category
  target_type: 'admin_user',        // What was affected
  target_id: userId,
  ip_address: req.ip,
  session_id: req.adminUser.sessionId,
  old_values: oldUser,              // Before state
  new_values: newUser,              // After state
  severity: 'critical',             // How important
  reason: req.body.reason           // Why
});
```

---

## Privilege Escalation Prevention

```typescript
// ❌ WRONG - Allow changing own role
if (req.body.newRole) {
  user.role = req.body.newRole;
}

// ✅ RIGHT - Role changes require super_admin + different endpoint
if (req.adminUser.role !== 'super_admin') {
  return res.status(403).json({ error: 'Requires super_admin' });
}

// ✅ RIGHT - Prevent self-elevation
if (req.body.targetUserId === req.adminUser.id) {
  return res.status(400).json({ error: 'Cannot change own role' });
}

// ✅ RIGHT - Require 2FA verification for critical ops
const isValid = speakeasy.totp.verify({ ... });
if (!isValid) {
  return res.status(401).json({ error: 'Verification required' });
}

// ✅ RIGHT - Full audit trail
await changeRole(targetUser, newRole);
await terminateAllSessions(targetUser.id, 'role_change');
await logCriticalAction('role_changed', { user: targetUser, newRole });
```

---

## OWASP Top 3 for Admin Panels

| Risk | Attack | Prevention |
|------|--------|-----------|
| **Broken Access Control** | Admin accesses other admin's data | Permission checks on every endpoint |
| **Cryptographic Failures** | Passwords stored plaintext | bcrypt all passwords; HTTPS always |
| **Injection** | SQL injection via user input | Parameterized queries only |

---

## Helmet Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  
  // Enforce HTTPS
  hsts: { maxAge: 31536000 },
  
  // Prevent MIME sniffing
  noSniff: true,
  
  // XSS protection
  xssFilter: { mode: 'block' },
  
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));
```

---

## Common Mistakes to Avoid

1. ❌ Trusting client-side validation
2. ❌ Storing passwords in plaintext
3. ❌ Not logging security events
4. ❌ Reusing session tokens
5. ❌ Not checking permissions on every endpoint
6. ❌ Logging sensitive data (passwords, tokens)
7. ❌ Not implementing timeouts
8. ❌ Allowing unlimited login attempts
9. ❌ Not refreshing CSRF tokens
10. ❌ Single point of failure (no 2FA, no IP allowlist)

---

## Testing Commands

```bash
# Test unauthorized access
curl -X GET http://localhost:5174/api/admin/users

# Test with invalid token
curl -X GET http://localhost:5174/api/admin/users \
  -H "Authorization: Bearer invalid_token"

# Test rate limiting
for i in {1..6}; do
  curl -X POST http://localhost:5174/api/admin/auth/login \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# Check security headers
curl -I https://admin.civicnotices.co.uk | grep -i 'strict\|x-frame\|x-content'

# Test SQL injection (should fail safely)
curl "http://localhost:5174/api/admin/users?id=1' OR '1'='1"

# Test XSS (should be escaped)
curl -X POST http://localhost:5174/api/admin/users \
  -d '{"name":"<script>alert(1)</script>"}'
```

---

## Key Files

| File | Purpose |
|------|---------|
| `server/middleware/adminAuth.ts` | Auth & IP allowlist validation |
| `server/routes/admin/auth.ts` | Login, 2FA, session management |
| `src/contexts/AdminAuthContext.tsx` | Client-side auth context |
| `supabase/migrations/20260120000001_admin_users.sql` | Admin user table |
| `supabase/migrations/20260120000002_admin_sessions.sql` | Session tracking |
| `supabase/migrations/20260120000003_admin_actions_audit.sql` | Audit logging |

---

## Deployment Checklist

- [ ] All admin accounts have strong passwords
- [ ] 2FA enabled for super_admin accounts
- [ ] IP allowlists configured
- [ ] SSL/TLS certificates valid
- [ ] Environment variables not in code
- [ ] Database backups configured
- [ ] Audit log retention policy set
- [ ] Security monitoring alerts active
- [ ] Incident response plan documented
- [ ] Penetration testing completed

---

## Escalation Matrix

| Issue | Action | Owner |
|-------|--------|-------|
| Failed login detected | Check logs; contact admin | On-call |
| Unusual activity pattern | Investigate; may block IP | Security team |
| Permission denied error | Check permissions; test endpoint | Dev team |
| Session expired unexpectedly | Check timeout config; test clock sync | Ops |
| Rate limit blocking traffic | Adjust limits or whitelist IP | Dev + Ops |
| 2FA not working | Check secret sync; regenerate if needed | Admin |

---

**Print this. Keep at your desk. Reference before shipping code.**

**Questions?** See `docs/ADMIN_SECURITY_BEST_PRACTICES_OWASP.md` for full details.

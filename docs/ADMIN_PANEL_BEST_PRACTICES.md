# Admin Panel Best Practices for React/TypeScript with Supabase
## A Comprehensive Research Guide

**Date Created:** January 2026  
**Version:** 1.0  
**Status:** Complete Research Document  
**Audience:** Development Team, Architects, Security Team

---

## Table of Contents

1. [User Management & Account Administration](#1-user-management--account-administration)
2. [Dashboard Metrics & Statistics](#2-dashboard-metrics--statistics)
3. [Secure Password Reset & Account Recovery](#3-secure-password-reset--account-recovery)
4. [Audit Logging & Activity Tracking](#4-audit-logging--activity-tracking)
5. [Settings & Configuration Management](#5-settings--configuration-management)
6. [Architecture Patterns](#6-architecture-patterns)
7. [Security Hardening](#7-security-hardening)
8. [Performance Optimization](#8-performance-optimization)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. User Management & Account Administration

### 1.1 Role-Based Access Control (RBAC)

**Pattern:** Role hierarchy with granular permissions

```typescript
// Recommended role structure
type AdminRole = 'super_admin' | 'admin' | 'support' | 'moderator';

interface AdminUser {
  id: string;
  userId: string;
  email: string;
  role: AdminRole;
  twoFactorEnabled: boolean;
  ipAllowlist?: string[];
  permissions: Permission[];
  metadata?: {
    department?: string;
    delegatedFrom?: string;
    restrictions?: {
      maxRoleLevel?: AdminRole;
      organizationScopes?: string[];
    };
  };
}

interface Permission {
  resource: string;      // 'accounts', 'notices', 'settings'
  action: string;        // 'read', 'create', 'update', 'delete'
  scope: string;         // 'all', 'organization', 'self'
}
```

**Implementation in React:**

```typescript
// AdminAuthContext with permission checking
interface AdminAuthContextType {
  adminUser: AdminUser | null;
  hasPermission: (resource: string, action: string) => boolean;
  can: (action: string) => (resource: string) => boolean;
  isAuthorizedFor: (role: AdminRole) => boolean;
}

// Usage in components
const AdminUserForm = () => {
  const { hasPermission } = useAdminAuth();
  
  if (!hasPermission('users', 'update')) {
    return <AccessDenied />;
  }
  
  return <UserFormComponent />;
};
```

**Best Practices:**
- Use principle of least privilege: Grant minimum required permissions
- Implement time-limited elevation: Temporary elevated access with warnings
- Create permission groups: Bundle related permissions for easier management
- Support delegation: Allow admins to delegate specific permissions temporarily
- Audit all role changes: Log who changed which admin's role and when

### 1.2 User Lifecycle Management

**Phases:**

1. **Invitation & Onboarding**
   - Generate secure invite tokens (32-byte random, 48-hour expiry)
   - Send invitation emails with unique setup links
   - Require strong password on first login
   - Optionally mandate 2FA setup during onboarding

2. **Active Administration**
   - Monitor last login and activity
   - Track session duration and patterns
   - Flag unusual access patterns (off-hours, VPN, new IPs)

3. **Suspension**
   - Support soft suspension (inactive but recoverable)
   - Require reason and date of suspension
   - Automatically revoke active sessions
   - Keep full audit trail for compliance

4. **Offboarding**
   - Revoke all active sessions immediately
   - Disable 2FA and API keys
   - Optionally transfer responsibilities to another admin
   - Archive all audit logs for that user

**Database Schema Pattern:**

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  email TEXT NOT NULL UNIQUE,
  role admin_role NOT NULL,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT, -- encrypted
  two_factor_backup_codes TEXT[] -- encrypted, hash verified
  status admin_status DEFAULT 'pending', -- pending, active, suspended, offboarded
  status_changed_at TIMESTAMPTZ,
  status_changed_by UUID REFERENCES admin_users,
  status_reason TEXT,
  ip_allowlist TEXT[] DEFAULT '{}',
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES admin_users
);
```

### 1.3 Multi-Organization Admin Support

For platforms with multiple councils/firms:

```typescript
interface AdminContext {
  organization_scope?: string;  // null = system-wide, string = org ID
  can_see_organization: (orgId: string) => boolean;
  organizations_visible: string[];
  effective_role: AdminRole;  // May be limited by scope
}

// In dashboard components
const checkOrgAccess = (orgId: string, adminUser: AdminUser): boolean => {
  // Super admin sees all
  if (adminUser.role === 'super_admin') return true;
  
  // Scoped admin sees only their orgs
  if (adminUser.metadata?.restrictions?.organizationScopes) {
    return adminUser.metadata.restrictions.organizationScopes.includes(orgId);
  }
  
  return false;
};
```

---

## 2. Dashboard Metrics & Statistics

### 2.1 Key Performance Indicators (KPIs)

**Essential Metrics for Admin Dashboards:**

| Category | Metric | Calculation | Update Frequency |
|----------|--------|-----------|------------------|
| **Organizations** | Total Active | COUNT(orgs WHERE status='active') | 1 hour |
| | Pending Approval | COUNT(orgs WHERE status='pending') | Real-time |
| | Suspended | COUNT(orgs WHERE status='suspended') | 1 hour |
| | Growth Rate | (Current - Previous Month) / Previous * 100 | Daily |
| **Users** | Total Registered | COUNT(users) | 1 hour |
| | Monthly Active | COUNT(DISTINCT user_id WHERE last_login_at > NOW() - 30 days) | Daily |
| | New This Month | COUNT(created_at > DATE_TRUNC('month', NOW())) | Daily |
| **Notices** | Published This Month | COUNT WHERE created_at > DATE_TRUNC('month', NOW()) | Real-time |
| | Pending Moderation | COUNT(notices WHERE status='pending') | Real-time |
| | Average Processing Time | AVG(published_at - created_at) | Daily |
| **System** | API Response Time | P50, P95, P99 latency | Real-time |
| | Database Load | CPU %, connections active | Real-time |
| | Error Rate | COUNT(errors) / COUNT(requests) | Real-time |
| | Uptime | (Total - Downtime) / Total * 100 | Daily |

### 2.2 Real-Time Dashboard Implementation

**React Pattern with Supabase Real-time:**

```typescript
interface DashboardMetrics {
  stats: Record<string, number>;
  systemHealth: HealthStatus;
  lastUpdated: Date;
  isLoading: boolean;
}

// Custom hook for dashboard data
function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    stats: {},
    systemHealth: 'healthy',
    lastUpdated: new Date(),
    isLoading: true
  });

  useEffect(() => {
    // Initial fetch
    fetchDashboardData();

    // Setup real-time subscriptions for frequently changing metrics
    const subscriptions = [
      supabase
        .channel('public:notices')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'notices' },
          handleNoticeChange
        )
        .subscribe(),
      
      supabase
        .channel('public:organizations')
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'organizations' },
          handleOrgChange
        )
        .subscribe(),
      
      supabase
        .channel('system_metrics')
        .on('broadcast', { event: 'health_check' }, handleHealthUpdate)
        .subscribe()
    ];

    // Periodic refresh for computed metrics
    const interval = setInterval(fetchComputedMetrics, 60000);

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
      clearInterval(interval);
    };
  }, []);

  return metrics;
}
```

### 2.3 Caching Strategy

**Multi-Layer Caching:**

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;  // milliseconds
  etag?: string;
}

class MetricsCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  private cacheConfig = {
    // Real-time updates (prefer subscription)
    pending_approvals: { ttl: 0, method: 'subscription' },
    
    // Frequent updates (cache 1 min)
    error_rate: { ttl: 60_000 },
    active_users: { ttl: 60_000 },
    
    // Less frequent (cache 1 hour)
    total_orgs: { ttl: 3_600_000 },
    monthly_stats: { ttl: 3_600_000 },
    
    // Rarely changes (cache 24 hours)
    platform_config: { ttl: 86_400_000 }
  };

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: this.cacheConfig[key]?.ttl ?? 60_000
    });

    return data;
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: RegExp) {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}
```

### 2.4 Visualization Best Practices

```typescript
interface MetricCard {
  title: string;
  value: number | string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
    period: '24h' | '7d' | '30d';
  };
  actionable?: boolean;
  alert?: {
    level: 'warning' | 'critical';
    message: string;
  };
}

// Component with loading skeleton and error states
<MetricCard
  title="Pending Approvals"
  value={pendingCount}
  actionable={pendingCount > 0}
  alert={pendingCount > 10 ? {
    level: 'critical',
    message: 'High volume of pending approvals'
  } : undefined}
/>
```

---

## 3. Secure Password Reset & Account Recovery

### 3.1 Password Security Standards

**Minimum Requirements:**

```typescript
const PASSWORD_REQUIREMENTS = {
  minLength: 12,           // NIST recommends 8+, 12+ for admin
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  minEntropy: 50,          // bits of entropy
  maxConsecutiveChars: 2,  // limit 'aaa'
  blacklist: [             // Common patterns to block
    'password', 'admin', 'user', 'civicnotices',
    'council', 'notice', '12345', 'qwerty'
  ]
};

// Password validation
function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`At least ${PASSWORD_REQUIREMENTS.minLength} characters required`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter required');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter required');
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('At least one number required');
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChars) {
    const specialCharsRegex = new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars}]`);
    if (!specialCharsRegex.test(password)) {
      errors.push(`At least one special character (${PASSWORD_REQUIREMENTS.specialChars}) required`);
    }
  }

  // Check entropy using zxcvbn library
  const strength = zxcvbn(password);
  if (strength.score < 3) {
    errors.push('Password is too weak');
  }

  return {
    valid: errors.length === 0,
    errors,
    strength: strength.score
  };
}
```

### 3.2 Password Reset Flow

**Secure Implementation:**

```typescript
// Backend route for password reset
router.post('/admin/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Don't reveal if email exists (security best practice)
    // Always return success response
    
    const admin = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .single();

    if (admin.data) {
      // Generate secure reset token
      const resetToken = generateSecureToken(32);
      const tokenHash = hashToken(resetToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store hashed token in database
      await supabase
        .from('admin_password_resets')
        .insert({
          admin_user_id: admin.data.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
          created_at: new Date(),
          used: false
        });

      // Send email with reset link
      // Link includes plaintext token (sent only via email, not in DB)
      const resetUrl = `${process.env.ADMIN_URL}/reset-password?token=${resetToken}&email=${email}`;
      await sendPasswordResetEmail(email, resetUrl);
    }

    // Always return success
    res.json({ 
      message: 'If an admin account exists with that email, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify and complete reset
router.post('/admin/auth/reset-password', async (req, res) => {
  const { token, email, newPassword } = req.body;

  try {
    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid password',
        details: validation.errors 
      });
    }

    // Find admin and verify reset token
    const tokenHash = hashToken(token);
    
    const resetRecord = await supabase
      .from('admin_password_resets')
      .select('admin_user_id')
      .eq('token_hash', tokenHash)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!resetRecord.data) {
      return res.status(400).json({ 
        error: 'Invalid or expired reset token' 
      });
    }

    // Hash new password with bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark token as used
    await Promise.all([
      supabase
        .from('admin_users')
        .update({ password_hash: hashedPassword })
        .eq('id', resetRecord.data.admin_user_id),
      
      supabase
        .from('admin_password_resets')
        .update({ used: true })
        .eq('token_hash', tokenHash),

      // Revoke all existing sessions for this admin
      supabase
        .from('admin_sessions')
        .delete()
        .eq('admin_user_id', resetRecord.data.admin_user_id)
    ]);

    // Log security event
    await logAdminAction({
      admin_user_id: resetRecord.data.admin_user_id,
      action: 'password_reset_completed',
      action_category: 'security',
      severity: 'warning'
    });

    res.json({ 
      message: 'Password reset successful. Please log in with your new password.' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 3.3 Account Recovery with 2FA

**Multi-Factor Recovery Pattern:**

```typescript
interface RecoveryMethod {
  type: 'backup_codes' | 'alternative_email' | 'phone' | 'support_ticket';
  verified: boolean;
  lastUsed?: Date;
}

interface RecoveryOptions {
  backupCodesRemaining: number;
  alternativeEmails: string[];
  phoneNumbers: string[];
  canCreateSupportTicket: boolean;
}

// Generate backup codes
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 4 groups of 4 characters: XXXX-XXXX-XXXX-XXXX
    const code = Array(4)
      .fill(0)
      .map(() => 
        Array(4)
          .fill(0)
          .map(() => Math.random().toString(36).charAt(2).toUpperCase())
          .join('')
      )
      .join('-');
    codes.push(code);
  }
  return codes;
}

// Hash backup codes for storage
async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map(code => bcrypt.hash(code, 10)));
}

// Verify and consume backup code
async function verifyAndConsumeBackupCode(
  adminId: string,
  code: string
): Promise<boolean> {
  const admin = await supabase
    .from('admin_users')
    .select('two_factor_backup_codes')
    .eq('id', adminId)
    .single();

  const hashedCodes = admin.data?.two_factor_backup_codes || [];
  
  for (let i = 0; i < hashedCodes.length; i++) {
    const isMatch = await bcrypt.compare(code, hashedCodes[i]);
    if (isMatch) {
      // Remove used code
      hashedCodes.splice(i, 1);
      
      await supabase
        .from('admin_users')
        .update({ two_factor_backup_codes: hashedCodes })
        .eq('id', adminId);

      return true;
    }
  }

  return false;
}
```

---

## 4. Audit Logging & Activity Tracking

### 4.1 Comprehensive Audit Log Schema

```sql
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who performed the action
  admin_user_id UUID NOT NULL REFERENCES admin_users,
  admin_email TEXT NOT NULL,
  admin_role admin_role NOT NULL,
  
  -- What action was performed
  action VARCHAR(255) NOT NULL,           -- 'user_created', 'org_suspended', etc.
  action_category VARCHAR(50) NOT NULL,   -- 'account_mgmt', 'moderation', 'settings', etc.
  
  -- Details about the action
  target_type VARCHAR(50),                -- 'user', 'organization', 'notice', etc.
  target_id UUID,
  target_identifier TEXT,                 -- name/email of affected resource
  
  -- Change tracking
  old_values JSONB,                       -- Previous values
  new_values JSONB,                       -- Updated values
  changes_description TEXT,               -- Human-readable summary
  
  -- Security context
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  
  -- Metadata
  severity admin_action_severity,         -- 'info', 'warning', 'critical'
  status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent modification
  CONSTRAINT admin_actions_immutable CHECK (created_at = created_at)
);

-- Immutable table trigger
CREATE TRIGGER admin_actions_immutable_trigger
  BEFORE UPDATE OR DELETE ON admin_actions
  FOR EACH ROW
  EXECUTE FUNCTION raise_immutable_error();

CREATE FUNCTION raise_immutable_error() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log entries cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

-- Indexes for efficient querying
CREATE INDEX idx_admin_actions_user ON admin_actions(admin_user_id);
CREATE INDEX idx_admin_actions_target ON admin_actions(target_type, target_id);
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at DESC);
CREATE INDEX idx_admin_actions_severity ON admin_actions(severity, created_at DESC);
CREATE INDEX idx_admin_actions_category ON admin_actions(action_category, created_at DESC);
```

### 4.2 Audit Logging Middleware

```typescript
interface AuditLogContext {
  adminUserId: string;
  adminEmail: string;
  adminRole: AdminRole;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
}

// Express middleware to set audit context
export function auditContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const context: AuditLogContext = {
    adminUserId: req.adminUser?.id || 'system',
    adminEmail: req.adminUser?.email || 'system',
    adminRole: req.adminUser?.role || 'system',
    sessionId: req.adminUser?.sessionId || 'system',
    ipAddress: req.ip || 'unknown',
    userAgent: req.get('user-agent') || 'unknown'
  };

  (req as any).auditContext = context;
  next();
}

// Helper to log actions
async function logAdminAction(
  context: AuditLogContext,
  action: {
    action: string;
    category: string;
    targetType?: string;
    targetId?: string;
    targetIdentifier?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    description?: string;
    severity: 'info' | 'warning' | 'critical';
  }
) {
  const changes = computeChanges(action.oldValues, action.newValues);

  const auditRecord = {
    admin_user_id: context.adminUserId,
    admin_email: context.adminEmail,
    admin_role: context.adminRole,
    action: action.action,
    action_category: action.category,
    target_type: action.targetType,
    target_id: action.targetId,
    target_identifier: action.targetIdentifier,
    old_values: action.oldValues,
    new_values: action.newValues,
    changes_description: action.description || changes.summary,
    ip_address: context.ipAddress,
    user_agent: context.userAgent,
    session_id: context.sessionId,
    severity: action.severity,
    created_at: new Date()
  };

  await supabase
    .from('admin_actions')
    .insert([auditRecord]);

  // Trigger real-time notifications for critical actions
  if (action.severity === 'critical') {
    notifySecurityTeam(auditRecord);
  }
}

// Compute human-readable change summary
function computeChanges(
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>
): { summary: string; changes: Array<{field: string; from: any; to: any}> } {
  const changes: Array<{field: string; from: any; to: any}> = [];

  if (!oldValues || !newValues) {
    return { summary: 'New record created', changes };
  }

  for (const key in newValues) {
    if (oldValues[key] !== newValues[key]) {
      changes.push({
        field: key,
        from: oldValues[key],
        to: newValues[key]
      });
    }
  }

  const summary = changes
    .map(c => `${c.field}: "${c.from}" → "${c.to}"`)
    .join(', ');

  return { summary, changes };
}
```

### 4.3 Real-Time Audit Monitoring

```typescript
// Client-side component to stream audit logs
function AuditLogViewer({ filters }: { filters: AuditLogFilters }) {
  const [logs, setLogs] = useState<AdminAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    // Initial fetch
    fetchAuditLogs(filters).then(data => {
      setLogs(data);
      setIsLoading(false);
    });

    // Real-time subscription
    const channel = supabase
      .channel(`admin_actions:${JSON.stringify(filters)}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_actions',
          filter: buildRLSFilter(filters)
        },
        (payload: RealtimePostgresChangesPayload<AdminAction>) => {
          // Prepend new log to list (immutable update)
          setLogs(prev => [payload.new, ...prev].slice(0, 1000));
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [filters]);

  return (
    <div className="space-y-4">
      {logs.map(log => (
        <AuditLogEntry key={log.id} entry={log} />
      ))}
    </div>
  );
}

// Highlight anomalies
function detectAnomalies(logs: AdminAction[]): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Check for rapid-fire actions (potential automation/attack)
  const timeWindows = groupBy(logs, log => 
    Math.floor(log.created_at.getTime() / 60000)
  );
  
  for (const [, groupLogs] of Object.entries(timeWindows)) {
    if (groupLogs.length > 20) {
      anomalies.push({
        type: 'rapid_fire',
        severity: 'warning',
        message: `${groupLogs.length} actions in 1 minute`
      });
    }
  }

  // Check for sensitive operations at unusual times
  const criticalOps = logs.filter(l => l.severity === 'critical');
  for (const log of criticalOps) {
    const hour = new Date(log.created_at).getHours();
    if (hour < 6 || hour > 22) {
      anomalies.push({
        type: 'off_hours_critical',
        severity: 'warning',
        message: `Critical operation at ${hour}:00`
      });
    }
  }

  return anomalies;
}
```

### 4.4 Audit Log Retention & Archival

```typescript
// Archive old logs for compliance
async function archiveOldAuditLogs(daysToKeepOnline: number = 365) {
  const archiveDate = new Date();
  archiveDate.setDate(archiveDate.getDate() - daysToKeepOnline);

  // Export to cold storage (S3, etc.)
  const { data: oldLogs } = await supabase
    .from('admin_actions')
    .select('*')
    .lt('created_at', archiveDate.toISOString());

  if (oldLogs && oldLogs.length > 0) {
    // Archive to cold storage
    const archiveKey = `audit-logs/archive-${archiveDate.toISOString().split('T')[0]}.jsonl`;
    const content = oldLogs
      .map(log => JSON.stringify(log))
      .join('\n');

    await uploadToArchiveStorage(archiveKey, content);

    // Keep reference in database
    await supabase
      .from('audit_log_archives')
      .insert({
        start_date: archiveDate,
        end_date: new Date(),
        record_count: oldLogs.length,
        archive_key: archiveKey,
        created_at: new Date()
      });
  }
}
```

---

## 5. Settings & Configuration Management

### 5.1 Hierarchical Settings Structure

```typescript
// Multi-level settings hierarchy
interface SettingsHierarchy {
  global: GlobalSettings;        // System-wide settings
  organization: OrgSettings;     // Per-organization
  department: DeptSettings;      // Per-department
  user: UserSettings;            // Individual user preferences
}

interface GlobalSettings {
  // General
  platform_name: string;
  support_email: string;
  default_timezone: string;
  maintenance_mode: boolean;

  // Security
  password_requirements: PasswordPolicy;
  session_timeout_minutes: number;
  require_2fa_for_admins: boolean;
  ip_allowlist_enabled: boolean;
  max_login_attempts: number;
  lockout_duration_minutes: number;

  // Notice Configuration
  auto_publish: boolean;
  require_moderation: boolean;
  max_file_upload_mb: number;
  notice_retention_days: number;

  // Email
  email_provider: 'sendgrid' | 'aws_ses' | 'smtp';
  email_from_address: string;
  email_templates: Record<string, string>;

  // Feature Flags
  features: {
    advanced_analytics: boolean;
    api_access: boolean;
    custom_branding: boolean;
    webhooks: boolean;
  };
}

interface OrgSettings {
  max_users: number;
  max_departments: number;
  storage_quota_gb: number;
  api_rate_limit_rpm: number;
  custom_branding: {
    logo_url?: string;
    primary_color?: string;
  };
  notification_preferences: {
    email_on_notice_published: boolean;
    email_on_approval_needed: boolean;
  };
}
```

### 5.2 Settings Management API

```typescript
// Type-safe settings access
class SettingsManager {
  private cache: Map<string, SettingsCacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getSetting<T>(
    key: string,
    context?: { orgId?: string; userId?: string }
  ): Promise<T> {
    const cacheKey = this.buildCacheKey(key, context);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }

    const value = await this.fetchSetting<T>(key, context);
    this.cache.set(cacheKey, {
      value,
      timestamp: Date.now()
    });

    return value;
  }

  async setSetting(
    key: string,
    value: any,
    context?: { orgId?: string; userId?: string },
    admin?: AdminUser
  ): Promise<void> {
    // Validate against schema
    const schema = this.getSettingSchema(key);
    const validated = schema.parse(value);

    // Check permissions
    await this.checkSettingPermission(key, admin);

    // Update in database
    await supabase
      .from('settings')
      .upsert({
        key,
        value: validated,
        org_id: context?.orgId,
        user_id: context?.userId,
        updated_by: admin?.id,
        updated_at: new Date()
      });

    // Invalidate cache
    this.cache.delete(this.buildCacheKey(key, context));

    // Log the change
    await logAdminAction(admin, {
      action: 'setting_updated',
      category: 'system_config',
      oldValues: { [key]: await this.getSetting(key, context) },
      newValues: { [key]: value },
      severity: this.isSecuritySetting(key) ? 'critical' : 'warning'
    });
  }

  private buildCacheKey(
    key: string,
    context?: { orgId?: string; userId?: string }
  ): string {
    return `${key}:${context?.orgId || 'global'}:${context?.userId || 'default'}`;
  }
}
```

### 5.3 Settings UI Components

```typescript
// Generic settings form component
interface SettingDefinition {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'email' | 'url';
  options?: Array<{ value: any; label: string }>;
  required?: boolean;
  validation?: (value: any) => string | null;
  onChange?: (value: any) => void;
}

function SettingField({ definition, value, onSave }: {
  definition: SettingDefinition;
  value: any;
  onSave: (newValue: any) => Promise<void>;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const validationError = definition.validation?.(localValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(localValue);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save setting');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2 mb-6">
      <label className="block text-sm font-medium text-gray-900">
        {definition.label}
        {definition.required && <span className="text-red-500">*</span>}
      </label>
      <p className="text-sm text-gray-600">{definition.description}</p>
      
      {definition.type === 'boolean' ? (
        <Toggle
          checked={localValue}
          onChange={setLocalValue}
        />
      ) : definition.type === 'select' ? (
        <select
          value={localValue}
          onChange={e => setLocalValue(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          {definition.options?.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={definition.type}
          value={localValue}
          onChange={e => setLocalValue(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={isSaving || localValue === value}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
```

---

## 6. Architecture Patterns

### 6.1 Admin Authentication Context Pattern

```typescript
// Multi-tenant admin context with unified auth
interface AdminAuthContextType {
  // State
  adminUser: AdminUser | null;
  loading: boolean;
  error: Error | null;
  sessionTimeLeft: number;

  // Authentication
  login: (email: string, password: string) => Promise<LoginResult>;
  verify2FA: (code: string) => Promise<VerifyResult>;
  logout: () => Promise<void>;

  // Session Management
  refreshSession: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  extendSession: () => Promise<void>;

  // Authorization
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (role: AdminRole | AdminRole[]) => boolean;
  can: (action: string) => boolean;
}

// Usage in protected routes
function AdminRoute({ children, requiredRole, requiredPermission }: {
  children: ReactNode;
  requiredRole?: AdminRole;
  requiredPermission?: { resource: string; action: string };
}) {
  const { adminUser, loading, hasRole, hasPermission } = useAdminAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!adminUser) {
    return <Navigate to="/admin/login" />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <AccessDenied />;
  }

  if (requiredPermission && !hasPermission(
    requiredPermission.resource,
    requiredPermission.action
  )) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
```

### 6.2 Custom Hook Patterns

```typescript
// Query hooks for common admin operations
function useAdminUsers(filters?: UserFilters) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchAdminUsers(filters)
      .then(setUsers)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [filters]);

  return { users, isLoading, error };
}

// Mutation hooks for admin actions
function useCreateAdminUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { adminUser } = useAdminAuth();

  const create = async (userData: CreateAdminUserInput): Promise<AdminUser> => {
    setIsLoading(true);
    try {
      const result = await createAdminUser(userData);
      
      // Log the action
      await logAdminAction(adminUser, {
        action: 'admin_created',
        category: 'account_management',
        targetType: 'admin_user',
        targetId: result.id,
        targetIdentifier: result.email,
        newValues: result,
        severity: 'warning'
      });

      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { create, isLoading, error };
}
```

### 6.3 Middleware & Guards

```typescript
// Express middleware for admin operations
export function auditAdminAction(target: {
  type: string;
  action: string;
  category: string;
  severity: 'info' | 'warning' | 'critical';
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Capture original response send
    const originalSend = res.send;

    res.send = function(data: any) {
      // After successful operation, log the action
      if (res.statusCode < 400) {
        logAdminAction((req as any).auditContext, {
          action: target.action,
          category: target.category,
          targetType: target.type,
          severity: target.severity,
          newValues: typeof data === 'object' ? data : undefined
        }).catch(err => {
          console.error('Failed to log admin action:', err);
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

// Rate limiting for sensitive operations
export function rateLimitSensitiveOps(
  maxAttempts: number = 5,
  windowMs: number = 60 * 1000
) {
  const attempts = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.adminUser?.id || req.ip;
    const now = Date.now();
    const userAttempts = attempts.get(key) || [];

    // Remove old attempts outside window
    const recentAttempts = userAttempts.filter(t => now - t < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      return res.status(429).json({
        error: 'Too many attempts. Please try again later.'
      });
    }

    recentAttempts.push(now);
    attempts.set(key, recentAttempts);

    next();
  };
}
```

---

## 7. Security Hardening

### 7.1 Session Security Best Practices

**Configuration:**

```typescript
const SESSION_CONFIG = {
  // Duration
  maxAge: 2 * 60 * 60 * 1000,        // 2 hours
  warningThreshold: 10 * 60,          // Warn at 10 minutes left
  
  // Security
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict' as const,
  path: '/admin',
  
  // Extended sessions
  extendThreshold: 5 * 60 * 1000,     // Extend if <5min used
  maxExtensions: 3,                   // Max 3 extensions per session
};

// Set secure session cookie
res.cookie('admin_session', sessionToken, SESSION_CONFIG);
```

**Session Timeout Prevention:**

```typescript
function useSessionExtension() {
  const { sessionTimeLeft, extendSession } = useAdminAuth();

  useEffect(() => {
    if (sessionTimeLeft > 0 && sessionTimeLeft < 5) {
      extendSession().catch(err => {
        console.error('Failed to extend session:', err);
      });
    }
  }, [sessionTimeLeft, extendSession]);
}

// Show warning modal
function SessionWarning() {
  const { sessionTimeLeft, logout } = useAdminAuth();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (sessionTimeLeft === 10) {
      setShowWarning(true);
    }
  }, [sessionTimeLeft]);

  if (!showWarning) return null;

  return (
    <Modal title="Session Expiring Soon">
      <p>Your session will expire in {sessionTimeLeft} minutes.</p>
      <div className="flex gap-4">
        <button onClick={() => location.reload()}>
          Continue Working
        </button>
        <button onClick={logout}>
          Logout Now
        </button>
      </div>
    </Modal>
  );
}
```

### 7.2 IP Allowlist Implementation

```typescript
// Wildcard pattern matching for IP allowlist
function matchIPPattern(ip: string, pattern: string): boolean {
  // Convert pattern to regex
  // 192.168.1.* -> 192\.168\.1\..*
  // 10.0.0.0/24 -> 10\.0\.0\.(0|1|2|...|255)
  
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
    return regex.test(ip);
  }

  if (pattern.includes('/')) {
    // CIDR notation
    return isIPInCIDR(ip, pattern);
  }

  return ip === pattern;
}

// Express middleware
export async function enforceIPAllowlist(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const adminUser = req.adminUser;
  if (!adminUser || !adminUser.ipAllowlist || adminUser.ipAllowlist.length === 0) {
    return next();
  }

  const clientIP = req.ip || req.connection.remoteAddress;
  const isAllowed = adminUser.ipAllowlist.some(pattern =>
    matchIPPattern(clientIP, pattern)
  );

  if (!isAllowed) {
    await logAdminAction((req as any).auditContext, {
      action: 'access_denied_ip_restriction',
      category: 'security',
      severity: 'critical',
      description: `Access denied from IP: ${clientIP}`
    });

    return res.status(403).json({
      error: 'Access denied',
      message: 'Your IP address is not authorized'
    });
  }

  next();
}
```

### 7.3 CSRF & CORS Protection

```typescript
import helmet from 'helmet';
import cors from 'cors';

// Security headers
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"]
    }
  }
}));

// CORS for admin endpoints
app.use('/api/admin', cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ADMIN_ALLOWED_ORIGINS?.split(',') || [];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
}));
```

---

## 8. Performance Optimization

### 8.1 Pagination Strategies

```typescript
interface PaginationOptions {
  page?: number;
  pageSize?: number;
  cursor?: string;
  order?: 'asc' | 'desc';
}

// Offset pagination (simple, good for <100k records)
async function getAdminUsersPaginated(
  page: number = 1,
  pageSize: number = 20
) {
  const offset = (page - 1) * pageSize;

  const { data, count } = await supabase
    .from('admin_users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total: count || 0,
      hasMore: offset + pageSize < (count || 0)
    }
  };
}

// Cursor pagination (efficient for large datasets)
async function getAdminUsersCursorPaginated(
  cursor?: string,
  pageSize: number = 20
) {
  let query = supabase
    .from('admin_users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(pageSize + 1); // Fetch one extra to determine hasMore

  if (cursor) {
    query = query.gt('created_at', cursor);
  }

  const { data } = await query;

  const hasMore = (data?.length || 0) > pageSize;
  const items = data?.slice(0, pageSize) || [];
  const nextCursor = items.length > 0
    ? items[items.length - 1]?.created_at
    : null;

  return {
    data: items,
    pagination: {
      nextCursor,
      hasMore
    }
  };
}
```

### 8.2 Query Optimization

```typescript
// Batch operations for efficiency
async function batchSuspendAdmins(adminIds: string[], reason: string) {
  // Instead of N queries, use single batch operation
  const { error } = await supabase
    .from('admin_users')
    .update({
      status: 'suspended',
      status_reason: reason,
      status_changed_at: new Date()
    })
    .in('id', adminIds);

  if (error) throw error;

  // Single audit log with batch info
  await logAdminAction({
    action: 'batch_suspend_admins',
    category: 'account_management',
    description: `Suspended ${adminIds.length} admin(s)`,
    severity: 'critical'
  });
}

// Use select() efficiently
async function getAdminSummary(adminId: string) {
  // Instead of all columns, select only what's needed
  const { data } = await supabase
    .from('admin_users')
    .select('id, email, role, status, last_login_at')
    .eq('id', adminId)
    .single();

  return data;
}
```

### 8.3 Caching Strategy

```typescript
// Multi-layer caching with invalidation
class AdminPanelCache {
  private redis: RedisClient;
  private localCache: Map<string, CacheEntry> = new Map();

  async getWithFallback<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Try local cache first
    const localEntry = this.localCache.get(key);
    if (localEntry && !this.isExpired(localEntry)) {
      return localEntry.value;
    }

    // Try Redis
    try {
      const redisValue = await this.redis.get(key);
      if (redisValue) {
        const value = JSON.parse(redisValue);
        // Populate local cache
        this.localCache.set(key, {
          value,
          expiresAt: Date.now() + ttlSeconds * 1000
        });
        return value;
      }
    } catch (err) {
      console.warn('Redis error:', err);
    }

    // Fetch fresh data
    const value = await fetcher();

    // Store in both caches
    this.localCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      console.warn('Failed to cache in Redis:', err);
    }

    return value;
  }

  invalidate(pattern: RegExp | string) {
    if (typeof pattern === 'string') {
      this.localCache.delete(pattern);
      this.redis.del(pattern).catch(err => console.warn(err));
    } else {
      // Invalidate matching keys
      for (const key of this.localCache.keys()) {
        if (pattern.test(key)) {
          this.localCache.delete(key);
        }
      }

      // Also invalidate in Redis (requires SCAN)
      this.redis.scan(0, 'MATCH', `*${pattern.source}*`).catch(err =>
        console.warn(err)
      );
    }
  }
}
```

---

## 9. Implementation Checklist

### 9.1 Pre-Development Checklist

- [ ] Define admin role hierarchy and permissions matrix
- [ ] Design password policy aligned with organizational security standards
- [ ] Plan 2FA implementation (TOTP preferred for admins)
- [ ] Create audit logging schema with all required fields
- [ ] Define metrics and KPIs for dashboard
- [ ] Design settings hierarchy (global > org > dept > user)
- [ ] Plan security hardening measures (IP allowlist, session management)
- [ ] Document account recovery procedures
- [ ] Review compliance requirements (GDPR, SOC 2, etc.)

### 9.2 Authentication & Authorization

- [ ] Implement admin login with email/password
- [ ] Setup 2FA/TOTP with backup codes
- [ ] Password reset flow with email verification
- [ ] Session management with 2-hour timeout
- [ ] Failed login lockout (5 attempts, 30-min coolout)
- [ ] Role-based access control (RBAC)
- [ ] Permission checking on all endpoints
- [ ] IP allowlist enforcement
- [ ] Session extension/refresh mechanism
- [ ] Logout with session revocation

### 9.3 User Management

- [ ] Admin user creation and invitation
- [ ] User profile/details page
- [ ] Password change functionality
- [ ] Account suspension/activation
- [ ] Role modification with audit trail
- [ ] Bulk user operations
- [ ] User activity timeline
- [ ] Impersonation for support (with logging)

### 9.4 Dashboard

- [ ] Summary statistics cards
- [ ] Real-time metrics updates
- [ ] System health indicator
- [ ] Recent activity feed
- [ ] Quick actions menu
- [ ] Alerts and warnings
- [ ] Performance metrics
- [ ] Export functionality

### 9.5 Audit Logging

- [ ] Immutable audit log table
- [ ] All admin actions logged
- [ ] Change tracking (before/after values)
- [ ] IP address and user agent capture
- [ ] Severity levels (info, warning, critical)
- [ ] Audit log viewer with filters
- [ ] Search and export functionality
- [ ] Log retention and archival
- [ ] Real-time critical event notifications

### 9.6 Settings Management

- [ ] Global system settings
- [ ] Organization-level settings
- [ ] Email templates configuration
- [ ] Feature flags
- [ ] Password policy configuration
- [ ] Session timeout settings
- [ ] Rate limiting configuration
- [ ] Storage quotas
- [ ] Settings validation and schema

### 9.7 Security

- [ ] Helmet.js headers
- [ ] CORS configuration
- [ ] CSRF protection
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Rate limiting middleware
- [ ] Input validation and sanitization
- [ ] Secrets management (Supabase Vault)
- [ ] TLS/SSL enforcement
- [ ] Security audit completion

### 9.8 Performance

- [ ] Query optimization
- [ ] Pagination implementation
- [ ] Caching strategy (Redis + local)
- [ ] Bundle size optimization
- [ ] Lazy loading of admin sections
- [ ] Real-time subscription efficiency
- [ ] Batch operations for bulk actions

### 9.9 Testing

- [ ] Unit tests for auth flows
- [ ] Permission checking tests
- [ ] Audit logging tests
- [ ] Security tests (injection, XSS, etc.)
- [ ] Performance/load tests
- [ ] E2E tests for admin workflows
- [ ] Integration tests with Supabase

### 9.10 Documentation

- [ ] API documentation
- [ ] Component storybook
- [ ] Admin user guide
- [ ] Developer guide
- [ ] Security documentation
- [ ] Troubleshooting guide
- [ ] Deployment runbook

---

## Key References & Resources

### Supabase Documentation
- [Multi-Factor Authentication (TOTP)](https://supabase.com/docs/guides/auth/auth-mfa/totp)
- [Password Security](https://supabase.com/docs/guides/auth/password-security)
- [Database Vault for Secrets](https://supabase.com/docs/guides/database/vault)

### React Best Practices
- [React Context API with TypeScript](https://blog.logrocket.com/how-to-use-react-context-typescript/)
- [State Management Patterns](https://kentcdodds.com/blog/how-to-use-react-context-effectively)
- [React Admin Framework](https://marmelab.com/react-admin/)

### Security Standards
- [OWASP Admin Panel Security](https://owasp.org/www-project-top-ten/)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [CWE Top 25](https://cwe.mitre.org/top25/)

### Admin Panel Examples
- [React-Admin](https://github.com/marmelab/react-admin)
- [CoreUI React Admin](https://coreui.io/react/)
- [AdminLTE](https://adminlte.io/)

---

## Document Metadata

**Author:** Development Team Research  
**Last Updated:** January 20, 2026  
**Version:** 1.0 (Initial Research Document)  
**Status:** Complete  
**Review Frequency:** Quarterly  
**Next Review Date:** April 20, 2026  

For questions or clarifications, please contact the Security Team.

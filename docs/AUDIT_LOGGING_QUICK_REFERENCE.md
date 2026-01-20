# Audit Logging Quick Reference Guide

## 1. Immutability Verification

### Check if Audit Logs are Protected
```sql
-- Verify immutability trigger exists
SELECT trigger_name, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_name LIKE '%audit%immutable%';
```

### Attempt to Modify (Should Fail)
```sql
-- This WILL FAIL (as intended)
UPDATE admin_actions SET action = 'modified_action' WHERE id = 'some-uuid';
-- Error: "Admin actions are immutable and cannot be modified or deleted"
```

---

## 2. Structured Logging Examples

### Log a User Suspension
```typescript
const { data, error } = await supabase.rpc('log_admin_action', {
  p_admin_user_id: adminId,
  p_action: 'user.suspended',
  p_action_category: 'security',
  p_target_type: 'user',
  p_target_id: userId,
  p_target_identifier: userEmail,
  p_old_values: JSON.stringify({ status: 'active', last_login: '2026-01-20' }),
  p_new_values: JSON.stringify({ status: 'suspended', locked_until: '2026-01-27' }),
  p_reason: 'Suspicious activity detected',
  p_ip_address: req.ip,
  p_severity: 'critical'
});
```

---

## 3. Filtering & Search Patterns

### By Severity
```typescript
const { data } = await supabase
  .from('admin_actions')
  .select('*')
  .in('severity', ['warning', 'critical'])
  .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
```

### Full Text Search
```typescript
const { data } = await supabase
  .from('admin_actions')
  .select('*')
  .or('action.ilike.%search%,target_identifier.ilike.%search%')
  .order('created_at', { ascending: false });
```

---

## 4. Severity Levels

| Level | Use Case | Examples |
|-------|----------|----------|
| `info` | Normal operations | User created, notice published |
| `warning` | Important changes | Account suspended, role changed |
| `critical` | Security events | Credential reset, permissions revoked |

---

## 5. GDPR Operations

### Export Personal Data
```typescript
const auditData = await exportPersonalAuditData(userId, 'json');
```

### Anonymize Old Logs
```sql
SELECT anonymize_user_audit_logs('user-uuid', 'User requested deletion');
```

---

## 6. Key Database Functions

- `log_admin_action()` - Insert audit entry
- `get_recent_activity()` - Fetch recent logs
- `get_resource_audit_trail()` - Trace resource changes
- `archive_old_audit_logs()` - Archive by retention
- `cleanup_audit_logs_by_policy()` - Policy-based cleanup
- `anonymize_user_audit_logs()` - GDPR anonymization

---

## 7. API Endpoints

```
GET /api/admin/audit - List with filters
GET /api/admin/audit/recent - Last 10 actions
GET /api/admin/audit/export - CSV download
```

---

## 8. Performance Indexes

```sql
idx_audit_org_category          -- Organization + Category queries
idx_audit_severity_recent       -- Security event filtering
idx_audit_resource              -- Resource history
idx_audit_user_actions          -- Per-user activity
```


# Comprehensive Audit Logging for Admin Panels: Research Document

**Research Date:** January 20, 2026  
**Focus:** Immutable audit trails, structured logging, real-time streaming, compliance, and performance optimization

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Audit Trail Architecture](#core-audit-trail-architecture)
3. [Immutable Audit Trail Implementation](#immutable-audit-trail-implementation)
4. [Structured Logging with Old/New Values](#structured-logging-with-oldnew-values)
5. [Real-time Audit Log Streaming](#real-time-audit-log-streaming)
6. [Audit Log Filtering & Search](#audit-log-filtering--search)
7. [GDPR Compliance for Audit Logs](#gdpr-compliance-for-audit-logs)
8. [Performance Considerations](#performance-considerations)
9. [Implementation Best Practices](#implementation-best-practices)
10. [Reference Implementations](#reference-implementations)

---

## Executive Summary

Audit logging for admin panels requires:
- **Immutability**: Database-enforced write-once, append-only architecture
- **Structure**: Standardized JSON-compatible fields with old/new value pairs
- **Correlation**: Session IDs and user agents for request tracing
- **Searchability**: Composite indexes for common query patterns
- **Compliance**: GDPR-aware retention policies with anonymization support
- **Performance**: Partitioning, archival strategies, and efficient indexing

### Key Metrics from Reference Implementation
- **Audit Table Indexes**: 8 indexes covering common query patterns
- **Immutability**: Database-level triggers preventing modification
- **Retention**: Configurable archival policies (default: 365 days)
- **Severity Levels**: 3 levels (info, warning, critical) for filtering
- **Categories**: 9+ action categories for hierarchical classification

---

## Core Audit Trail Architecture

### Design Principles

1. **Append-Only**: Only INSERT operations allowed; UPDATE/DELETE prevented by triggers
2. **Immutable Timestamps**: All timestamps created by database (NOW()), not client
3. **Snapshot Consistency**: User email and admin role captured at action time
4. **Contextual Metadata**: IP address, user agent, and session ID for correlation

### Database Schema Pattern

```sql
CREATE TABLE audit_logs (
  -- Unique identifier
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organizational context
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,

  -- Actor information (snapshot at time of action)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,  -- Immutable snapshot
  user_role TEXT,   -- Immutable snapshot

  -- Action details
  action TEXT NOT NULL,
  action_category TEXT NOT NULL CHECK (action_category IN (
    'auth', 'notice', 'template', 'team', 'organization',
    'department', 'submission', 'representation', 'settings', 'security'
  )),

  -- Resource affected
  resource_type TEXT,
  resource_id UUID,

  -- Change tracking
  old_values JSONB,    -- Previous state (for updates/deletes)
  new_values JSONB,    -- New state (for creates/updates)
  metadata JSONB,      -- Additional context

  -- Request context
  ip_address INET,
  user_agent TEXT,
  session_id UUID REFERENCES admin_sessions(id) ON DELETE SET NULL,

  -- Security classification
  severity TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'critical')),

  -- Timestamp (database-enforced immutability)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Immutability Enforcement

```sql
-- Prevent any modification to audit logs
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();
```

**Key Features:**
- Trigger executes before any UPDATE or DELETE operation
- Exception raised prevents operation completion
- Log entry remains permanently in database
- Even superusers cannot bypass without dropping trigger

---

## Immutable Audit Trail Implementation

### 1. Database-Level Constraints

#### Approach 1: INSERT-Only Tables
```sql
-- Restrict to INSERT only via row-level security
CREATE POLICY "audit_logs_insert_only"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "audit_logs_no_update"
  ON audit_logs
  FOR UPDATE
  USING (false);

CREATE POLICY "audit_logs_no_delete"
  ON audit_logs
  FOR DELETE
  USING (false);
```

#### Approach 2: Trigger-Based Prevention
```sql
-- Most reliable: prevents even database administrators
CREATE TRIGGER audit_immutable_trigger
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION raise_audit_immutability_error();
```

#### Approach 3: Stored Procedure Wrapper
```sql
CREATE OR REPLACE FUNCTION insert_audit_log(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id, action, resource_type, old_values, new_values, created_at
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_old_values, p_new_values, NOW()
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Temporal Data Immutability

```sql
-- Store only created_at; no updated_at field
-- Prevents accidental timestamp modification

-- For archival, use separate archive table (never update source)
CREATE TABLE audit_logs_archive (LIKE audit_logs INCLUDING ALL);

-- Archive with verification
CREATE OR REPLACE FUNCTION archive_old_audit_logs(
  p_days_to_keep INTEGER DEFAULT 365
) RETURNS TABLE(archived_count INTEGER, deleted_count INTEGER) AS $$
DECLARE
  v_archived INTEGER := 0;
  v_deleted INTEGER := 0;
BEGIN
  -- Move to archive (INSERT + verify + DELETE from source)
  WITH archived AS (
    INSERT INTO audit_logs_archive
    SELECT * FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '1 day' * p_days_to_keep
    RETURNING id
  )
  SELECT COUNT(*) INTO v_archived FROM archived;
  
  -- Only delete after successful archival
  IF v_archived > 0 THEN
    DELETE FROM audit_logs
    WHERE id IN (SELECT id FROM audit_logs_archive
                 WHERE created_at < NOW() - INTERVAL '1 day' * p_days_to_keep);
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
  END IF;
  
  RETURN QUERY SELECT v_archived::INTEGER, v_deleted::INTEGER;
END;
$$ LANGUAGE plpgsql;
```

### 3. Cryptographic Verification

```sql
-- Optional: Add hash chain for tamper detection
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS
  previous_hash TEXT,
  current_hash TEXT;

-- Compute hash of current + all previous logs
CREATE OR REPLACE FUNCTION compute_audit_hash(p_log_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    digest(
      COALESCE((
        SELECT previous_hash FROM audit_logs
        WHERE id < p_log_id
        ORDER BY created_at DESC
        LIMIT 1
      ), '') ||
      COALESCE(p_log_id::TEXT, '') ||
      COALESCE((
        SELECT created_at::TEXT FROM audit_logs WHERE id = p_log_id
      ), ''),
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## Structured Logging with Old/New Values

### 1. JSONB Change Tracking

```typescript
// Server-side implementation
async function logStructuredChange(
  userId: string,
  resourceType: string,
  resourceId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  reason?: string
) {
  const changes = {
    // Only log changed fields for clarity
    fields_changed: Object.keys(newValues || {}).filter(key => 
      JSON.stringify(oldValues?.[key]) !== JSON.stringify(newValues?.[key])
    ),
    
    // Detailed before/after for audit trail
    old_values: oldValues,
    new_values: newValues,
    
    // Metadata
    change_reason: reason,
    timestamp: new Date().toISOString()
  };

  await supabase.rpc('insert_audit_log', {
    p_user_id: userId,
    p_action: 'resource.updated',
    p_resource_type: resourceType,
    p_resource_id: resourceId,
    p_old_values: oldValues ? JSON.stringify(oldValues) : null,
    p_new_values: newValues ? JSON.stringify(newValues) : null,
    p_metadata: JSON.stringify(changes)
  });
}
```

### 2. Selective Field Logging

```typescript
// Log only sensitive fields for performance
const SENSITIVE_FIELDS = {
  'organizations': ['status', 'suspended_reason', 'api_key'],
  'users': ['role', 'email', 'last_login_at'],
  'notices': ['status', 'publication_date', 'visibility']
};

function filterForAudit(
  resourceType: string,
  oldValues: any,
  newValues: any
): { old: any; new: any } {
  const sensitiveFields = SENSITIVE_FIELDS[resourceType] || Object.keys(newValues);
  
  return {
    old: Object.fromEntries(
      sensitiveFields.map(field => [field, oldValues?.[field]])
    ),
    new: Object.fromEntries(
      sensitiveFields.map(field => [field, newValues?.[field]])
    )
  };
}
```

### 3. Metadata Structure

```sql
-- Structured metadata for context-specific info
CREATE DOMAIN audit_metadata AS JSONB DEFAULT '{}';

-- Standard metadata fields
/*
{
  "request_id": "uuid",
  "trace_id": "uuid",
  "user_agent": "Mozilla/5.0...",
  "referrer": "admin-panel/accounts",
  "bulk_operation": {
    "operation_id": "uuid",
    "batch_size": 50,
    "batch_index": 1
  },
  "approval_chain": {
    "approver_id": "uuid",
    "approval_timestamp": "ISO-8601",
    "comments": "..."
  },
  "impact_analysis": {
    "affected_records": 10,
    "estimated_consequence": "high",
    "rollback_available": true
  }
}
*/
```

---

## Real-time Audit Log Streaming

### 1. Supabase Realtime Implementation

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuditLogStream(organizationId: string) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to new audit logs
    const subscription = supabase
      .channel(`audit_logs:org_${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          const newLog = payload.new as AuditLog;
          
          // Update UI with real-time data
          setLogs(prevLogs => [newLog, ...prevLogs]);
          
          // Optional: Show notification for critical events
          if (newLog.severity === 'critical') {
            showCriticalEventNotification(newLog);
          }
        }
      )
      .on('subscribe', () => setIsConnected(true))
      .on('system', ({ event, message }) => {
        if (event === 'connection_error') {
          console.error('Realtime connection error:', message);
          setIsConnected(false);
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [organizationId]);

  return { logs, isConnected };
}
```

### 2. Webhook-Based Streaming

```typescript
// Alternative: Webhook notifications for critical events
import express from 'express';

app.post('/webhooks/audit-alert', express.json(), async (req, res) => {
  const { audit_log } = req.body;

  // Verify webhook signature
  const signature = req.headers['x-webhook-signature'] as string;
  if (!verifyWebhookSignature(audit_log, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process critical audit events
  if (audit_log.severity === 'critical') {
    await handleCriticalEvent(audit_log);
  }

  res.json({ received: true });
});

// Send to external systems (SIEM, Datadog, etc.)
async function handleCriticalEvent(auditLog: AuditLog) {
  const channels = [
    sendToSlack(auditLog),
    sendToDatadog(auditLog),
    sendToSplunk(auditLog),
    createPagerDutyIncident(auditLog)
  ];

  await Promise.allSettled(channels);
}
```

### 3. Change Feed Polling

```sql
-- For high-volume scenarios, use change feed polling
CREATE OR REPLACE FUNCTION get_audit_changes_since(
  p_since_timestamp TIMESTAMPTZ,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
  id UUID,
  action TEXT,
  action_category TEXT,
  resource_type TEXT,
  severity TEXT,
  created_at TIMESTAMPTZ,
  changes JSONB
) AS $$
SELECT
  id,
  action,
  action_category,
  resource_type,
  severity,
  created_at,
  jsonb_build_object(
    'old_values', old_values,
    'new_values', new_values,
    'user_email', user_email
  ) AS changes
FROM audit_logs
WHERE created_at > p_since_timestamp
ORDER BY created_at ASC
LIMIT p_limit;
$$ LANGUAGE SQL STABLE;
```

---

## Audit Log Filtering & Search

### 1. Indexed Query Patterns

```sql
-- Comprehensive indexing strategy
CREATE INDEX idx_audit_org_category 
  ON audit_logs(organization_id, action_category, created_at DESC);

CREATE INDEX idx_audit_severity_recent
  ON audit_logs(severity, created_at DESC)
  WHERE severity IN ('warning', 'critical');

CREATE INDEX idx_audit_resource
  ON audit_logs(resource_type, resource_id);

CREATE INDEX idx_audit_user_actions
  ON audit_logs(user_id, action, created_at DESC);

-- Text search indexing
CREATE INDEX idx_audit_action_text
  ON audit_logs USING GIN(to_tsvector('english', action));

CREATE INDEX idx_audit_changes_text
  ON audit_logs USING GIN(old_values, new_values);
```

### 2. Advanced Filtering Function

```sql
CREATE OR REPLACE FUNCTION search_audit_logs(
  p_org_id UUID,
  p_filters JSONB DEFAULT '{}',
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  action TEXT,
  user_email TEXT,
  resource_type TEXT,
  severity TEXT,
  created_at TIMESTAMPTZ,
  old_values JSONB,
  new_values JSONB
) AS $$
DECLARE
  v_category TEXT := p_filters->>'category';
  v_severity TEXT := p_filters->>'severity';
  v_resource_type TEXT := p_filters->>'resource_type';
  v_date_from TIMESTAMPTZ := (p_filters->>'date_from')::TIMESTAMPTZ;
  v_date_to TIMESTAMPTZ := (p_filters->>'date_to')::TIMESTAMPTZ;
  v_search_term TEXT := p_filters->>'search';
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.action,
    al.user_email,
    al.resource_type,
    al.severity,
    al.created_at,
    al.old_values,
    al.new_values
  FROM audit_logs al
  WHERE al.organization_id = p_org_id
    AND (v_category IS NULL OR al.action_category = v_category)
    AND (v_severity IS NULL OR al.severity = v_severity)
    AND (v_resource_type IS NULL OR al.resource_type = v_resource_type)
    AND (v_date_from IS NULL OR al.created_at >= v_date_from)
    AND (v_date_to IS NULL OR al.created_at <= v_date_to)
    AND (v_search_term IS NULL OR 
         al.action ILIKE '%' || v_search_term || '%' OR
         al.user_email ILIKE '%' || v_search_term || '%' OR
         al.resource_type ILIKE '%' || v_search_term || '%')
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 3. Full-Text Search

```typescript
// Client-side search with FTS
async function searchAuditLogs(
  organizationId: string,
  searchTerm: string,
  filters?: {
    category?: string;
    severity?: 'info' | 'warning' | 'critical';
    dateFrom?: Date;
    dateTo?: Date;
  }
) {
  const { data, error } = await supabase.rpc('search_audit_logs', {
    p_org_id: organizationId,
    p_filters: {
      category: filters?.category,
      severity: filters?.severity,
      date_from: filters?.dateFrom?.toISOString(),
      date_to: filters?.dateTo?.toISOString(),
      search: searchTerm
    }
  });

  if (error) throw error;
  return data;
}
```

---

## GDPR Compliance for Audit Logs

### 1. Right to Erasure (Article 17)

```sql
-- Selective deletion with verification
CREATE OR REPLACE FUNCTION anonymize_user_audit_logs(
  p_user_id UUID,
  p_reason TEXT
)
RETURNS TABLE(
  anonymized_count INTEGER,
  retained_count INTEGER
) AS $$
DECLARE
  v_anonymized INTEGER := 0;
  v_retained INTEGER := 0;
BEGIN
  -- Identify logs that CAN be anonymized (non-critical)
  CREATE TEMP TABLE temp_anonymize AS
  SELECT id FROM audit_logs
  WHERE user_id = p_user_id
    AND severity != 'critical'
    AND created_at < NOW() - INTERVAL '90 days'
    AND action NOT IN ('security.permission_change', 'security.credential_reset');

  -- Anonymize (replace PII with hashes)
  UPDATE audit_logs
  SET user_email = 'anonymized_' || substring(md5(user_email), 1, 8) || '@redacted.local'
  WHERE id IN (SELECT id FROM temp_anonymize);

  GET DIAGNOSTICS v_anonymized = ROW_COUNT;

  -- Count retained critical logs
  SELECT COUNT(*) INTO v_retained FROM audit_logs
  WHERE user_id = p_user_id
    AND (severity = 'critical' OR action IN 
         ('security.permission_change', 'security.credential_reset'));

  DROP TABLE temp_anonymize;
  
  RETURN QUERY SELECT v_anonymized::INTEGER, v_retained::INTEGER;
END;
$$ LANGUAGE plpgsql;
```

### 2. Data Portability (Article 20)

```typescript
// Export all personal audit data in portable format
async function exportPersonalAuditData(userId: string, format: 'json' | 'csv' = 'json') {
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  if (format === 'csv') {
    return convertToCSV(logs);
  }

  return {
    exported_at: new Date().toISOString(),
    data_subject_id: userId,
    audit_entries: logs.map(log => ({
      timestamp: log.created_at,
      action: log.action,
      resource: {
        type: log.resource_type,
        id: log.resource_id
      },
      changes: {
        before: log.old_values,
        after: log.new_values
      },
      context: {
        ip_address: log.ip_address,
        user_agent: log.user_agent
      }
    }))
  };
}
```

### 3. Retention Policy Compliance

```sql
-- Automated retention with legal holds
CREATE TABLE audit_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_category TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  legal_hold BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO audit_retention_policies (action_category, retention_days, legal_hold) VALUES
  ('auth', 90, false),
  ('notice', 365, false),
  ('security', 2555, true),  -- 7 years for security events
  ('billing', 2555, true);   -- 7 years for financial events

-- Cleanup function respecting policies
CREATE OR REPLACE FUNCTION cleanup_audit_logs_by_policy()
RETURNS TABLE(
  deleted_count INTEGER,
  retained_count INTEGER
) AS $$
DECLARE
  v_deleted INTEGER := 0;
  v_retained INTEGER := 0;
BEGIN
  DELETE FROM audit_logs al
  WHERE NOT EXISTS (
    SELECT 1 FROM audit_retention_policies arp
    WHERE al.action_category = arp.action_category
      AND arp.legal_hold = false
      AND al.created_at < NOW() - INTERVAL '1 day' * arp.retention_days
  );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  SELECT COUNT(*) INTO v_retained FROM audit_logs;

  RETURN QUERY SELECT v_deleted::INTEGER, v_retained::INTEGER;
END;
$$ LANGUAGE plpgsql;
```

### 4. Privacy Impact Assessment

```typescript
// Document compliance decisions
interface PrivacyImpactRecord {
  audit_id: string;
  pii_detected: boolean;
  pii_fields: string[];
  consent_level: 'required' | 'legitimate_interest' | 'legal_obligation';
  retention_justified: boolean;
  retention_justification: string;
  processing_purpose: string[];
  third_party_shared: boolean;
  encryption_applied: boolean;
}
```

---

## Performance Considerations

### 1. Table Partitioning

```sql
-- Partition by month for faster queries and archival
CREATE TABLE audit_logs_202601 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE audit_logs_202602 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Automatic partition creation
CREATE OR REPLACE FUNCTION create_audit_partition(
  p_year INTEGER,
  p_month INTEGER
) RETURNS void AS $$
DECLARE
  v_partition_name TEXT;
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  v_partition_name := format('audit_logs_%04d%02d', p_year, p_month);
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := v_start_date + INTERVAL '1 month';

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs
     FOR VALUES FROM (%L) TO (%L)',
    v_partition_name, v_start_date, v_end_date
  );
END;
$$ LANGUAGE plpgsql;
```

### 2. Write Optimization

```sql
-- Batch insertion for bulk operations
CREATE OR REPLACE FUNCTION batch_insert_audit_logs(
  p_logs JSONB[]
)
RETURNS TABLE(inserted_count INTEGER, failed_count INTEGER) AS $$
DECLARE
  v_inserted INTEGER := 0;
  v_failed INTEGER := 0;
  v_log JSONB;
BEGIN
  FOREACH v_log IN ARRAY p_logs
  LOOP
    BEGIN
      INSERT INTO audit_logs (
        user_id, action, action_category, resource_type, resource_id,
        old_values, new_values, severity, ip_address, session_id
      ) VALUES (
        v_log->>'user_id',
        v_log->>'action',
        v_log->>'action_category',
        v_log->>'resource_type',
        v_log->>'resource_id',
        v_log->'old_values',
        v_log->'new_values',
        v_log->>'severity',
        v_log->>'ip_address',
        v_log->>'session_id'
      );
      v_inserted := v_inserted + 1;
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
      CONTINUE;
    END;
  END LOOP;

  RETURN QUERY SELECT v_inserted::INTEGER, v_failed::INTEGER;
END;
$$ LANGUAGE plpgsql;
```

### 3. Read Query Optimization

```typescript
// Implement caching for frequently accessed logs
import NodeCache from 'node-cache';

const auditLogCache = new NodeCache({ stdTTL: 300 }); // 5-minute TTL

async function getAuditLogsSummary(organizationId: string) {
  const cacheKey = `audit_summary:${organizationId}`;
  
  // Try cache first
  const cached = auditLogCache.get(cacheKey);
  if (cached) return cached;

  // Fetch from database
  const { data, error } = await supabase.rpc('get_audit_summary', {
    p_org_id: organizationId
  });

  if (!error) {
    auditLogCache.set(cacheKey, data);
  }

  return data;
}
```

### 4. Large Export Optimization

```typescript
// Stream large exports to avoid memory exhaustion
app.get('/api/admin/audit/export-stream', async (req, res) => {
  const { organizationId, dateFrom, dateTo } = req.query;

  // Set streaming headers
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');

  // Stream results from database cursor
  const stream = await supabase
    .from('audit_logs')
    .select('*', { count: 'none' })
    .eq('organization_id', organizationId)
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo)
    .order('created_at', { ascending: false })
    .stream();

  // Convert stream to CSV and pipe to response
  stream
    .on('data', (row) => {
      res.write(convertRowToCSV(row) + '\n');
    })
    .on('error', (error) => {
      console.error('Stream error:', error);
      res.end();
    })
    .on('end', () => {
      res.end();
    });
});
```

---

## Implementation Best Practices

### 1. Action Naming Convention

```
<entity>.<action>

Examples:
- user.created
- user.suspended
- user.credentials_reset
- notice.published
- notice.unpublished
- template.created
- template.deleted
- permission.granted
- permission.revoked
- api_key.rotated
- audit_log.exported
```

### 2. Error Handling in Logging

```typescript
// Never let logging failures crash the application
async function safeLogAction(action: AdminAction) {
  try {
    await logAdminAction(action);
  } catch (error) {
    // Log to application error tracking
    Sentry.captureException(error, {
      contexts: {
        audit: {
          action: action.type,
          target: action.targetId
        }
      }
    });

    // Continue application flow
    console.error('Failed to log admin action:', error);
  }
}
```

### 3. Sensitive Data Masking

```typescript
function maskSensitiveData(value: any, fieldName: string): any {
  const SENSITIVE_PATTERNS = {
    'password': /./g,
    'api_key': value => value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4),
    'email': value => value.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    'phone': value => value.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2'),
    'ssn': value => value.replace(/(\d{3})-(\d{2})(\d{4})/, '$1-**-$3')
  };

  const pattern = SENSITIVE_PATTERNS[fieldName];
  if (pattern) {
    if (typeof pattern === 'function') return pattern(value);
    return value.replace(pattern, '*');
  }

  return value;
}
```

### 4. Correlation and Tracing

```typescript
// Use request ID for correlating related events
import { v4 as uuidv4 } from 'uuid';

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  req.traceId = req.headers['x-trace-id'] || uuidv4();
  
  res.setHeader('X-Request-ID', req.id);
  res.setHeader('X-Trace-ID', req.traceId);
  
  next();
});

// Include in audit logs
async function logWithContext(action: AdminAction) {
  await logAdminAction({
    ...action,
    metadata: {
      request_id: getCurrentRequest().id,
      trace_id: getCurrentRequest().traceId,
      parent_request_id: getCurrentRequest().parentId
    }
  });
}
```

---

## Reference Implementations

### Implementation from Codebase

#### Database Schema
- **Location**: `/supabase/migrations/20260120000003_admin_actions_audit.sql`
- **Features**:
  - 8 performance indexes
  - Trigger-based immutability
  - RPC function for insertion
  - Admin role and email snapshot
  - Severity classification

#### API Endpoints
- **Location**: `/server/routes/admin/audit.ts`
- **Features**:
  - Pagination support (50/100 limit)
  - Date range filtering
  - Category filtering
  - Severity filtering
  - Full-text search
  - CSV export
  - 4 endpoints (list, recent, export, stream)

#### UI Component
- **Location**: `/src/pages/admin/AuditLog.tsx`
- **Features**:
  - Real-time data display
  - Infinite scroll pagination
  - Multi-filter UI
  - Export functionality
  - Detail modal with old/new values
  - Severity-based color coding

#### Middleware
- **Location**: `/server/middleware/adminAuth.ts`
- **Features**:
  - `logAdminAction()` middleware factory
  - Automatic severity detection
  - Response data capture
  - Session tracking
  - IP allowlist enforcement logging

---

## Compliance Checklist

- [ ] **Immutability**: Audit logs cannot be modified after creation
- [ ] **Audit Trail**: All admin actions logged with timestamp
- [ ] **User Attribution**: Every action linked to authenticated user
- [ ] **Session Correlation**: Session ID stored for request tracing
- [ ] **Data Changes**: Old and new values recorded for updates
- [ ] **Retention Policy**: Defined retention periods by action category
- [ ] **GDPR Right to Erasure**: Support for selective anonymization
- [ ] **Data Portability**: Export audit data in portable format
- [ ] **Encryption**: Sensitive fields masked or encrypted
- [ ] **Access Control**: Audit logs readable by authorized personnel only
- [ ] **Performance**: Partitioned and indexed for fast queries
- [ ] **Archival**: Automatic archival of old logs
- [ ] **Monitoring**: Real-time alerts for critical events
- [ ] **Documentation**: Clear audit trail purpose and retention

---

## Conclusion

An effective audit logging system for admin panels requires:

1. **Database-level immutability** using triggers and constraints
2. **Structured data** capturing old/new values as JSONB
3. **Comprehensive indexing** for common query patterns
4. **Real-time streaming** capabilities for security monitoring
5. **GDPR-compliant** retention and anonymization policies
6. **Performance optimization** through partitioning and archival
7. **Clear categorization** and severity classification
8. **Integration** with security tools (SIEM, alerting, etc.)

The reference implementation demonstrates production-ready patterns that can be adapted for various admin panel requirements.


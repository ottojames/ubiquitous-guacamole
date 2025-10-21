# Database Optimization Guide

## 📊 Recommended Indexes

### Submissions Table

```sql
-- Speed up submission queries by status and department
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_department ON submissions(receiving_department_id);
CREATE INDEX IF NOT EXISTS idx_submissions_organization ON submissions(submitting_organization_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assigned ON submissions(assigned_to);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_submissions_dept_status
ON submissions(receiving_department_id, status, submitted_at DESC);

-- Speed up SLA compliance queries
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_submissions_reviewed_at ON submissions(reviewed_at);
```

### Notices Table

```sql
-- Speed up published notices queries
CREATE INDEX IF NOT EXISTS idx_notices_status ON notices(status);
CREATE INDEX IF NOT EXISTS idx_notices_department ON notices(department_id);
CREATE INDEX IF NOT EXISTS idx_notices_published ON notices(published_at);

-- Composite index for public portal queries
CREATE INDEX IF NOT EXISTS idx_notices_status_published
ON notices(status, published_at DESC) WHERE status = 'published';

-- Speed up deadline tracking
CREATE INDEX IF NOT EXISTS idx_notices_deadline ON notices(representation_deadline);
CREATE INDEX IF NOT EXISTS idx_notices_expires ON notices(expires_at);
```

### Representations Table

```sql
-- Speed up representation queries by status and notice
CREATE INDEX IF NOT EXISTS idx_representations_status ON representations(status);
CREATE INDEX IF NOT EXISTS idx_representations_notice ON representations(notice_id);
CREATE INDEX IF NOT EXISTS idx_representations_department ON representations(department_id);

-- Composite index for council representation manager
CREATE INDEX IF NOT EXISTS idx_representations_dept_status
ON representations(department_id, status, submitted_at DESC);

-- Speed up reviewer queries
CREATE INDEX IF NOT EXISTS idx_representations_reviewer ON representations(reviewed_by);
```

### Organization & Department Tables

```sql
-- Speed up organization queries by type
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Speed up department lookups
CREATE INDEX IF NOT EXISTS idx_departments_slug ON departments(slug);
CREATE INDEX IF NOT EXISTS idx_departments_organization ON departments(organization_id);
```

### Membership Tables

```sql
-- Speed up user membership lookups
CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org ON organization_memberships(organization_id);

CREATE INDEX IF NOT EXISTS idx_dept_memberships_user ON department_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_dept_memberships_dept ON department_memberships(department_id);

-- Composite index for role-based queries
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_role
ON organization_memberships(user_id, role);

CREATE INDEX IF NOT EXISTS idx_dept_memberships_user_role
ON department_memberships(user_id, role);
```

### Audit Log

```sql
-- Speed up audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);

-- Composite index for filtered audit queries
CREATE INDEX IF NOT EXISTS idx_audit_log_table_action
ON audit_log(table_name, action, timestamp DESC);
```

## 🚀 Query Optimizations

### 1. Submissions Dashboard Query

**Before:**
```sql
SELECT * FROM submissions WHERE receiving_department_id = ?
```

**After (with indexes):**
```sql
SELECT
  s.id, s.title, s.status, s.submitted_at, s.notice_type,
  o.name as submitting_org_name,
  p.email as assigned_officer_email
FROM submissions s
LEFT JOIN organizations o ON s.submitting_organization_id = o.id
LEFT JOIN profiles p ON s.assigned_to = p.id
WHERE s.receiving_department_id = ?
  AND s.status IN ('new', 'in_review')
ORDER BY s.submitted_at ASC
LIMIT 100;
```

### 2. Public Notices Query

**Before:**
```sql
SELECT * FROM notices WHERE status = 'published' ORDER BY published_at DESC
```

**After (with partial index):**
```sql
SELECT
  n.id, n.title, n.notice_type, n.published_at,
  n.representation_deadline, n.premises_name, n.premises_postcode,
  d.name as department_name,
  o.name as organization_name
FROM notices n
INNER JOIN departments d ON n.department_id = d.id
INNER JOIN organizations o ON d.organization_id = o.id
WHERE n.status = 'published'
  AND (n.expires_at IS NULL OR n.expires_at > NOW())
ORDER BY n.published_at DESC
LIMIT 100;
```

### 3. SLA Compliance Query

**Before:**
```sql
SELECT * FROM submissions WHERE receiving_department_id = ?
```

**After (optimized for date calculations):**
```sql
SELECT
  COUNT(*) FILTER (WHERE
    (status = 'new' AND submitted_at > NOW() - INTERVAL '5 days') OR
    (status = 'in_review' AND submitted_at > NOW() - INTERVAL '10 days')
  ) as within_sla,
  COUNT(*) FILTER (WHERE
    (status = 'new' AND submitted_at <= NOW() - INTERVAL '5 days') OR
    (status = 'in_review' AND submitted_at <= NOW() - INTERVAL '10 days')
  ) as breached_sla
FROM submissions
WHERE receiving_department_id = ?
  AND status IN ('new', 'in_review');
```

### 4. Representations by Notice

**Before:**
```sql
SELECT * FROM representations WHERE notice_id = ?
```

**After (with aggregation):**
```sql
SELECT
  r.*,
  p.email as reviewer_email
FROM representations r
LEFT JOIN profiles p ON r.reviewed_by = p.id
WHERE r.notice_id = ?
ORDER BY
  CASE r.status
    WHEN 'new' THEN 1
    WHEN 'reviewed' THEN 2
    WHEN 'actioned' THEN 3
  END,
  r.submitted_at DESC;
```

## 📈 Performance Monitoring

### Slow Query Identification

```sql
-- Enable slow query logging in Supabase
-- Check for queries taking > 1 second

SELECT
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Index Usage Statistics

```sql
-- Check which indexes are being used
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Missing Indexes

```sql
-- Identify tables with sequential scans (potential missing indexes)
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  seq_tup_read / seq_scan as avg_seq_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 20;
```

## 🧹 Maintenance Tasks

### 1. Regular VACUUM

```sql
-- Run weekly to reclaim storage and update statistics
VACUUM ANALYZE submissions;
VACUUM ANALYZE notices;
VACUUM ANALYZE representations;
```

### 2. Update Statistics

```sql
-- Run after bulk imports or major changes
ANALYZE submissions;
ANALYZE notices;
ANALYZE representations;
```

### 3. Reindex

```sql
-- Run monthly to rebuild indexes
REINDEX TABLE submissions;
REINDEX TABLE notices;
REINDEX TABLE representations;
```

## 📊 Table Partitioning (Future)

For tables that grow very large (>1M rows), consider partitioning:

### Partition Submissions by Date

```sql
-- Example: Partition submissions by quarter
CREATE TABLE submissions_2024_q1 PARTITION OF submissions
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE submissions_2024_q2 PARTITION OF submissions
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- etc.
```

### Partition Audit Log by Date

```sql
-- Example: Partition audit log by month
CREATE TABLE audit_log_2024_01 PARTITION OF audit_log
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_log_2024_02 PARTITION OF audit_log
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- etc.
```

## 🔒 Connection Pooling

### Supabase Pooler Configuration

```env
# Use transaction pooler for most queries
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:6543/postgres

# Use session pooler for long-running queries
DATABASE_URL_SESSION=postgresql://[USER]:[PASSWORD]@[HOST]:5432/postgres
```

### Application-Level Pooling

```typescript
// Supabase client already handles connection pooling
// But ensure you're not creating multiple clients

// ✅ Good: Single client instance
export const supabase = createClient(url, key);

// ❌ Bad: Creating multiple clients
// Don't do this in every component
```

## 📝 Materialized Views (Advanced)

For expensive aggregations, consider materialized views:

```sql
-- Example: Pre-compute dashboard statistics
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
  receiving_department_id,
  COUNT(*) FILTER (WHERE status = 'new') as new_count,
  COUNT(*) FILTER (WHERE status = 'in_review') as review_count,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  AVG(EXTRACT(EPOCH FROM (reviewed_at - submitted_at))/86400) as avg_review_days
FROM submissions
GROUP BY receiving_department_id;

-- Refresh daily or on-demand
REFRESH MATERIALIZED VIEW dashboard_stats;
```

## 🎯 Caching Strategy

### Application-Level Caching

```typescript
// Use React Query for client-side caching
import { useQuery } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['submissions', departmentId],
  queryFn: () => fetchSubmissions(departmentId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000  // 30 minutes
});
```

### Supabase Edge Functions Caching

```typescript
// Cache static data at the edge
export const councilsQuery = supabase
  .from('organizations')
  .select('id, name')
  .eq('type', 'council')
  .order('name');

// Cache for 1 hour
const { data, error } = await councilsQuery.setCacheTime(3600);
```

## 🚨 Alerts and Monitoring

### Set Up Alerts

1. **Slow Queries** - Alert when queries exceed 2 seconds
2. **High Connection Count** - Alert when connections > 80% of pool
3. **Table Bloat** - Alert when tables need VACUUM
4. **Index Usage** - Alert on unused indexes
5. **Disk Space** - Alert when database > 80% capacity

### Monitoring Dashboards

- Query performance trends
- Connection pool utilization
- Cache hit rates
- Table sizes over time
- Index effectiveness

---

**Implementation Priority:**

1. ✅ Add all recommended indexes (immediate performance boost)
2. ✅ Enable slow query logging
3. ✅ Set up weekly VACUUM jobs
4. ⏳ Implement application-level caching
5. ⏳ Monitor and tune based on actual usage patterns
6. ⏳ Consider partitioning when tables exceed 1M rows

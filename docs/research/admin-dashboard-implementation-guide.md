# Admin Dashboard Implementation Guide

**Companion to**: `admin-dashboard-best-practices.md`
**Status**: Production-Ready Patterns
**Last Updated**: 2026-01-20

---

## Quick Reference: Production Code Templates

### 1. Optimized Dashboard Hook

```typescript
// src/hooks/useDashboardStats.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalCouncils: number;
  activeCouncils: number;
  totalFirms: number;
  totalNotices: number;
  monthlyRevenue: number;
  systemHealth: 'healthy' | 'degraded' | 'down';
}

const CACHE_KEY_PREFIX = 'dashboard_stats_';
const DEFAULT_CACHE_MS = 60000; // 1 minute

export function useDashboardStats(
  adminId: string,
  cacheMs: number = DEFAULT_CACHE_MS
): [DashboardStats | null, boolean, Error | null] {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const cacheKey = `${CACHE_KEY_PREFIX}${adminId}`;
        
        // Check cache
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < cacheMs) {
            if (isMounted) {
              setStats(data);
              setLoading(false);
            }
            return;
          }
        }

        // Fetch fresh data - use parallel queries
        const [councilsRes, firmsRes, noticesRes] = await Promise.all([
          supabase
            .from('organizations')
            .select('id, status', { count: 'exact', head: true })
            .eq('type', 'council'),
          supabase
            .from('organizations')
            .select('id', { count: 'exact', head: true })
            .eq('type', 'firm'),
          supabase
            .from('notices')
            .select('id', { count: 'exact', head: true })
        ]);

        if (!isMounted) return;

        const totalCouncils = councilsRes.count || 0;
        const activeCouncils = councilsRes.data?.filter(c => c.status === 'active').length || 0;
        const totalFirms = firmsRes.count || 0;
        const totalNotices = noticesRes.count || 0;
        const monthlyRevenue = (activeCouncils * 500) + (totalFirms * 1000);

        const newStats: DashboardStats = {
          totalCouncils,
          activeCouncils,
          totalFirms,
          totalNotices,
          monthlyRevenue,
          systemHealth: 'healthy'
        };

        // Cache the result
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: newStats,
          timestamp: Date.now()
        }));

        setStats(newStats);
        setError(null);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [adminId, cacheMs]);

  return [stats, loading, error];
}
```

### 2. Memoized KPI Card

```typescript
// src/components/admin/KPICard.tsx
import React from 'react';

interface KPICardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'amber';
  trend?: number;
  onClick?: () => void;
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
  amber: 'bg-amber-100 text-amber-600'
};

export const KPICard = React.memo<KPICardProps>(({
  label,
  value,
  icon,
  color,
  trend,
  onClick
}) => (
  <div
    onClick={onClick}
    className={`
      bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)]
      border border-gray-200 hover:shadow-xl hover:scale-[1.02]
      transition-all ${onClick ? 'cursor-pointer' : ''}
    `}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-600 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        {trend !== undefined && (
          <p className={`text-sm mt-2 font-semibold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}% this month
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
        {icon}
      </div>
    </div>
  </div>
));

KPICard.displayName = 'KPICard';
```

### 3. Activity Feed Component

```typescript
// src/components/admin/ActivityFeed.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle, Activity } from 'lucide-react';

interface ActivityItem {
  id: string;
  admin_email: string;
  action: string;
  action_category: string;
  target_identifier?: string;
  created_at: string;
  severity: 'info' | 'warning' | 'critical';
}

interface ActivityFeedProps {
  maxHeight?: string;
  refreshInterval?: number;
}

export function ActivityFeed({ 
  maxHeight = 'max-h-96',
  refreshInterval = 30000 
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { data } = await supabase
          .from('admin_actions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (data) {
          setActivities(data);
        }
      } catch (err) {
        console.error('Error fetching activities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();

    // Set up polling
    const interval = setInterval(fetchActivities, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity
        </h2>
      </div>
      <div className={`${maxHeight} overflow-y-auto`}>
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading activities...</div>
        ) : activities.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No recent activity</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(activity.severity)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.admin_email}</span>
                      {' '}
                      {activity.action.replace('_', ' ')}
                      {activity.target_identifier && (
                        <>
                          {' '}
                          <span className="text-gray-600">
                            {activity.target_identifier}
                          </span>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(activity.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4. PostgreSQL RPC Function

```sql
-- supabase/migrations/[timestamp]_create_dashboard_stats_rpc.sql

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  v_start_of_month timestamp;
BEGIN
  v_start_of_month := DATE_TRUNC('month', NOW());

  result := jsonb_build_object(
    'total_councils', (
      SELECT COUNT(*) FROM organizations WHERE type = 'council'
    ),
    'active_councils', (
      SELECT COUNT(*) FROM organizations 
      WHERE type = 'council' AND status = 'active'
    ),
    'total_firms', (
      SELECT COUNT(*) FROM organizations WHERE type = 'firm'
    ),
    'total_notices', (
      SELECT COUNT(*) FROM notices
    ),
    'published_this_month', (
      SELECT COUNT(*) FROM notices 
      WHERE status = 'published' 
      AND published_at >= v_start_of_month
    ),
    'monthly_revenue', (
      SELECT COALESCE(SUM(amount), 0)::numeric FROM billing_transactions
      WHERE created_at >= v_start_of_month
      AND status = 'completed'
    ),
    'system_health', 'healthy',
    'last_computed_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE
SET statement_timeout = '5s';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() 
TO authenticated;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at 
ON admin_actions(created_at DESC)
INCLUDE (severity, action_category);

CREATE INDEX IF NOT EXISTS idx_organizations_type_status 
ON organizations(type, status) 
WHERE status = 'active';
```

---

## Real-Time Updates Implementation

### Polling with Smart Invalidation

```typescript
// src/hooks/useDashboardRefresh.ts
import { useEffect, useRef } from 'react';

interface RefreshConfig {
  interval: number; // milliseconds
  onRefresh: () => Promise<void>;
  onError?: (error: Error) => void;
}

export function useDashboardRefresh({
  interval,
  onRefresh,
  onError
}: RefreshConfig) {
  const intervalRef = useRef<NodeJS.Timer>();

  useEffect(() => {
    let isActive = true;

    const refresh = async () => {
      try {
        if (isActive) {
          await onRefresh();
        }
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    };

    // Initial refresh
    refresh();

    // Set up polling
    intervalRef.current = setInterval(refresh, interval);

    return () => {
      isActive = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, onRefresh, onError]);
}
```

### Supabase Realtime (Optional Enhancement)

```typescript
// src/hooks/useDashboardRealtime.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useDashboardRealtime(
  onNoticesChange?: (count: number) => void
) {
  useEffect(() => {
    // Subscribe to notice changes
    const subscription = supabase
      .channel('admin_dashboard_notices')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notices'
        },
        (payload) => {
          // Handle insert
          if (payload.eventType === 'INSERT') {
            onNoticesChange?.(1); // increment
          }
          // Handle delete
          if (payload.eventType === 'DELETE') {
            onNoticesChange?.(-1); // decrement
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [onNoticesChange]);
}
```

---

## Database Optimization Checklist

### Indexes to Create
```sql
-- 1. Organizations queries
CREATE INDEX idx_org_type_status ON organizations(type, status);
CREATE INDEX idx_org_created ON organizations(created_at DESC);

-- 2. Notices queries
CREATE INDEX idx_notices_status ON notices(status);
CREATE INDEX idx_notices_dept ON notices(department_id);
CREATE INDEX idx_notices_published ON notices(published_at DESC) 
WHERE status = 'published';

-- 3. Admin actions (activity feed)
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at DESC);
CREATE INDEX idx_admin_actions_severity ON admin_actions(severity);

-- 4. Billing queries
CREATE INDEX idx_billing_org ON billing_transactions(organization_id, created_at DESC);
CREATE INDEX idx_billing_status ON billing_transactions(status, created_at DESC);
```

### Query Performance Testing

```sql
-- Test dashboard stats query performance
EXPLAIN ANALYZE
SELECT
  COUNT(*) FILTER (WHERE type = 'council') as councils,
  COUNT(*) FILTER (WHERE type = 'firm') as firms
FROM organizations;

-- Test activity feed query
EXPLAIN ANALYZE
SELECT *
FROM admin_actions
ORDER BY created_at DESC
LIMIT 10;
```

---

## Performance Monitoring

### Metrics to Track

```typescript
// src/lib/dashboardMetrics.ts
interface DashboardMetrics {
  loadTime: number;
  statsQueryTime: number;
  activityFeedQueryTime: number;
  renderTime: number;
  cacheHitRate: number;
}

export function recordDashboardMetrics(metrics: DashboardMetrics) {
  // Send to monitoring service (e.g., Sentry, DataDog)
  console.log('Dashboard Metrics:', metrics);
  
  // Track thresholds
  if (metrics.loadTime > 2000) {
    console.warn('Dashboard load time exceeds 2s:', metrics.loadTime);
  }
  if (metrics.cacheHitRate < 0.5) {
    console.warn('Low cache hit rate:', metrics.cacheHitRate);
  }
}
```

---

## Troubleshooting Guide

| Issue | Cause | Solution |
|-------|-------|----------|
| Dashboard loads slow on first visit | No caching | Implement sessionStorage caching |
| Stats queries timeout | Sequential queries | Use Promise.all() for parallel queries |
| Activity feed lags | Full data fetch | Use pagination with `.limit(10)` |
| High memory usage | Unreleased subscriptions | Unsubscribe in cleanup function |
| Frequent re-renders | Missing React.memo | Wrap card components with React.memo |
| Realtime not updating | RLS policy issue | Check RLS on admin_actions table |

---

## Deployment Checklist

Before deploying dashboard improvements:

- [ ] Database indexes created and tested
- [ ] RPC functions deployed and tested
- [ ] Cache strategy validated (60s+ cache time)
- [ ] Activity feed pagination working (limit: 10)
- [ ] Lazy loading for below-fold sections working
- [ ] Realtime subscriptions cleanup verified
- [ ] Performance benchmarks met (LCP <2.5s)
- [ ] Mobile responsiveness tested
- [ ] Error boundaries added
- [ ] Loading states implemented
- [ ] Empty states handled

---

## References

- [Supabase Performance Docs](https://supabase.com/docs/guides/performance)
- [React Query Best Practices](https://react-query-v3.tanstack.com/overview)
- [PostgreSQL Query Optimization](https://www.postgresql.org/docs/current/query-performance.html)
- [Web Vitals Guide](https://web.dev/vitals/)

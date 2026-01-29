/**
 * Admin Stats hook for the Admin Dashboard
 * Uses React Query for data fetching and caching
 * Requires admin authentication
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Admin stats data returned from /api/admin/stats
 */
export interface AdminStatsData {
  // Core counts
  totalCouncils: number;
  activeCouncils: number;
  totalFirms: number;
  totalNotices: number;
  totalUsers: number;
  pendingVerifications: number;
  // Growth metrics
  firmGrowthPercent: number;
  firmsThisMonth: number;
  firmsLastMonth: number;
  // Revenue (in GBP)
  monthlyRevenue: number;
  firmSubscriptionRevenue: number;
  noticeRevenue: number;
  noticesThisMonth: number;
  // System health
  systemHealth: 'healthy' | 'degraded' | 'down';
  apiResponseTime: number;
  databaseLoad: number | null;
  uptime: number | null;
}

/**
 * Fetches admin stats from the API
 * Requires admin session for authentication
 */
async function fetchAdminStats(): Promise<AdminStatsData> {
  // Get the current session to get the access token
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Admin authentication required');
  }

  const response = await fetch('/api/admin/stats', {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Admin authentication required');
    }
    if (response.status === 403) {
      throw new Error('Admin access denied');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to fetch admin stats');
  }

  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.error?.message || 'Failed to fetch admin stats');
  }

  return result.data;
}

/**
 * Hook to fetch admin dashboard stats
 * Returns cached data and handles loading/error states
 *
 * @example
 * const { data: stats, isLoading, error } = useAdminStats();
 *
 * if (isLoading) return <DashboardSkeleton />;
 * if (error) return <ErrorMessage error={error} />;
 * return <Dashboard stats={stats} />;
 */
export function useAdminStats() {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: fetchAdminStats,
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter for admin dashboard
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error.message.includes('authentication') || error.message.includes('access denied')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

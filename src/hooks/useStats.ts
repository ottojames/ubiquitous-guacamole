/**
 * Stats hook for the Homepage
 * Uses React Query for data fetching and caching
 */

import { useQuery } from '@tanstack/react-query';

/**
 * Stats data returned from the API
 */
export interface StatsData {
  notices: number;
  representations: number;
  councils: number;
}

/**
 * Fetches real stats counts from the API
 */
async function fetchStats(): Promise<StatsData> {
  const response = await fetch('/api/stats');

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to fetch stats');
  }

  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.error?.message || 'Failed to fetch stats');
  }

  return result.data;
}

/**
 * Hook to fetch real stats from the database
 * Returns cached data and handles loading/error states
 *
 * @example
 * const { data: stats, isLoading, error } = useStats();
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <span>—</span>;
 * return <span>{stats.notices.toLocaleString()}</span>;
 */
export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

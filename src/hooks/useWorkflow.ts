/**
 * Workflow hooks for Firm Portal
 * Uses React Query for data fetching and caching
 */

import { useQuery } from '@tanstack/react-query';
import type { WorkflowConfigWithStages } from '@/types/workflow';

/**
 * Fetches all workflow configurations for the authenticated user's firm
 */
async function fetchWorkflowConfigs(): Promise<WorkflowConfigWithStages[]> {
  const response = await fetch('/api/workflow/configs', {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch workflow configurations');
  }

  const data = await response.json();
  return data.configs || [];
}

/**
 * Hook to fetch all workflow configurations for the user's firm
 * Returns cached data and handles loading/error states
 */
export function useWorkflowConfigs() {
  return useQuery({
    queryKey: ['workflow', 'configs'],
    queryFn: fetchWorkflowConfigs,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });
}

/**
 * Workflow hooks for Firm Portal
 * Uses React Query for data fetching and caching
 */

import { useQuery } from '@tanstack/react-query';
import type { WorkflowConfigWithStages, NoticeWorkflowStatus, WorkflowStage, WorkflowConfig } from '@/types/workflow';

/**
 * Extended NoticeWorkflowStatus with joined relations for API response
 */
export interface NoticeWorkflowStatusWithDetails extends NoticeWorkflowStatus {
  current_stage: WorkflowStage | null;
  workflow: WorkflowConfig | null;
  is_overdue: boolean;
}

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

// ============================================================
// Single Workflow Config Hooks
// ============================================================

/**
 * Fetches a specific workflow configuration by notice type
 */
async function fetchWorkflowConfig(noticeType: string): Promise<WorkflowConfigWithStages | null> {
  const response = await fetch(`/api/workflow/configs/${encodeURIComponent(noticeType)}`, {
    credentials: 'include',
  });

  if (response.status === 404) {
    return null; // No workflow found for this notice type
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch workflow configuration');
  }

  const data = await response.json();
  return data.config || null;
}

/**
 * Hook to fetch a single workflow configuration by notice type
 * @param noticeType - The notice type identifier (e.g., 'premises-licence')
 */
export function useWorkflowConfig(noticeType: string | undefined) {
  return useQuery({
    queryKey: ['workflow', 'configs', noticeType],
    queryFn: () => fetchWorkflowConfig(noticeType!),
    enabled: !!noticeType, // Only fetch if noticeType is provided
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// ============================================================
// Notice Workflow Status Hooks
// ============================================================

/**
 * Fetches the workflow status for a specific notice
 */
async function fetchNoticeWorkflowStatus(noticeId: string): Promise<NoticeWorkflowStatusWithDetails | null> {
  const response = await fetch(`/api/workflow/notices/${encodeURIComponent(noticeId)}/status`, {
    credentials: 'include',
  });

  if (response.status === 404) {
    return null; // No workflow status found for this notice
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch notice workflow status');
  }

  const data = await response.json();
  return data.status || null;
}

/**
 * Hook to fetch the workflow status for a specific notice
 * @param noticeId - The UUID of the notice
 */
export function useNoticeWorkflowStatus(noticeId: string | undefined) {
  return useQuery({
    queryKey: ['workflow', 'notices', noticeId, 'status'],
    queryFn: () => fetchNoticeWorkflowStatus(noticeId!),
    enabled: !!noticeId, // Only fetch if noticeId is provided
    staleTime: 2 * 60 * 1000, // 2 minutes (status changes more frequently)
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

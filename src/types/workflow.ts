/**
 * Workflow Types for Firm Portal
 * TypeScript definitions for workflow management tables
 */

// ============================================================================
// FIRM DEPARTMENTS
// ============================================================================

export interface FirmDepartment {
  id: string;
  firm_id: string;
  name: string;
  slug: string;
  description: string | null;
  default_notice_types: string[] | null;
  color: string;
  icon: string;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// ============================================================================
// WORKFLOW CONFIGURATION
// ============================================================================

export interface WorkflowConfig {
  id: string;
  firm_id: string;
  department_id: string | null;
  notice_type: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// ============================================================================
// WORKFLOW STAGES
// ============================================================================

export type DeadlineType = 'fixed_days' | 'calendar_date' | 'calculated';

export interface WorkflowStage {
  id: string;
  workflow_id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  color: string;
  icon: string | null;
  is_initial: boolean;
  is_terminal: boolean;
  auto_transition_days: number | null;
  has_deadline: boolean;
  deadline_type: DeadlineType | null;
  deadline_days: number | null;
  deadline_working_days: boolean;
  deadline_name: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// NOTICE WORKFLOW STATUS
// ============================================================================

export interface NoticeWorkflowStatus {
  id: string;
  notice_id: string;
  workflow_id: string;
  current_stage_id: string;
  firm_id: string;
  entered_stage_at: string;
  deadline_date: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Computed property for overdue status
 * Use in application layer: status.deadline_date && new Date(status.deadline_date) < new Date()
 */
export function isNoticeOverdue(status: NoticeWorkflowStatus): boolean {
  if (!status.deadline_date) return false;
  return new Date(status.deadline_date) < new Date();
}

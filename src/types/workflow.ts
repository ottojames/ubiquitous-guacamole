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

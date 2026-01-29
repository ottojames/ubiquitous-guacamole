/**
 * Organization and Department Types
 * Shared types for organization/department context across the application
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'council' | 'firm';
  created_at?: string;
  updated_at?: string;
  settings?: Record<string, unknown>;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
  type?: string;
  organization_id: string;
  organization?: Organization;
  created_at?: string;
  updated_at?: string;
  settings?: Record<string, unknown>;
}

export interface OrganizationMembership {
  id: string;
  user_id: string;
  organization_id: string;
  organization?: Organization;
  role: string;
  created_at?: string;
}

export interface DepartmentMembership {
  id: string;
  user_id: string;
  department_id: string;
  department?: Department;
  role: string;
  created_at?: string;
  last_accessed_at?: string | null;
}

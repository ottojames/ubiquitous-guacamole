-- ============================================
-- RBAC MIGRATION - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================
--
-- HOW TO RUN:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Click "New Query"
-- 5. Copy and paste this ENTIRE file
-- 6. Click "Run" button
-- 7. Wait for completion (may take 10-30 seconds)
--
-- ============================================

-- This is the full RBAC migration
-- Source: supabase/migrations/20251025000003_rbac_permissions.sql

-- Role-Based Access Control (RBAC) System
-- This migration creates tables for managing user roles and permissions

-- ============================================================================
-- ROLES TABLE
-- ============================================================================
-- Defines available roles in the system (e.g., admin, officer, viewer)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- e.g., 'org_admin', 'dept_admin', 'officer', 'viewer'
  display_name TEXT NOT NULL, -- e.g., 'Organization Administrator'
  description TEXT,
  level INTEGER NOT NULL, -- Hierarchy level (lower = more powerful): 1=org_admin, 2=dept_admin, 3=officer, 4=viewer
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- PERMISSIONS TABLE
-- ============================================================================
-- Defines granular permissions that can be assigned to roles
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- e.g., 'notices.create', 'representations.view'
  resource TEXT NOT NULL, -- e.g., 'notices', 'representations', 'team'
  action TEXT NOT NULL, -- e.g., 'create', 'read', 'update', 'delete', 'export'
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- ROLE_PERMISSIONS TABLE
-- ============================================================================
-- Maps permissions to roles (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- ============================================================================
-- UPDATE DEPARTMENT_MEMBERSHIPS
-- ============================================================================
-- Add role reference to existing department_memberships table
-- (Assumes department_memberships table exists with 'role' text column)
ALTER TABLE IF EXISTS public.department_memberships
  ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);

-- ============================================================================
-- UPDATE ORGANIZATION_MEMBERSHIPS
-- ============================================================================
-- Add role reference to existing organization_memberships table
ALTER TABLE IF EXISTS public.organization_memberships
  ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON public.permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON public.permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_dept_memberships_role_id ON public.department_memberships(role_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_role_id ON public.organization_memberships(role_id);

-- ============================================================================
-- SEED DEFAULT ROLES
-- ============================================================================
INSERT INTO public.roles (name, display_name, description, level) VALUES
  ('org_admin', 'Organization Administrator', 'Full access to all organization and department features', 1),
  ('dept_admin', 'Department Administrator', 'Full access to department features, can manage team members', 2),
  ('officer', 'Licensing Officer', 'Can create, edit, and manage notices and representations', 3),
  ('viewer', 'Read-Only Viewer', 'Can view notices and representations but cannot make changes', 4)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SEED DEFAULT PERMISSIONS
-- ============================================================================
INSERT INTO public.permissions (name, resource, action, description) VALUES
  -- Notice permissions
  ('notices.create', 'notices', 'create', 'Create new notices'),
  ('notices.read', 'notices', 'read', 'View notices'),
  ('notices.update', 'notices', 'update', 'Edit existing notices'),
  ('notices.delete', 'notices', 'delete', 'Delete notices'),
  ('notices.publish', 'notices', 'publish', 'Publish notices to the public'),
  ('notices.export', 'notices', 'export', 'Export notice data'),

  -- Representation permissions
  ('representations.read', 'representations', 'read', 'View representations'),
  ('representations.update', 'representations', 'update', 'Edit representation status/notes'),
  ('representations.export', 'representations', 'export', 'Export representations to CSV'),
  ('representations.comment', 'representations', 'comment', 'Add internal comments to representations'),

  -- Team management permissions
  ('team.read', 'team', 'read', 'View team members'),
  ('team.invite', 'team', 'invite', 'Invite new team members'),
  ('team.update', 'team', 'update', 'Update team member roles'),
  ('team.remove', 'team', 'remove', 'Remove team members'),

  -- Template permissions
  ('templates.create', 'templates', 'create', 'Create notice templates'),
  ('templates.read', 'templates', 'read', 'View notice templates'),
  ('templates.update', 'templates', 'update', 'Edit notice templates'),
  ('templates.delete', 'templates', 'delete', 'Delete notice templates'),

  -- Settings permissions
  ('settings.read', 'settings', 'read', 'View department settings'),
  ('settings.update', 'settings', 'update', 'Update department settings'),

  -- Audit log permissions
  ('audit.read', 'audit', 'read', 'View audit logs')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ASSIGN PERMISSIONS TO ROLES
-- ============================================================================

-- Organization Admin: Full access to everything
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'org_admin'
ON CONFLICT DO NOTHING;

-- Department Admin: All permissions except org-level team management
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'dept_admin'
ON CONFLICT DO NOTHING;

-- Officer: Can manage notices and representations, view team/templates
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'officer'
  AND p.name IN (
    'notices.create', 'notices.read', 'notices.update', 'notices.publish', 'notices.export',
    'representations.read', 'representations.update', 'representations.comment', 'representations.export',
    'team.read',
    'templates.read',
    'settings.read'
  )
ON CONFLICT DO NOTHING;

-- Viewer: Read-only access to notices and representations
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'viewer'
  AND p.name IN (
    'notices.read',
    'representations.read',
    'team.read',
    'templates.read'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a user has a specific permission for a department
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id UUID,
  p_department_id UUID,
  p_permission_name TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check department-level permission
  RETURN EXISTS (
    SELECT 1
    FROM public.department_memberships dm
    JOIN public.role_permissions rp ON dm.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE dm.user_id = p_user_id
      AND dm.department_id = p_department_id
      AND p.name = p_permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions for a user in a department
CREATE OR REPLACE FUNCTION public.get_user_permissions(
  p_user_id UUID,
  p_department_id UUID
) RETURNS TABLE (
  permission_name TEXT,
  resource TEXT,
  action TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name, p.resource, p.action
  FROM public.department_memberships dm
  JOIN public.role_permissions rp ON dm.role_id = rp.role_id
  JOIN public.permissions p ON rp.permission_id = p.id
  WHERE dm.user_id = p_user_id
    AND dm.department_id = p_department_id
  ORDER BY p.resource, p.action;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role in a department
CREATE OR REPLACE FUNCTION public.get_user_role(
  p_user_id UUID,
  p_department_id UUID
) RETURNS TABLE (
  role_name TEXT,
  role_display_name TEXT,
  role_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.name, r.display_name, r.level
  FROM public.department_memberships dm
  JOIN public.roles r ON dm.role_id = r.id
  WHERE dm.user_id = p_user_id
    AND dm.department_id = p_department_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Roles: Readable by authenticated users, modifiable only by service role
CREATE POLICY "Roles are viewable by authenticated users"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

-- Permissions: Readable by authenticated users, modifiable only by service role
CREATE POLICY "Permissions are viewable by authenticated users"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

-- Role permissions: Readable by authenticated users, modifiable only by service role
CREATE POLICY "Role permissions are viewable by authenticated users"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on roles table
CREATE OR REPLACE FUNCTION public.update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_roles_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.roles IS 'Available roles in the system with hierarchy levels';
COMMENT ON TABLE public.permissions IS 'Granular permissions that can be assigned to roles';
COMMENT ON TABLE public.role_permissions IS 'Maps permissions to roles (many-to-many)';
COMMENT ON FUNCTION public.user_has_permission IS 'Check if user has a specific permission for a department';
COMMENT ON FUNCTION public.get_user_permissions IS 'Get all permissions for a user in a department';
COMMENT ON FUNCTION public.get_user_role IS 'Get user role information in a department';


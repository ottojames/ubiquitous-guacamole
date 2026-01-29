-- Memberships Migration
-- Creates organization and department membership tables for dual-level role system

-- ============================================================================
-- ORGANIZATION MEMBERSHIPS TABLE
-- ============================================================================
-- Org-wide roles (Owner, Org Admin) - applies to entire organization

CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role (org-wide)
  role TEXT NOT NULL CHECK (role IN ('owner', 'org_admin')),
  -- owner: Can delete org, manage all departments, transfer ownership
  -- org_admin: Can create departments, view all dept data, manage org settings

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT unique_org_user UNIQUE (organization_id, user_id)
);

-- Organization Memberships Indexes
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_memberships(organization_id, role);
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_members_unique ON public.organization_memberships(organization_id, user_id);

-- ============================================================================
-- DEPARTMENT MEMBERSHIPS TABLE
-- ============================================================================
-- Department-specific roles (Dept Admin, Editor, Viewer) - scoped to single department

CREATE TABLE IF NOT EXISTS public.department_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role (department-scoped)
  role TEXT NOT NULL CHECK (role IN ('department_admin', 'editor', 'viewer')),
  -- department_admin: Full control within dept, manage team, settings
  -- editor: Create/edit/publish notices, use templates
  -- viewer: Read-only access to dept data

  -- Context Switching Support
  last_accessed_at TIMESTAMPTZ, -- Tracks most recently used department

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT unique_dept_user UNIQUE (department_id, user_id)
);

-- Department Memberships Indexes
CREATE INDEX IF NOT EXISTS idx_dept_members_dept ON public.department_memberships(department_id);
CREATE INDEX IF NOT EXISTS idx_dept_members_user ON public.department_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_dept_members_role ON public.department_memberships(department_id, role);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dept_members_unique ON public.department_memberships(department_id, user_id);

-- Context switching support: Find user's most recently accessed departments
CREATE INDEX IF NOT EXISTS idx_dept_members_last_accessed ON public.department_memberships(user_id, last_accessed_at DESC NULLS LAST);

-- ============================================================================
-- VALIDATION: Ensure at least one owner per organization
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_org_has_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- On DELETE or UPDATE changing role from owner
  IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role != 'owner')) THEN
    -- Check if this is the last owner
    IF NOT EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = OLD.organization_id
        AND role = 'owner'
        AND id != OLD.id
    ) THEN
      RAISE EXCEPTION 'Cannot remove last owner from organization. Transfer ownership first.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER org_members_ensure_owner
  BEFORE UPDATE OR DELETE ON public.organization_memberships
  FOR EACH ROW
  WHEN (OLD.role = 'owner')
  EXECUTE FUNCTION validate_org_has_owner();

-- ============================================================================
-- VALIDATION: Ensure at least one admin per department
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_dept_has_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- On DELETE or UPDATE changing role from department_admin
  IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.role = 'department_admin' AND NEW.role != 'department_admin')) THEN
    -- Check if this is the last department admin
    IF NOT EXISTS (
      SELECT 1 FROM public.department_memberships
      WHERE department_id = OLD.department_id
        AND role = 'department_admin'
        AND id != OLD.id
    ) THEN
      RAISE EXCEPTION 'Cannot remove last admin from department. Assign another admin first.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dept_members_ensure_admin
  BEFORE UPDATE OR DELETE ON public.department_memberships
  FOR EACH ROW
  WHEN (OLD.role = 'department_admin')
  EXECUTE FUNCTION validate_dept_has_admin();

-- ============================================================================
-- AUTO-ASSIGN: Creator becomes owner/admin on org/dept creation
-- ============================================================================

-- When organization is created, make creator the owner
CREATE OR REPLACE FUNCTION auto_assign_org_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.organization_memberships (organization_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_auto_owner
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_org_owner();

-- When department is created, make creator a department admin
CREATE OR REPLACE FUNCTION auto_assign_dept_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.department_memberships (department_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'department_admin')
    ON CONFLICT (department_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER departments_auto_admin
  AFTER INSERT ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_dept_admin();

-- ============================================================================
-- UPDATE LAST_ACCESSED_AT HELPER FUNCTION
-- ============================================================================
-- Called by application when user switches to a department context

CREATE OR REPLACE FUNCTION update_department_access(p_user_id UUID, p_department_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.department_memberships
  SET last_accessed_at = NOW()
  WHERE user_id = p_user_id AND department_id = p_department_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.organization_memberships IS 'Organization-wide roles (Owner, Org Admin) with elevated privileges';
COMMENT ON TABLE public.department_memberships IS 'Department-scoped roles (Dept Admin, Editor, Viewer) with data isolation';

COMMENT ON COLUMN public.organization_memberships.role IS 'owner: full control + can delete org, org_admin: can create depts and view all dept data';
COMMENT ON COLUMN public.department_memberships.role IS 'department_admin: full dept control, editor: create/edit notices, viewer: read-only';
COMMENT ON COLUMN public.department_memberships.last_accessed_at IS 'Tracks most recently used department for context switching UI';

COMMENT ON FUNCTION update_department_access IS 'Updates last_accessed_at when user switches to department context';

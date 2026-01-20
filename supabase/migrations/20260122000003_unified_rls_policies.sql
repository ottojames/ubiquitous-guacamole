-- ============================================================================
-- UNIFIED RLS POLICIES
-- Enforces proper organization and department isolation
-- ============================================================================

-- Drop old overly-permissive policies
DROP POLICY IF EXISTS "Public read access" ON public.notices;
DROP POLICY IF EXISTS "Authenticated insert" ON public.notices;
DROP POLICY IF EXISTS "Authenticated update" ON public.notices;

-- 1. Platform Admins - Full Access
CREATE POLICY "platform_admins_full_access"
ON public.notices
FOR ALL
TO authenticated
USING ((SELECT private.is_platform_admin()));

-- 2. Organization Members - See Own Organization's Notices
CREATE POLICY "org_members_see_own_notices"
ON public.notices
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_memberships
    WHERE user_id = auth.uid()
  )
);

-- 3. Department Members - Manage Own Department's Notices
CREATE POLICY "dept_members_manage_notices"
ON public.notices
FOR ALL
TO authenticated
USING (
  department_id IN (
    SELECT department_id
    FROM department_memberships
    WHERE user_id = auth.uid()
      AND role IN ('department_admin', 'editor')
  )
);

-- 4. Public Notices - Everyone Can Read
CREATE POLICY "public_notices_readable"
ON public.notices
FOR SELECT
TO anon, authenticated
USING (
  status = 'published'
  AND is_public = true
);

-- Organizations table policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_org"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id
    FROM organization_memberships
    WHERE user_id = auth.uid()
  )
  OR (SELECT private.is_platform_admin())
);

-- Departments table policies
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_depts"
ON public.departments
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_memberships
    WHERE user_id = auth.uid()
  )
  OR (SELECT private.is_platform_admin())
);

-- Council settings policies
ALTER TABLE public.council_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_council_settings"
ON public.council_settings
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_memberships
    WHERE user_id = auth.uid()
  )
  OR (SELECT private.is_platform_admin())
);

COMMENT ON POLICY "platform_admins_full_access" ON public.notices
IS 'Platform admins bypass all restrictions';
COMMENT ON POLICY "org_members_see_own_notices" ON public.notices
IS 'Users see notices from their organization';
COMMENT ON POLICY "dept_members_manage_notices" ON public.notices
IS 'Department members with appropriate role can manage notices';
COMMENT ON POLICY "public_notices_readable" ON public.notices
IS 'Published public notices visible to everyone';
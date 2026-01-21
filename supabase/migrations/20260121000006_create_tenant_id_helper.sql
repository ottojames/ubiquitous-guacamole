-- ============================================================================
-- MIGRATION: Create tenant_id() helper function
-- Description: Creates a helper function to extract the current user's
--              organization (tenant) ID from JWT claims or database lookup.
--              This simplifies RLS policies for multi-tenant isolation.
-- ============================================================================
--
-- BACKGROUND:
-- - The custom_access_token_hook populates app_metadata.organization_id in JWTs
-- - However, RLS policies cannot directly access JWT app_metadata
-- - This helper provides a consistent way to get the current tenant ID
-- - Uses organization_memberships table as source of truth
--
-- NOTE: Cannot use auth schema (Supabase protects it), so using public schema
-- ============================================================================

-- ============================================================================
-- 1. Create public.tenant_id() helper function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.tenant_id()
RETURNS UUID AS $$
DECLARE
  v_organization_id UUID;
BEGIN
  -- Get the primary organization for the current user
  -- Uses same logic as custom_access_token_hook: most recently created membership
  SELECT om.organization_id INTO v_organization_id
  FROM public.organization_memberships om
  JOIN public.organizations o ON o.id = om.organization_id
  WHERE om.user_id = auth.uid()
    AND o.status = 'active'
  ORDER BY om.created_at DESC
  LIMIT 1;

  RETURN v_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- SECURITY DEFINER: Runs with definer privileges to access organization_memberships
-- STABLE: Function returns same result for same inputs within a transaction

COMMENT ON FUNCTION public.tenant_id IS 'Returns the current user''s primary organization (tenant) ID. Used in RLS policies for multi-tenant isolation.';

-- Grant execute to authenticated users (called indirectly via RLS policies)
GRANT EXECUTE ON FUNCTION public.tenant_id() TO authenticated;


-- ============================================================================
-- 2. Create public.is_tenant_member(org_id) helper function
-- ============================================================================
-- This is a more flexible version that checks if user belongs to ANY org,
-- not just their primary tenant. Useful for cross-org access scenarios.

CREATE OR REPLACE FUNCTION public.is_tenant_member(p_organization_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is a member of the specified organization
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    WHERE om.organization_id = p_organization_id
      AND om.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_tenant_member IS 'Returns true if the current user is a member of the specified organization. Similar to is_firm_member but with clearer naming for multi-tenant context.';

GRANT EXECUTE ON FUNCTION public.is_tenant_member(UUID) TO authenticated;


-- ============================================================================
-- 3. Create public.tenant_role() helper function
-- ============================================================================
-- Returns the user's role in their primary organization

CREATE OR REPLACE FUNCTION public.tenant_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Get the role for the current user in their primary organization
  SELECT om.role INTO v_role
  FROM public.organization_memberships om
  JOIN public.organizations o ON o.id = om.organization_id
  WHERE om.user_id = auth.uid()
    AND o.status = 'active'
  ORDER BY om.created_at DESC
  LIMIT 1;

  RETURN COALESCE(v_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.tenant_role IS 'Returns the current user''s role in their primary organization (owner, org_admin, etc). Defaults to viewer if no membership found.';

GRANT EXECUTE ON FUNCTION public.tenant_role() TO authenticated;


-- ============================================================================
-- 4. Create public.is_tenant_admin() helper function
-- ============================================================================
-- Checks if user is an admin (owner or org_admin) in their primary tenant

CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.tenant_role() IN ('owner', 'org_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_tenant_admin IS 'Returns true if the current user is an admin (owner or org_admin) in their primary organization.';

GRANT EXECUTE ON FUNCTION public.is_tenant_admin() TO authenticated;


-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================
--
-- In RLS policies:
--
-- -- Simple tenant isolation (user can only see their org's data):
-- CREATE POLICY "Users can view their org notices"
--   ON notices FOR SELECT
--   USING (organization_id = public.tenant_id());
--
-- -- Admin-only access within tenant:
-- CREATE POLICY "Admins can update org settings"
--   ON organization_settings FOR UPDATE
--   USING (
--     organization_id = public.tenant_id()
--     AND public.is_tenant_admin()
--   );
--
-- -- Cross-tenant member check:
-- CREATE POLICY "Users can view shared resources"
--   ON shared_resources FOR SELECT
--   USING (public.is_tenant_member(owner_organization_id));
--
-- ============================================================================
-- RELATIONSHIP TO EXISTING FUNCTIONS
-- ============================================================================
--
-- public.is_firm_member(firm_id) - Specific check for firm membership (existing)
-- public.tenant_id() - Get current user's primary org (NEW)
-- public.is_tenant_member(org_id) - Check membership in any org (NEW)
-- public.tenant_role() - Get role in primary org (NEW)
-- public.is_tenant_admin() - Check if admin in primary org (NEW)
--
-- These complement each other:
-- - is_firm_member: Use when you have a specific firm_id to check
-- - tenant_id: Use to get the current tenant for filtering
-- - is_tenant_member: Use for flexible org membership checks
-- - tenant_role/is_tenant_admin: Use for role-based access control
--
-- ============================================================================

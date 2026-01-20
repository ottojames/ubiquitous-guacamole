-- ============================================================================
-- CUSTOM JWT CLAIMS FOR ORGANIZATION CONTEXT
-- Adds organization and admin info to JWT tokens
-- ============================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  claims jsonb;
  user_org_id uuid;
  user_dept_id uuid;
  user_role text;
  org_type text;
  org_name text;
  is_admin boolean;
  admin_role_val text;
BEGIN
  -- Get organization membership
  SELECT
    om.organization_id,
    om.role,
    o.type,
    o.name
  INTO user_org_id, user_role, org_type, org_name
  FROM organization_memberships om
  JOIN organizations o ON o.id = om.organization_id
  WHERE om.user_id = (event->>'user_id')::uuid
    AND o.status = 'active'
  ORDER BY om.created_at DESC
  LIMIT 1;

  -- Get current department for councils
  IF org_type = 'council' THEN
    SELECT dm.department_id
    INTO user_dept_id
    FROM department_memberships dm
    WHERE dm.user_id = (event->>'user_id')::uuid
      AND dm.organization_id = user_org_id
    ORDER BY dm.last_accessed_at DESC NULLS LAST, dm.created_at DESC
    LIMIT 1;
  END IF;

  -- Check platform admin status
  SELECT
    CASE WHEN pas.user_id IS NOT NULL THEN true ELSE false END,
    pas.admin_role
  INTO is_admin, admin_role_val
  FROM platform_admin_settings pas
  WHERE pas.user_id = (event->>'user_id')::uuid;

  -- Build custom claims
  claims := event -> 'claims';

  -- Add app_metadata with full context
  claims := jsonb_set(claims, '{app_metadata}',
    COALESCE(claims->'app_metadata', '{}'::jsonb) ||
    jsonb_build_object(
      'organization_id', user_org_id,
      'organization_name', org_name,
      'organization_type', org_type,
      'department_id', user_dept_id,
      'role', COALESCE(user_role, 'viewer'),
      'is_platform_admin', COALESCE(is_admin, false),
      'admin_role', admin_role_val
    )
  );

  -- Return modified event
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant permissions for the hook
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT SELECT ON public.organizations TO supabase_auth_admin;
GRANT SELECT ON public.organization_memberships TO supabase_auth_admin;
GRANT SELECT ON public.department_memberships TO supabase_auth_admin;
GRANT SELECT ON public.platform_admin_settings TO supabase_auth_admin;

-- IMPORTANT: After running this migration, you must:
-- 1. Go to Supabase Dashboard > Authentication > Hooks
-- 2. Enable "Custom Access Token Hook"
-- 3. Select the function: public.custom_access_token_hook

COMMENT ON FUNCTION public.custom_access_token_hook IS 'Adds organization context and admin status to JWT tokens for proper authorization';
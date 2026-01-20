-- ============================================================================
-- UNIFIED AUTHENTICATION SYSTEM MIGRATION
-- Migrates from dual auth to single Supabase Auth
-- ============================================================================

-- 1. Add platform admin settings (replaces admin_users)
CREATE TABLE IF NOT EXISTS public.platform_admin_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_role TEXT CHECK (admin_role IN ('super_admin', 'admin', 'support')),
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret TEXT,
  backup_codes TEXT[],
  ip_allowlist INET[],
  require_ip_allowlist BOOLEAN DEFAULT false,
  session_timeout_minutes INTEGER DEFAULT 120,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_admin_action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Helper functions for auth context
CREATE OR REPLACE FUNCTION private.get_user_org_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id
  FROM public.organization_memberships
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.get_user_dept_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT department_id
  FROM public.department_memberships
  WHERE user_id = auth.uid()
  ORDER BY last_accessed_at DESC NULLS LAST
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.platform_admin_settings
    WHERE user_id = auth.uid()
  );
$$;

-- 3. Migrate existing admin users
INSERT INTO public.platform_admin_settings (
  user_id,
  admin_role,
  two_factor_enabled,
  two_factor_secret,
  backup_codes,
  ip_allowlist,
  failed_login_attempts,
  locked_until
)
SELECT
  user_id,
  role,
  two_factor_enabled,
  two_factor_secret,
  backup_codes,
  ip_allowlist,
  failed_login_attempts,
  locked_until
FROM public.admin_users
WHERE status = 'active'
ON CONFLICT (user_id) DO NOTHING;

-- 4. Fix notices table - make organization_id required
-- First, update any NULL organization_ids
UPDATE public.notices
SET organization_id = (
  SELECT id FROM organizations
  WHERE type = 'council'
  ORDER BY created_at
  LIMIT 1
)
WHERE organization_id IS NULL;

-- Now make it required
ALTER TABLE public.notices
  ALTER COLUMN organization_id SET NOT NULL;

-- Add foreign key if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notices_organization_id_fkey'
  ) THEN
    ALTER TABLE public.notices
      ADD CONSTRAINT notices_organization_id_fkey
      FOREIGN KEY (organization_id)
      REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Create active councils view (replaces JSON file)
CREATE OR REPLACE VIEW public.active_councils AS
SELECT
  o.id,
  o.name,
  o.slug,
  cs.authority_email as email,
  cs.authority_address as address,
  cs.authority_phone as phone,
  o.created_at
FROM organizations o
LEFT JOIN council_settings cs ON cs.organization_id = o.id
WHERE o.type = 'council'
  AND o.status = 'active'
ORDER BY o.name;

-- Grant access
GRANT SELECT ON public.active_councils TO authenticated;

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_admin_user ON platform_admin_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_dept_memberships_user ON department_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_notices_org ON notices(organization_id);
CREATE INDEX IF NOT EXISTS idx_notices_dept ON notices(department_id);

COMMENT ON TABLE platform_admin_settings IS 'Unified admin settings - replaces admin_users';
COMMENT ON VIEW active_councils IS 'Active councils for dropdown - replaces councils.json';
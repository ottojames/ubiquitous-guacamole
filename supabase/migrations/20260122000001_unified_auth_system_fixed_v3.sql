-- ============================================================================
-- UNIFIED AUTHENTICATION SYSTEM MIGRATION (FIXED V3)
-- Migrates from dual auth to single Supabase Auth
-- Fixed: Handles orphaned notices before adding foreign key constraint
-- ============================================================================

-- 0. Create private schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

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

-- 2. Helper functions for auth context (in private schema)
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

-- 3. Migrate existing admin users (with proper type casting)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'admin_users'
  ) THEN
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
      -- Cast text[] to inet[] for ip_allowlist
      CASE
        WHEN ip_allowlist IS NULL THEN NULL
        ELSE ARRAY(
          SELECT ip::inet
          FROM unnest(ip_allowlist) AS ip
          WHERE ip IS NOT NULL AND ip != ''
        )
      END,
      failed_login_attempts,
      locked_until
    FROM public.admin_users
    WHERE status = 'active'
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- 4. Fix notices table - clean up orphaned records and make organization_id required
DO $$
DECLARE
  default_org_id UUID;
  orphaned_count INTEGER;
BEGIN
  -- Count orphaned notices
  SELECT COUNT(*) INTO orphaned_count
  FROM public.notices n
  WHERE n.organization_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = n.organization_id
    );

  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Found % notices with non-existent organizations', orphaned_count;
  END IF;

  -- Get or create a default organization for orphaned notices
  SELECT id INTO default_org_id
  FROM organizations
  WHERE type = 'council'
  ORDER BY created_at
  LIMIT 1;

  -- If no council exists, check for any organization
  IF default_org_id IS NULL THEN
    SELECT id INTO default_org_id
    FROM organizations
    ORDER BY created_at
    LIMIT 1;
  END IF;

  -- If still no organization, create a default one
  IF default_org_id IS NULL THEN
    INSERT INTO organizations (
      id,
      name,
      type,
      slug,
      status,
      email
    ) VALUES (
      gen_random_uuid(),
      'Default Council',
      'council',
      'default-council',
      'active',
      'admin@example.com'
    )
    RETURNING id INTO default_org_id;
  END IF;

  -- Update NULL organization_ids
  UPDATE public.notices
  SET organization_id = default_org_id
  WHERE organization_id IS NULL;

  -- Update orphaned organization_ids (pointing to non-existent orgs)
  UPDATE public.notices n
  SET organization_id = default_org_id
  WHERE n.organization_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = n.organization_id
    );

  -- Only alter if not already NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notices'
    AND column_name = 'organization_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.notices
      ALTER COLUMN organization_id SET NOT NULL;
  END IF;
END $$;

-- Add foreign key if missing (now that data is clean)
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
  COALESCE(cs.authority_email, o.email) as email,
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
GRANT SELECT ON public.active_councils TO anon;

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_admin_user ON platform_admin_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_dept_memberships_user ON department_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_notices_org ON notices(organization_id);
CREATE INDEX IF NOT EXISTS idx_notices_dept ON notices(department_id);

-- 7. Insert default platform admins if none exist and admin_users doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'admin_users'
  ) THEN
    -- Create platform admins from auth.users with specific emails
    INSERT INTO public.platform_admin_settings (user_id, admin_role)
    SELECT
      id,
      'super_admin'
    FROM auth.users
    WHERE email IN (
      'ottoclarke00@gmail.com',
      'otto@wilsonpartners.law',
      'admin@civicnotices.uk',
      'otto@sampletonborough.gov.uk',
      'admin@westminster.gov.uk',
      'tom@duffieldandassoc.law'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

COMMENT ON TABLE platform_admin_settings IS 'Unified admin settings - replaces admin_users';
COMMENT ON VIEW active_councils IS 'Active councils for dropdown - replaces councils.json';
COMMENT ON SCHEMA private IS 'Schema for private functions and tables not exposed to API';
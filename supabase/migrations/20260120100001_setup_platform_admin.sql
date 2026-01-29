-- ============================================
-- PLATFORM ADMIN USER SETUP
-- Creates a platform admin user for testing admin dashboard access
-- ============================================
--
-- This migration:
-- 1. Creates a platform admin user in auth.users
-- 2. Adds them to platform_admin_settings table
-- 3. The custom_access_token_hook (20260122000002) will automatically
--    populate is_platform_admin and admin_role in JWT app_metadata
--
-- LOGIN CREDENTIALS:
-- Email: admin@civicnotices.uk
-- Password: adminpass123
--
-- IMPORTANT: Change this password in production!

-- Function to create platform admin user (if not exists)
CREATE OR REPLACE FUNCTION create_platform_admin_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_admin_role TEXT DEFAULT 'super_admin'
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  IF v_user_id IS NULL THEN
    -- Create new user
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email'],
        -- Pre-populate app_metadata for immediate access
        -- (JWT hook will also populate this on subsequent logins)
        'is_platform_admin', true,
        'admin_role', p_admin_role
      ),
      jsonb_build_object('full_name', p_full_name),
      false,
      'authenticated',
      'authenticated',
      ''
    );

    RAISE NOTICE 'Created platform admin user: % with ID %', p_email, v_user_id;
  ELSE
    -- User exists - update their app_metadata to include admin flags
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
      'is_platform_admin', true,
      'admin_role', p_admin_role
    ),
    updated_at = now()
    WHERE id = v_user_id;

    RAISE NOTICE 'Updated existing user % with platform admin access', p_email;
  END IF;

  -- Create profile if not exists
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (v_user_id, p_email, p_full_name)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, updated_at = now();

  -- Add to platform_admin_settings (this is what the JWT hook reads)
  INSERT INTO public.platform_admin_settings (
    user_id,
    admin_role,
    two_factor_enabled,
    session_timeout_minutes,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_admin_role,
    false,
    120,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    admin_role = EXCLUDED.admin_role,
    updated_at = now();

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CREATE PLATFORM ADMIN USER
-- ============================================

DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Create the main platform admin
  v_admin_id := create_platform_admin_user(
    'admin@civicnotices.uk',
    'adminpass123',
    'Platform Admin',
    'super_admin'
  );

  RAISE NOTICE 'Platform admin setup complete. User ID: %', v_admin_id;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify admin user was created
SELECT 'Admin user created:' as status,
       u.id,
       u.email,
       u.raw_app_meta_data->>'is_platform_admin' as is_platform_admin,
       u.raw_app_meta_data->>'admin_role' as admin_role
FROM auth.users u
WHERE u.email = 'admin@civicnotices.uk';

-- Verify platform_admin_settings entry
SELECT 'Platform admin settings:' as status,
       pas.user_id,
       pas.admin_role,
       pas.two_factor_enabled
FROM public.platform_admin_settings pas
JOIN auth.users u ON u.id = pas.user_id
WHERE u.email = 'admin@civicnotices.uk';

-- ============================================
-- CLEANUP (only needed if migration needs re-running)
-- ============================================

-- To remove the admin user (run manually if needed):
-- DELETE FROM public.platform_admin_settings WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@civicnotices.uk');
-- DELETE FROM public.profiles WHERE email = 'admin@civicnotices.uk';
-- DELETE FROM auth.users WHERE email = 'admin@civicnotices.uk';

COMMENT ON FUNCTION create_platform_admin_user IS 'Creates or updates a platform admin user with proper app_metadata and platform_admin_settings entry';

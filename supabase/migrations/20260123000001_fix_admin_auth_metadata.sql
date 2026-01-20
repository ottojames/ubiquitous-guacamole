-- Fix admin authentication by ensuring admin@civic user has proper metadata
-- This resolves the infinite spinner issue on admin login

-- First, ensure the admin@civic user exists (if not, create it)
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if user exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@civic';

  -- If user doesn't exist, create it with proper metadata
  IF v_user_id IS NULL THEN
    -- Insert user with admin metadata
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      gen_random_uuid(),
      'admin@civic',
      crypt('admin123', gen_salt('bf')), -- Default password, should be changed
      now(),
      jsonb_build_object(
        'is_platform_admin', true,
        'admin_role', 'super_admin',
        'role', 'admin'
      ),
      jsonb_build_object(
        'full_name', 'Platform Administrator'
      ),
      now(),
      now(),
      null,
      null,
      null,
      null
    ) RETURNING id INTO v_user_id;

    RAISE NOTICE 'Created admin@civic user with ID: %', v_user_id;
  ELSE
    -- User exists, update their metadata to include admin flags
    UPDATE auth.users
    SET
      raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
        'is_platform_admin', true,
        'admin_role', 'super_admin',
        'role', 'admin'
      ),
      updated_at = now()
    WHERE id = v_user_id;

    RAISE NOTICE 'Updated admin@civic user metadata for ID: %', v_user_id;
  END IF;

  -- Ensure the user exists in admin_users table (for backend admin panel)
  INSERT INTO admin_users (
    id,
    user_id,
    email,
    role,
    status,
    two_factor_enabled,
    failed_login_attempts,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    'admin@civic',
    'super_admin',
    'active',
    false,
    0,
    now(),
    now()
  ) ON CONFLICT (email) DO UPDATE
  SET
    role = 'super_admin',
    status = 'active',
    updated_at = now();

  -- Ensure platform_admin_settings exists for this user
  INSERT INTO platform_admin_settings (
    id,
    user_id,
    admin_role,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    'super_admin',
    now(),
    now()
  ) ON CONFLICT (user_id) DO UPDATE
  SET
    admin_role = 'super_admin',
    updated_at = now();

END $$;

-- Create a function to easily check if a user is a platform admin
CREATE OR REPLACE FUNCTION is_platform_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = user_id
    AND raw_app_meta_data->>'is_platform_admin' = 'true'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_platform_admin(uuid) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION is_platform_admin IS 'Check if a user has platform admin privileges';

-- Output confirmation
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM auth.users
  WHERE email = 'admin@civic'
  AND raw_app_meta_data->>'is_platform_admin' = 'true';

  IF v_count > 0 THEN
    RAISE NOTICE 'Success: admin@civic user is configured as platform admin';
  ELSE
    RAISE WARNING 'Issue: admin@civic user may not be properly configured';
  END IF;
END $$;
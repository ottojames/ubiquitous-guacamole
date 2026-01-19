-- ============================================================================
-- COMPREHENSIVE SUPABASE SCHEMA FIX FOR REGISTRATION & LOGIN
-- ============================================================================
-- This file fixes ALL issues preventing council/firm registration and login
-- Execute this ENTIRE file in Supabase SQL Editor
--
-- SUCCESS CRITERIA:
-- 1. Council registration creates account successfully
-- 2. Can login with the same credentials
-- 3. Firm registration creates account successfully
-- 4. Can login with the same credentials
-- ============================================================================

-- 1. CHECK AND FIX DEPARTMENTS TABLE COLUMN NAMING
-- ============================================================================
-- The departments table should have 'email' column (not 'contact_email')
DO $$
BEGIN
  -- Check if 'contact_email' exists and rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'departments'
    AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE public.departments RENAME COLUMN contact_email TO email;
    RAISE NOTICE 'Renamed departments.contact_email to departments.email';
  ELSE
    RAISE NOTICE 'departments.email column already correct';
  END IF;
END $$;

-- 2. MODIFY EXISTING DEPARTMENT_MEMBERSHIPS TABLE IF NEEDED
-- ============================================================================
-- Check if department_memberships exists and has the right structure
DO $$
BEGIN
  -- Check if the table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'department_memberships'
  ) THEN
    RAISE NOTICE 'department_memberships table already exists';

    -- Simply drop and recreate the constraint to ensure it supports all needed roles
    -- This is safer than trying to detect the existing constraint definition
    BEGIN
      -- Try to drop existing constraint
      ALTER TABLE public.department_memberships
      DROP CONSTRAINT IF EXISTS department_memberships_role_check;

      -- Add the updated constraint
      ALTER TABLE public.department_memberships
      ADD CONSTRAINT department_memberships_role_check
      CHECK (role IN ('department_admin', 'editor', 'viewer', 'admin', 'member'));

      RAISE NOTICE 'Updated role constraints on department_memberships';
    EXCEPTION
      WHEN OTHERS THEN
        -- If there's any issue, just log it and continue
        RAISE NOTICE 'Could not update role constraint: %', SQLERRM;
    END;
  ELSE
    -- Create the table if it doesn't exist (shouldn't happen based on migrations)
    CREATE TABLE public.department_memberships (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, department_id)
    );
    RAISE NOTICE 'Created department_memberships table';
  END IF;
END $$;

-- 3. CREATE TRIGGER TO AUTO-ADD DEPARTMENT MEMBERSHIPS
-- ============================================================================
-- When a user is created with organization_id metadata, add them to all departments
CREATE OR REPLACE FUNCTION auto_create_department_memberships()
RETURNS TRIGGER AS $$
BEGIN
  -- If user has organization_id in metadata, add them to all departments
  IF (NEW.raw_user_meta_data->>'organization_id') IS NOT NULL THEN
    INSERT INTO public.department_memberships (user_id, department_id, role)
    SELECT
      NEW.id,
      d.id,
      COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
    FROM public.departments d
    WHERE d.organization_id = (NEW.raw_user_meta_data->>'organization_id')::UUID
    ON CONFLICT (user_id, department_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_memberships ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created_memberships
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_department_memberships();

-- 4. FIX RLS POLICIES FOR DEPARTMENT ACCESS
-- ============================================================================
-- Enable RLS on department_memberships
ALTER TABLE public.department_memberships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.department_memberships;
DROP POLICY IF EXISTS "Service role has full access to memberships" ON public.department_memberships;

-- Create policies for department_memberships
CREATE POLICY "Users can view their own memberships"
  ON public.department_memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to memberships"
  ON public.department_memberships FOR ALL
  USING (auth.role() = 'service_role');

-- Fix departments table policies
DROP POLICY IF EXISTS "Users can view departments in their organization" ON public.departments;
DROP POLICY IF EXISTS "Service role has full access to departments" ON public.departments;

-- Enable RLS on departments if not already enabled
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view departments in their organization"
  ON public.departments FOR SELECT
  USING (
    -- Check if user has membership in this department
    id IN (
      SELECT department_id
      FROM public.department_memberships
      WHERE user_id = auth.uid()
    )
    OR
    -- Also check user metadata for organization_id from auth.users table
    organization_id IN (
      SELECT (raw_user_meta_data->>'organization_id')::UUID
      FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'organization_id' IS NOT NULL
    )
  );

CREATE POLICY "Service role has full access to departments"
  ON public.departments FOR ALL
  USING (auth.role() = 'service_role');

-- 5. BACKFILL EXISTING USERS INTO DEPARTMENT_MEMBERSHIPS
-- ============================================================================
-- Add existing users to their department memberships if missing
INSERT INTO public.department_memberships (user_id, department_id, role)
SELECT
  u.id AS user_id,
  d.id AS department_id,
  COALESCE(u.raw_user_meta_data->>'role', 'admin') AS role
FROM auth.users u
CROSS JOIN public.departments d
WHERE
  (u.raw_user_meta_data->>'organization_id')::UUID = d.organization_id
  AND NOT EXISTS (
    SELECT 1 FROM public.department_memberships dm
    WHERE dm.user_id = u.id AND dm.department_id = d.id
  );

-- 6. VERIFY REQUIRED COLUMNS EXIST
-- ============================================================================
-- Add any missing columns that the code expects
DO $$
BEGIN
  -- Ensure departments.status exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'departments'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.departments
    ADD COLUMN status TEXT DEFAULT 'active';
    RAISE NOTICE 'Added departments.status column';
  END IF;

  -- Ensure departments.slug exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'departments'
    AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.departments
    ADD COLUMN slug TEXT;
    RAISE NOTICE 'Added departments.slug column';
  END IF;

  -- Ensure departments.type exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'departments'
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.departments
    ADD COLUMN type TEXT;
    RAISE NOTICE 'Added departments.type column';
  END IF;

  -- Ensure departments.organization_id exists (it should from migrations)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'departments'
    AND column_name = 'organization_id'
  ) THEN
    -- This shouldn't happen if migrations ran correctly, but handle it
    ALTER TABLE public.departments
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added departments.organization_id column';
  END IF;
END $$;

-- 7. CREATE FUNCTION TO GET USER'S DEPARTMENTS
-- ============================================================================
-- Helper function to get departments for a user
CREATE OR REPLACE FUNCTION get_user_departments(user_uuid UUID)
RETURNS TABLE (
  department_id UUID,
  department_name TEXT,
  department_slug TEXT,
  organization_id UUID,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id AS department_id,
    d.name AS department_name,
    d.slug AS department_slug,
    d.organization_id,
    dm.role
  FROM public.departments d
  INNER JOIN public.department_memberships dm ON d.id = dm.department_id
  WHERE dm.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. ENSURE ORGANIZATIONS TABLE EXISTS
-- ============================================================================
-- Check if organizations table exists (should from migrations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'organizations'
  ) THEN
    RAISE EXCEPTION 'organizations table does not exist! Please run migration 20251021000000_multi_tenant_foundation.sql first';
  ELSE
    RAISE NOTICE 'organizations table exists';
  END IF;
END $$;

-- 9. REFRESH SCHEMA CACHE
-- ============================================================================
-- Force Supabase to reload schema cache
NOTIFY pgrst, 'reload schema';

-- 10. VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the fix worked:

-- Check departments table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'departments'
ORDER BY ordinal_position;

-- Check if department_memberships table exists and structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'department_memberships'
ORDER BY ordinal_position;

-- Check if organizations table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'organizations'
) AS organizations_table_exists;

-- Count existing department memberships
SELECT COUNT(*) AS membership_count
FROM public.department_memberships;

-- Check for users with organization metadata but no memberships
SELECT
  u.id,
  u.email,
  u.raw_user_meta_data->>'organization_id' as org_id,
  COUNT(dm.user_id) as membership_count
FROM auth.users u
LEFT JOIN public.department_memberships dm ON u.id = dm.user_id
WHERE u.raw_user_meta_data->>'organization_id' IS NOT NULL
GROUP BY u.id, u.email, u.raw_user_meta_data->>'organization_id'
HAVING COUNT(dm.user_id) = 0;

-- ============================================================================
-- EXECUTION INSTRUCTIONS:
-- ============================================================================
-- 1. Go to Supabase Dashboard
-- 2. Navigate to SQL Editor (left sidebar)
-- 3. Click "New Query"
-- 4. Paste this entire file
-- 5. Click "Run" button
-- 6. Check the output for any errors and notices
-- 7. If successful, try creating a council account again
-- ============================================================================
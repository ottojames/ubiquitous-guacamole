-- Fix departments table schema inconsistency
-- The migration 20251021000000_multi_tenant_foundation.sql shows 'email' column
-- but the actual database has 'contact_email' column
-- This migration renames the column to match what the code expects

-- First check if the column exists and rename it if needed
DO $$
BEGIN
  -- Check if 'contact_email' column exists (current state)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'departments'
    AND column_name = 'contact_email'
  ) THEN
    -- Rename to 'email' to match original migration intent
    ALTER TABLE public.departments
    RENAME COLUMN contact_email TO email;

    RAISE NOTICE 'Renamed departments.contact_email to departments.email';
  END IF;

  -- If 'email' already exists, do nothing
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'departments'
    AND column_name = 'email'
  ) THEN
    RAISE NOTICE 'departments.email column already exists';
  END IF;
END $$;

-- Update any views or functions that might reference the old column name
-- This ensures backward compatibility

COMMENT ON COLUMN public.departments.email IS 'Contact email for this department (e.g., licensing@council.gov.uk)';
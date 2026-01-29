-- Allow NULL organization_id for public notice submissions
-- This is needed because:
-- 1. Public users can submit notices without being logged in
-- 2. Anonymous submissions don't have an associated organization
-- 3. Existing data already has NULL organization_ids

-- Drop the NOT NULL constraint if it exists
DO $$
BEGIN
  -- Check if the column has a NOT NULL constraint and drop it
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notices'
      AND column_name = 'organization_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.notices ALTER COLUMN organization_id DROP NOT NULL;
    RAISE NOTICE 'Dropped NOT NULL constraint from notices.organization_id';
  ELSE
    RAISE NOTICE 'notices.organization_id is already nullable';
  END IF;
END $$;

-- Add an index to quickly find notices without organization for admin review
CREATE INDEX IF NOT EXISTS idx_notices_no_org ON public.notices(created_at DESC)
  WHERE organization_id IS NULL;

COMMENT ON COLUMN public.notices.organization_id IS
  'Organization that owns this notice. NULL for public/anonymous submissions.';

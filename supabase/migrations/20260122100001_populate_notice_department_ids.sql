-- Migration: Populate department_id for existing notices
-- Purpose: Notices in the database have NULL department_id values.
-- The dashboard queries filter by department_id, so notices don't appear.
-- This migration sets department_id based on organization_id and department type.

-- ============================================================================
-- POPULATE department_id FOR EXISTING NOTICES
-- ============================================================================
-- Logic:
-- 1. Find notices with NULL department_id but valid organization_id
-- 2. For each notice, look up the licensing department for that organization
-- 3. Set department_id to the licensing department
--
-- Note: This assumes licensing notices. If notices could belong to other
-- department types, additional logic would be needed to determine the correct
-- department based on notice_type.

-- Update notices that have organization_id but no department_id
-- Set them to the licensing department of their organization
UPDATE public.notices n
SET department_id = d.id
FROM public.departments d
WHERE n.department_id IS NULL
  AND n.organization_id IS NOT NULL
  AND d.organization_id = n.organization_id
  AND d.type = 'licensing'
  AND d.status = 'active';

-- For notices with council_id (legacy column) but no organization_id or department_id,
-- try to match via the council name or create a mapping
-- First, check if there's a council_id column we need to handle
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notices'
    AND column_name = 'council_id'
  ) THEN
    -- Update notices that have council_id but no department_id
    -- Match councils to organizations by name or ID
    EXECUTE '
      UPDATE public.notices n
      SET
        organization_id = o.id,
        department_id = d.id
      FROM public.organizations o
      JOIN public.departments d ON d.organization_id = o.id AND d.type = ''licensing'' AND d.status = ''active''
      WHERE n.department_id IS NULL
        AND n.council_id IS NOT NULL
        AND o.type = ''council''
        AND o.status = ''active''
        AND (
          -- Match by council_id if it exists as organization ID
          n.council_id::text = o.id::text
          -- Or match by looking up council name
          OR EXISTS (
            SELECT 1 FROM public.councils c
            WHERE c.id = n.council_id
            AND LOWER(c.name) = LOWER(o.name)
          )
        )
    ';
  END IF;
END $$;

-- ============================================================================
-- LOGGING
-- ============================================================================
-- Report how many notices were updated
DO $$
DECLARE
  total_notices INTEGER;
  notices_with_dept INTEGER;
  notices_without_dept INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_notices FROM public.notices;
  SELECT COUNT(*) INTO notices_with_dept FROM public.notices WHERE department_id IS NOT NULL;
  notices_without_dept := total_notices - notices_with_dept;

  RAISE NOTICE 'Migration complete: % total notices, % with department_id, % still without department_id',
    total_notices, notices_with_dept, notices_without_dept;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.notices IS 'Public notices with department_id populated for proper isolation';

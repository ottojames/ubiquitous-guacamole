-- ============================================================================
-- RLS MIGRATION: Enable Anonymous Public Submissions
-- ============================================================================
-- This migration enables unauthenticated applicants to submit licensing
-- applications directly to councils without creating an account.
--
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Go to SQL Editor
-- 3. Copy this ENTIRE file and paste it
-- 4. Click "Run" or press Cmd+Enter
-- ============================================================================

-- STEP 1: Allow public read access to active licensing departments
DROP POLICY IF EXISTS departments_select_policy ON public.departments;

CREATE POLICY departments_select_policy ON public.departments
FOR SELECT
USING (
  (type = 'licensing' AND status = 'active')
  OR
  user_is_org_admin(organization_id)
  OR
  user_is_dept_member(id)
);

COMMENT ON POLICY departments_select_policy ON public.departments IS
'Public can see active licensing departments. Authenticated users see their own.';

-- STEP 2: Allow public read access to council organizations
DROP POLICY IF EXISTS organizations_select_policy ON public.organizations;

CREATE POLICY organizations_select_policy ON public.organizations
FOR SELECT
USING (
  (type = 'council' AND status = 'active')
  OR
  id IN (
    SELECT organization_id
    FROM public.organization_memberships
    WHERE user_id = auth.uid()
  )
  OR
  id IN (
    SELECT DISTINCT d.organization_id
    FROM public.departments d
    JOIN public.department_memberships dm ON d.id = dm.department_id
    WHERE dm.user_id = auth.uid()
  )
);

COMMENT ON POLICY organizations_select_policy ON public.organizations IS
'Public can see active councils. Authenticated users see their own orgs.';

-- STEP 3: Make columns nullable for anonymous submissions
ALTER TABLE public.submissions
  ALTER COLUMN source_organization_id DROP NOT NULL;

ALTER TABLE public.submissions
  ALTER COLUMN submitted_by DROP NOT NULL;

-- STEP 4: Update trigger to allow NULL source organization
CREATE OR REPLACE FUNCTION validate_submission_organizations()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow NULL source for anonymous public applicants
  IF NEW.source_organization_id IS NOT NULL THEN
    -- If source is provided, ensure it's a firm
    IF NOT EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = NEW.source_organization_id AND type = 'firm'
    ) THEN
      RAISE EXCEPTION 'Submissions can only be created by firm organizations';
    END IF;
  END IF;

  -- Auto-populate target_organization_id from department
  SELECT organization_id INTO NEW.target_organization_id
  FROM public.departments
  WHERE id = NEW.target_department_id;

  -- Ensure target is a council
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = NEW.target_organization_id AND type = 'council'
  ) THEN
    RAISE EXCEPTION 'Submissions can only target council departments';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 5: Update RLS policy to allow anonymous inserts
DROP POLICY IF EXISTS submissions_insert_policy ON public.submissions;

CREATE POLICY submissions_insert_policy ON public.submissions
FOR INSERT
WITH CHECK (
  -- Authenticated firm members can submit with their org ID
  (
    auth.uid() IS NOT NULL
    AND source_organization_id IN (
      SELECT organization_id
      FROM public.organization_memberships
      WHERE user_id = auth.uid()
    )
  )
  OR
  -- Anonymous public applicants can submit with NULL org ID
  (
    auth.uid() IS NULL
    AND source_organization_id IS NULL
  )
);

COMMENT ON POLICY submissions_insert_policy ON public.submissions IS
'Firms submit with their org ID. Anonymous applicants submit with NULL org ID.';

-- ============================================================================
-- VERIFICATION: Check if policies were created successfully
-- ============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('submissions', 'departments', 'organizations')
ORDER BY tablename, policyname;

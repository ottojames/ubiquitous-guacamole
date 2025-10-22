-- Allow public to submit applications (anonymous applicants)

-- Make source_organization_id and submitted_by nullable for public submissions
ALTER TABLE public.submissions ALTER COLUMN source_organization_id DROP NOT NULL;
ALTER TABLE public.submissions ALTER COLUMN submitted_by DROP NOT NULL;

-- Update validation trigger to allow NULL source (anonymous applicants)
CREATE OR REPLACE FUNCTION validate_submission_organizations()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow NULL source for anonymous public applicants
  IF NEW.source_organization_id IS NOT NULL THEN
    -- Ensure source is a firm
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

-- Update INSERT policy to allow anonymous submissions
DROP POLICY IF EXISTS submissions_insert_policy ON public.submissions;

CREATE POLICY submissions_insert_policy ON public.submissions
FOR INSERT
WITH CHECK (
  -- Authenticated firm members
  (
    auth.uid() IS NOT NULL
    AND source_organization_id IN (
      SELECT organization_id FROM public.organization_memberships
      WHERE user_id = auth.uid()
    )
  )
  OR
  -- Anonymous public applicants (source_organization_id must be NULL)
  (
    auth.uid() IS NULL
    AND source_organization_id IS NULL
  )
);

COMMENT ON POLICY submissions_insert_policy ON public.submissions IS
'Firms can submit with their org ID. Anonymous applicants can submit with NULL org ID.';

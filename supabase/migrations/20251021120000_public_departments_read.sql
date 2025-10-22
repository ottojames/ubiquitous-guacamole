-- Allow public read access to active licensing departments
-- This enables unauthenticated applicants to see which councils they can submit to

-- Drop existing policy
DROP POLICY IF EXISTS departments_select_policy ON public.departments;

-- Recreate with public read for active licensing departments
CREATE POLICY departments_select_policy ON public.departments
FOR SELECT
USING (
  -- Public can see active licensing departments (client filters for councils)
  (type = 'licensing' AND status = 'active')
  OR
  -- User is org admin
  user_is_org_admin(organization_id)
  OR
  -- User is member of this department
  user_is_dept_member(id)
);

COMMENT ON POLICY departments_select_policy ON public.departments IS
'Public can see active licensing departments. Client-side filters for council vs firm.';

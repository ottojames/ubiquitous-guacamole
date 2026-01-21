-- ============================================================================
-- Internal Comments RLS Policies
-- Defense-in-depth: ensures department isolation at database level
-- ============================================================================

-- Drop existing policies that may conflict
DROP POLICY IF EXISTS "Department members can insert comments" ON internal_comments;
DROP POLICY IF EXISTS "Department members can view comments" ON internal_comments;

-- 1. INSERT Policy: Department members can insert comments for their department
CREATE POLICY "Department members can insert comments"
ON internal_comments FOR INSERT TO authenticated
WITH CHECK (
  -- User must be a member of the department
  department_id IN (
    SELECT department_id FROM department_memberships
    WHERE user_id = auth.uid()
  )
  -- OR user is an org admin for the department's organization
  OR department_id IN (
    SELECT d.id FROM departments d
    JOIN organization_memberships om ON om.organization_id = d.organization_id
    WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'org_admin')
  )
);

-- 2. SELECT Policy: Department members can view comments for their department
CREATE POLICY "Department members can view comments"
ON internal_comments FOR SELECT TO authenticated
USING (
  deleted_at IS NULL
  AND (
    -- User is a member of the department
    department_id IN (
      SELECT department_id FROM department_memberships
      WHERE user_id = auth.uid()
    )
    -- OR user is an org admin for the department's organization
    OR department_id IN (
      SELECT d.id FROM departments d
      JOIN organization_memberships om ON om.organization_id = d.organization_id
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'org_admin')
    )
  )
);

-- Add comments
COMMENT ON POLICY "Department members can insert comments" ON internal_comments
IS 'Users can only insert comments into departments they are members of (or org admins over)';
COMMENT ON POLICY "Department members can view comments" ON internal_comments
IS 'Users can only view non-deleted comments from departments they are members of (or org admins over)';

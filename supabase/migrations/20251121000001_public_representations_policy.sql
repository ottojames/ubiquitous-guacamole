-- Migration: Allow public read access to representations for published notices
-- This is required by Licensing Act 2003 Section 35(5) and Planning Act
-- Representations are public documents and must be available for public inspection

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "representations_select_policy" ON representations;

-- Create new policy that allows public read access for published notices
CREATE POLICY "representations_public_read_policy"
ON representations
FOR SELECT
USING (
  notice_id IN (
    SELECT id FROM notices
    WHERE status = 'published'
    AND is_public = true
  )
  OR
  notice_id IN (
    SELECT notices.id
    FROM notices
    WHERE (
      user_is_dept_member(notices.department_id)
      OR user_is_org_admin(notices.organization_id)
    )
  )
);

-- Add comment explaining the legal requirement
COMMENT ON POLICY "representations_public_read_policy" ON representations IS
'Allows public read access to representations for published notices (Licensing Act 2003 s.35(5) requires public inspection of representations). Council staff retain access to all representations.';

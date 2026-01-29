-- ============================================================================
-- DEPARTMENT ISOLATION RLS POLICIES
-- Defense in depth: ensures department-level isolation at database layer
-- Even if frontend filters are bypassed, database rejects cross-department queries
-- ============================================================================

-- NOTE: Existing policies in 20251021000007_rls_policies.sql already provide
-- department isolation via user_is_dept_member() function. These additional
-- policies provide explicit, clearly-named department isolation as a second
-- layer of defense.

-- ============================================================================
-- NOTICES TABLE - Department Isolation Policy
-- ============================================================================

-- Drop the policy if it already exists (idempotent)
DROP POLICY IF EXISTS "Users see notices in their departments" ON public.notices;

-- Add explicit department isolation policy for notices
-- This ensures users can only see notices from departments they belong to
CREATE POLICY "Users see notices in their departments"
ON public.notices
FOR SELECT
TO authenticated
USING (
  -- Published public notices are visible to everyone (handled by other policies)
  -- Non-public/draft notices require department membership
  department_id IN (
    SELECT department_id
    FROM public.department_memberships
    WHERE user_id = auth.uid()
  )
  -- Org admins can see all notices in their organization
  OR organization_id IN (
    SELECT organization_id
    FROM public.organization_memberships
    WHERE user_id = auth.uid() AND role IN ('owner', 'org_admin')
  )
);

-- ============================================================================
-- REPRESENTATIONS TABLE - Department Isolation Policy
-- ============================================================================

-- Drop the policy if it already exists (idempotent)
DROP POLICY IF EXISTS "Users see representations for their department notices" ON public.representations;

-- Add explicit department isolation policy for representations
-- Users can only see representations for notices in their departments
CREATE POLICY "Users see representations for their department notices"
ON public.representations
FOR SELECT
TO authenticated
USING (
  notice_id IN (
    SELECT id FROM public.notices
    WHERE department_id IN (
      SELECT department_id
      FROM public.department_memberships
      WHERE user_id = auth.uid()
    )
    -- Org admins can see representations for all notices in their organization
    OR organization_id IN (
      SELECT organization_id
      FROM public.organization_memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'org_admin')
    )
  )
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users see notices in their departments" ON public.notices
IS 'Defense in depth: ensures department-level isolation for notices at database layer';

COMMENT ON POLICY "Users see representations for their department notices" ON public.representations
IS 'Defense in depth: ensures department-level isolation for representations at database layer';

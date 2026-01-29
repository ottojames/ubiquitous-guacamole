-- Row-Level Security (RLS) Policies Migration
-- Three-layer security: RLS (database) + API + UI
-- Enforces department-level data isolation

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.representations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Check if user is org owner or admin
CREATE OR REPLACE FUNCTION user_is_org_admin(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'org_admin')
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user is department admin
CREATE OR REPLACE FUNCTION user_is_dept_admin(p_dept_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.department_memberships
    WHERE department_id = p_dept_id
      AND user_id = auth.uid()
      AND role = 'department_admin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user has any role in department
CREATE OR REPLACE FUNCTION user_is_dept_member(p_dept_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.department_memberships
    WHERE department_id = p_dept_id
      AND user_id = auth.uid()
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user can edit in department (admin or editor)
CREATE OR REPLACE FUNCTION user_can_edit_dept(p_dept_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.department_memberships
    WHERE department_id = p_dept_id
      AND user_id = auth.uid()
      AND role IN ('department_admin', 'editor')
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- ORGANIZATIONS TABLE RLS
-- ============================================================================

-- SELECT: Users can see orgs they're members of, or all orgs for site admin
CREATE POLICY organizations_select_policy ON public.organizations
FOR SELECT
USING (
  -- User is member of this organization
  id IN (
    SELECT organization_id FROM public.organization_memberships
    WHERE user_id = auth.uid()
  )
  OR
  -- User is member of a department in this organization
  id IN (
    SELECT DISTINCT d.organization_id
    FROM public.departments d
    JOIN public.department_memberships dm ON d.id = dm.department_id
    WHERE dm.user_id = auth.uid()
  )
  -- TODO: Add site admin check when admin auth is implemented
);

-- INSERT: Anyone can create organization (pending approval)
CREATE POLICY organizations_insert_policy ON public.organizations
FOR INSERT
WITH CHECK (
  created_by = auth.uid()
);

-- UPDATE: Org owners and admins only
CREATE POLICY organizations_update_policy ON public.organizations
FOR UPDATE
USING (
  user_is_org_admin(id)
);

-- DELETE: Org owners only
CREATE POLICY organizations_delete_policy ON public.organizations
FOR DELETE
USING (
  id IN (
    SELECT organization_id FROM public.organization_memberships
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- ============================================================================
-- DEPARTMENTS TABLE RLS
-- ============================================================================

-- SELECT: Org admins + dept members
CREATE POLICY departments_select_policy ON public.departments
FOR SELECT
USING (
  -- User is org admin
  user_is_org_admin(organization_id)
  OR
  -- User is member of this department
  user_is_dept_member(id)
);

-- INSERT: Org admins can create departments
CREATE POLICY departments_insert_policy ON public.departments
FOR INSERT
WITH CHECK (
  user_is_org_admin(organization_id)
);

-- UPDATE: Org admins + dept admins
CREATE POLICY departments_update_policy ON public.departments
FOR UPDATE
USING (
  user_is_org_admin(organization_id)
  OR
  user_is_dept_admin(id)
);

-- DELETE: Org admins only
CREATE POLICY departments_delete_policy ON public.departments
FOR DELETE
USING (
  user_is_org_admin(organization_id)
);

-- ============================================================================
-- ORGANIZATION_MEMBERSHIPS TABLE RLS
-- ============================================================================

-- SELECT: Org members can see other org members
CREATE POLICY org_memberships_select_policy ON public.organization_memberships
FOR SELECT
USING (
  user_is_org_admin(organization_id)
  OR
  user_id = auth.uid()
);

-- INSERT: Org admins can add members (via invitations)
CREATE POLICY org_memberships_insert_policy ON public.organization_memberships
FOR INSERT
WITH CHECK (
  user_is_org_admin(organization_id)
  OR
  invited_by = auth.uid()
);

-- UPDATE: Org owners can change roles
CREATE POLICY org_memberships_update_policy ON public.organization_memberships
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_memberships
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- DELETE: Org owners can remove members, users can leave
CREATE POLICY org_memberships_delete_policy ON public.organization_memberships
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_memberships
    WHERE user_id = auth.uid() AND role = 'owner'
  )
  OR
  user_id = auth.uid()
);

-- ============================================================================
-- DEPARTMENT_MEMBERSHIPS TABLE RLS
-- ============================================================================

-- SELECT: Dept members + org admins
CREATE POLICY dept_memberships_select_policy ON public.department_memberships
FOR SELECT
USING (
  user_is_dept_member(department_id)
  OR
  department_id IN (
    SELECT id FROM public.departments
    WHERE user_is_org_admin(organization_id)
  )
  OR
  user_id = auth.uid()
);

-- INSERT: Dept admins + org admins
CREATE POLICY dept_memberships_insert_policy ON public.department_memberships
FOR INSERT
WITH CHECK (
  user_is_dept_admin(department_id)
  OR
  department_id IN (
    SELECT id FROM public.departments
    WHERE user_is_org_admin(organization_id)
  )
);

-- UPDATE: Dept admins + org admins
CREATE POLICY dept_memberships_update_policy ON public.department_memberships
FOR UPDATE
USING (
  user_is_dept_admin(department_id)
  OR
  department_id IN (
    SELECT id FROM public.departments
    WHERE user_is_org_admin(organization_id)
  )
);

-- DELETE: Dept admins + org admins + self
CREATE POLICY dept_memberships_delete_policy ON public.department_memberships
FOR DELETE
USING (
  user_is_dept_admin(department_id)
  OR
  department_id IN (
    SELECT id FROM public.departments
    WHERE user_is_org_admin(organization_id)
  )
  OR
  user_id = auth.uid()
);

-- ============================================================================
-- NOTICES TABLE RLS
-- ============================================================================

-- SELECT: Published notices are public, drafts visible to dept members
CREATE POLICY notices_select_policy ON public.notices
FOR SELECT
USING (
  -- Published notices are public
  (status = 'published' AND is_public = true)
  OR
  -- Department members can see all dept notices
  user_is_dept_member(department_id)
  OR
  -- Org admins can see all org notices
  user_is_org_admin(organization_id)
);

-- INSERT: Dept editors and admins
CREATE POLICY notices_insert_policy ON public.notices
FOR INSERT
WITH CHECK (
  user_can_edit_dept(department_id)
);

-- UPDATE: Creator (if editor) or dept admins or org admins
CREATE POLICY notices_update_policy ON public.notices
FOR UPDATE
USING (
  user_is_dept_admin(department_id)
  OR
  user_is_org_admin(organization_id)
  OR
  (created_by = auth.uid() AND user_can_edit_dept(department_id))
);

-- DELETE: Dept admins + org admins
CREATE POLICY notices_delete_policy ON public.notices
FOR DELETE
USING (
  user_is_dept_admin(department_id)
  OR
  user_is_org_admin(organization_id)
);

-- ============================================================================
-- TEMPLATES TABLE RLS
-- ============================================================================

-- SELECT: Dept members
CREATE POLICY templates_select_policy ON public.templates
FOR SELECT
USING (
  user_is_dept_member(department_id)
);

-- INSERT: Dept editors and admins
CREATE POLICY templates_insert_policy ON public.templates
FOR INSERT
WITH CHECK (
  user_can_edit_dept(department_id)
);

-- UPDATE: Creator or dept admin
CREATE POLICY templates_update_policy ON public.templates
FOR UPDATE
USING (
  created_by = auth.uid()
  OR
  user_is_dept_admin(department_id)
);

-- DELETE: Creator or dept admin
CREATE POLICY templates_delete_policy ON public.templates
FOR DELETE
USING (
  created_by = auth.uid()
  OR
  user_is_dept_admin(department_id)
);

-- ============================================================================
-- ATTACHMENTS TABLE RLS
-- ============================================================================

-- SELECT: Follow notice visibility rules
CREATE POLICY attachments_select_policy ON public.attachments
FOR SELECT
USING (
  notice_id IN (
    SELECT id FROM public.notices
    WHERE (status = 'published' AND is_public = true)
      OR user_is_dept_member(department_id)
      OR user_is_org_admin(organization_id)
  )
);

-- INSERT: Follow notice edit rules
CREATE POLICY attachments_insert_policy ON public.attachments
FOR INSERT
WITH CHECK (
  notice_id IN (
    SELECT id FROM public.notices
    WHERE user_can_edit_dept(department_id)
      OR user_is_dept_admin(department_id)
      OR user_is_org_admin(organization_id)
  )
);

-- UPDATE: Uploader or notice editor
CREATE POLICY attachments_update_policy ON public.attachments
FOR UPDATE
USING (
  uploaded_by = auth.uid()
  OR
  notice_id IN (
    SELECT id FROM public.notices
    WHERE user_is_dept_admin(department_id)
      OR user_is_org_admin(organization_id)
  )
);

-- DELETE: Uploader or notice editor
CREATE POLICY attachments_delete_policy ON public.attachments
FOR DELETE
USING (
  uploaded_by = auth.uid()
  OR
  notice_id IN (
    SELECT id FROM public.notices
    WHERE user_is_dept_admin(department_id)
      OR user_is_org_admin(organization_id)
  )
);

-- ============================================================================
-- INVITATIONS TABLE RLS
-- ============================================================================

-- SELECT: Inviter + org/dept admins
CREATE POLICY invitations_select_policy ON public.invitations
FOR SELECT
USING (
  invited_by = auth.uid()
  OR
  (organization_id IS NOT NULL AND user_is_org_admin(organization_id))
  OR
  (department_id IS NOT NULL AND user_is_dept_admin(department_id))
);

-- INSERT: Org/dept admins
CREATE POLICY invitations_insert_policy ON public.invitations
FOR INSERT
WITH CHECK (
  (organization_id IS NOT NULL AND user_is_org_admin(organization_id))
  OR
  (department_id IS NOT NULL AND user_is_dept_admin(department_id))
);

-- UPDATE: Status changes allowed by inviter or admin
CREATE POLICY invitations_update_policy ON public.invitations
FOR UPDATE
USING (
  invited_by = auth.uid()
  OR
  (organization_id IS NOT NULL AND user_is_org_admin(organization_id))
  OR
  (department_id IS NOT NULL AND user_is_dept_admin(department_id))
);

-- DELETE: Inviter or admin can cancel
CREATE POLICY invitations_delete_policy ON public.invitations
FOR DELETE
USING (
  invited_by = auth.uid()
  OR
  (organization_id IS NOT NULL AND user_is_org_admin(organization_id))
  OR
  (department_id IS NOT NULL AND user_is_dept_admin(department_id))
);

-- ============================================================================
-- CLIENTS TABLE RLS
-- ============================================================================

-- SELECT: Firm members
CREATE POLICY clients_select_policy ON public.clients
FOR SELECT
USING (
  user_is_org_admin(organization_id)
  OR
  organization_id IN (
    SELECT organization_id FROM public.organization_memberships
    WHERE user_id = auth.uid()
  )
);

-- INSERT: Firm members
CREATE POLICY clients_insert_policy ON public.clients
FOR INSERT
WITH CHECK (
  user_is_org_admin(organization_id)
  OR
  organization_id IN (
    SELECT organization_id FROM public.organization_memberships
    WHERE user_id = auth.uid()
  )
);

-- UPDATE: Firm members
CREATE POLICY clients_update_policy ON public.clients
FOR UPDATE
USING (
  user_is_org_admin(organization_id)
  OR
  created_by = auth.uid()
);

-- DELETE: Firm admins
CREATE POLICY clients_delete_policy ON public.clients
FOR DELETE
USING (
  user_is_org_admin(organization_id)
);

-- ============================================================================
-- SUBMISSIONS TABLE RLS
-- ============================================================================

-- SELECT: Source firm + target dept
CREATE POLICY submissions_select_policy ON public.submissions
FOR SELECT
USING (
  -- Firm can see their own submissions
  source_organization_id IN (
    SELECT organization_id FROM public.organization_memberships
    WHERE user_id = auth.uid()
  )
  OR
  -- Council dept can see submissions to them
  user_is_dept_member(target_department_id)
  OR
  user_is_org_admin(target_organization_id)
);

-- INSERT: Firm members
CREATE POLICY submissions_insert_policy ON public.submissions
FOR INSERT
WITH CHECK (
  source_organization_id IN (
    SELECT organization_id FROM public.organization_memberships
    WHERE user_id = auth.uid()
  )
);

-- UPDATE: Submitter (firm) or assigned council officer
CREATE POLICY submissions_update_policy ON public.submissions
FOR UPDATE
USING (
  submitted_by = auth.uid()
  OR
  assigned_to = auth.uid()
  OR
  user_is_dept_admin(target_department_id)
  OR
  user_is_org_admin(target_organization_id)
);

-- DELETE: Firm admin or council dept admin
CREATE POLICY submissions_delete_policy ON public.submissions
FOR DELETE
USING (
  user_is_org_admin(source_organization_id)
  OR
  user_is_dept_admin(target_department_id)
  OR
  user_is_org_admin(target_organization_id)
);

-- ============================================================================
-- REPRESENTATIONS TABLE RLS
-- ============================================================================

-- SELECT: Public (for published notices) + dept members
CREATE POLICY representations_select_policy ON public.representations
FOR SELECT
USING (
  -- Dept members can see all representations
  notice_id IN (
    SELECT id FROM public.notices
    WHERE user_is_dept_member(department_id)
      OR user_is_org_admin(organization_id)
  )
  -- TODO: Public can see their own representation via token/email validation
);

-- INSERT: Anyone (public submissions)
CREATE POLICY representations_insert_policy ON public.representations
FOR INSERT
WITH CHECK (
  -- Ensure notice is published and within deadline
  notice_id IN (
    SELECT id FROM public.notices
    WHERE status = 'published'
      AND is_public = true
      AND (representation_deadline IS NULL OR representation_deadline > NOW())
  )
);

-- UPDATE: Council reviewers only (for internal notes)
CREATE POLICY representations_update_policy ON public.representations
FOR UPDATE
USING (
  notice_id IN (
    SELECT id FROM public.notices
    WHERE user_is_dept_admin(department_id)
      OR user_is_org_admin(organization_id)
  )
);

-- DELETE: Dept admins + org admins
CREATE POLICY representations_delete_policy ON public.representations
FOR DELETE
USING (
  notice_id IN (
    SELECT id FROM public.notices
    WHERE user_is_dept_admin(department_id)
      OR user_is_org_admin(organization_id)
  )
);

-- ============================================================================
-- AUDIT_LOGS TABLE RLS
-- ============================================================================

-- SELECT: Org/dept members can see their logs
CREATE POLICY audit_logs_select_policy ON public.audit_logs
FOR SELECT
USING (
  user_is_org_admin(organization_id)
  OR
  (department_id IS NOT NULL AND user_is_dept_member(department_id))
  OR
  user_id = auth.uid()
);

-- INSERT: System only (via SECURITY DEFINER functions)
-- No direct INSERT policy - use create_audit_log function

-- UPDATE/DELETE: Never allowed (enforced by trigger)

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY organizations_select_policy ON public.organizations IS 'Users see orgs they belong to or have dept access to';
COMMENT ON POLICY notices_select_policy ON public.notices IS 'Published notices are public, drafts visible to dept members only';
COMMENT ON POLICY representations_insert_policy ON public.representations IS 'Public can submit representations on published notices within deadline';

COMMENT ON FUNCTION user_is_org_admin IS 'Returns true if user is owner or org_admin of organization';
COMMENT ON FUNCTION user_is_dept_admin IS 'Returns true if user is department_admin of department';
COMMENT ON FUNCTION user_is_dept_member IS 'Returns true if user has any role in department';
COMMENT ON FUNCTION user_can_edit_dept IS 'Returns true if user can create/edit content in department (admin or editor)';

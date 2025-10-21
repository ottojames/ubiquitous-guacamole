-- Audit Logs Migration
-- Comprehensive activity tracking for compliance and security

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================
-- Tamper-proof append-only audit trail for all significant actions

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,

  -- Actor
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT, -- Snapshot at time of action (in case user deleted)

  -- Action Details
  action TEXT NOT NULL, -- e.g., 'notice.published', 'user.invited', 'template.created'
  action_category TEXT NOT NULL CHECK (action_category IN (
    'auth',           -- Login, logout, password reset
    'notice',         -- Notice CRUD operations
    'template',       -- Template CRUD operations
    'team',           -- User invitations, role changes, removals
    'organization',   -- Org settings, creation, deletion
    'department',     -- Dept settings, creation, archival
    'submission',     -- Firm submission workflow
    'representation', -- Public representation handling
    'settings',       -- Configuration changes
    'security'        -- Security events, permission changes
  )),

  -- Resource Affected
  resource_type TEXT, -- 'notice', 'template', 'user', 'department', etc.
  resource_id UUID,   -- ID of affected resource

  -- Change Details
  old_values JSONB,   -- Previous state (for updates/deletes)
  new_values JSONB,   -- New state (for creates/updates)
  metadata JSONB,     -- Additional context-specific data

  -- Request Info
  ip_address INET,
  user_agent TEXT,

  -- Timestamp (immutable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Severity
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical'))
);

-- Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_audit_org ON public.audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_dept ON public.audit_logs(department_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_category ON public.audit_logs(action_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON public.audit_logs(severity, created_at DESC)
  WHERE severity IN ('warning', 'critical');
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_org_category ON public.audit_logs(organization_id, action_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_dept_category ON public.audit_logs(department_id, action_category, created_at DESC);

-- ============================================================================
-- PREVENT AUDIT LOG MODIFICATIONS (Append-only enforcement)
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();

-- ============================================================================
-- AUTOMATIC AUDIT LOGGING FUNCTIONS
-- ============================================================================

-- Generic audit log creator
CREATE OR REPLACE FUNCTION create_audit_log(
  p_organization_id UUID,
  p_department_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_action_category TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
  user_email_snapshot TEXT;
BEGIN
  -- Get user email snapshot
  SELECT email INTO user_email_snapshot FROM auth.users WHERE id = p_user_id;

  INSERT INTO public.audit_logs (
    organization_id,
    department_id,
    user_id,
    user_email,
    action,
    action_category,
    resource_type,
    resource_id,
    old_values,
    new_values,
    metadata,
    severity
  ) VALUES (
    p_organization_id,
    p_department_id,
    p_user_id,
    user_email_snapshot,
    p_action,
    p_action_category,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    p_metadata,
    p_severity
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUTO-AUDIT TRIGGERS FOR KEY TABLES
-- ============================================================================

-- Audit notice changes
CREATE OR REPLACE FUNCTION audit_notice_changes()
RETURNS TRIGGER AS $$
DECLARE
  action_name TEXT;
  old_vals JSONB;
  new_vals JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_name := 'notice.created';
    new_vals := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := 'notice.updated';
    old_vals := to_jsonb(OLD);
    new_vals := to_jsonb(NEW);

    -- Specific actions for status changes
    IF NEW.status != OLD.status THEN
      action_name := 'notice.status_changed';
      new_vals := jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_name := 'notice.deleted';
    old_vals := to_jsonb(OLD);
  END IF;

  PERFORM create_audit_log(
    COALESCE(NEW.organization_id, OLD.organization_id),
    COALESCE(NEW.department_id, OLD.department_id),
    COALESCE(NEW.created_by, OLD.created_by),
    action_name,
    'notice',
    'notice',
    COALESCE(NEW.id, OLD.id),
    old_vals,
    new_vals,
    NULL,
    'info'
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notices_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.notices
  FOR EACH ROW
  EXECUTE FUNCTION audit_notice_changes();

-- Audit membership changes
CREATE OR REPLACE FUNCTION audit_dept_membership_changes()
RETURNS TRIGGER AS $$
DECLARE
  action_name TEXT;
  dept_org_id UUID;
BEGIN
  -- Get organization ID from department
  SELECT organization_id INTO dept_org_id
  FROM public.departments
  WHERE id = COALESCE(NEW.department_id, OLD.department_id);

  IF TG_OP = 'INSERT' THEN
    action_name := 'team.member_added';
  ELSIF TG_OP = 'UPDATE' AND NEW.role != OLD.role THEN
    action_name := 'team.role_changed';
  ELSIF TG_OP = 'DELETE' THEN
    action_name := 'team.member_removed';
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  PERFORM create_audit_log(
    dept_org_id,
    COALESCE(NEW.department_id, OLD.department_id),
    COALESCE(NEW.invited_by, OLD.invited_by),
    action_name,
    'team',
    'department_membership',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    jsonb_build_object('affected_user_id', COALESCE(NEW.user_id, OLD.user_id)),
    'info'
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dept_memberships_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.department_memberships
  FOR EACH ROW
  EXECUTE FUNCTION audit_dept_membership_changes();

-- Audit organization changes
CREATE OR REPLACE FUNCTION audit_organization_changes()
RETURNS TRIGGER AS $$
DECLARE
  action_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_name := 'organization.created';
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := 'organization.updated';
    IF NEW.status != OLD.status THEN
      action_name := 'organization.status_changed';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_name := 'organization.deleted';
  END IF;

  PERFORM create_audit_log(
    COALESCE(NEW.id, OLD.id),
    NULL,
    COALESCE(NEW.created_by, OLD.created_by),
    action_name,
    'organization',
    'organization',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    NULL,
    CASE WHEN TG_OP = 'DELETE' THEN 'warning' ELSE 'info' END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION audit_organization_changes();

-- Audit department changes
CREATE OR REPLACE FUNCTION audit_department_changes()
RETURNS TRIGGER AS $$
DECLARE
  action_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_name := 'department.created';
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := 'department.updated';
    IF NEW.status != OLD.status THEN
      action_name := 'department.status_changed';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_name := 'department.deleted';
  END IF;

  PERFORM create_audit_log(
    COALESCE(NEW.organization_id, OLD.organization_id),
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.created_by, OLD.created_by),
    action_name,
    'department',
    'department',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    NULL,
    CASE WHEN TG_OP = 'DELETE' THEN 'warning' ELSE 'info' END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER departments_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION audit_department_changes();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get recent activity for organization
CREATE OR REPLACE FUNCTION get_recent_activity(
  p_organization_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  action TEXT,
  action_category TEXT,
  user_email TEXT,
  resource_type TEXT,
  created_at TIMESTAMPTZ,
  metadata JSONB
) AS $$
  SELECT
    id,
    action,
    action_category,
    user_email,
    resource_type,
    created_at,
    metadata
  FROM public.audit_logs
  WHERE organization_id = p_organization_id
  ORDER BY created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$ LANGUAGE SQL STABLE;

-- Get audit trail for specific resource
CREATE OR REPLACE FUNCTION get_resource_audit_trail(
  p_resource_type TEXT,
  p_resource_id UUID
)
RETURNS TABLE(
  id UUID,
  action TEXT,
  user_email TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ
) AS $$
  SELECT
    id,
    action,
    user_email,
    old_values,
    new_values,
    created_at
  FROM public.audit_logs
  WHERE resource_type = p_resource_type
    AND resource_id = p_resource_id
  ORDER BY created_at ASC;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- RETENTION POLICY FUNCTION
-- ============================================================================
-- Archive old audit logs (run as scheduled job)

CREATE OR REPLACE FUNCTION archive_old_audit_logs(p_days_to_keep INTEGER DEFAULT 365)
RETURNS TABLE(archived_count INTEGER) AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- In production, you'd move to an archive table instead of DELETE
  -- For now, we keep all logs (no deletion)

  -- This is a placeholder for future archival strategy
  -- Example: Move logs older than p_days_to_keep to audit_logs_archive table

  RETURN QUERY SELECT 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.audit_logs IS 'Append-only immutable audit trail for all significant actions - cannot be modified or deleted';

COMMENT ON COLUMN public.audit_logs.action IS 'Specific action performed (e.g., notice.published, user.invited)';
COMMENT ON COLUMN public.audit_logs.action_category IS 'High-level category for filtering (auth, notice, team, etc.)';
COMMENT ON COLUMN public.audit_logs.user_email IS 'Snapshot of user email at time of action (preserved even if user deleted)';
COMMENT ON COLUMN public.audit_logs.old_values IS 'Previous state for updates/deletes';
COMMENT ON COLUMN public.audit_logs.new_values IS 'New state for creates/updates';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional context-specific information';
COMMENT ON COLUMN public.audit_logs.severity IS 'info: normal operation, warning: notable event, critical: security/compliance issue';

COMMENT ON FUNCTION create_audit_log IS 'Creates audit log entry with standardized format';
COMMENT ON FUNCTION get_recent_activity IS 'Returns recent audit log entries for an organization';
COMMENT ON FUNCTION get_resource_audit_trail IS 'Returns complete audit trail for a specific resource';

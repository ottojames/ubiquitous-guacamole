-- FIX C3: Audit trigger fix for NULL department_id
-- The audit_notice_changes trigger captures notice changes but if the notice
-- has NULL department_id, the audit entry also has NULL, making it invisible
-- to department-filtered queries.

-- Update the trigger to resolve department_id from organization if not set

CREATE OR REPLACE FUNCTION audit_notice_changes()
RETURNS TRIGGER AS $$
DECLARE
  action_name TEXT;
  old_vals JSONB;
  new_vals JSONB;
  resolved_dept_id UUID;
  resolved_org_id UUID;
BEGIN
  -- Resolve organization_id
  resolved_org_id := COALESCE(NEW.organization_id, OLD.organization_id);

  -- Resolve department_id - first try the notice, then look up from organization
  resolved_dept_id := COALESCE(NEW.department_id, OLD.department_id);

  IF resolved_dept_id IS NULL AND resolved_org_id IS NOT NULL THEN
    -- Look up default licensing department for this organization
    SELECT id INTO resolved_dept_id
    FROM public.departments
    WHERE organization_id = resolved_org_id
      AND type = 'licensing'
    LIMIT 1;
  END IF;

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
    resolved_org_id,
    resolved_dept_id,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update the AuditLog component to query by organization_id as fallback
-- This is handled in the unified_audit_logs view, but let's also ensure
-- the base audit_logs RLS allows reads by organization membership

-- Grant read access to audit_logs for organization members
DROP POLICY IF EXISTS "Organization members can view audit logs" ON public.audit_logs;
CREATE POLICY "Organization members can view audit logs" ON public.audit_logs
  FOR SELECT
  USING (
    -- User is member of the organization
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
    )
    OR
    -- User is member of the department
    department_id IN (
      SELECT department_id FROM public.department_memberships WHERE user_id = auth.uid()
    )
    OR
    -- Allow service role to read all
    auth.role() = 'service_role'
  );

-- Also ensure inserts work with SECURITY DEFINER functions
-- The create_audit_log function already has SECURITY DEFINER but let's verify
-- it can insert regardless of RLS

-- Add insert policy for the audit system
DROP POLICY IF EXISTS "Audit system can insert logs" ON public.audit_logs;
CREATE POLICY "Audit system can insert logs" ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);  -- Allow all inserts (controlled by SECURITY DEFINER functions)

-- Enable RLS if not already enabled
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

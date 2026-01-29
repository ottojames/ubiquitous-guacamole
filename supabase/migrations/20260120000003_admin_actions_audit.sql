-- Enhanced audit logging for admin actions
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Admin context
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  admin_role TEXT NOT NULL,

  -- Action details
  action TEXT NOT NULL, -- e.g., 'account.suspended', 'notice.deleted'
  action_category TEXT NOT NULL CHECK (action_category IN (
    'account_management',
    'notice_moderation',
    'user_management',
    'system_config',
    'security',
    'billing'
  )),

  -- Target resource
  target_type TEXT NOT NULL, -- 'organization', 'department', 'user', 'notice'
  target_id UUID,
  target_identifier TEXT, -- Human-readable identifier

  -- Change tracking
  old_values JSONB,
  new_values JSONB,
  reason TEXT,

  -- Request context
  ip_address INET NOT NULL,
  user_agent TEXT,
  session_id UUID REFERENCES public.admin_sessions(id) ON DELETE SET NULL,

  -- Severity
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),

  -- Timestamp (immutable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_actions_admin_user ON public.admin_actions(admin_user_id, created_at DESC);
CREATE INDEX idx_admin_actions_category ON public.admin_actions(action_category, created_at DESC);
CREATE INDEX idx_admin_actions_target ON public.admin_actions(target_type, target_id);
CREATE INDEX idx_admin_actions_severity ON public.admin_actions(severity, created_at DESC);
CREATE INDEX idx_admin_actions_created ON public.admin_actions(created_at DESC);

-- Enable RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Admin actions readable by service role only"
  ON public.admin_actions
  FOR SELECT
  TO service_role
  USING (true);

-- Prevent modification
CREATE OR REPLACE FUNCTION prevent_admin_action_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Admin actions are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_actions_immutable
  BEFORE UPDATE OR DELETE ON public.admin_actions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_action_modification();

-- Helper function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_user_id UUID,
  p_action TEXT,
  p_action_category TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_target_identifier TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_session_id UUID DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
  action_id UUID;
  admin_email_val TEXT;
  admin_role_val TEXT;
BEGIN
  -- Get admin details
  SELECT email, role INTO admin_email_val, admin_role_val
  FROM public.admin_users
  WHERE id = p_admin_user_id;

  INSERT INTO public.admin_actions (
    admin_user_id, admin_email, admin_role, action, action_category,
    target_type, target_id, target_identifier,
    old_values, new_values, reason,
    ip_address, session_id, severity
  ) VALUES (
    p_admin_user_id, admin_email_val, admin_role_val, p_action, p_action_category,
    p_target_type, p_target_id, p_target_identifier,
    p_old_values, p_new_values, p_reason,
    p_ip_address, p_session_id, p_severity
  ) RETURNING id INTO action_id;

  RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.admin_actions IS 'Immutable audit trail of all admin panel actions';
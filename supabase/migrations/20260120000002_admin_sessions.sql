-- Admin session tracking for enhanced security
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,

  -- Session details
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET NOT NULL,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '2 hours',
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  terminated_at TIMESTAMPTZ,

  -- Termination reason
  termination_reason TEXT CHECK (termination_reason IN ('logout', 'timeout', 'security', 'admin_action'))
);

-- Indexes
CREATE INDEX idx_admin_sessions_admin_user ON public.admin_sessions(admin_user_id);
CREATE INDEX idx_admin_sessions_token ON public.admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_expires ON public.admin_sessions(expires_at) WHERE terminated_at IS NULL;

-- Enable RLS
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role
CREATE POLICY "Admin sessions manageable by service role only"
  ON public.admin_sessions
  FOR ALL
  TO service_role
  USING (true);

-- Function to validate admin session
CREATE OR REPLACE FUNCTION public.validate_admin_session(p_session_token TEXT)
RETURNS TABLE(
  admin_user_id UUID,
  user_id UUID,
  email TEXT,
  role TEXT,
  two_factor_enabled BOOLEAN
) AS $$
BEGIN
  -- Update last activity
  UPDATE public.admin_sessions
  SET last_activity_at = NOW()
  WHERE session_token = p_session_token
    AND terminated_at IS NULL
    AND expires_at > NOW();

  -- Return admin user details
  RETURN QUERY
  SELECT
    au.id,
    au.user_id,
    au.email,
    au.role,
    au.two_factor_enabled
  FROM public.admin_sessions s
  JOIN public.admin_users au ON s.admin_user_id = au.id
  WHERE s.session_token = p_session_token
    AND s.terminated_at IS NULL
    AND s.expires_at > NOW()
    AND au.status = 'active'
    AND (au.locked_until IS NULL OR au.locked_until < NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE public.admin_sessions
  SET terminated_at = NOW(),
      termination_reason = 'timeout'
  WHERE terminated_at IS NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.admin_sessions IS 'Admin session tracking with 2-hour timeout';
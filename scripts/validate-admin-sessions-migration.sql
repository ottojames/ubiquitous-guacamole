-- Test script to validate SQL syntax
-- This would fail if there are syntax errors

BEGIN;

-- Simulate the admin_users table exists
CREATE TEMP TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  locked_until TIMESTAMPTZ
);

-- Now test our migration SQL
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '2 hours',
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  terminated_at TIMESTAMPTZ,
  termination_reason TEXT CHECK (termination_reason IN ('logout', 'timeout', 'security', 'admin_action'))
);

-- Test indexes can be created
CREATE INDEX idx_admin_sessions_admin_user ON admin_sessions(admin_user_id);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at) WHERE terminated_at IS NULL;

-- Rollback - don't actually create anything
ROLLBACK;
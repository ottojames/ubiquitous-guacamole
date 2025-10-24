-- Migration: Direct Publishing Flow (Phase 5)
-- Description: Add firm tracking to notices and enable direct publishing workflow
-- Author: Claude Code Assistant
-- Date: 2025-10-22

-- =============================================================================
-- 1. Add firm/publisher tracking to notices table
-- =============================================================================

-- Add columns for tracking who published the notice
ALTER TABLE notices
  ADD COLUMN IF NOT EXISTS published_by_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS published_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Add billing tracking columns
ALTER TABLE notices
  ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'pending' CHECK (billing_status IN ('pending', 'paid', 'overdue', 'waived')),
  ADD COLUMN IF NOT EXISTS billing_amount DECIMAL(10,2);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notices_published_by_org
  ON notices(published_by_organization_id)
  WHERE published_by_organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notices_council_dept
  ON notices(organization_id, department_id);

CREATE INDEX IF NOT EXISTS idx_notices_billing_status
  ON notices(billing_status)
  WHERE billing_status = 'pending';

-- Add comments for clarity
COMMENT ON COLUMN notices.published_by_organization_id IS 'Firm that published this notice (NULL if published by council directly)';
COMMENT ON COLUMN notices.published_by_user_id IS 'User who published this notice';
COMMENT ON COLUMN notices.organization_id IS 'Target council (licensing authority)';
COMMENT ON COLUMN notices.department_id IS 'Target department within council';
COMMENT ON COLUMN notices.client_id IS 'Client reference (for firm use)';
COMMENT ON COLUMN notices.billing_status IS 'Payment status for this notice';
COMMENT ON COLUMN notices.billing_amount IS 'Cost to publish this notice';

-- =============================================================================
-- 2. Create notice access tokens table (for magic links)
-- =============================================================================

CREATE TABLE IF NOT EXISTS notice_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Token details
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,

  -- Expiry
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,

  -- Usage tracking
  created_for UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_used_at TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notice_access_tokens_token ON notice_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_notice_access_tokens_notice ON notice_access_tokens(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_access_tokens_expires ON notice_access_tokens(expires_at);

-- Auto-delete expired tokens (runs daily)
CREATE OR REPLACE FUNCTION delete_expired_access_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM notice_access_tokens
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE notice_access_tokens IS 'Magic links for accessing notices without authentication';

-- =============================================================================
-- 3. Update RLS policies for firm/council notice access
-- =============================================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Firms can view own published notices" ON notices;
DROP POLICY IF EXISTS "Councils can view department notices" ON notices;
DROP POLICY IF EXISTS "Firms can publish notices" ON notices;
DROP POLICY IF EXISTS "Public can view published notices" ON notices;

-- Public can view all published notices (unchanged)
CREATE POLICY "Public can view published notices"
  ON notices FOR SELECT
  USING (status = 'published');

-- Firms can view their own published notices
CREATE POLICY "Firms can view own published notices"
  ON notices FOR SELECT
  USING (
    published_by_organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Councils can view notices published to their departments
CREATE POLICY "Councils can view department notices"
  ON notices FOR SELECT
  USING (
    department_id IN (
      SELECT department_id FROM department_memberships
      WHERE user_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'org_admin')
    )
  );

-- Firms can publish notices (insert)
CREATE POLICY "Firms can publish notices"
  ON notices FOR INSERT
  WITH CHECK (
    published_by_organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Firms can update their own draft notices
CREATE POLICY "Firms can update own draft notices"
  ON notices FOR UPDATE
  USING (
    published_by_organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
    AND status = 'draft'
  );

-- Councils can update notices in their departments
CREATE POLICY "Councils can update department notices"
  ON notices FOR UPDATE
  USING (
    department_id IN (
      SELECT department_id FROM department_memberships
      WHERE user_id = auth.uid()
      AND role IN ('editor', 'admin', 'owner')
    )
  );

-- =============================================================================
-- 4. Create function to generate secure access tokens
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_notice_access_token(
  p_notice_id UUID,
  p_user_id UUID,
  p_expires_days INTEGER DEFAULT 90
)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate a secure random token (32 characters)
  v_token := encode(gen_random_bytes(24), 'base64');
  v_token := replace(v_token, '/', '_');
  v_token := replace(v_token, '+', '-');

  -- Insert token
  INSERT INTO notice_access_tokens (
    notice_id,
    token,
    expires_at,
    created_for
  ) VALUES (
    p_notice_id,
    v_token,
    NOW() + (p_expires_days || ' days')::INTERVAL,
    p_user_id
  );

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_notice_access_token IS 'Generate a secure magic link token for notice access';

-- =============================================================================
-- 5. Create function to verify access tokens
-- =============================================================================

CREATE OR REPLACE FUNCTION verify_notice_access_token(
  p_token TEXT
)
RETURNS UUID AS $$
DECLARE
  v_notice_id UUID;
BEGIN
  -- Find valid token and return notice_id
  SELECT notice_id INTO v_notice_id
  FROM notice_access_tokens
  WHERE token = p_token
    AND expires_at > NOW();

  -- Update usage tracking
  IF v_notice_id IS NOT NULL THEN
    UPDATE notice_access_tokens
    SET
      last_used_at = NOW(),
      use_count = use_count + 1
    WHERE token = p_token;
  END IF;

  RETURN v_notice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION verify_notice_access_token IS 'Verify a magic link token and return the notice ID if valid';

-- =============================================================================
-- 6. Enable RLS on notice_access_tokens
-- =============================================================================

ALTER TABLE notice_access_tokens ENABLE ROW LEVEL SECURITY;

-- Only the system can manage tokens (no direct user access)
-- Tokens are created/verified via functions only

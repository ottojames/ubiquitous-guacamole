-- Migration: Add all showcase narration features
-- Date: 2025-11-22
-- Purpose: Implement Segment 3 & 4 features (approval workflow, analytics, audit log)

-- ============================================================================
-- SEGMENT 3: Council Officer Features
-- ============================================================================

-- 1. Add approval workflow columns to notices
ALTER TABLE notices
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')) DEFAULT 'auto_approved';

-- Create index for pending submissions queries
CREATE INDEX IF NOT EXISTS idx_notices_approval_status ON notices(approval_status, department_id);
CREATE INDEX IF NOT EXISTS idx_notices_submitted_at ON notices(submitted_at);

-- 2. Add read/unread tracking to representations
ALTER TABLE representations
ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS first_read_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;

-- Create index for unread representations
CREATE INDEX IF NOT EXISTS idx_representations_read_by ON representations USING GIN(read_by);

-- Function to mark representation as read
CREATE OR REPLACE FUNCTION mark_representation_read(
  representation_id UUID,
  user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE representations
  SET
    read_by = array_append(read_by, user_id),
    first_read_at = COALESCE(first_read_at, NOW()),
    last_read_at = NOW()
  WHERE id = representation_id
    AND NOT (user_id = ANY(read_by));
END;
$$;

-- ============================================================================
-- SEGMENT 4: Analytics & Audit Features
-- ============================================================================

-- 3. Create audit_actions table for full audit log
CREATE TABLE IF NOT EXISTS audit_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  actor_email TEXT,
  actor_role TEXT,
  organization_id UUID REFERENCES organizations(id),
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_actions_actor ON audit_actions(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actions_organization ON audit_actions(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actions_resource ON audit_actions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_actions_type ON audit_actions(action_type, created_at DESC);

-- Function to log audit action
CREATE OR REPLACE FUNCTION log_audit_action(
  p_action_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_actions (
    actor_id,
    actor_email,
    action_type,
    resource_type,
    resource_id,
    metadata
  ) VALUES (
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_metadata
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$;

-- 4. Add analytics helper views

-- View: Notice approval times by department
CREATE OR REPLACE VIEW notice_approval_times AS
SELECT
  n.department_id,
  d.name as department_name,
  COUNT(*) as total_notices,
  AVG(EXTRACT(EPOCH FROM (n.reviewed_at - n.submitted_at)) / 86400) as avg_approval_days,
  MIN(EXTRACT(EPOCH FROM (n.reviewed_at - n.submitted_at)) / 86400) as min_approval_days,
  MAX(EXTRACT(EPOCH FROM (n.reviewed_at - n.submitted_at)) / 86400) as max_approval_days
FROM notices n
LEFT JOIN departments d ON n.department_id = d.id
WHERE n.approval_status = 'approved'
  AND n.reviewed_at IS NOT NULL
  AND n.submitted_at IS NOT NULL
GROUP BY n.department_id, d.name;

-- View: Deadline adherence tracking
CREATE OR REPLACE VIEW deadline_adherence AS
SELECT
  n.department_id,
  d.name as department_name,
  COUNT(*) as total_notices,
  COUNT(*) FILTER (WHERE n.published_at <= n.application_date + INTERVAL '28 days') as within_deadline,
  COUNT(*) FILTER (WHERE n.published_at > n.application_date + INTERVAL '28 days') as overdue,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE n.published_at <= n.application_date + INTERVAL '28 days') / NULLIF(COUNT(*), 0),
    1
  ) as adherence_percentage
FROM notices n
LEFT JOIN departments d ON n.department_id = d.id
WHERE n.status = 'published'
  AND n.published_at IS NOT NULL
  AND n.application_date IS NOT NULL
GROUP BY n.department_id, d.name;

-- View: Engagement rate (notices with representations)
CREATE OR REPLACE VIEW engagement_rate AS
SELECT
  n.council_id,
  c.name as council_name,
  COUNT(DISTINCT n.id) as total_notices,
  COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN n.id END) as notices_with_reps,
  COUNT(r.id) as total_representations,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN n.id END) / NULLIF(COUNT(DISTINCT n.id), 0),
    1
  ) as engagement_percentage
FROM notices n
LEFT JOIN councils c ON n.council_id = c.id
LEFT JOIN representations r ON r.notice_id = n.id
WHERE n.status = 'published'
GROUP BY n.council_id, c.name;

-- Function: Get analytics for date range
CREATE OR REPLACE FUNCTION get_analytics_for_period(
  p_organization_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_notices', COUNT(*),
    'active_notices', COUNT(*) FILTER (WHERE status = 'published' AND reps_deadline > NOW()),
    'total_representations', (
      SELECT COUNT(*)
      FROM representations r
      WHERE r.notice_id IN (SELECT id FROM notices WHERE council_id = p_organization_id)
    ),
    'notices_by_department', (
      SELECT jsonb_object_agg(d.name, dept_counts.count)
      FROM (
        SELECT department_id, COUNT(*) as count
        FROM notices
        WHERE council_id = p_organization_id
          AND published_at BETWEEN p_start_date AND p_end_date
        GROUP BY department_id
      ) dept_counts
      LEFT JOIN departments d ON d.id = dept_counts.department_id
    ),
    'avg_approval_time_days', (
      SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - submitted_at)) / 86400)
      FROM notices
      WHERE council_id = p_organization_id
        AND reviewed_at BETWEEN p_start_date AND p_end_date
        AND approval_status = 'approved'
    ),
    'deadline_adherence_rate', (
      SELECT ROUND(
        100.0 * COUNT(*) FILTER (WHERE published_at <= application_date + INTERVAL '28 days') / NULLIF(COUNT(*), 0),
        1
      )
      FROM notices
      WHERE council_id = p_organization_id
        AND published_at BETWEEN p_start_date AND p_end_date
    ),
    'engagement_rate', (
      SELECT ROUND(
        100.0 * COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN n.id END) / NULLIF(COUNT(DISTINCT n.id), 0),
        1
      )
      FROM notices n
      LEFT JOIN representations r ON r.notice_id = n.id
      WHERE n.council_id = p_organization_id
        AND n.published_at BETWEEN p_start_date AND p_end_date
    )
  ) INTO v_result
  FROM notices
  WHERE council_id = p_organization_id
    AND published_at BETWEEN p_start_date AND p_end_date;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Audit actions: Organizations can only see their own audit log
ALTER TABLE audit_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_actions_select_policy ON audit_actions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM memberships
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS FOR AUTO AUDIT LOGGING
-- ============================================================================

-- Trigger: Log notice approval/rejection
CREATE OR REPLACE FUNCTION log_notice_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (OLD.approval_status IS DISTINCT FROM NEW.approval_status) THEN
    PERFORM log_audit_action(
      'notice_' || NEW.approval_status,
      'notice',
      NEW.id,
      jsonb_build_object(
        'previous_status', OLD.approval_status,
        'new_status', NEW.approval_status,
        'reviewed_by', NEW.reviewed_by
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notice_review_audit_trigger ON notices;
CREATE TRIGGER notice_review_audit_trigger
  AFTER UPDATE ON notices
  FOR EACH ROW
  WHEN (OLD.approval_status IS DISTINCT FROM NEW.approval_status)
  EXECUTE FUNCTION log_notice_review();

-- Trigger: Log representation submissions
CREATE OR REPLACE FUNCTION log_representation_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM log_audit_action(
    'representation_submitted',
    'representation',
    NEW.id,
    jsonb_build_object(
      'notice_id', NEW.notice_id,
      'type', NEW.type,
      'representor_name', NEW.representor_name
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS representation_submission_audit_trigger ON representations;
CREATE TRIGGER representation_submission_audit_trigger
  AFTER INSERT ON representations
  FOR EACH ROW
  EXECUTE FUNCTION log_representation_submission();

-- ============================================================================
-- SEED DATA FOR DEMO
-- ============================================================================

-- Set submitted_at for existing notices (backfill)
UPDATE notices
SET submitted_at = published_at - INTERVAL '2 days',
    reviewed_at = published_at - INTERVAL '1 day',
    approval_status = 'approved'
WHERE status = 'published'
  AND submitted_at IS NULL;

-- Mark some representations as read by Westminster officers
UPDATE representations
SET
  read_by = ARRAY[(SELECT id FROM auth.users WHERE email LIKE '%westminster%' LIMIT 1)]::UUID[],
  first_read_at = submitted_at + INTERVAL '1 hour',
  last_read_at = submitted_at + INTERVAL '3 hours'
WHERE notice_id IN (
  SELECT id FROM notices
  WHERE council_id = '02cb9c23-92bb-4f51-9e1a-30698dccffb6'
  LIMIT 10
);

COMMENT ON COLUMN notices.approval_status IS 'Workflow status: pending (awaiting council review), approved (council approved), rejected (council rejected), auto_approved (published directly by council)';
COMMENT ON COLUMN notices.submitted_at IS 'When the notice was submitted for review (for approval workflow tracking)';
COMMENT ON COLUMN notices.reviewed_at IS 'When the council officer approved/rejected the notice';
COMMENT ON COLUMN representations.read_by IS 'Array of user IDs who have read this representation';
COMMENT ON TABLE audit_actions IS 'Full audit log of all actions taken in the system for compliance and transparency';

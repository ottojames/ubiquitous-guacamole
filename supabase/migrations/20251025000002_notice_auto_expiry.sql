-- Notice Auto-Expiry Migration
-- Automatically expires notices when their representation deadline passes

-- ============================================================================
-- AUTO-EXPIRY FUNCTION
-- ============================================================================

-- Function to expire notices that have passed their representation deadline
CREATE OR REPLACE FUNCTION expire_overdue_notices()
RETURNS TABLE(
  notice_id UUID,
  title TEXT,
  previous_status TEXT,
  expired_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH expired_notices AS (
    UPDATE public.notices
    SET
      status = 'expired',
      updated_at = NOW()
    WHERE
      status = 'published'
      AND representation_deadline IS NOT NULL
      AND representation_deadline < NOW()
    RETURNING id, title, 'published'::TEXT as prev_status, NOW() as exp_at
  )
  SELECT * FROM expired_notices;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ============================================================================
-- SCHEDULED JOB (pg_cron extension required in production)
-- ============================================================================

-- Note: This requires the pg_cron extension to be enabled in Supabase
-- In development, this will need to be called manually or via an API endpoint

-- Example scheduled job (requires pg_cron extension):
-- SELECT cron.schedule(
--   'expire-overdue-notices',
--   '*/5 * * * *', -- Every 5 minutes
--   $$ SELECT expire_overdue_notices() $$
-- );

-- ============================================================================
-- HELPER FUNCTIONS FOR EXPIRY CHECKS
-- ============================================================================

-- Check if a notice should be expired (deadline passed)
CREATE OR REPLACE FUNCTION should_notice_be_expired(p_notice_id UUID)
RETURNS BOOLEAN AS $$
  SELECT
    status = 'published'
    AND representation_deadline IS NOT NULL
    AND representation_deadline < NOW()
  FROM public.notices
  WHERE id = p_notice_id;
$$ LANGUAGE SQL STABLE;

-- Get count of notices that need to be expired
CREATE OR REPLACE FUNCTION get_overdue_notice_count()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.notices
  WHERE
    status = 'published'
    AND representation_deadline IS NOT NULL
    AND representation_deadline < NOW();
$$ LANGUAGE SQL STABLE;

-- Check if representation is late (submitted after deadline)
CREATE OR REPLACE FUNCTION check_representation_timeliness(p_representation_id UUID)
RETURNS TABLE(
  is_late BOOLEAN,
  deadline TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  hours_late NUMERIC
) AS $$
  SELECT
    r.submitted_at > n.representation_deadline as is_late,
    n.representation_deadline as deadline,
    r.submitted_at,
    CASE
      WHEN n.representation_deadline IS NULL THEN NULL
      WHEN r.submitted_at <= n.representation_deadline THEN 0
      ELSE EXTRACT(EPOCH FROM (r.submitted_at - n.representation_deadline)) / 3600
    END as hours_late
  FROM public.representations r
  JOIN public.notices n ON r.notice_id = n.id
  WHERE r.id = p_representation_id;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- TRIGGER TO ADD EXPIRY EVENTS TO AUDIT LOG
-- ============================================================================

-- Create trigger to log when notices are auto-expired
CREATE OR REPLACE FUNCTION log_notice_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'expired' AND OLD.status != 'expired' THEN
    -- Insert audit log entry
    INSERT INTO public.audit_logs (
      organization_id,
      user_id,
      action,
      resource_type,
      resource_id,
      details
    )
    SELECT
      n.organization_id,
      NULL, -- System action, no specific user
      'notice.expired',
      'notice',
      NEW.id,
      jsonb_build_object(
        'previous_status', OLD.status,
        'representation_deadline', OLD.representation_deadline,
        'auto_expired', true,
        'expired_at', NOW()
      )
    FROM public.notices n
    WHERE n.id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notices_log_expiry
  AFTER UPDATE ON public.notices
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'expired')
  EXECUTE FUNCTION log_notice_expiry();

-- ============================================================================
-- VALIDATION: Prevent late representations (optional - disabled by default)
-- ============================================================================

-- This function can be enabled to completely block late representations
-- Currently representations_check_deadline in the previous migration already prevents this

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION expire_overdue_notices IS 'Expires all published notices whose representation deadline has passed. Returns list of expired notices.';
COMMENT ON FUNCTION should_notice_be_expired IS 'Checks if a specific notice should be auto-expired';
COMMENT ON FUNCTION get_overdue_notice_count IS 'Returns count of notices that need expiry';
COMMENT ON FUNCTION check_representation_timeliness IS 'Returns details about whether a representation was submitted late';
COMMENT ON FUNCTION log_notice_expiry IS 'Automatically logs expiry events to audit_logs table';

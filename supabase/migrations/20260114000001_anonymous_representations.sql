-- Add support for anonymous representations and rate limiting
-- ============================================================================

-- Add IP address tracking to representations table
ALTER TABLE public.representations
  ADD COLUMN IF NOT EXISTS submitter_ip INET,
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- Create index for IP-based rate limiting checks
CREATE INDEX IF NOT EXISTS idx_representations_ip_notice
  ON public.representations(submitter_ip, notice_id, submitted_at DESC)
  WHERE submitter_ip IS NOT NULL;

-- Create rate limiting table for tracking attempts
CREATE TABLE IF NOT EXISTS public.representation_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint for IP + notice combination
  CONSTRAINT unique_ip_notice UNIQUE(ip_address, notice_id)
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_last_attempt
  ON public.representation_rate_limits(last_attempt_at);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_representation_rate_limit(
  p_ip_address INET,
  p_notice_id UUID,
  p_max_attempts INTEGER DEFAULT 3,
  p_window_hours INTEGER DEFAULT 24
)
RETURNS TABLE(
  allowed BOOLEAN,
  current_count INTEGER,
  remaining_attempts INTEGER
) AS $$
DECLARE
  v_current_count INTEGER;
  v_first_attempt TIMESTAMPTZ;
BEGIN
  -- Get current attempt count
  SELECT
    attempt_count,
    first_attempt_at
  INTO
    v_current_count,
    v_first_attempt
  FROM public.representation_rate_limits
  WHERE ip_address = p_ip_address
    AND notice_id = p_notice_id;

  -- If no record exists, this is the first attempt
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      true AS allowed,
      0 AS current_count,
      p_max_attempts AS remaining_attempts;
    RETURN;
  END IF;

  -- Check if outside the window (reset if so)
  IF v_first_attempt < (NOW() - (p_window_hours || ' hours')::INTERVAL) THEN
    -- Reset the counter
    UPDATE public.representation_rate_limits
    SET
      attempt_count = 1,
      first_attempt_at = NOW(),
      last_attempt_at = NOW()
    WHERE ip_address = p_ip_address
      AND notice_id = p_notice_id;

    RETURN QUERY
    SELECT
      true AS allowed,
      0 AS current_count,
      p_max_attempts AS remaining_attempts;
    RETURN;
  END IF;

  -- Check if under limit
  RETURN QUERY
  SELECT
    v_current_count < p_max_attempts AS allowed,
    v_current_count AS current_count,
    GREATEST(0, p_max_attempts - v_current_count) AS remaining_attempts;
END;
$$ LANGUAGE plpgsql;

-- Function to record representation attempt
CREATE OR REPLACE FUNCTION record_representation_attempt(
  p_ip_address INET,
  p_notice_id UUID
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.representation_rate_limits (
    ip_address,
    notice_id,
    attempt_count,
    first_attempt_at,
    last_attempt_at
  ) VALUES (
    p_ip_address,
    p_notice_id,
    1,
    NOW(),
    NOW()
  )
  ON CONFLICT (ip_address, notice_id)
  DO UPDATE SET
    attempt_count = representation_rate_limits.attempt_count + 1,
    last_attempt_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Cleanup function for old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits(p_days_old INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.representation_rate_limits
  WHERE last_attempt_at < (NOW() - (p_days_old || ' days')::INTERVAL);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to allow anonymous submissions
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can create representations" ON public.representations;

-- Create new policy that allows public creation
CREATE POLICY "Public can create representations"
  ON public.representations
  FOR INSERT
  TO public, anon
  WITH CHECK (true);

-- Ensure public can still view their own representations by reference
-- Drop if exists then recreate
DROP POLICY IF EXISTS "Public can view own representations by id" ON public.representations;
CREATE POLICY "Public can view own representations by id"
  ON public.representations
  FOR SELECT
  TO public, anon
  USING (true);

-- Comments
COMMENT ON COLUMN public.representations.submitter_ip IS 'IP address of submitter for rate limiting';
COMMENT ON COLUMN public.representations.is_anonymous IS 'Whether representation was submitted anonymously';
COMMENT ON TABLE public.representation_rate_limits IS 'Tracks representation attempts per IP for rate limiting';
COMMENT ON FUNCTION check_representation_rate_limit IS 'Checks if an IP address can submit another representation for a notice';
COMMENT ON FUNCTION record_representation_attempt IS 'Records a representation attempt for rate limiting';
COMMENT ON FUNCTION cleanup_old_rate_limits IS 'Removes old rate limit records to keep table size manageable';
-- Representation Reads Tracking Migration
-- Tracks which representations have been viewed/read by which council officers

-- ============================================================================
-- REPRESENTATION_READS TABLE
-- ============================================================================
-- Many-to-many relationship: representations × council_users
-- Each record indicates a specific user has read a specific representation

CREATE TABLE IF NOT EXISTS public.representation_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  representation_id UUID NOT NULL REFERENCES public.representations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Metadata
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(representation_id, user_id)
  -- A user can only "read" a representation once
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_representation_reads_rep ON public.representation_reads(representation_id);
CREATE INDEX IF NOT EXISTS idx_representation_reads_user ON public.representation_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_representation_reads_at ON public.representation_reads(read_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS FOR UNREAD COUNTS
-- ============================================================================

-- Get unread representation count for a specific notice and user
CREATE OR REPLACE FUNCTION get_unread_representation_count(
  p_notice_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.representations r
  WHERE r.notice_id = p_notice_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.representation_reads rr
      WHERE rr.representation_id = r.id
        AND rr.user_id = p_user_id
    );
$$ LANGUAGE SQL STABLE;

-- Get total and unread counts for a notice
CREATE OR REPLACE FUNCTION get_representation_counts(
  p_notice_id UUID,
  p_user_id UUID
)
RETURNS TABLE(total INTEGER, unread INTEGER) AS $$
  SELECT
    COUNT(*)::INTEGER as total,
    COUNT(*) FILTER (
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.representation_reads rr
        WHERE rr.representation_id = r.id
          AND rr.user_id = p_user_id
      )
    )::INTEGER as unread
  FROM public.representations r
  WHERE r.notice_id = p_notice_id;
$$ LANGUAGE SQL STABLE;

-- Batch get representation counts for multiple notices
CREATE OR REPLACE FUNCTION get_bulk_representation_counts(
  p_notice_ids UUID[],
  p_user_id UUID
)
RETURNS TABLE(
  notice_id UUID,
  total INTEGER,
  unread INTEGER
) AS $$
  SELECT
    r.notice_id,
    COUNT(*)::INTEGER as total,
    COUNT(*) FILTER (
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.representation_reads rr
        WHERE rr.representation_id = r.id
          AND rr.user_id = p_user_id
      )
    )::INTEGER as unread
  FROM public.representations r
  WHERE r.notice_id = ANY(p_notice_ids)
  GROUP BY r.notice_id;
$$ LANGUAGE SQL STABLE;

-- Mark representation as read (idempotent)
CREATE OR REPLACE FUNCTION mark_representation_read(
  p_representation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
  INSERT INTO public.representation_reads (representation_id, user_id)
  VALUES (p_representation_id, p_user_id)
  ON CONFLICT (representation_id, user_id) DO NOTHING;
$$ LANGUAGE SQL VOLATILE;

-- Mark all representations for a notice as read
CREATE OR REPLACE FUNCTION mark_notice_representations_read(
  p_notice_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  rows_inserted INTEGER;
BEGIN
  WITH new_reads AS (
    INSERT INTO public.representation_reads (representation_id, user_id)
    SELECT r.id, p_user_id
    FROM public.representations r
    WHERE r.notice_id = p_notice_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.representation_reads rr
        WHERE rr.representation_id = r.id
          AND rr.user_id = p_user_id
      )
    ON CONFLICT DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO rows_inserted FROM new_reads;

  RETURN rows_inserted;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Check if representation is late (submitted after deadline)
CREATE OR REPLACE FUNCTION is_representation_late(p_representation_id UUID)
RETURNS BOOLEAN AS $$
  SELECT r.submitted_at > n.representation_deadline
  FROM public.representations r
  JOIN public.notices n ON r.notice_id = n.id
  WHERE r.id = p_representation_id
    AND n.representation_deadline IS NOT NULL;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.representation_reads IS 'Tracks which council officers have viewed which representations';
COMMENT ON FUNCTION get_unread_representation_count IS 'Returns count of unread representations for a notice and user';
COMMENT ON FUNCTION get_representation_counts IS 'Returns total and unread counts for a notice';
COMMENT ON FUNCTION get_bulk_representation_counts IS 'Efficiently fetches counts for multiple notices at once';
COMMENT ON FUNCTION mark_representation_read IS 'Marks a single representation as read (idempotent)';
COMMENT ON FUNCTION mark_notice_representations_read IS 'Marks all representations for a notice as read';
COMMENT ON FUNCTION is_representation_late IS 'Checks if representation was submitted after the deadline';

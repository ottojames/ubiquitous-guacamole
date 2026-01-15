-- Notice Versioning Migration
-- Implements amendment/versioning policy for notices

-- ============================================================================
-- NOTICE_VERSIONS TABLE
-- ============================================================================
-- Tracks all versions of a notice for amendment history and auditability

CREATE TABLE IF NOT EXISTS public.notice_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  parent_version_id UUID REFERENCES public.notice_versions(id) ON DELETE SET NULL,

  -- Version metadata
  version_number INTEGER NOT NULL,
  version_type TEXT NOT NULL CHECK (version_type IN ('original', 'amendment', 'correction', 'republication')),

  -- Snapshot of notice data at this version
  notice_snapshot JSONB NOT NULL,

  -- Changes
  changes_summary TEXT, -- Human-readable summary of what changed
  changes_detail JSONB, -- Structured diff of what changed

  -- Amendment reason and authority
  amendment_reason TEXT, -- Why was this amendment made?
  amendment_authority TEXT, -- Who authorized the amendment?
  statutory_basis TEXT, -- Legal basis for amendment if applicable

  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_email TEXT, -- Snapshot at time of creation

  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT TRUE, -- Current version
  supersedes_at TIMESTAMPTZ, -- When this version supersedes previous

  UNIQUE(notice_id, version_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notice_versions_notice ON public.notice_versions(notice_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_notice_versions_active ON public.notice_versions(notice_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_notice_versions_created ON public.notice_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notice_versions_type ON public.notice_versions(version_type);

-- ============================================================================
-- AMENDMENT LOG TABLE
-- ============================================================================
-- Separate log for amendment requests and approvals

CREATE TABLE IF NOT EXISTS public.notice_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  resulting_version_id UUID REFERENCES public.notice_versions(id) ON DELETE SET NULL,

  -- Amendment request
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
  requested_changes JSONB NOT NULL, -- What changes were requested
  reason TEXT NOT NULL, -- Why is amendment needed

  -- Approval workflow
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_by_email TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by_email TEXT,
  approved_at TIMESTAMPTZ,

  rejection_reason TEXT,

  -- Metadata
  metadata JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_amendments_notice ON public.notice_amendments(notice_id, status);
CREATE INDEX IF NOT EXISTS idx_amendments_status ON public.notice_amendments(status);
CREATE INDEX IF NOT EXISTS idx_amendments_requested ON public.notice_amendments(requested_at DESC);

-- ============================================================================
-- VERSIONING FUNCTIONS
-- ============================================================================

-- Create initial version when notice is created
CREATE OR REPLACE FUNCTION create_initial_notice_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create initial version if notice is published
  IF NEW.status = 'published' AND NEW.published_at IS NOT NULL THEN
    INSERT INTO public.notice_versions (
      notice_id,
      version_number,
      version_type,
      notice_snapshot,
      changes_summary,
      created_by,
      created_by_email,
      is_active,
      supersedes_at
    ) VALUES (
      NEW.id,
      1,
      'original',
      to_jsonb(NEW),
      'Original publication',
      NEW.created_by,
      (SELECT email FROM auth.users WHERE id = NEW.created_by),
      TRUE,
      NEW.published_at
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notice_initial_version
  AFTER INSERT ON public.notices
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_notice_version();

-- Create amendment version
CREATE OR REPLACE FUNCTION create_notice_amendment_version(
  p_notice_id UUID,
  p_changes JSONB,
  p_amendment_reason TEXT,
  p_amendment_authority TEXT,
  p_version_type TEXT DEFAULT 'amendment',
  p_statutory_basis TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_new_version_number INTEGER;
  v_new_version_id UUID;
  v_notice_snapshot JSONB;
  v_creator_email TEXT;
BEGIN
  -- Get current max version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_new_version_number
  FROM public.notice_versions
  WHERE notice_id = p_notice_id;

  -- Get current notice state
  SELECT to_jsonb(n.*) INTO v_notice_snapshot
  FROM public.notices n
  WHERE id = p_notice_id;

  -- Get creator email
  IF p_created_by IS NOT NULL THEN
    SELECT email INTO v_creator_email FROM auth.users WHERE id = p_created_by;
  END IF;

  -- Deactivate previous versions
  UPDATE public.notice_versions
  SET is_active = FALSE
  WHERE notice_id = p_notice_id AND is_active = TRUE;

  -- Create new version
  INSERT INTO public.notice_versions (
    notice_id,
    version_number,
    version_type,
    notice_snapshot,
    changes_summary,
    changes_detail,
    amendment_reason,
    amendment_authority,
    statutory_basis,
    created_by,
    created_by_email,
    is_active,
    supersedes_at
  ) VALUES (
    p_notice_id,
    v_new_version_number,
    p_version_type,
    v_notice_snapshot,
    'Amendment: ' || p_amendment_reason,
    p_changes,
    p_amendment_reason,
    p_amendment_authority,
    p_statutory_basis,
    p_created_by,
    v_creator_email,
    TRUE,
    NOW()
  ) RETURNING id INTO v_new_version_id;

  RETURN v_new_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get version history for a notice
CREATE OR REPLACE FUNCTION get_notice_version_history(p_notice_id UUID)
RETURNS TABLE(
  version_id UUID,
  version_number INTEGER,
  version_type TEXT,
  changes_summary TEXT,
  created_at TIMESTAMPTZ,
  created_by_email TEXT,
  is_active BOOLEAN
) AS $$
  SELECT
    id,
    version_number,
    version_type,
    changes_summary,
    created_at,
    created_by_email,
    is_active
  FROM public.notice_versions
  WHERE notice_id = p_notice_id
  ORDER BY version_number DESC;
$$ LANGUAGE SQL STABLE;

-- Get active version for a notice
CREATE OR REPLACE FUNCTION get_active_notice_version(p_notice_id UUID)
RETURNS TABLE(
  version_id UUID,
  version_number INTEGER,
  version_type TEXT,
  notice_snapshot JSONB,
  created_at TIMESTAMPTZ
) AS $$
  SELECT
    id,
    version_number,
    version_type,
    notice_snapshot,
    created_at
  FROM public.notice_versions
  WHERE notice_id = p_notice_id AND is_active = TRUE
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.notice_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_amendments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published notice versions
CREATE POLICY view_published_notice_versions ON public.notice_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.notices
      WHERE id = notice_versions.notice_id
      AND status = 'published'
    )
  );

-- Policy: Department members can create amendments for their notices
CREATE POLICY create_amendments ON public.notice_amendments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.notices n
      INNER JOIN public.department_memberships dm ON dm.department_id = n.department_id
      WHERE n.id = notice_amendments.notice_id
      AND dm.user_id = auth.uid()
    )
  );

-- Policy: Department members can view amendments for their notices
CREATE POLICY view_amendments ON public.notice_amendments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.notices n
      INNER JOIN public.department_memberships dm ON dm.department_id = n.department_id
      WHERE n.id = notice_amendments.notice_id
      AND dm.user_id = auth.uid()
    )
  );

-- Policy: Heads/admins can approve/reject amendments
CREATE POLICY approve_amendments ON public.notice_amendments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.notices n
      INNER JOIN public.department_memberships dm ON dm.department_id = n.department_id
      WHERE n.id = notice_amendments.notice_id
      AND dm.user_id = auth.uid()
      AND dm.role IN ('head', 'admin', 'owner')
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.notice_versions IS 'Complete version history of all notices with snapshots for amendment tracking and legal defensibility';
COMMENT ON TABLE public.notice_amendments IS 'Amendment requests and approval workflow for notice modifications';

COMMENT ON COLUMN public.notice_versions.notice_snapshot IS 'Complete JSONB snapshot of notice data at this version';
COMMENT ON COLUMN public.notice_versions.version_type IS 'original: first publication, amendment: substantive change, correction: minor fix, republication: reissue';
COMMENT ON COLUMN public.notice_versions.is_active IS 'Only one version per notice should be active at a time';

COMMENT ON FUNCTION create_notice_amendment_version IS 'Creates new version of notice with amendment tracking - automatically deactivates previous version';
COMMENT ON FUNCTION get_notice_version_history IS 'Returns chronological version history for a notice';
COMMENT ON FUNCTION get_active_notice_version IS 'Returns the currently active version of a notice';

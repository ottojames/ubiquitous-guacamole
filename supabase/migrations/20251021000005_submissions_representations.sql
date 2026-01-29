-- Submissions and Representations Migration
-- Firm-to-council workflow and public engagement

-- ============================================================================
-- SUBMISSIONS TABLE
-- ============================================================================
-- Notice submissions from firms (solicitors, consultants) to council departments

CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source (firm)
  source_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,

  -- Target (council department)
  target_department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  target_organization_id UUID, -- Auto-populated from department

  -- Status Workflow
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN (
      'new',              -- Just submitted, awaiting review
      'under_review',     -- Claimed by council officer
      'changes_requested',-- Council requested modifications
      'resubmitted',      -- Firm resubmitted after changes
      'accepted',         -- Council accepted and published
      'rejected'          -- Council rejected
    )),

  -- Reference
  reference_number TEXT NOT NULL UNIQUE, -- e.g., "SUB-123456"

  -- Notice Data (submitted by firm)
  notice_type TEXT NOT NULL,
  notice_data JSONB NOT NULL, -- Complete notice details
  attachments JSONB, -- Array of file references

  -- Communication
  firm_message TEXT, -- Message from firm to council
  council_response TEXT, -- Response from council to firm
  requested_changes JSONB, -- Structured list of required changes

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,

  -- Resolution
  created_notice_id UUID REFERENCES public.notices(id) ON DELETE SET NULL,
  -- If accepted, this is the published notice created from submission

  -- Metadata
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  -- History tracking
  status_history JSONB DEFAULT '[]'::jsonb
  -- Array of { status, timestamp, user_id, note }
);

-- Submissions Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_source ON public.submissions(source_organization_id);
CREATE INDEX IF NOT EXISTS idx_submissions_target_dept ON public.submissions(target_department_id);
CREATE INDEX IF NOT EXISTS idx_submissions_target_org ON public.submissions(target_organization_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_client ON public.submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assigned ON public.submissions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_submissions_reference ON public.submissions(reference_number);
CREATE INDEX IF NOT EXISTS idx_submissions_dept_status ON public.submissions(target_department_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted ON public.submissions(submitted_at DESC);

-- Submissions Updated At Trigger
CREATE TRIGGER submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- REPRESENTATIONS TABLE
-- ============================================================================
-- Public responses/objections to published notices

CREATE TABLE IF NOT EXISTS public.representations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target Notice
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,

  -- Representor Info
  representor_name TEXT NOT NULL,
  representor_email TEXT NOT NULL,
  representor_phone TEXT,
  representor_address JSONB, -- { street, city, postcode }

  -- Representation Type
  type TEXT NOT NULL CHECK (type IN ('objection', 'support', 'comment')),

  -- Content
  representation_text TEXT NOT NULL,
  grounds JSONB, -- Array of specific grounds/reasons
  -- Example: ["noise", "public_safety", "parking"]

  -- Attachments
  supporting_documents JSONB, -- Array of uploaded file references

  -- Status
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'acknowledged', 'reviewed', 'considered', 'withdrawn')),

  -- Council Processing
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  council_notes TEXT, -- Internal notes not visible to public

  -- Metadata
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Reference Number
  reference_number TEXT NOT NULL UNIQUE, -- e.g., "REP-789012"

  -- Constraints
  CONSTRAINT valid_email CHECK (representor_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_text CHECK (LENGTH(representation_text) >= 10 AND LENGTH(representation_text) <= 10000)
);

-- Representations Indexes
CREATE INDEX IF NOT EXISTS idx_representations_notice ON public.representations(notice_id);
CREATE INDEX IF NOT EXISTS idx_representations_type ON public.representations(type);
CREATE INDEX IF NOT EXISTS idx_representations_status ON public.representations(status);
CREATE INDEX IF NOT EXISTS idx_representations_submitted ON public.representations(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_representations_notice_status ON public.representations(notice_id, status);
CREATE INDEX IF NOT EXISTS idx_representations_reference ON public.representations(reference_number);

-- Representations Updated At Trigger
CREATE TRIGGER representations_updated_at
  BEFORE UPDATE ON public.representations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VALIDATION: Ensure submissions from firms to councils
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_submission_organizations()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure source is a firm
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = NEW.source_organization_id AND type = 'firm'
  ) THEN
    RAISE EXCEPTION 'Submissions can only be created by firm organizations';
  END IF;

  -- Auto-populate target_organization_id from department
  SELECT organization_id INTO NEW.target_organization_id
  FROM public.departments
  WHERE id = NEW.target_department_id;

  -- Ensure target is a council
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = NEW.target_organization_id AND type = 'council'
  ) THEN
    RAISE EXCEPTION 'Submissions can only target council departments';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER submissions_validate_orgs
  BEFORE INSERT OR UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION validate_submission_organizations();

-- ============================================================================
-- AUTO-GENERATE REFERENCE NUMBERS
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_submission_reference()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate reference: SUB-XXXXXX (6 random digits)
    ref := 'SUB-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- Check uniqueness
    SELECT EXISTS(SELECT 1 FROM public.submissions WHERE reference_number = ref) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;

  RETURN ref;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_submission_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := generate_submission_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER submissions_set_reference
  BEFORE INSERT ON public.submissions
  FOR EACH ROW
  WHEN (NEW.reference_number IS NULL OR NEW.reference_number = '')
  EXECUTE FUNCTION set_submission_reference();

-- Same for representations
CREATE OR REPLACE FUNCTION generate_representation_reference()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate reference: REP-XXXXXX (6 random digits)
    ref := 'REP-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- Check uniqueness
    SELECT EXISTS(SELECT 1 FROM public.representations WHERE reference_number = ref) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;

  RETURN ref;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_representation_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := generate_representation_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER representations_set_reference
  BEFORE INSERT ON public.representations
  FOR EACH ROW
  WHEN (NEW.reference_number IS NULL OR NEW.reference_number = '')
  EXECUTE FUNCTION set_representation_reference();

-- ============================================================================
-- STATUS TRACKING
-- ============================================================================

-- Track submission status changes
CREATE OR REPLACE FUNCTION track_submission_status_change()
RETURNS TRIGGER AS $$
DECLARE
  history_entry JSONB;
BEGIN
  IF NEW.status != OLD.status THEN
    history_entry := jsonb_build_object(
      'status', NEW.status,
      'timestamp', NOW(),
      'user_id', current_setting('request.jwt.claims', true)::jsonb->>'sub',
      'previous_status', OLD.status
    );

    NEW.status_history := COALESCE(OLD.status_history, '[]'::jsonb) || history_entry;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER submissions_track_status
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION track_submission_status_change();

-- ============================================================================
-- VALIDATION: Check representation deadline
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_representation_deadline()
RETURNS TRIGGER AS $$
DECLARE
  notice_deadline TIMESTAMPTZ;
BEGIN
  SELECT representation_deadline INTO notice_deadline
  FROM public.notices
  WHERE id = NEW.notice_id;

  IF notice_deadline IS NOT NULL AND notice_deadline < NOW() THEN
    RAISE EXCEPTION 'Representation deadline has passed for this notice';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER representations_check_deadline
  BEFORE INSERT ON public.representations
  FOR EACH ROW
  EXECUTE FUNCTION validate_representation_deadline();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get submission counts by status for a department
CREATE OR REPLACE FUNCTION get_submission_summary(p_department_id UUID)
RETURNS TABLE(status TEXT, count BIGINT) AS $$
  SELECT status, COUNT(*)
  FROM public.submissions
  WHERE target_department_id = p_department_id
  GROUP BY status;
$$ LANGUAGE SQL STABLE;

-- Get representation counts by type for a notice
CREATE OR REPLACE FUNCTION get_representation_summary(p_notice_id UUID)
RETURNS TABLE(type TEXT, count BIGINT) AS $$
  SELECT type, COUNT(*)
  FROM public.representations
  WHERE notice_id = p_notice_id
  GROUP BY type;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.submissions IS 'Notice submissions from firms to councils - managed workflow from submission to publication';
COMMENT ON TABLE public.representations IS 'Public responses to published notices - objections, support, or comments';

COMMENT ON COLUMN public.submissions.status IS 'new → under_review → changes_requested/accepted/rejected';
COMMENT ON COLUMN public.submissions.reference_number IS 'Unique submission reference (SUB-XXXXXX) for tracking';
COMMENT ON COLUMN public.submissions.status_history IS 'JSONB array tracking all status changes with timestamps and users';
COMMENT ON COLUMN public.submissions.created_notice_id IS 'If accepted, the published notice created from this submission';

COMMENT ON COLUMN public.representations.type IS 'objection: against the application, support: in favor, comment: neutral feedback';
COMMENT ON COLUMN public.representations.grounds IS 'JSONB array of specific grounds (noise, safety, parking, etc.)';
COMMENT ON COLUMN public.representations.reference_number IS 'Unique representation reference (REP-XXXXXX) for tracking';

COMMENT ON FUNCTION validate_representation_deadline IS 'Prevents submissions after representation_deadline has passed';
COMMENT ON FUNCTION get_submission_summary IS 'Returns submission counts grouped by status for department inbox';
COMMENT ON FUNCTION get_representation_summary IS 'Returns representation counts grouped by type for a notice';

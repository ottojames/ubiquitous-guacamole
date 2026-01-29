-- Enhanced Notices Migration
-- Extends existing notices table for department-level multi-tenancy

-- ============================================================================
-- ENHANCE NOTICES TABLE
-- ============================================================================
-- Add department and organization scoping to existing notices table

-- Add new columns for multi-tenant architecture
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE;
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add description column (auto-generated or manual)
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS description TEXT;

-- Enhance status ENUM to include more states
-- The status column uses notice_status ENUM type
DO $$
BEGIN
  -- Add new values to the existing notice_status ENUM if they don't exist
  -- Note: We can only add, not remove enum values
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_approval' AND enumtypid = 'notice_status'::regtype) THEN
    ALTER TYPE notice_status ADD VALUE 'pending_approval';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'expired' AND enumtypid = 'notice_status'::regtype) THEN
    ALTER TYPE notice_status ADD VALUE 'expired';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'archived' AND enumtypid = 'notice_status'::regtype) THEN
    ALTER TYPE notice_status ADD VALUE 'archived';
  END IF;

  -- Drop any CHECK constraint if it exists (in case column was switched from TEXT to ENUM)
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notices_status_check') THEN
    ALTER TABLE public.notices DROP CONSTRAINT notices_status_check;
  END IF;
END $$;

-- Add published_at and expires_at for better lifecycle management
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add representation deadline tracking
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS representation_deadline TIMESTAMPTZ;

-- Add visibility control
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- ============================================================================
-- INDEXES FOR ENHANCED NOTICES
-- ============================================================================

-- Department and organization filtering
CREATE INDEX IF NOT EXISTS idx_notices_dept ON public.notices(department_id);
CREATE INDEX IF NOT EXISTS idx_notices_org ON public.notices(organization_id);
CREATE INDEX IF NOT EXISTS idx_notices_dept_status ON public.notices(department_id, status);

-- Status-based queries
CREATE INDEX IF NOT EXISTS idx_notices_status ON public.notices(status);

-- Published notices (most common query)
CREATE INDEX IF NOT EXISTS idx_notices_published ON public.notices(published_at DESC NULLS LAST)
  WHERE status = 'published' AND is_public = true;

-- Expiring soon queries
CREATE INDEX IF NOT EXISTS idx_notices_expires ON public.notices(expires_at ASC NULLS LAST)
  WHERE status = 'published';

-- Representation deadline queries
CREATE INDEX IF NOT EXISTS idx_notices_deadline ON public.notices(representation_deadline ASC NULLS LAST)
  WHERE status = 'published';

-- Creator queries
CREATE INDEX IF NOT EXISTS idx_notices_creator ON public.notices(created_by, created_at DESC);

-- Geospatial index - TODO: Add proper PostGIS geometry/geography index once data structure is confirmed
-- For now, skip GIST index on JSONB as it requires operator class specification
-- CREATE INDEX IF NOT EXISTS idx_notices_location ON public.notices USING GIST((premises->'location'))
--   WHERE premises->'location' IS NOT NULL;

-- Full-text search support (will be enhanced later)
-- ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS search_vector tsvector;
-- CREATE INDEX IF NOT EXISTS idx_notices_search ON public.notices USING GIN(search_vector);

-- ============================================================================
-- AUTOMATIC DESCRIPTION GENERATION
-- ============================================================================
-- Generates description from notice data if not manually provided

CREATE OR REPLACE FUNCTION generate_notice_description(notice_record public.notices)
RETURNS TEXT AS $$
DECLARE
  description_text TEXT;
  applicant_name TEXT;
  premises_name TEXT;
  premises_address TEXT;
BEGIN
  -- Extract key fields from JSONB
  applicant_name := notice_record.applicant->>'name';
  premises_name := notice_record.premises->>'name';
  premises_address := CONCAT_WS(', ',
    notice_record.premises->>'street',
    notice_record.premises->>'city',
    notice_record.premises->>'postcode'
  );

  -- Build description based on notice type
  CASE notice_record.notice_type
    WHEN 'premises-licence' THEN
      description_text := CONCAT(
        'Premises licence application for ',
        COALESCE(premises_name, 'premises'),
        ' at ',
        COALESCE(premises_address, 'address not specified'),
        ' by ',
        COALESCE(applicant_name, 'applicant')
      );
    WHEN 'variation' THEN
      description_text := CONCAT(
        'Application to vary premises licence for ',
        COALESCE(premises_name, 'premises'),
        ' at ',
        COALESCE(premises_address, 'address not specified')
      );
    WHEN 'review' THEN
      description_text := CONCAT(
        'Review application for premises licence at ',
        COALESCE(premises_address, 'address not specified')
      );
    ELSE
      description_text := CONCAT(
        'Notice regarding ',
        COALESCE(premises_name, 'premises'),
        ' at ',
        COALESCE(premises_address, 'address not specified')
      );
  END CASE;

  RETURN description_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- AUTO-SET EXPIRES_AT ON PUBLISH
-- ============================================================================
-- Calculates expiration date based on department settings when notice is published

CREATE OR REPLACE FUNCTION set_notice_expiration()
RETURNS TRIGGER AS $$
DECLARE
  default_days INTEGER;
BEGIN
  -- If status changed to 'published' and expires_at not set
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    -- Set published_at if not already set
    IF NEW.published_at IS NULL THEN
      NEW.published_at := NOW();
    END IF;

    -- Calculate expires_at if not manually set
    IF NEW.expires_at IS NULL AND NEW.department_id IS NOT NULL THEN
      -- Get default expiration days from department settings
      SELECT COALESCE(
        (settings->>'default_notice_expiration_days')::INTEGER,
        90  -- Default: 90 days
      ) INTO default_days
      FROM public.departments
      WHERE id = NEW.department_id;

      NEW.expires_at := NEW.published_at + (default_days || ' days')::INTERVAL;
    END IF;

    -- Set representation deadline if not manually set
    IF NEW.representation_deadline IS NULL AND NEW.department_id IS NOT NULL THEN
      SELECT COALESCE(
        (settings->>'default_representation_period_days')::INTEGER,
        28  -- Default: 28 days
      ) INTO default_days
      FROM public.departments
      WHERE id = NEW.department_id;

      NEW.representation_deadline := NEW.published_at + (default_days || ' days')::INTERVAL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notices_set_expiration
  BEFORE UPDATE ON public.notices
  FOR EACH ROW
  WHEN (NEW.status = 'published' AND OLD.status != 'published')
  EXECUTE FUNCTION set_notice_expiration();

-- ============================================================================
-- AUTO-EXPIRE NOTICES
-- ============================================================================
-- Scheduled function to mark expired notices (called by cron job or manually)

CREATE OR REPLACE FUNCTION expire_old_notices()
RETURNS TABLE(expired_count INTEGER) AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.notices
  SET status = 'expired'
  WHERE status = 'published'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN QUERY SELECT updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_old_notices IS 'Marks published notices as expired when expires_at passes. Run via cron job.';

-- ============================================================================
-- VALIDATION: Ensure department and organization consistency
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_notice_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- If department_id is set, ensure organization_id matches department's organization
  IF NEW.department_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.departments
    WHERE id = NEW.department_id;

    IF NEW.organization_id IS NULL THEN
      RAISE EXCEPTION 'Invalid department_id: department not found';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notices_validate_org
  BEFORE INSERT OR UPDATE ON public.notices
  FOR EACH ROW
  WHEN (NEW.department_id IS NOT NULL)
  EXECUTE FUNCTION validate_notice_organization();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.notices.organization_id IS 'Parent organization (council or firm) - auto-populated from department';
COMMENT ON COLUMN public.notices.department_id IS 'Department this notice belongs to - primary isolation boundary';
COMMENT ON COLUMN public.notices.description IS 'Auto-generated or manual summary - shown in search results and cards';
COMMENT ON COLUMN public.notices.published_at IS 'Timestamp when notice was published (status changed to published)';
COMMENT ON COLUMN public.notices.expires_at IS 'Automatic expiration date - notices marked expired after this';
COMMENT ON COLUMN public.notices.representation_deadline IS 'Deadline for public to submit representations/objections';
COMMENT ON COLUMN public.notices.is_public IS 'False = visible only to dept members, True = visible on public portal';

COMMENT ON FUNCTION generate_notice_description IS 'Generates description from notice data for display in search results';
COMMENT ON FUNCTION set_notice_expiration IS 'Automatically sets published_at, expires_at, and representation_deadline on publication';

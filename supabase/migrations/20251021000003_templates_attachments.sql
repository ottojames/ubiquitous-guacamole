-- Templates and Attachments Migration
-- Creates reusable notice templates and file attachment tracking

-- ============================================================================
-- TEMPLATES TABLE
-- ============================================================================
-- Reusable notice templates scoped to departments

CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,

  -- Template Info
  name TEXT NOT NULL, -- e.g., "Standard Pub Licence Application"
  description TEXT,
  notice_type TEXT NOT NULL, -- Must match notice_type values

  -- Template Data (pre-filled values)
  default_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example:
  -- {
  --   "consultation": {
  --     "authority": "Sampleton Borough Council",
  --     "newspaper": "Sampleton Gazette"
  --   },
  --   "extras": {
  --     "operating_hours": {
  --       "monday": { "open": "10:00", "close": "23:00" }
  --     }
  --   }
  -- }

  -- Usage Tracking
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_template_name CHECK (LENGTH(name) >= 3 AND LENGTH(name) <= 200)
);

-- Templates Indexes
CREATE INDEX IF NOT EXISTS idx_templates_dept ON public.templates(department_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON public.templates(notice_type);
CREATE INDEX IF NOT EXISTS idx_templates_dept_type ON public.templates(department_id, notice_type);
CREATE INDEX IF NOT EXISTS idx_templates_usage ON public.templates(use_count DESC, last_used_at DESC);

-- Templates Updated At Trigger
CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ATTACHMENTS TABLE
-- ============================================================================
-- Files attached to notices (PDFs, images, documents)

CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Linked Resource
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,

  -- File Info
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type: application/pdf, image/jpeg, etc.
  file_size_bytes BIGINT NOT NULL,

  -- Storage
  storage_path TEXT NOT NULL, -- Supabase Storage path
  storage_bucket TEXT NOT NULL DEFAULT 'notices',

  -- File Metadata
  category TEXT CHECK (category IN (
    'application_form',
    'site_plan',
    'supporting_document',
    'license_copy',
    'correspondence',
    'other'
  )),
  description TEXT,

  -- OCR Results (if applicable)
  ocr_text TEXT, -- Extracted text from document
  ocr_processed_at TIMESTAMPTZ,

  -- Metadata
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_file_size CHECK (file_size_bytes > 0 AND file_size_bytes <= 104857600), -- Max 100MB
  CONSTRAINT valid_file_name CHECK (LENGTH(file_name) > 0 AND LENGTH(file_name) <= 255)
);

-- Attachments Indexes
CREATE INDEX IF NOT EXISTS idx_attachments_notice ON public.attachments(notice_id);
CREATE INDEX IF NOT EXISTS idx_attachments_type ON public.attachments(file_type);
CREATE INDEX IF NOT EXISTS idx_attachments_category ON public.attachments(category);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded ON public.attachments(uploaded_at DESC);

-- Full-text search on OCR text
CREATE INDEX IF NOT EXISTS idx_attachments_ocr_search ON public.attachments USING GIN(to_tsvector('english', COALESCE(ocr_text, '')))
  WHERE ocr_text IS NOT NULL;

-- ============================================================================
-- TEMPLATE USAGE TRACKING
-- ============================================================================
-- Updates use_count and last_used_at when template is applied to notice

CREATE OR REPLACE FUNCTION track_template_usage()
RETURNS TRIGGER AS $$
DECLARE
  template_uuid UUID;
BEGIN
  -- Extract template_id from notice extras (if present)
  template_uuid := (NEW.extras->>'template_id')::UUID;

  IF template_uuid IS NOT NULL THEN
    UPDATE public.templates
    SET
      use_count = use_count + 1,
      last_used_at = NOW()
    WHERE id = template_uuid;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notices_track_template
  AFTER INSERT ON public.notices
  FOR EACH ROW
  WHEN (NEW.extras->>'template_id' IS NOT NULL)
  EXECUTE FUNCTION track_template_usage();

-- ============================================================================
-- ATTACHMENT STORAGE PATH GENERATION
-- ============================================================================
-- Generates consistent storage path: dept-slug/notice-id/filename

CREATE OR REPLACE FUNCTION generate_attachment_path()
RETURNS TRIGGER AS $$
DECLARE
  dept_slug TEXT;
  notice_uuid UUID;
BEGIN
  -- Get department slug from notice
  SELECT d.slug, n.id INTO dept_slug, notice_uuid
  FROM public.notices n
  JOIN public.departments d ON n.department_id = d.id
  WHERE n.id = NEW.notice_id;

  -- Generate path: dept-slug/notice-id/filename
  NEW.storage_path := CONCAT(dept_slug, '/', notice_uuid::TEXT, '/', NEW.file_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attachments_generate_path
  BEFORE INSERT ON public.attachments
  FOR EACH ROW
  WHEN (NEW.storage_path IS NULL)
  EXECUTE FUNCTION generate_attachment_path();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get total attachment size for a notice
CREATE OR REPLACE FUNCTION get_notice_attachment_size(p_notice_id UUID)
RETURNS BIGINT AS $$
  SELECT COALESCE(SUM(file_size_bytes), 0)
  FROM public.attachments
  WHERE notice_id = p_notice_id;
$$ LANGUAGE SQL STABLE;

-- Get attachment count by category for a notice
CREATE OR REPLACE FUNCTION get_notice_attachment_summary(p_notice_id UUID)
RETURNS TABLE(category TEXT, count BIGINT, total_bytes BIGINT) AS $$
  SELECT
    COALESCE(category, 'other') as category,
    COUNT(*) as count,
    COALESCE(SUM(file_size_bytes), 0) as total_bytes
  FROM public.attachments
  WHERE notice_id = p_notice_id
  GROUP BY category;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.templates IS 'Reusable notice templates scoped to departments - pre-filled field values';
COMMENT ON TABLE public.attachments IS 'Files attached to notices - stored in Supabase Storage with metadata';

COMMENT ON COLUMN public.templates.default_values IS 'JSONB containing pre-filled field values to apply when template is used';
COMMENT ON COLUMN public.templates.use_count IS 'Number of times this template has been used to create notices';

COMMENT ON COLUMN public.attachments.storage_path IS 'Path in Supabase Storage: dept-slug/notice-id/filename';
COMMENT ON COLUMN public.attachments.ocr_text IS 'Extracted text from OCR processing - searchable';
COMMENT ON COLUMN public.attachments.category IS 'File category for organization and filtering';

COMMENT ON FUNCTION get_notice_attachment_size IS 'Returns total size in bytes of all attachments for a notice';
COMMENT ON FUNCTION get_notice_attachment_summary IS 'Returns attachment counts and sizes grouped by category';

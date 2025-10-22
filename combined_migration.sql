-- Cleanup and reapply migration
-- This migration cleans up any partially applied tables/functions and allows migrations to be reapplied

-- Drop all partially created tables if they exist
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.representations CASCADE;
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.attachments CASCADE;
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.department_memberships CASCADE;
DROP TABLE IF EXISTS public.organization_memberships CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.validate_department_organization() CASCADE;
DROP FUNCTION IF EXISTS public.validate_org_has_owner() CASCADE;
DROP FUNCTION IF EXISTS public.validate_dept_has_admin() CASCADE;
DROP FUNCTION IF EXISTS public.auto_assign_org_owner() CASCADE;
DROP FUNCTION IF EXISTS public.auto_assign_dept_admin() CASCADE;
DROP FUNCTION IF EXISTS public.update_department_access(UUID, UUID) CASCADE;

-- Mark previous migration versions as reverted in the schema_migrations table
UPDATE supabase_migrations.schema_migrations
SET statements = NULL
WHERE version IN ('20250121000000', '20250121000001');

SELECT 'Cleanup complete - ready for clean migration application' AS status;
-- Multi-Tenant Foundation Migration
-- Creates organizations and departments tables for department-level isolation

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================
-- Represents councils and firms (solicitors, licensing consultants, etc.)

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  type TEXT NOT NULL CHECK (type IN ('council', 'firm')),
  name TEXT NOT NULL,
  domain TEXT, -- e.g., 'sampleton.gov.uk' or 'wilsonpartners.com'

  -- Status
  status TEXT NOT NULL DEFAULT 'pending_approval'
    CHECK (status IN ('pending_approval', 'active', 'suspended', 'archived')),

  -- Official Details
  registration_number TEXT, -- Companies House number, council code, etc.
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address JSONB, -- { street, city, postcode, country }

  -- Branding
  logo_url TEXT,

  -- Settings (JSONB for flexibility)
  settings JSONB DEFAULT '{}'::jsonb,
  -- Example settings:
  -- {
  --   "default_timezone": "Europe/London",
  --   "branding_color": "#3b82f6",
  --   "require_2fa": false
  -- }

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_email CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT unique_domain UNIQUE (domain)
);

-- Organizations Indexes
CREATE INDEX IF NOT EXISTS idx_orgs_type ON public.organizations(type);
CREATE INDEX IF NOT EXISTS idx_orgs_status ON public.organizations(status);
CREATE INDEX IF NOT EXISTS idx_orgs_domain ON public.organizations(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orgs_created_at ON public.organizations(created_at DESC);

-- Organizations Updated At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DEPARTMENTS TABLE
-- ============================================================================
-- Represents functional divisions within councils (Licensing, Planning, etc.)
-- COUNCILS ONLY - firms do not have departments

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent Organization (must be a council)
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Basic Info
  name TEXT NOT NULL, -- e.g., "Licensing Department"
  slug TEXT NOT NULL, -- e.g., "licensing" - used in URLs
  type TEXT NOT NULL CHECK (type IN (
    'licensing',
    'planning',
    'traffic',
    'environmental_health',
    'building_control',
    'other'
  )),

  -- Contact
  email TEXT NOT NULL, -- e.g., licensing@sampleton.gov.uk
  phone TEXT,
  description TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),

  -- Settings (JSONB for department-specific config)
  settings JSONB DEFAULT '{}'::jsonb,
  -- Example settings:
  -- {
  --   "default_representation_period_days": 28,
  --   "require_approval_for_publication": false,
  --   "allowed_notice_types": ["premises_licence_new", "premises_licence_variation"],
  --   "default_newspaper": "Sampleton Gazette",
  --   "auto_archive_after_days": 90
  -- }

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT unique_org_slug UNIQUE (organization_id, slug),
  CONSTRAINT valid_slug CHECK (slug ~* '^[a-z0-9-]+$')
);

-- Departments Indexes
CREATE INDEX IF NOT EXISTS idx_depts_org ON public.departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_depts_type ON public.departments(type);
CREATE INDEX IF NOT EXISTS idx_depts_status ON public.departments(status);
CREATE INDEX IF NOT EXISTS idx_depts_org_status ON public.departments(organization_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_depts_org_slug ON public.departments(organization_id, slug);

-- Departments Updated At Trigger
CREATE TRIGGER departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VALIDATION: Ensure departments only created for councils
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_department_organization()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = NEW.organization_id AND type = 'council'
  ) THEN
    RAISE EXCEPTION 'Departments can only be created for council organizations';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER departments_validate_org
  BEFORE INSERT OR UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION validate_department_organization();

-- ============================================================================
-- COMMENTS (for documentation)
-- ============================================================================

COMMENT ON TABLE public.organizations IS 'Councils and firms (solicitors, licensing consultants, legal advisors)';
COMMENT ON TABLE public.departments IS 'Functional divisions within councils - each operates as independent data silo';

COMMENT ON COLUMN public.organizations.type IS 'council or firm - firms include all professional service providers';
COMMENT ON COLUMN public.organizations.status IS 'pending_approval: awaiting admin approval, active: operational, suspended: temporarily disabled, archived: permanently disabled';
COMMENT ON COLUMN public.organizations.settings IS 'Flexible JSONB for organization-specific configuration';

COMMENT ON COLUMN public.departments.type IS 'Department function type - determines default notice types and workflows';
COMMENT ON COLUMN public.departments.slug IS 'URL-safe identifier unique within organization - used in routing';
COMMENT ON COLUMN public.departments.settings IS 'Department-specific settings including approval requirements and defaults';
-- Memberships Migration
-- Creates organization and department membership tables for dual-level role system

-- ============================================================================
-- ORGANIZATION MEMBERSHIPS TABLE
-- ============================================================================
-- Org-wide roles (Owner, Org Admin) - applies to entire organization

CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role (org-wide)
  role TEXT NOT NULL CHECK (role IN ('owner', 'org_admin')),
  -- owner: Can delete org, manage all departments, transfer ownership
  -- org_admin: Can create departments, view all dept data, manage org settings

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT unique_org_user UNIQUE (organization_id, user_id)
);

-- Organization Memberships Indexes
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_memberships(organization_id, role);
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_members_unique ON public.organization_memberships(organization_id, user_id);

-- ============================================================================
-- DEPARTMENT MEMBERSHIPS TABLE
-- ============================================================================
-- Department-specific roles (Dept Admin, Editor, Viewer) - scoped to single department

CREATE TABLE IF NOT EXISTS public.department_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role (department-scoped)
  role TEXT NOT NULL CHECK (role IN ('department_admin', 'editor', 'viewer')),
  -- department_admin: Full control within dept, manage team, settings
  -- editor: Create/edit/publish notices, use templates
  -- viewer: Read-only access to dept data

  -- Context Switching Support
  last_accessed_at TIMESTAMPTZ, -- Tracks most recently used department

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT unique_dept_user UNIQUE (department_id, user_id)
);

-- Department Memberships Indexes
CREATE INDEX IF NOT EXISTS idx_dept_members_dept ON public.department_memberships(department_id);
CREATE INDEX IF NOT EXISTS idx_dept_members_user ON public.department_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_dept_members_role ON public.department_memberships(department_id, role);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dept_members_unique ON public.department_memberships(department_id, user_id);

-- Context switching support: Find user's most recently accessed departments
CREATE INDEX IF NOT EXISTS idx_dept_members_last_accessed ON public.department_memberships(user_id, last_accessed_at DESC NULLS LAST);

-- ============================================================================
-- VALIDATION: Ensure at least one owner per organization
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_org_has_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- On DELETE or UPDATE changing role from owner
  IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role != 'owner')) THEN
    -- Check if this is the last owner
    IF NOT EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = OLD.organization_id
        AND role = 'owner'
        AND id != OLD.id
    ) THEN
      RAISE EXCEPTION 'Cannot remove last owner from organization. Transfer ownership first.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER org_members_ensure_owner
  BEFORE UPDATE OR DELETE ON public.organization_memberships
  FOR EACH ROW
  WHEN (OLD.role = 'owner')
  EXECUTE FUNCTION validate_org_has_owner();

-- ============================================================================
-- VALIDATION: Ensure at least one admin per department
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_dept_has_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- On DELETE or UPDATE changing role from department_admin
  IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.role = 'department_admin' AND NEW.role != 'department_admin')) THEN
    -- Check if this is the last department admin
    IF NOT EXISTS (
      SELECT 1 FROM public.department_memberships
      WHERE department_id = OLD.department_id
        AND role = 'department_admin'
        AND id != OLD.id
    ) THEN
      RAISE EXCEPTION 'Cannot remove last admin from department. Assign another admin first.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dept_members_ensure_admin
  BEFORE UPDATE OR DELETE ON public.department_memberships
  FOR EACH ROW
  WHEN (OLD.role = 'department_admin')
  EXECUTE FUNCTION validate_dept_has_admin();

-- ============================================================================
-- AUTO-ASSIGN: Creator becomes owner/admin on org/dept creation
-- ============================================================================

-- When organization is created, make creator the owner
CREATE OR REPLACE FUNCTION auto_assign_org_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.organization_memberships (organization_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_auto_owner
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_org_owner();

-- When department is created, make creator a department admin
CREATE OR REPLACE FUNCTION auto_assign_dept_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.department_memberships (department_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'department_admin')
    ON CONFLICT (department_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER departments_auto_admin
  AFTER INSERT ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_dept_admin();

-- ============================================================================
-- UPDATE LAST_ACCESSED_AT HELPER FUNCTION
-- ============================================================================
-- Called by application when user switches to a department context

CREATE OR REPLACE FUNCTION update_department_access(p_user_id UUID, p_department_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.department_memberships
  SET last_accessed_at = NOW()
  WHERE user_id = p_user_id AND department_id = p_department_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.organization_memberships IS 'Organization-wide roles (Owner, Org Admin) with elevated privileges';
COMMENT ON TABLE public.department_memberships IS 'Department-scoped roles (Dept Admin, Editor, Viewer) with data isolation';

COMMENT ON COLUMN public.organization_memberships.role IS 'owner: full control + can delete org, org_admin: can create depts and view all dept data';
COMMENT ON COLUMN public.department_memberships.role IS 'department_admin: full dept control, editor: create/edit notices, viewer: read-only';
COMMENT ON COLUMN public.department_memberships.last_accessed_at IS 'Tracks most recently used department for context switching UI';

COMMENT ON FUNCTION update_department_access IS 'Updates last_accessed_at when user switches to department context';
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
-- Invitations and Clients Migration
-- Team invitation system and firm client management

-- ============================================================================
-- INVITATIONS TABLE
-- ============================================================================
-- Email invitations to join organizations or departments

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target (either org-level or dept-level)
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,

  -- Invitee
  email TEXT NOT NULL,
  role TEXT NOT NULL, -- org role or dept role depending on scope

  -- Token
  token TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL, -- Bcrypt hash for validation

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),

  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),

  -- Message
  personal_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_scope CHECK (
    (organization_id IS NOT NULL AND department_id IS NULL) OR
    (organization_id IS NULL AND department_id IS NOT NULL)
  ),
  CONSTRAINT valid_org_role CHECK (
    organization_id IS NULL OR role IN ('owner', 'org_admin')
  ),
  CONSTRAINT valid_dept_role CHECK (
    department_id IS NULL OR role IN ('department_admin', 'editor', 'viewer')
  )
);

-- Invitations Indexes
CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_dept ON public.invitations(department_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON public.invitations(expires_at ASC)
  WHERE status = 'pending';

-- ============================================================================
-- CLIENTS TABLE
-- ============================================================================
-- Client records for firms (solicitors, consultants)

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner (firm organization)
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Client Info
  name TEXT NOT NULL, -- Company or individual name
  type TEXT NOT NULL DEFAULT 'business'
    CHECK (type IN ('business', 'individual')),

  -- Contact Details
  contact_email TEXT,
  contact_phone TEXT,
  address JSONB, -- { street, city, postcode, country }

  -- Business Details (for companies)
  company_number TEXT, -- Companies House number
  vat_number TEXT,

  -- Relationship
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived')),

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_client_name CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 200),
  CONSTRAINT valid_email CHECK (
    contact_email IS NULL OR
    contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

-- Clients Indexes
CREATE INDEX IF NOT EXISTS idx_clients_org ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_org_status ON public.clients(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_created ON public.clients(created_at DESC);

-- Clients Updated At Trigger
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VALIDATION: Ensure clients only for firms
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_client_organization()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = NEW.organization_id AND type = 'firm'
  ) THEN
    RAISE EXCEPTION 'Clients can only be created for firm organizations';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_validate_org
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION validate_client_organization();

-- ============================================================================
-- AUTO-EXPIRE INVITATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS TABLE(expired_count INTEGER) AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN QUERY SELECT updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_old_invitations IS 'Marks pending invitations as expired after expires_at. Run via cron job.';

-- ============================================================================
-- INVITATION TOKEN GENERATION
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate random 32-character token (URL-safe)
  token := encode(gen_random_bytes(24), 'base64');
  token := REPLACE(token, '/', '_');
  token := REPLACE(token, '+', '-');
  token := REPLACE(token, '=', '');
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate token on insert if not provided
CREATE OR REPLACE FUNCTION set_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token := generate_invitation_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invitations_set_token
  BEFORE INSERT ON public.invitations
  FOR EACH ROW
  WHEN (NEW.token IS NULL OR NEW.token = '')
  EXECUTE FUNCTION set_invitation_token();

-- ============================================================================
-- ACCEPT INVITATION FUNCTION
-- ============================================================================
-- Called when user accepts invitation via token

CREATE OR REPLACE FUNCTION accept_invitation(p_token TEXT, p_user_id UUID)
RETURNS TABLE(success BOOLEAN, membership_type TEXT, id UUID) AS $$
DECLARE
  inv_record RECORD;
  new_membership_id UUID;
BEGIN
  -- Find valid invitation
  SELECT * INTO inv_record
  FROM public.invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Create membership based on invitation type
  IF inv_record.organization_id IS NOT NULL THEN
    -- Organization-level invitation
    INSERT INTO public.organization_memberships (organization_id, user_id, role, invited_by)
    VALUES (inv_record.organization_id, p_user_id, inv_record.role, inv_record.invited_by)
    ON CONFLICT (organization_id, user_id) DO NOTHING
    RETURNING id INTO new_membership_id;

    membership_type := 'organization';
  ELSE
    -- Department-level invitation
    INSERT INTO public.department_memberships (department_id, user_id, role, invited_by)
    VALUES (inv_record.department_id, p_user_id, inv_record.role, inv_record.invited_by)
    ON CONFLICT (department_id, user_id) DO NOTHING
    RETURNING id INTO new_membership_id;

    membership_type := 'department';
  END IF;

  -- Mark invitation as accepted
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = NOW(), accepted_by = p_user_id
  WHERE id = inv_record.id;

  RETURN QUERY SELECT true, membership_type, new_membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get pending invitations for an organization
CREATE OR REPLACE FUNCTION get_pending_org_invitations(p_org_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  role TEXT,
  scope TEXT,
  invited_by_email TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
) AS $$
  SELECT
    i.id,
    i.email,
    i.role,
    CASE
      WHEN i.department_id IS NOT NULL THEN 'department'
      ELSE 'organization'
    END as scope,
    u.email as invited_by_email,
    i.created_at,
    i.expires_at
  FROM public.invitations i
  JOIN auth.users u ON i.invited_by = u.id
  WHERE i.organization_id = p_org_id
    AND i.status = 'pending'
  ORDER BY i.created_at DESC;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.invitations IS 'Email invitations to join organizations or departments - expire after 7 days';
COMMENT ON TABLE public.clients IS 'Client records for firms - businesses or individuals represented by solicitors/consultants';

COMMENT ON COLUMN public.invitations.token IS 'URL-safe random token sent in invitation email link';
COMMENT ON COLUMN public.invitations.token_hash IS 'Bcrypt hash for additional security validation';
COMMENT ON COLUMN public.invitations.personal_message IS 'Optional welcome message from inviter to invitee';

COMMENT ON COLUMN public.clients.type IS 'business: company/organization, individual: single person';
COMMENT ON COLUMN public.clients.company_number IS 'Companies House registration number for UK businesses';

COMMENT ON FUNCTION accept_invitation IS 'Validates invitation token and creates membership. Returns success status and membership details.';
COMMENT ON FUNCTION get_pending_org_invitations IS 'Lists all pending invitations for an organization (org-level and dept-level)';
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
-- Audit Logs Migration
-- Comprehensive activity tracking for compliance and security

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================
-- Tamper-proof append-only audit trail for all significant actions

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,

  -- Actor
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT, -- Snapshot at time of action (in case user deleted)

  -- Action Details
  action TEXT NOT NULL, -- e.g., 'notice.published', 'user.invited', 'template.created'
  action_category TEXT NOT NULL CHECK (action_category IN (
    'auth',           -- Login, logout, password reset
    'notice',         -- Notice CRUD operations
    'template',       -- Template CRUD operations
    'team',           -- User invitations, role changes, removals
    'organization',   -- Org settings, creation, deletion
    'department',     -- Dept settings, creation, archival
    'submission',     -- Firm submission workflow
    'representation', -- Public representation handling
    'settings',       -- Configuration changes
    'security'        -- Security events, permission changes
  )),

  -- Resource Affected
  resource_type TEXT, -- 'notice', 'template', 'user', 'department', etc.
  resource_id UUID,   -- ID of affected resource

  -- Change Details
  old_values JSONB,   -- Previous state (for updates/deletes)
  new_values JSONB,   -- New state (for creates/updates)
  metadata JSONB,     -- Additional context-specific data

  -- Request Info
  ip_address INET,
  user_agent TEXT,

  -- Timestamp (immutable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Severity
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical'))
);

-- Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_audit_org ON public.audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_dept ON public.audit_logs(department_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_category ON public.audit_logs(action_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON public.audit_logs(severity, created_at DESC)
  WHERE severity IN ('warning', 'critical');
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_org_category ON public.audit_logs(organization_id, action_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_dept_category ON public.audit_logs(department_id, action_category, created_at DESC);

-- ============================================================================
-- PREVENT AUDIT LOG MODIFICATIONS (Append-only enforcement)
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();

-- ============================================================================
-- AUTOMATIC AUDIT LOGGING FUNCTIONS
-- ============================================================================

-- Generic audit log creator
CREATE OR REPLACE FUNCTION create_audit_log(
  p_organization_id UUID,
  p_department_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_action_category TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
  user_email_snapshot TEXT;
BEGIN
  -- Get user email snapshot
  SELECT email INTO user_email_snapshot FROM auth.users WHERE id = p_user_id;

  INSERT INTO public.audit_logs (
    organization_id,
    department_id,
    user_id,
    user_email,
    action,
    action_category,
    resource_type,
    resource_id,
    old_values,
    new_values,
    metadata,
    severity
  ) VALUES (
    p_organization_id,
    p_department_id,
    p_user_id,
    user_email_snapshot,
    p_action,
    p_action_category,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    p_metadata,
    p_severity
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUTO-AUDIT TRIGGERS FOR KEY TABLES
-- ============================================================================

-- Audit notice changes
CREATE OR REPLACE FUNCTION audit_notice_changes()
RETURNS TRIGGER AS $$
DECLARE
  action_name TEXT;
  old_vals JSONB;
  new_vals JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_name := 'notice.created';
    new_vals := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := 'notice.updated';
    old_vals := to_jsonb(OLD);
    new_vals := to_jsonb(NEW);

    -- Specific actions for status changes
    IF NEW.status != OLD.status THEN
      action_name := 'notice.status_changed';
      new_vals := jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_name := 'notice.deleted';
    old_vals := to_jsonb(OLD);
  END IF;

  PERFORM create_audit_log(
    COALESCE(NEW.organization_id, OLD.organization_id),
    COALESCE(NEW.department_id, OLD.department_id),
    COALESCE(NEW.created_by, OLD.created_by),
    action_name,
    'notice',
    'notice',
    COALESCE(NEW.id, OLD.id),
    old_vals,
    new_vals,
    NULL,
    'info'
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notices_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.notices
  FOR EACH ROW
  EXECUTE FUNCTION audit_notice_changes();

-- Audit membership changes
CREATE OR REPLACE FUNCTION audit_dept_membership_changes()
RETURNS TRIGGER AS $$
DECLARE
  action_name TEXT;
  dept_org_id UUID;
BEGIN
  -- Get organization ID from department
  SELECT organization_id INTO dept_org_id
  FROM public.departments
  WHERE id = COALESCE(NEW.department_id, OLD.department_id);

  IF TG_OP = 'INSERT' THEN
    action_name := 'team.member_added';
  ELSIF TG_OP = 'UPDATE' AND NEW.role != OLD.role THEN
    action_name := 'team.role_changed';
  ELSIF TG_OP = 'DELETE' THEN
    action_name := 'team.member_removed';
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  PERFORM create_audit_log(
    dept_org_id,
    COALESCE(NEW.department_id, OLD.department_id),
    COALESCE(NEW.invited_by, OLD.invited_by),
    action_name,
    'team',
    'department_membership',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    jsonb_build_object('affected_user_id', COALESCE(NEW.user_id, OLD.user_id)),
    'info'
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dept_memberships_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.department_memberships
  FOR EACH ROW
  EXECUTE FUNCTION audit_dept_membership_changes();

-- Audit organization changes
CREATE OR REPLACE FUNCTION audit_organization_changes()
RETURNS TRIGGER AS $$
DECLARE
  action_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_name := 'organization.created';
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := 'organization.updated';
    IF NEW.status != OLD.status THEN
      action_name := 'organization.status_changed';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_name := 'organization.deleted';
  END IF;

  PERFORM create_audit_log(
    COALESCE(NEW.id, OLD.id),
    NULL,
    COALESCE(NEW.created_by, OLD.created_by),
    action_name,
    'organization',
    'organization',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    NULL,
    CASE WHEN TG_OP = 'DELETE' THEN 'warning' ELSE 'info' END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION audit_organization_changes();

-- Audit department changes
CREATE OR REPLACE FUNCTION audit_department_changes()
RETURNS TRIGGER AS $$
DECLARE
  action_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_name := 'department.created';
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := 'department.updated';
    IF NEW.status != OLD.status THEN
      action_name := 'department.status_changed';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_name := 'department.deleted';
  END IF;

  PERFORM create_audit_log(
    COALESCE(NEW.organization_id, OLD.organization_id),
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.created_by, OLD.created_by),
    action_name,
    'department',
    'department',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    NULL,
    CASE WHEN TG_OP = 'DELETE' THEN 'warning' ELSE 'info' END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER departments_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION audit_department_changes();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get recent activity for organization
CREATE OR REPLACE FUNCTION get_recent_activity(
  p_organization_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  action TEXT,
  action_category TEXT,
  user_email TEXT,
  resource_type TEXT,
  created_at TIMESTAMPTZ,
  metadata JSONB
) AS $$
  SELECT
    id,
    action,
    action_category,
    user_email,
    resource_type,
    created_at,
    metadata
  FROM public.audit_logs
  WHERE organization_id = p_organization_id
  ORDER BY created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$ LANGUAGE SQL STABLE;

-- Get audit trail for specific resource
CREATE OR REPLACE FUNCTION get_resource_audit_trail(
  p_resource_type TEXT,
  p_resource_id UUID
)
RETURNS TABLE(
  id UUID,
  action TEXT,
  user_email TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ
) AS $$
  SELECT
    id,
    action,
    user_email,
    old_values,
    new_values,
    created_at
  FROM public.audit_logs
  WHERE resource_type = p_resource_type
    AND resource_id = p_resource_id
  ORDER BY created_at ASC;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- RETENTION POLICY FUNCTION
-- ============================================================================
-- Archive old audit logs (run as scheduled job)

CREATE OR REPLACE FUNCTION archive_old_audit_logs(p_days_to_keep INTEGER DEFAULT 365)
RETURNS TABLE(archived_count INTEGER) AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- In production, you'd move to an archive table instead of DELETE
  -- For now, we keep all logs (no deletion)

  -- This is a placeholder for future archival strategy
  -- Example: Move logs older than p_days_to_keep to audit_logs_archive table

  RETURN QUERY SELECT 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.audit_logs IS 'Append-only immutable audit trail for all significant actions - cannot be modified or deleted';

COMMENT ON COLUMN public.audit_logs.action IS 'Specific action performed (e.g., notice.published, user.invited)';
COMMENT ON COLUMN public.audit_logs.action_category IS 'High-level category for filtering (auth, notice, team, etc.)';
COMMENT ON COLUMN public.audit_logs.user_email IS 'Snapshot of user email at time of action (preserved even if user deleted)';
COMMENT ON COLUMN public.audit_logs.old_values IS 'Previous state for updates/deletes';
COMMENT ON COLUMN public.audit_logs.new_values IS 'New state for creates/updates';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional context-specific information';
COMMENT ON COLUMN public.audit_logs.severity IS 'info: normal operation, warning: notable event, critical: security/compliance issue';

COMMENT ON FUNCTION create_audit_log IS 'Creates audit log entry with standardized format';
COMMENT ON FUNCTION get_recent_activity IS 'Returns recent audit log entries for an organization';
COMMENT ON FUNCTION get_resource_audit_trail IS 'Returns complete audit trail for a specific resource';
-- Row-Level Security (RLS) Policies Migration
-- Three-layer security: RLS (database) + API + UI
-- Enforces department-level data isolation

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.representations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Check if user is org owner or admin
CREATE OR REPLACE FUNCTION user_is_org_admin(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'org_admin')
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user is department admin
CREATE OR REPLACE FUNCTION user_is_dept_admin(p_dept_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.department_memberships
    WHERE department_id = p_dept_id
      AND user_id = auth.uid()
      AND role = 'department_admin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user has any role in department
CREATE OR REPLACE FUNCTION user_is_dept_member(p_dept_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.department_memberships
    WHERE department_id = p_dept_id
      AND user_id = auth.uid()
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user can edit in department (admin or editor)
CREATE OR REPLACE FUNCTION user_can_edit_dept(p_dept_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.department_memberships
    WHERE department_id = p_dept_id
      AND user_id = auth.uid()
      AND role IN ('department_admin', 'editor')
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- ORGANIZATIONS TABLE RLS
-- ============================================================================

-- SELECT: Users can see orgs they're members of, or all orgs for site admin
CREATE POLICY organizations_select_policy ON public.organizations
FOR SELECT
USING (
  -- User is member of this organization
  id IN (
    SELECT organization_id FROM public.organization_memberships
    WHERE user_id = auth.uid()
  )
  OR
  -- User is member of a department in this organization
  id IN (
    SELECT DISTINCT d.organization_id
    FROM public.departments d
    JOIN public.department_memberships dm ON d.id = dm.department_id
    WHERE dm.user_id = auth.uid()
  )
  -- TODO: Add site admin check when admin auth is implemented
);

-- INSERT: Anyone can create organization (pending approval)
CREATE POLICY organizations_insert_policy ON public.organizations
FOR INSERT
WITH CHECK (
  created_by = auth.uid()
);

-- UPDATE: Org owners and admins only
CREATE POLICY organizations_update_policy ON public.organizations
FOR UPDATE
USING (
  user_is_org_admin(id)
);

-- DELETE: Org owners only
CREATE POLICY organizations_delete_policy ON public.organizations
FOR DELETE
USING (
  id IN (
    SELECT organization_id FROM public.organization_memberships
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- ============================================================================
-- DEPARTMENTS TABLE RLS
-- ============================================================================

-- SELECT: Org admins + dept members
CREATE POLICY departments_select_policy ON public.departments
FOR SELECT
USING (
  -- User is org admin
  user_is_org_admin(organization_id)
  OR
  -- User is member of this department
  user_is_dept_member(id)
);

-- INSERT: Org admins can create departments
CREATE POLICY departments_insert_policy ON public.departments
FOR INSERT
WITH CHECK (
  user_is_org_admin(organization_id)
);

-- UPDATE: Org admins + dept admins
CREATE POLICY departments_update_policy ON public.departments
FOR UPDATE
USING (
  user_is_org_admin(organization_id)
  OR
  user_is_dept_admin(id)
);

-- DELETE: Org admins only
CREATE POLICY departments_delete_policy ON public.departments
FOR DELETE
USING (
  user_is_org_admin(organization_id)
);

-- ============================================================================
-- ORGANIZATION_MEMBERSHIPS TABLE RLS
-- ============================================================================

-- SELECT: Org members can see other org members
CREATE POLICY org_memberships_select_policy ON public.organization_memberships
FOR SELECT
USING (
  user_is_org_admin(organization_id)
  OR
  user_id = auth.uid()
);

-- INSERT: Org admins can add members (via invitations)
CREATE POLICY org_memberships_insert_policy ON public.organization_memberships
FOR INSERT
WITH CHECK (
  user_is_org_admin(organization_id)
  OR
  invited_by = auth.uid()
);

-- UPDATE: Org owners can change roles
CREATE POLICY org_memberships_update_policy ON public.organization_memberships
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_memberships
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- DELETE: Org owners can remove members, users can leave
CREATE POLICY org_memberships_delete_policy ON public.organization_memberships
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_memberships
    WHERE user_id = auth.uid() AND role = 'owner'
  )
  OR
  user_id = auth.uid()
);

-- ============================================================================
-- DEPARTMENT_MEMBERSHIPS TABLE RLS
-- ============================================================================

-- SELECT: Dept members + org admins
CREATE POLICY dept_memberships_select_policy ON public.department_memberships
FOR SELECT
USING (
  user_is_dept_member(department_id)
  OR
  department_id IN (
    SELECT id FROM public.departments
    WHERE user_is_org_admin(organization_id)
  )
  OR
  user_id = auth.uid()
);

-- INSERT: Dept admins + org admins
CREATE POLICY dept_memberships_insert_policy ON public.department_memberships
FOR INSERT
WITH CHECK (
  user_is_dept_admin(department_id)
  OR
  department_id IN (
    SELECT id FROM public.departments
    WHERE user_is_org_admin(organization_id)
  )
);

-- UPDATE: Dept admins + org admins
CREATE POLICY dept_memberships_update_policy ON public.department_memberships
FOR UPDATE
USING (
  user_is_dept_admin(department_id)
  OR
  department_id IN (
    SELECT id FROM public.departments
    WHERE user_is_org_admin(organization_id)
  )
);

-- DELETE: Dept admins + org admins + self
CREATE POLICY dept_memberships_delete_policy ON public.department_memberships
FOR DELETE
USING (
  user_is_dept_admin(department_id)
  OR
  department_id IN (
    SELECT id FROM public.departments
    WHERE user_is_org_admin(organization_id)
  )
  OR
  user_id = auth.uid()
);

-- ============================================================================
-- NOTICES TABLE RLS
-- ============================================================================

-- SELECT: Published notices are public, drafts visible to dept members
CREATE POLICY notices_select_policy ON public.notices
FOR SELECT
USING (
  -- Published notices are public
  (status = 'published' AND is_public = true)
  OR
  -- Department members can see all dept notices
  user_is_dept_member(department_id)
  OR
  -- Org admins can see all org notices
  user_is_org_admin(organization_id)
);

-- INSERT: Dept editors and admins
CREATE POLICY notices_insert_policy ON public.notices
FOR INSERT
WITH CHECK (
  user_can_edit_dept(department_id)
);

-- UPDATE: Creator (if editor) or dept admins or org admins
CREATE POLICY notices_update_policy ON public.notices
FOR UPDATE
USING (
  user_is_dept_admin(department_id)
  OR
  user_is_org_admin(organization_id)
  OR
  (created_by = auth.uid() AND user_can_edit_dept(department_id))
);

-- DELETE: Dept admins + org admins
CREATE POLICY notices_delete_policy ON public.notices
FOR DELETE
USING (
  user_is_dept_admin(department_id)
  OR
  user_is_org_admin(organization_id)
);

-- ============================================================================
-- TEMPLATES TABLE RLS
-- ============================================================================

-- SELECT: Dept members
CREATE POLICY templates_select_policy ON public.templates
FOR SELECT
USING (
  user_is_dept_member(department_id)
);

-- INSERT: Dept editors and admins
CREATE POLICY templates_insert_policy ON public.templates
FOR INSERT
WITH CHECK (
  user_can_edit_dept(department_id)
);

-- UPDATE: Creator or dept admin
CREATE POLICY templates_update_policy ON public.templates
FOR UPDATE
USING (
  created_by = auth.uid()
  OR
  user_is_dept_admin(department_id)
);

-- DELETE: Creator or dept admin
CREATE POLICY templates_delete_policy ON public.templates
FOR DELETE
USING (
  created_by = auth.uid()
  OR
  user_is_dept_admin(department_id)
);

-- ============================================================================
-- ATTACHMENTS TABLE RLS
-- ============================================================================

-- SELECT: Follow notice visibility rules
CREATE POLICY attachments_select_policy ON public.attachments
FOR SELECT
USING (
  notice_id IN (
    SELECT id FROM public.notices
    WHERE (status = 'published' AND is_public = true)
      OR user_is_dept_member(department_id)
      OR user_is_org_admin(organization_id)
  )
);

-- INSERT: Follow notice edit rules
CREATE POLICY attachments_insert_policy ON public.attachments
FOR INSERT
WITH CHECK (
  notice_id IN (
    SELECT id FROM public.notices
    WHERE user_can_edit_dept(department_id)
      OR user_is_dept_admin(department_id)
      OR user_is_org_admin(organization_id)
  )
);

-- UPDATE: Uploader or notice editor
CREATE POLICY attachments_update_policy ON public.attachments
FOR UPDATE
USING (
  uploaded_by = auth.uid()
  OR
  notice_id IN (
    SELECT id FROM public.notices
    WHERE user_is_dept_admin(department_id)
      OR user_is_org_admin(organization_id)
  )
);

-- DELETE: Uploader or notice editor
CREATE POLICY attachments_delete_policy ON public.attachments
FOR DELETE
USING (
  uploaded_by = auth.uid()
  OR
  notice_id IN (
    SELECT id FROM public.notices
    WHERE user_is_dept_admin(department_id)
      OR user_is_org_admin(organization_id)
  )
);

-- ============================================================================
-- INVITATIONS TABLE RLS
-- ============================================================================

-- SELECT: Inviter + org/dept admins
CREATE POLICY invitations_select_policy ON public.invitations
FOR SELECT
USING (
  invited_by = auth.uid()
  OR
  (organization_id IS NOT NULL AND user_is_org_admin(organization_id))
  OR
  (department_id IS NOT NULL AND user_is_dept_admin(department_id))
);

-- INSERT: Org/dept admins
CREATE POLICY invitations_insert_policy ON public.invitations
FOR INSERT
WITH CHECK (
  (organization_id IS NOT NULL AND user_is_org_admin(organization_id))
  OR
  (department_id IS NOT NULL AND user_is_dept_admin(department_id))
);

-- UPDATE: Status changes allowed by inviter or admin
CREATE POLICY invitations_update_policy ON public.invitations
FOR UPDATE
USING (
  invited_by = auth.uid()
  OR
  (organization_id IS NOT NULL AND user_is_org_admin(organization_id))
  OR
  (department_id IS NOT NULL AND user_is_dept_admin(department_id))
);

-- DELETE: Inviter or admin can cancel
CREATE POLICY invitations_delete_policy ON public.invitations
FOR DELETE
USING (
  invited_by = auth.uid()
  OR
  (organization_id IS NOT NULL AND user_is_org_admin(organization_id))
  OR
  (department_id IS NOT NULL AND user_is_dept_admin(department_id))
);

-- ============================================================================
-- CLIENTS TABLE RLS
-- ============================================================================

-- SELECT: Firm members
CREATE POLICY clients_select_policy ON public.clients
FOR SELECT
USING (
  user_is_org_admin(organization_id)
  OR
  organization_id IN (
    SELECT organization_id FROM public.organization_memberships
    WHERE user_id = auth.uid()
  )
);

-- INSERT: Firm members
CREATE POLICY clients_insert_policy ON public.clients
FOR INSERT
WITH CHECK (
  user_is_org_admin(organization_id)
  OR
  organization_id IN (
    SELECT organization_id FROM public.organization_memberships
    WHERE user_id = auth.uid()
  )
);

-- UPDATE: Firm members
CREATE POLICY clients_update_policy ON public.clients
FOR UPDATE
USING (
  user_is_org_admin(organization_id)
  OR
  created_by = auth.uid()
);

-- DELETE: Firm admins
CREATE POLICY clients_delete_policy ON public.clients
FOR DELETE
USING (
  user_is_org_admin(organization_id)
);

-- ============================================================================
-- SUBMISSIONS TABLE RLS
-- ============================================================================

-- SELECT: Source firm + target dept
CREATE POLICY submissions_select_policy ON public.submissions
FOR SELECT
USING (
  -- Firm can see their own submissions
  source_organization_id IN (
    SELECT organization_id FROM public.organization_memberships
    WHERE user_id = auth.uid()
  )
  OR
  -- Council dept can see submissions to them
  user_is_dept_member(target_department_id)
  OR
  user_is_org_admin(target_organization_id)
);

-- INSERT: Firm members
CREATE POLICY submissions_insert_policy ON public.submissions
FOR INSERT
WITH CHECK (
  source_organization_id IN (
    SELECT organization_id FROM public.organization_memberships
    WHERE user_id = auth.uid()
  )
);

-- UPDATE: Submitter (firm) or assigned council officer
CREATE POLICY submissions_update_policy ON public.submissions
FOR UPDATE
USING (
  submitted_by = auth.uid()
  OR
  assigned_to = auth.uid()
  OR
  user_is_dept_admin(target_department_id)
  OR
  user_is_org_admin(target_organization_id)
);

-- DELETE: Firm admin or council dept admin
CREATE POLICY submissions_delete_policy ON public.submissions
FOR DELETE
USING (
  user_is_org_admin(source_organization_id)
  OR
  user_is_dept_admin(target_department_id)
  OR
  user_is_org_admin(target_organization_id)
);

-- ============================================================================
-- REPRESENTATIONS TABLE RLS
-- ============================================================================

-- SELECT: Public (for published notices) + dept members
CREATE POLICY representations_select_policy ON public.representations
FOR SELECT
USING (
  -- Dept members can see all representations
  notice_id IN (
    SELECT id FROM public.notices
    WHERE user_is_dept_member(department_id)
      OR user_is_org_admin(organization_id)
  )
  -- TODO: Public can see their own representation via token/email validation
);

-- INSERT: Anyone (public submissions)
CREATE POLICY representations_insert_policy ON public.representations
FOR INSERT
WITH CHECK (
  -- Ensure notice is published and within deadline
  notice_id IN (
    SELECT id FROM public.notices
    WHERE status = 'published'
      AND is_public = true
      AND (representation_deadline IS NULL OR representation_deadline > NOW())
  )
);

-- UPDATE: Council reviewers only (for internal notes)
CREATE POLICY representations_update_policy ON public.representations
FOR UPDATE
USING (
  notice_id IN (
    SELECT id FROM public.notices
    WHERE user_is_dept_admin(department_id)
      OR user_is_org_admin(organization_id)
  )
);

-- DELETE: Dept admins + org admins
CREATE POLICY representations_delete_policy ON public.representations
FOR DELETE
USING (
  notice_id IN (
    SELECT id FROM public.notices
    WHERE user_is_dept_admin(department_id)
      OR user_is_org_admin(organization_id)
  )
);

-- ============================================================================
-- AUDIT_LOGS TABLE RLS
-- ============================================================================

-- SELECT: Org/dept members can see their logs
CREATE POLICY audit_logs_select_policy ON public.audit_logs
FOR SELECT
USING (
  user_is_org_admin(organization_id)
  OR
  (department_id IS NOT NULL AND user_is_dept_member(department_id))
  OR
  user_id = auth.uid()
);

-- INSERT: System only (via SECURITY DEFINER functions)
-- No direct INSERT policy - use create_audit_log function

-- UPDATE/DELETE: Never allowed (enforced by trigger)

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY organizations_select_policy ON public.organizations IS 'Users see orgs they belong to or have dept access to';
COMMENT ON POLICY notices_select_policy ON public.notices IS 'Published notices are public, drafts visible to dept members only';
COMMENT ON POLICY representations_insert_policy ON public.representations IS 'Public can submit representations on published notices within deadline';

COMMENT ON FUNCTION user_is_org_admin IS 'Returns true if user is owner or org_admin of organization';
COMMENT ON FUNCTION user_is_dept_admin IS 'Returns true if user is department_admin of department';
COMMENT ON FUNCTION user_is_dept_member IS 'Returns true if user has any role in department';
COMMENT ON FUNCTION user_can_edit_dept IS 'Returns true if user can create/edit content in department (admin or editor)';
-- Storage Buckets Configuration
-- Creates Supabase Storage buckets with RLS policies

-- ============================================================================
-- CREATE STORAGE BUCKETS
-- ============================================================================

-- Notices bucket: for notice attachments (PDFs, images, documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notices',
  'notices',
  false, -- Not publicly accessible by default (RLS controls access)
  104857600, -- 100MB max file size
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Logos bucket: for organization and user profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true, -- Publicly accessible (logos are meant to be shown)
  5242880, -- 5MB max file size
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE HELPER FUNCTIONS
-- ============================================================================

-- Extract department slug from storage path (notices bucket uses: dept-slug/notice-id/filename)
CREATE OR REPLACE FUNCTION public.storage_dept_slug_from_path(path TEXT)
RETURNS TEXT AS $$
  SELECT SPLIT_PART(path, '/', 1);
$$ LANGUAGE SQL IMMUTABLE;

-- Extract notice ID from storage path
CREATE OR REPLACE FUNCTION public.storage_notice_id_from_path(path TEXT)
RETURNS UUID AS $$
  SELECT NULLIF(SPLIT_PART(path, '/', 2), '')::UUID;
$$ LANGUAGE SQL IMMUTABLE;

-- Check if user can access notice attachments
CREATE OR REPLACE FUNCTION public.storage_user_can_access_notice(p_notice_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.notices n
    WHERE n.id = p_notice_id
      AND (
        -- Published notices are accessible
        (n.status = 'published' AND n.is_public = true)
        OR
        -- Dept members can access all dept notices
        EXISTS (
          SELECT 1 FROM public.department_memberships
          WHERE department_id = n.department_id
            AND user_id = auth.uid()
        )
        OR
        -- Org admins can access all org notices
        EXISTS (
          SELECT 1 FROM public.organization_memberships om
          WHERE om.organization_id = n.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'org_admin')
        )
      )
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user can upload to notice
CREATE OR REPLACE FUNCTION public.storage_user_can_upload_to_notice(p_notice_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.notices n
    WHERE n.id = p_notice_id
      AND (
        -- Dept editors/admins can upload
        EXISTS (
          SELECT 1 FROM public.department_memberships dm
          WHERE dm.department_id = n.department_id
            AND dm.user_id = auth.uid()
            AND dm.role IN ('department_admin', 'editor')
        )
        OR
        -- Org admins can upload
        EXISTS (
          SELECT 1 FROM public.organization_memberships om
          WHERE om.organization_id = n.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'org_admin')
        )
      )
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- NOTICES BUCKET RLS POLICIES
-- ============================================================================

-- SELECT (Download): Public for published notices, dept members for all
CREATE POLICY notices_storage_select ON storage.objects
FOR SELECT
USING (
  bucket_id = 'notices'
  AND public.storage_user_can_access_notice(public.storage_notice_id_from_path(name))
);

-- INSERT (Upload): Dept editors/admins + org admins
CREATE POLICY notices_storage_insert ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'notices'
  AND public.storage_user_can_upload_to_notice(public.storage_notice_id_from_path(name))
);

-- UPDATE: Same as insert (rename, update metadata)
CREATE POLICY notices_storage_update ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'notices'
  AND public.storage_user_can_upload_to_notice(public.storage_notice_id_from_path(name))
);

-- DELETE: Dept admins + org admins
CREATE POLICY notices_storage_delete ON storage.objects
FOR DELETE
USING (
  bucket_id = 'notices'
  AND public.storage_user_can_upload_to_notice(public.storage_notice_id_from_path(name))
);

-- ============================================================================
-- LOGOS BUCKET RLS POLICIES
-- ============================================================================
-- Logos are public, but only org admins can upload/modify them

-- SELECT: Everyone (bucket is public)
CREATE POLICY logos_storage_select ON storage.objects
FOR SELECT
USING (
  bucket_id = 'logos'
);

-- INSERT: Org admins only
CREATE POLICY logos_storage_insert ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'logos'
  AND (
    -- Path format: organizations/{org-id}/logo.ext
    -- Check user is admin of that org
    SPLIT_PART(name, '/', 1) = 'organizations'
    AND EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = SPLIT_PART(name, '/', 2)::UUID
        AND user_id = auth.uid()
        AND role IN ('owner', 'org_admin')
    )
  )
);

-- UPDATE: Org admins only
CREATE POLICY logos_storage_update ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'logos'
  AND (
    SPLIT_PART(name, '/', 1) = 'organizations'
    AND EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = SPLIT_PART(name, '/', 2)::UUID
        AND user_id = auth.uid()
        AND role IN ('owner', 'org_admin')
    )
  )
);

-- DELETE: Org admins only
CREATE POLICY logos_storage_delete ON storage.objects
FOR DELETE
USING (
  bucket_id = 'logos'
  AND (
    SPLIT_PART(name, '/', 1) = 'organizations'
    AND EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = SPLIT_PART(name, '/', 2)::UUID
        AND user_id = auth.uid()
        AND role IN ('owner', 'org_admin')
    )
  )
);

-- ============================================================================
-- STORAGE UTILITY FUNCTIONS
-- ============================================================================

-- Generate signed URL for private file (notices)
CREATE OR REPLACE FUNCTION get_notice_attachment_url(
  p_attachment_id UUID,
  p_expires_in INTEGER DEFAULT 3600
)
RETURNS TEXT AS $$
DECLARE
  file_path TEXT;
BEGIN
  -- Get storage path from attachment
  SELECT storage_path INTO file_path
  FROM public.attachments
  WHERE id = p_attachment_id;

  IF file_path IS NULL THEN
    RETURN NULL;
  END IF;

  -- Generate signed URL via Supabase Storage API
  -- In practice, this would be called from application code
  -- This is a placeholder for documentation
  RETURN CONCAT(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/sign/notices/',
    file_path,
    '?token=', -- Token would be generated by Supabase Storage API
    '&expiresIn=', p_expires_in
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get public URL for logo
CREATE OR REPLACE FUNCTION get_organization_logo_url(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  logo_path TEXT;
BEGIN
  SELECT logo_url INTO logo_path
  FROM public.organizations
  WHERE id = p_org_id;

  IF logo_path IS NULL THEN
    RETURN NULL;
  END IF;

  -- Return public URL
  RETURN CONCAT(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/public/logos/',
    logo_path
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- CLEANUP FUNCTIONS
-- ============================================================================

-- Delete orphaned files (files not referenced in attachments table)
CREATE OR REPLACE FUNCTION cleanup_orphaned_notice_files()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  count INTEGER := 0;
BEGIN
  -- This would be implemented with Supabase Storage API calls
  -- Placeholder for scheduled cleanup job
  RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.storage_dept_slug_from_path IS 'Extracts department slug from storage path (first segment)';
COMMENT ON FUNCTION public.storage_notice_id_from_path IS 'Extracts notice UUID from storage path (second segment)';
COMMENT ON FUNCTION public.storage_user_can_access_notice IS 'Checks if user can download notice attachments based on notice visibility';
COMMENT ON FUNCTION public.storage_user_can_upload_to_notice IS 'Checks if user can upload attachments to notice (editor/admin permissions)';

COMMENT ON FUNCTION get_notice_attachment_url IS 'Generates signed URL for private notice attachment download';
COMMENT ON FUNCTION get_organization_logo_url IS 'Returns public URL for organization logo';

-- ============================================================================
-- BUCKET PATH STRUCTURE DOCUMENTATION
-- ============================================================================

/*
NOTICES BUCKET PATH STRUCTURE:
  {dept-slug}/{notice-id}/{filename}

  Examples:
    licensing/550e8400-e29b-41d4-a716-446655440000/application.pdf
    planning/123e4567-e89b-12d3-a456-426614174000/site-plan.jpg

LOGOS BUCKET PATH STRUCTURE:
  organizations/{org-id}/logo.{ext}

  Examples:
    organizations/550e8400-e29b-41d4-a716-446655440000/logo.png
    organizations/123e4567-e89b-12d3-a456-426614174000/logo.svg

RLS ENFORCEMENT:
  - Notices bucket: RLS based on notice visibility and user dept membership
  - Logos bucket: Public read, admin-only write
*/
-- Seed Data Migration
-- Creates sample organizations and departments for testing

-- ============================================================================
-- SAMPLE COUNCILS
-- ============================================================================

-- Insert sample councils
INSERT INTO public.organizations (id, type, name, domain, status, contact_email, settings)
VALUES
  (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'council',
    'Sampleton Borough Council',
    'sampleton.gov.uk',
    'active',
    'info@sampleton.gov.uk',
    '{"default_timezone": "Europe/London", "branding_color": "#1e3a8a"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000002'::UUID,
    'council',
    'Riverside City Council',
    'riverside.gov.uk',
    'active',
    'contact@riverside.gov.uk',
    '{"default_timezone": "Europe/London", "branding_color": "#059669"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE DEPARTMENTS
-- ============================================================================

-- Sampleton Borough Council Departments
INSERT INTO public.departments (id, organization_id, name, slug, type, email, description, settings)
VALUES
  (
    '00000000-0000-0000-0001-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Licensing Department',
    'licensing',
    'licensing',
    'licensing@sampleton.gov.uk',
    'Alcohol and entertainment licensing for Sampleton Borough',
    '{
      "default_representation_period_days": 28,
      "require_approval_for_publication": false,
      "allowed_notice_types": ["premises-licence", "variation", "review", "club-certificate"],
      "default_newspaper": "Sampleton Gazette"
    }'::jsonb
  ),
  (
    '00000000-0000-0000-0001-000000000002'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Planning Department',
    'planning',
    'planning',
    'planning@sampleton.gov.uk',
    'Development control and planning applications',
    '{
      "default_representation_period_days": 21,
      "require_approval_for_publication": true,
      "allowed_notice_types": ["planning-application", "planning-appeal"],
      "default_newspaper": "Sampleton Gazette"
    }'::jsonb
  ),
  (
    '00000000-0000-0000-0001-000000000003'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Traffic Management',
    'traffic',
    'traffic',
    'traffic@sampleton.gov.uk',
    'Road closures, traffic orders, and parking',
    '{
      "default_representation_period_days": 14,
      "require_approval_for_publication": false,
      "allowed_notice_types": ["traffic-order", "road-closure"]
    }'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Riverside City Council Departments
INSERT INTO public.departments (id, organization_id, name, slug, type, email, description, settings)
VALUES
  (
    '00000000-0000-0000-0002-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000002'::UUID,
    'Licensing Authority',
    'licensing',
    'licensing',
    'licensing@riverside.gov.uk',
    'Licensing services for Riverside City',
    '{
      "default_representation_period_days": 28,
      "require_approval_for_publication": false,
      "allowed_notice_types": ["premises-licence", "variation"]
    }'::jsonb
  ),
  (
    '00000000-0000-0000-0002-000000000002'::UUID,
    '00000000-0000-0000-0000-000000000002'::UUID,
    'Environmental Health',
    'environmental-health',
    'environmental_health',
    'envhealth@riverside.gov.uk',
    'Food safety, pollution control, and health inspections',
    '{
      "default_representation_period_days": 21,
      "require_approval_for_publication": true
    }'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE FIRMS
-- ============================================================================

INSERT INTO public.organizations (id, type, name, domain, status, contact_email, registration_number, settings)
VALUES
  (
    '00000000-0000-0000-0000-000000000101'::UUID,
    'firm',
    'Wilson & Partners LLP',
    'wilsonpartners.com',
    'active',
    'contact@wilsonpartners.com',
    '12345678',
    '{"default_timezone": "Europe/London"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000102'::UUID,
    'firm',
    'Thompson Legal Services',
    'thompsonlegal.co.uk',
    'active',
    'info@thompsonlegal.co.uk',
    '87654321',
    '{"default_timezone": "Europe/London"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE NOTICE TEMPLATES
-- ============================================================================

-- Template for Sampleton Licensing
INSERT INTO public.templates (id, department_id, name, description, notice_type, default_values, use_count)
VALUES
  (
    '00000000-0000-0001-0001-000000000001'::UUID,
    '00000000-0000-0000-0001-000000000001'::UUID,
    'Standard Pub Licence',
    'Template for typical pub/bar premises licence applications',
    'premises-licence',
    '{
      "consultation": {
        "authority": "Sampleton Borough Council",
        "newspaper": "Sampleton Gazette"
      },
      "extras": {
        "operating_hours": {
          "monday": {"open": "10:00", "close": "23:00"},
          "tuesday": {"open": "10:00", "close": "23:00"},
          "wednesday": {"open": "10:00", "close": "23:00"},
          "thursday": {"open": "10:00", "close": "23:00"},
          "friday": {"open": "10:00", "close": "00:00"},
          "saturday": {"open": "10:00", "close": "00:00"},
          "sunday": {"open": "12:00", "close": "22:30"}
        }
      }
    }'::jsonb,
    0
  ),
  (
    '00000000-0000-0001-0001-000000000002'::UUID,
    '00000000-0000-0000-0001-000000000001'::UUID,
    'Off-Licence Template',
    'Template for off-licence (alcohol sales only)',
    'premises-licence',
    '{
      "consultation": {
        "authority": "Sampleton Borough Council",
        "newspaper": "Sampleton Gazette"
      },
      "extras": {
        "licensable_activities": ["sale_of_alcohol_off"],
        "operating_hours": {
          "all_days": {"open": "08:00", "close": "23:00"}
        }
      }
    }'::jsonb,
    0
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.organizations.id IS 'Sample IDs use pattern: 00000000-0000-0000-00XX-0000000000YY where XX=org type (00=council, 01=firm), YY=sequence';
COMMENT ON COLUMN public.departments.id IS 'Sample IDs use pattern: 00000000-0000-0000-XXYY-0000000000ZZ where XX=org, YY=dept type, ZZ=sequence';

-- Seed data complete
SELECT
  'Seed data loaded: ' ||
  (SELECT COUNT(*) FROM organizations WHERE type = 'council') || ' councils, ' ||
  (SELECT COUNT(*) FROM organizations WHERE type = 'firm') || ' firms, ' ||
  (SELECT COUNT(*) FROM departments) || ' departments, ' ||
  (SELECT COUNT(*) FROM templates) || ' templates'
AS seed_summary;

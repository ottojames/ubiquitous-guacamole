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

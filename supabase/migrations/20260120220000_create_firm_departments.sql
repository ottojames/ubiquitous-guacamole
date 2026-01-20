-- Firm Departments Table
-- Allows firms to organize work by practice area

CREATE TABLE IF NOT EXISTS public.firm_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  firm_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Department details
  name TEXT NOT NULL, -- 'Licensing', 'Probate', 'Planning', 'Traffic & Highways'
  slug TEXT NOT NULL,
  description TEXT,

  -- Configuration
  default_notice_types TEXT[], -- Array of notice type slugs this dept handles
  color TEXT DEFAULT '#6366f1', -- For UI differentiation
  icon TEXT DEFAULT 'folder', -- Icon name

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Ensure unique dept names per firm
  UNIQUE(firm_id, slug)
);

-- Indexes
CREATE INDEX idx_firm_departments_firm ON public.firm_departments(firm_id);
CREATE INDEX idx_firm_departments_status ON public.firm_departments(status) WHERE status = 'active';

-- Trigger for updated_at
CREATE TRIGGER update_firm_departments_updated_at
  BEFORE UPDATE ON public.firm_departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.firm_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members can view their departments" ON public.firm_departments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_departments.firm_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm admins can insert departments" ON public.firm_departments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_departments.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Firm admins can update departments" ON public.firm_departments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_departments.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

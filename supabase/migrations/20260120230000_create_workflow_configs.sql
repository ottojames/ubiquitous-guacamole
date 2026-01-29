-- Workflow Configuration Table
-- Defines customizable workflows per notice type per firm/department

CREATE TABLE IF NOT EXISTS public.workflow_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  firm_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.firm_departments(id) ON DELETE SET NULL,

  -- Configuration
  notice_type TEXT NOT NULL, -- 'premises-licence', 'probate', 'planning', 'tro', 'gvol', 'gambling'
  name TEXT NOT NULL, -- Display name for this workflow
  description TEXT,

  -- Settings
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE, -- If true, use for all notices of this type

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Ensure one default workflow per notice type per firm
  UNIQUE(firm_id, notice_type, is_default) -- PostgreSQL partial unique handled differently
);

-- Indexes
CREATE INDEX idx_workflow_configs_firm ON public.workflow_configs(firm_id);
CREATE INDEX idx_workflow_configs_dept ON public.workflow_configs(department_id);
CREATE INDEX idx_workflow_configs_type ON public.workflow_configs(notice_type);
CREATE INDEX idx_workflow_configs_active ON public.workflow_configs(is_active) WHERE is_active = TRUE;

-- Trigger for updated_at
CREATE TRIGGER update_workflow_configs_updated_at
  BEFORE UPDATE ON public.workflow_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.workflow_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members can view workflows" ON public.workflow_configs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = workflow_configs.firm_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm admins can manage workflows" ON public.workflow_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = workflow_configs.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

GRANT ALL ON public.workflow_configs TO authenticated;

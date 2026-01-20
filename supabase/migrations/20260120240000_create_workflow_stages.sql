-- Workflow Stages Table
-- Individual stages within a workflow

CREATE TABLE IF NOT EXISTS public.workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  workflow_id UUID NOT NULL REFERENCES public.workflow_configs(id) ON DELETE CASCADE,

  -- Stage details
  name TEXT NOT NULL, -- 'Draft', 'Submitted', 'Advertising', 'Consultation', etc.
  slug TEXT NOT NULL, -- 'draft', 'submitted', 'advertising', etc.
  description TEXT,

  -- Position & UI
  position INTEGER NOT NULL DEFAULT 0, -- Order in the workflow
  color TEXT NOT NULL DEFAULT '#6366f1', -- Hex color for Kanban cards
  icon TEXT, -- Optional icon name

  -- Stage behavior
  is_initial BOOLEAN NOT NULL DEFAULT FALSE, -- Starting stage for new notices
  is_terminal BOOLEAN NOT NULL DEFAULT FALSE, -- End stage (Complete, Refused, etc.)
  auto_transition_days INTEGER, -- Auto-move to next stage after N days

  -- Deadline settings
  has_deadline BOOLEAN NOT NULL DEFAULT FALSE,
  deadline_type TEXT CHECK (deadline_type IN ('fixed_days', 'calendar_date', 'calculated')),
  deadline_days INTEGER, -- Days from stage entry
  deadline_working_days BOOLEAN DEFAULT FALSE, -- Use working days only
  deadline_name TEXT, -- 'Consultation End', 'Hearing Date', etc.

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique positions and slugs within workflow
  UNIQUE(workflow_id, position),
  UNIQUE(workflow_id, slug)
);

-- Indexes
CREATE INDEX idx_workflow_stages_workflow ON public.workflow_stages(workflow_id);
CREATE INDEX idx_workflow_stages_position ON public.workflow_stages(workflow_id, position);
CREATE INDEX idx_workflow_stages_initial ON public.workflow_stages(workflow_id, is_initial) WHERE is_initial = TRUE;

-- Trigger for updated_at
CREATE TRIGGER update_workflow_stages_updated_at
  BEFORE UPDATE ON public.workflow_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS - inherit from workflow_configs
ALTER TABLE public.workflow_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members can view stages" ON public.workflow_stages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_configs wc
      JOIN public.organization_memberships om ON om.organization_id = wc.firm_id
      WHERE wc.id = workflow_stages.workflow_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm admins can manage stages" ON public.workflow_stages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_configs wc
      JOIN public.organization_memberships om ON om.organization_id = wc.firm_id
      WHERE wc.id = workflow_stages.workflow_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

GRANT ALL ON public.workflow_stages TO authenticated;

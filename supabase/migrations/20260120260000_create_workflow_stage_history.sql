-- Workflow Stage History Table
-- Audit log of stage transitions for each notice

CREATE TABLE IF NOT EXISTS public.workflow_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  workflow_status_id UUID NOT NULL REFERENCES public.notice_workflow_status(id) ON DELETE CASCADE,

  -- Transition details
  from_stage_id UUID REFERENCES public.workflow_stages(id) ON DELETE SET NULL,
  to_stage_id UUID NOT NULL REFERENCES public.workflow_stages(id) ON DELETE RESTRICT,

  -- Metadata
  transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transitioned_by UUID REFERENCES auth.users(id),
  transition_type TEXT NOT NULL DEFAULT 'manual' CHECK (transition_type IN ('manual', 'automatic', 'system')),
  notes TEXT, -- Optional notes for the transition

  -- Firm context (denormalized for RLS)
  firm_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_workflow_stage_history_notice ON public.workflow_stage_history(notice_id);
CREATE INDEX idx_workflow_stage_history_status ON public.workflow_stage_history(workflow_status_id);
CREATE INDEX idx_workflow_stage_history_firm ON public.workflow_stage_history(firm_id);
CREATE INDEX idx_workflow_stage_history_time ON public.workflow_stage_history(transitioned_at);

-- RLS
ALTER TABLE public.workflow_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members can view stage history" ON public.workflow_stage_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = workflow_stage_history.firm_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm members can insert stage history" ON public.workflow_stage_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = workflow_stage_history.firm_id
      AND om.user_id = auth.uid()
    )
  );

GRANT ALL ON public.workflow_stage_history TO authenticated;

-- Notice Workflow Status Table
-- Tracks which stage each notice is at

CREATE TABLE IF NOT EXISTS public.notice_workflow_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES public.workflow_configs(id) ON DELETE RESTRICT,
  current_stage_id UUID NOT NULL REFERENCES public.workflow_stages(id) ON DELETE RESTRICT,

  -- Firm context (denormalized for RLS efficiency)
  firm_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Current stage details
  entered_stage_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline_date TIMESTAMPTZ, -- Calculated from stage settings

  -- Tracking
  is_overdue BOOLEAN GENERATED ALWAYS AS (deadline_date IS NOT NULL AND deadline_date < NOW()) STORED,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One workflow status per notice
  UNIQUE(notice_id)
);

-- Indexes
CREATE INDEX idx_notice_workflow_status_notice ON public.notice_workflow_status(notice_id);
CREATE INDEX idx_notice_workflow_status_workflow ON public.notice_workflow_status(workflow_id);
CREATE INDEX idx_notice_workflow_status_stage ON public.notice_workflow_status(current_stage_id);
CREATE INDEX idx_notice_workflow_status_firm ON public.notice_workflow_status(firm_id);
CREATE INDEX idx_notice_workflow_status_deadline ON public.notice_workflow_status(deadline_date) WHERE deadline_date IS NOT NULL;
CREATE INDEX idx_notice_workflow_status_overdue ON public.notice_workflow_status(firm_id, is_overdue) WHERE is_overdue = TRUE;

-- Trigger for updated_at
CREATE TRIGGER update_notice_workflow_status_updated_at
  BEFORE UPDATE ON public.notice_workflow_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.notice_workflow_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members can view their notice statuses" ON public.notice_workflow_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = notice_workflow_status.firm_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm members can update notice statuses" ON public.notice_workflow_status
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = notice_workflow_status.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Firm members can insert notice statuses" ON public.notice_workflow_status
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = notice_workflow_status.firm_id
      AND om.user_id = auth.uid()
    )
  );

GRANT ALL ON public.notice_workflow_status TO authenticated;

-- CRITICAL: Councils cannot see this data (workflow is firm-internal)

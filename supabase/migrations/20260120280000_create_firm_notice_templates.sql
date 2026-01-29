-- Firm Notice Templates Table
-- Saved templates per firm for quick notice creation

CREATE TABLE IF NOT EXISTS public.firm_notice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  firm_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.firm_departments(id) ON DELETE SET NULL,

  -- Template details
  name TEXT NOT NULL, -- 'Standard Pub Licence', 'Late Night Variation', etc.
  description TEXT,
  notice_type TEXT NOT NULL, -- 'premises-licence', 'variation', etc.

  -- Template data
  template_data JSONB NOT NULL DEFAULT '{}', -- Pre-filled form fields

  -- Settings
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_shared BOOLEAN NOT NULL DEFAULT TRUE, -- Share across all dept members
  usage_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_used_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_firm_notice_templates_firm ON public.firm_notice_templates(firm_id);
CREATE INDEX idx_firm_notice_templates_dept ON public.firm_notice_templates(department_id);
CREATE INDEX idx_firm_notice_templates_type ON public.firm_notice_templates(notice_type);
CREATE INDEX idx_firm_notice_templates_active ON public.firm_notice_templates(is_active) WHERE is_active = TRUE;

-- Trigger for updated_at
CREATE TRIGGER update_firm_notice_templates_updated_at
  BEFORE UPDATE ON public.firm_notice_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.firm_notice_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members can view shared templates" ON public.firm_notice_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_notice_templates.firm_id
      AND om.user_id = auth.uid()
    )
    AND (is_shared = TRUE OR created_by = auth.uid())
  );

CREATE POLICY "Firm members can create templates" ON public.firm_notice_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_notice_templates.firm_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Template owners can update" ON public.firm_notice_templates
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_notice_templates.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Template owners can delete" ON public.firm_notice_templates
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_notice_templates.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

GRANT ALL ON public.firm_notice_templates TO authenticated;

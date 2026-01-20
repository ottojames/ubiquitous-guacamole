-- Seed Default Workflow Stages for Probate
-- Based on researched stages from todo.md (Trustee Act 1925 s.27)

CREATE OR REPLACE FUNCTION create_default_probate_workflow(p_firm_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  INSERT INTO public.workflow_configs (
    firm_id,
    notice_type,
    name,
    description,
    is_active,
    is_default
  ) VALUES (
    p_firm_id,
    'probate',
    'Probate Notice',
    'Standard workflow for Trustee Act 1925 s.27 probate notices',
    TRUE,
    TRUE
  ) RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_stages (workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days, deadline_working_days, deadline_name) VALUES
    (v_workflow_id, 'Draft', 'draft', 0, '#94a3b8', TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Published', 'published', 1, '#60a5fa', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Waiting Period', 'waiting-period', 2, '#fbbf24', FALSE, FALSE, TRUE, 'fixed_days', 60, FALSE, '2-Month Expiry'),
    (v_workflow_id, 'Claims Received', 'claims-received', 3, '#f97316', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Period Expired', 'period-expired', 4, '#a855f7', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Estate Distributed', 'estate-distributed', 5, '#22c55e', FALSE, TRUE, FALSE, NULL, NULL, NULL, NULL);

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_default_probate_workflow TO authenticated;

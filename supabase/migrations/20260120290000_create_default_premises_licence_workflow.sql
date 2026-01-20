-- Create default premises licence workflow function
-- Seeds 10 stages with correct deadlines based on Licensing Act 2003

-- This function creates default workflow for a firm
CREATE OR REPLACE FUNCTION create_default_premises_licence_workflow(p_firm_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  -- Create the workflow config
  INSERT INTO public.workflow_configs (
    firm_id,
    notice_type,
    name,
    description,
    is_active,
    is_default
  ) VALUES (
    p_firm_id,
    'premises-licence',
    'Premises Licence Application',
    'Standard workflow for Licensing Act 2003 premises licence applications',
    TRUE,
    TRUE
  ) RETURNING id INTO v_workflow_id;

  -- Insert stages in order
  INSERT INTO public.workflow_stages (workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days, deadline_working_days, deadline_name) VALUES
    (v_workflow_id, 'Draft', 'draft', 0, '#94a3b8', TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Pre-Application', 'pre-application', 1, '#a78bfa', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Submitted', 'submitted', 2, '#60a5fa', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Advertising', 'advertising', 3, '#f59e0b', FALSE, FALSE, TRUE, 'fixed_days', 10, TRUE, 'Advertising Deadline'),
    (v_workflow_id, 'Consultation', 'consultation', 4, '#fbbf24', FALSE, FALSE, TRUE, 'fixed_days', 28, FALSE, 'Consultation End'),
    (v_workflow_id, 'Awaiting Decision', 'awaiting-decision', 5, '#818cf8', FALSE, FALSE, TRUE, 'fixed_days', 40, FALSE, 'Decision Target'),
    (v_workflow_id, 'Hearing Scheduled', 'hearing-scheduled', 6, '#f97316', FALSE, FALSE, TRUE, 'calendar_date', NULL, NULL, 'Hearing Date'),
    (v_workflow_id, 'Decision', 'decision', 7, '#a855f7', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Appeal Period', 'appeal-period', 8, '#ef4444', FALSE, FALSE, TRUE, 'fixed_days', 21, FALSE, 'Appeal Window Closes'),
    (v_workflow_id, 'Complete', 'complete', 9, '#22c55e', FALSE, TRUE, FALSE, NULL, NULL, NULL, NULL);

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_default_premises_licence_workflow TO authenticated;

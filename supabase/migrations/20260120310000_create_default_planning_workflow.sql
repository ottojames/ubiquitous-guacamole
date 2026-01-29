-- Seed Default Workflow Stages for Planning Applications
-- Based on researched stages from todo.md

CREATE OR REPLACE FUNCTION create_default_planning_workflow(p_firm_id UUID)
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
    'planning',
    'Planning Application',
    'Standard workflow for planning applications',
    TRUE,
    TRUE
  ) RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_stages (workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days, deadline_working_days, deadline_name) VALUES
    (v_workflow_id, 'Pre-Application', 'pre-application', 0, '#a78bfa', TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Submitted', 'submitted', 1, '#60a5fa', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Validation', 'validation', 2, '#fbbf24', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Consultation', 'consultation', 3, '#f59e0b', FALSE, FALSE, TRUE, 'fixed_days', 21, FALSE, 'Consultation End'),
    (v_workflow_id, 'Site Visit', 'site-visit', 4, '#818cf8', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Amendments', 'amendments', 5, '#f97316', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Officer Report', 'officer-report', 6, '#a855f7', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Committee/Delegated', 'committee-delegated', 7, '#ec4899', FALSE, FALSE, TRUE, 'fixed_days', 56, FALSE, 'Decision Target (8 weeks)'),
    (v_workflow_id, 'Decision', 'decision', 8, '#8b5cf6', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Discharge Conditions', 'discharge-conditions', 9, '#14b8a6', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Appeal', 'appeal', 10, '#ef4444', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Complete', 'complete', 11, '#22c55e', FALSE, TRUE, FALSE, NULL, NULL, NULL, NULL);

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_default_planning_workflow TO authenticated;

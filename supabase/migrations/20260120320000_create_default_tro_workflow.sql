-- Create default TRO (Traffic Regulation Order) workflow function
-- Part of Phase 8: Firm Portal Database Schema

-- TRO - Traffic Regulation Order
CREATE OR REPLACE FUNCTION create_default_tro_workflow(p_firm_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  INSERT INTO public.workflow_configs (firm_id, notice_type, name, description, is_active, is_default)
  VALUES (p_firm_id, 'tro', 'Traffic Regulation Order', 'Standard workflow for TRO notices', TRUE, TRUE)
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_stages (workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days, deadline_name) VALUES
    (v_workflow_id, 'Investigation', 'investigation', 0, '#94a3b8', TRUE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Design', 'design', 1, '#a78bfa', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Statutory Consultation', 'statutory-consultation', 2, '#60a5fa', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Notice of Intention', 'notice-of-intention', 3, '#fbbf24', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Objection Period', 'objection-period', 4, '#f59e0b', FALSE, FALSE, TRUE, 'fixed_days', 21, 'Objection Deadline'),
    (v_workflow_id, 'Objection Review', 'objection-review', 5, '#f97316', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Modifications', 'modifications', 6, '#818cf8', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Notice of Making', 'notice-of-making', 7, '#a855f7', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Implementation', 'implementation', 8, '#14b8a6', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'In Force', 'in-force', 9, '#22c55e', FALSE, TRUE, FALSE, NULL, NULL, NULL);

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_default_tro_workflow TO authenticated;

COMMENT ON FUNCTION create_default_tro_workflow IS 'Creates a default TRO (Traffic Regulation Order) workflow with 10 stages for a given firm. Includes a 21-day deadline for the Objection Period stage.';

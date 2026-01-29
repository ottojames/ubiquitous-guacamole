-- Create default GVOL (Goods Vehicle Operator Licence) workflow function
-- Part of Phase 8: Firm Portal Database Schema

-- GVOL - Goods Vehicle Operator Licence
CREATE OR REPLACE FUNCTION create_default_gvol_workflow(p_firm_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  INSERT INTO public.workflow_configs (firm_id, notice_type, name, description, is_active, is_default)
  VALUES (p_firm_id, 'gvol', 'Goods Vehicle Operator Licence', 'Standard workflow for O licence applications', TRUE, TRUE)
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_stages (workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days, deadline_name) VALUES
    (v_workflow_id, 'Preparation', 'preparation', 0, '#94a3b8', TRUE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Application Submitted', 'application-submitted', 1, '#60a5fa', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Newspaper Advertisement', 'newspaper-advertisement', 2, '#fbbf24', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Traffic Commissioner Review', 'tc-review', 3, '#818cf8', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Objection Period', 'objection-period', 4, '#f59e0b', FALSE, FALSE, TRUE, 'fixed_days', 40, 'Decision Target'),
    (v_workflow_id, 'Decision', 'decision', 5, '#a855f7', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Interim Licence', 'interim-licence', 6, '#14b8a6', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Licence Issued', 'licence-issued', 7, '#22c55e', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Renewal Due', 'renewal-due', 8, '#f97316', FALSE, TRUE, TRUE, 'fixed_days', 1825, '5-Year Renewal');

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_default_gvol_workflow TO authenticated;

COMMENT ON FUNCTION create_default_gvol_workflow IS 'Creates a default GVOL (Goods Vehicle Operator Licence) workflow with 9 stages for a given firm. Includes a 40-day deadline for the Objection Period stage and a 1825-day (5-year) renewal deadline.';

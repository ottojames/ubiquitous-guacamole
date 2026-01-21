-- Create default Gambling premises licence workflow function
-- Part of Phase 8: Firm Portal Database Schema

-- Gambling - Gambling Act 2005 premises licence applications
CREATE OR REPLACE FUNCTION create_default_gambling_workflow(p_firm_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  INSERT INTO public.workflow_configs (firm_id, notice_type, name, description, is_active, is_default)
  VALUES (p_firm_id, 'gambling', 'Gambling Premises Licence', 'Standard workflow for Gambling Act 2005 applications', TRUE, TRUE)
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_stages (workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days, deadline_name) VALUES
    (v_workflow_id, 'Operating Licence', 'operating-licence', 0, '#94a3b8', TRUE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Application Submitted', 'application-submitted', 1, '#60a5fa', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Notify Authorities', 'notify-authorities', 2, '#fbbf24', FALSE, FALSE, TRUE, 'fixed_days', 7, 'Authority Notification Deadline'),
    (v_workflow_id, 'Advertisement', 'advertisement', 3, '#f59e0b', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Consultation', 'consultation', 4, '#818cf8', FALSE, FALSE, TRUE, 'fixed_days', 28, 'Consultation End'),
    (v_workflow_id, 'Representations', 'representations', 5, '#f97316', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Determination', 'determination', 6, '#a855f7', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Decision', 'decision', 7, '#8b5cf6', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Appeal Period', 'appeal-period', 8, '#ef4444', FALSE, FALSE, TRUE, 'fixed_days', 21, 'Appeal Window Closes'),
    (v_workflow_id, 'Complete', 'complete', 9, '#22c55e', FALSE, TRUE, FALSE, NULL, NULL, NULL);

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_default_gambling_workflow TO authenticated;

COMMENT ON FUNCTION create_default_gambling_workflow IS 'Creates a default Gambling premises licence workflow with 10 stages for a given firm. Includes 7-day deadline for authority notification, 28-day consultation period, and 21-day appeal window.';

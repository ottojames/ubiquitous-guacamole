-- Migration: Create transition_notice_stage function
-- Description: Function to transition a notice to a new workflow stage
--              Records history and calculates new deadline

CREATE OR REPLACE FUNCTION transition_notice_stage(
  p_notice_id UUID,
  p_to_stage_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_transition_type TEXT DEFAULT 'manual'
)
RETURNS UUID AS $$
DECLARE
  v_workflow_status RECORD;
  v_new_stage RECORD;
  v_history_id UUID;
  v_new_deadline TIMESTAMPTZ;
BEGIN
  -- Get current workflow status
  SELECT * INTO v_workflow_status
  FROM public.notice_workflow_status
  WHERE notice_id = p_notice_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No workflow status found for notice %', p_notice_id;
  END IF;

  -- Get new stage details
  SELECT * INTO v_new_stage
  FROM public.workflow_stages
  WHERE id = p_to_stage_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stage % not found', p_to_stage_id;
  END IF;

  -- Validate stage belongs to same workflow
  IF v_new_stage.workflow_id != v_workflow_status.workflow_id THEN
    RAISE EXCEPTION 'Stage % does not belong to workflow %', p_to_stage_id, v_workflow_status.workflow_id;
  END IF;

  -- Calculate deadline if stage has one
  IF v_new_stage.has_deadline AND v_new_stage.deadline_type = 'fixed_days' THEN
    IF v_new_stage.deadline_working_days THEN
      -- Add working days (simple: skip weekends)
      v_new_deadline := NOW() + (v_new_stage.deadline_days * INTERVAL '1.4 day'); -- Rough estimate
    ELSE
      v_new_deadline := NOW() + (v_new_stage.deadline_days || ' days')::INTERVAL;
    END IF;
  END IF;

  -- Record history
  INSERT INTO public.workflow_stage_history (
    notice_id,
    workflow_status_id,
    from_stage_id,
    to_stage_id,
    transition_type,
    notes,
    transitioned_by,
    firm_id
  ) VALUES (
    p_notice_id,
    v_workflow_status.id,
    v_workflow_status.current_stage_id,
    p_to_stage_id,
    p_transition_type,
    p_notes,
    auth.uid(),
    v_workflow_status.firm_id
  ) RETURNING id INTO v_history_id;

  -- Update workflow status
  UPDATE public.notice_workflow_status
  SET
    current_stage_id = p_to_stage_id,
    entered_stage_at = NOW(),
    deadline_date = v_new_deadline,
    updated_at = NOW()
  WHERE id = v_workflow_status.id;

  -- TODO: Schedule deadline reminders if applicable

  RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION transition_notice_stage TO authenticated;

-- Add comment describing the function
COMMENT ON FUNCTION transition_notice_stage IS 'Transitions a notice to a new workflow stage. Validates stage belongs to same workflow, records history, and calculates new deadline if applicable.';

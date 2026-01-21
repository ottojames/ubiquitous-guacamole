-- Function to initialize workflow for a newly published notice
-- Called when firm publishes a notice

CREATE OR REPLACE FUNCTION initialize_notice_workflow(
  p_notice_id UUID,
  p_firm_id UUID,
  p_notice_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_workflow_config RECORD;
  v_initial_stage RECORD;
  v_status_id UUID;
  v_deadline TIMESTAMPTZ;
BEGIN
  -- Find default workflow for this notice type for this firm
  SELECT * INTO v_workflow_config
  FROM public.workflow_configs
  WHERE firm_id = p_firm_id
    AND notice_type = p_notice_type
    AND is_active = TRUE
    AND is_default = TRUE
  LIMIT 1;

  -- If no firm-specific workflow, check if we should create one
  IF NOT FOUND THEN
    -- Create default workflow for this firm
    CASE p_notice_type
      WHEN 'premises-licence' THEN
        SELECT create_default_premises_licence_workflow(p_firm_id) INTO v_workflow_config.id;
      WHEN 'probate' THEN
        SELECT create_default_probate_workflow(p_firm_id) INTO v_workflow_config.id;
      WHEN 'planning' THEN
        SELECT create_default_planning_workflow(p_firm_id) INTO v_workflow_config.id;
      WHEN 'tro' THEN
        SELECT create_default_tro_workflow(p_firm_id) INTO v_workflow_config.id;
      WHEN 'gvol' THEN
        SELECT create_default_gvol_workflow(p_firm_id) INTO v_workflow_config.id;
      WHEN 'gambling' THEN
        SELECT create_default_gambling_workflow(p_firm_id) INTO v_workflow_config.id;
      ELSE
        -- Default to premises-licence workflow as fallback
        SELECT create_default_premises_licence_workflow(p_firm_id) INTO v_workflow_config.id;
    END CASE;

    -- Refresh to get the workflow
    SELECT * INTO v_workflow_config
    FROM public.workflow_configs
    WHERE id = v_workflow_config.id;
  END IF;

  -- Get initial stage
  SELECT * INTO v_initial_stage
  FROM public.workflow_stages
  WHERE workflow_id = v_workflow_config.id
    AND is_initial = TRUE
  LIMIT 1;

  IF NOT FOUND THEN
    -- Fall back to first stage by position
    SELECT * INTO v_initial_stage
    FROM public.workflow_stages
    WHERE workflow_id = v_workflow_config.id
    ORDER BY position ASC
    LIMIT 1;
  END IF;

  -- Calculate deadline if initial stage has one
  IF v_initial_stage.has_deadline AND v_initial_stage.deadline_type = 'fixed_days' THEN
    v_deadline := NOW() + (v_initial_stage.deadline_days || ' days')::INTERVAL;
  END IF;

  -- Create workflow status
  INSERT INTO public.notice_workflow_status (
    notice_id,
    workflow_id,
    current_stage_id,
    firm_id,
    entered_stage_at,
    deadline_date
  ) VALUES (
    p_notice_id,
    v_workflow_config.id,
    v_initial_stage.id,
    p_firm_id,
    NOW(),
    v_deadline
  ) RETURNING id INTO v_status_id;

  -- Record initial history entry
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
    v_status_id,
    NULL, -- No previous stage
    v_initial_stage.id,
    'system',
    'Workflow initialized',
    auth.uid(),
    p_firm_id
  );

  RETURN v_status_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION initialize_notice_workflow TO authenticated;

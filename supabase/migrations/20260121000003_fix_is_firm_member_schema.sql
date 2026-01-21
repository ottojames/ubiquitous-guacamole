-- Migration: Fix is_firm_member helper function schema
-- Description: The auth schema is protected by Supabase. Move the helper function
--              to public schema and update all references.
--
-- This fixes the issue from migration 20260121000002 where auth.is_firm_member
-- couldn't be created due to permission denied for schema auth.

-- ============================================================================
-- HELPER FUNCTION: Check firm membership (in public schema)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_firm_member(p_firm_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.organization_id = p_firm_id
      AND om.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_firm_member IS 'Returns true if the current user is a member of the specified organization/firm';

-- Grant execute to authenticated users (they call this indirectly through other functions)
GRANT EXECUTE ON FUNCTION public.is_firm_member(UUID) TO authenticated;

-- ============================================================================
-- Update all SECURITY DEFINER functions to use public.is_firm_member
-- ============================================================================

-- 1. transition_notice_stage
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
  -- AUTHORIZATION CHECK: Verify caller is member of the firm
  -- Get workflow status first to check firm membership
  SELECT * INTO v_workflow_status
  FROM public.notice_workflow_status
  WHERE notice_id = p_notice_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No workflow status found for notice %', p_notice_id;
  END IF;

  -- Check if user is a member of the firm that owns this workflow
  IF NOT public.is_firm_member(v_workflow_status.firm_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of the firm that owns this notice';
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

  RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION transition_notice_stage IS 'Transitions a notice to a new workflow stage. Verifies caller is firm member, validates stage belongs to same workflow, records history, and calculates new deadline.';

-- 2. initialize_notice_workflow
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
  -- AUTHORIZATION CHECK: Verify caller is member of the firm
  IF NOT public.is_firm_member(p_firm_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of the specified firm';
  END IF;

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

COMMENT ON FUNCTION initialize_notice_workflow IS 'Initializes workflow for a notice. Verifies caller is firm member before proceeding.';

-- 3. create_default_premises_licence_workflow
CREATE OR REPLACE FUNCTION create_default_premises_licence_workflow(p_firm_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  -- AUTHORIZATION CHECK: Verify caller is member of the firm
  IF NOT public.is_firm_member(p_firm_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of the specified firm';
  END IF;

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

COMMENT ON FUNCTION create_default_premises_licence_workflow IS 'Creates default premises licence workflow. Verifies caller is firm member before proceeding.';

-- 4. create_default_probate_workflow
CREATE OR REPLACE FUNCTION create_default_probate_workflow(p_firm_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  -- AUTHORIZATION CHECK: Verify caller is member of the firm
  IF NOT public.is_firm_member(p_firm_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of the specified firm';
  END IF;

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
    'Standard workflow for s.27 Trustee Act 1925 notices with 60-day waiting period',
    TRUE,
    TRUE
  ) RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_stages (workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days, deadline_working_days, deadline_name) VALUES
    (v_workflow_id, 'Draft', 'draft', 0, '#94a3b8', TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Published', 'published', 1, '#60a5fa', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, '60-Day Wait', 'waiting-period', 2, '#fbbf24', FALSE, FALSE, TRUE, 'fixed_days', 60, FALSE, 'Claims Period End'),
    (v_workflow_id, 'Period Expired', 'period-expired', 3, '#a855f7', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Estate Distributed', 'estate-distributed', 4, '#22c55e', FALSE, TRUE, FALSE, NULL, NULL, NULL, NULL);

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_default_probate_workflow IS 'Creates default probate workflow. Verifies caller is firm member before proceeding.';

-- 5. create_default_planning_workflow
CREATE OR REPLACE FUNCTION create_default_planning_workflow(p_firm_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  -- AUTHORIZATION CHECK: Verify caller is member of the firm
  IF NOT public.is_firm_member(p_firm_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of the specified firm';
  END IF;

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
    'Standard workflow for Town and Country Planning Act applications',
    TRUE,
    TRUE
  ) RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_stages (workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days, deadline_working_days, deadline_name) VALUES
    (v_workflow_id, 'Draft', 'draft', 0, '#94a3b8', TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Pre-Application', 'pre-application', 1, '#a78bfa', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Submitted', 'submitted', 2, '#60a5fa', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Validation', 'validation', 3, '#fbbf24', FALSE, FALSE, TRUE, 'fixed_days', 5, TRUE, 'Validation Target'),
    (v_workflow_id, 'Consultation', 'consultation', 4, '#f59e0b', FALSE, FALSE, TRUE, 'fixed_days', 21, FALSE, 'Consultation End'),
    (v_workflow_id, 'Site Visit', 'site-visit', 5, '#14b8a6', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Officer Report', 'officer-report', 6, '#818cf8', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Committee', 'committee', 7, '#f97316', FALSE, FALSE, TRUE, 'calendar_date', NULL, NULL, 'Committee Date'),
    (v_workflow_id, 'Decision', 'decision', 8, '#a855f7', FALSE, FALSE, TRUE, 'fixed_days', 56, FALSE, 'Decision Target (8 weeks)'),
    (v_workflow_id, 'Appeal', 'appeal', 9, '#ef4444', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Complete', 'complete', 10, '#22c55e', FALSE, TRUE, FALSE, NULL, NULL, NULL, NULL);

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_default_planning_workflow IS 'Creates default planning workflow. Verifies caller is firm member before proceeding.';

-- 6. create_default_tro_workflow
CREATE OR REPLACE FUNCTION create_default_tro_workflow(p_firm_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  -- AUTHORIZATION CHECK: Verify caller is member of the firm
  IF NOT public.is_firm_member(p_firm_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of the specified firm';
  END IF;

  INSERT INTO public.workflow_configs (
    firm_id,
    notice_type,
    name,
    description,
    is_active,
    is_default
  ) VALUES (
    p_firm_id,
    'tro',
    'Traffic Regulation Order',
    'Workflow for Road Traffic Regulation Act 1984 orders',
    TRUE,
    TRUE
  ) RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_stages (workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days, deadline_name) VALUES
    (v_workflow_id, 'Draft', 'draft', 0, '#94a3b8', TRUE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Consultation Draft', 'consultation-draft', 1, '#a78bfa', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Notice Published', 'notice-published', 2, '#60a5fa', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Objection Period', 'objection-period', 3, '#fbbf24', FALSE, FALSE, TRUE, 'fixed_days', 21, 'Objection Deadline'),
    (v_workflow_id, 'Objections Review', 'objections-review', 4, '#f59e0b', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Committee/Decision', 'committee-decision', 5, '#818cf8', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Order Made', 'order-made', 6, '#a855f7', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Appeal Period', 'appeal-period', 7, '#ef4444', FALSE, FALSE, TRUE, 'fixed_days', 21, 'Appeal Window Closes'),
    (v_workflow_id, 'Implementation', 'implementation', 8, '#14b8a6', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'In Force', 'in-force', 9, '#22c55e', FALSE, TRUE, FALSE, NULL, NULL, NULL);

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_default_tro_workflow IS 'Creates default TRO workflow. Verifies caller is firm member before proceeding.';

-- 7. create_default_gvol_workflow
CREATE OR REPLACE FUNCTION create_default_gvol_workflow(p_firm_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  -- AUTHORIZATION CHECK: Verify caller is member of the firm
  IF NOT public.is_firm_member(p_firm_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of the specified firm';
  END IF;

  INSERT INTO public.workflow_configs (
    firm_id,
    notice_type,
    name,
    description,
    is_active,
    is_default
  ) VALUES (
    p_firm_id,
    'gvol',
    'Goods Vehicle Operator Licence',
    'Workflow for Goods Vehicle Operator Licensing applications',
    TRUE,
    TRUE
  ) RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_stages (workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days, deadline_name) VALUES
    (v_workflow_id, 'Draft', 'draft', 0, '#94a3b8', TRUE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Application Submitted', 'submitted', 1, '#60a5fa', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Notice Published', 'notice-published', 2, '#a78bfa', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Objection Period', 'objection-period', 3, '#fbbf24', FALSE, FALSE, TRUE, 'fixed_days', 40, 'Objection Deadline'),
    (v_workflow_id, 'TC Assessment', 'tc-assessment', 4, '#f59e0b', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Public Inquiry', 'public-inquiry', 5, '#818cf8', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Decision', 'decision', 6, '#a855f7', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Licence Issued', 'licence-issued', 7, '#22c55e', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Renewal Due', 'renewal-due', 8, '#f97316', FALSE, TRUE, TRUE, 'fixed_days', 1825, '5-Year Renewal');

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_default_gvol_workflow IS 'Creates default GVOL workflow. Verifies caller is firm member before proceeding.';

-- 8. create_default_gambling_workflow
CREATE OR REPLACE FUNCTION create_default_gambling_workflow(p_firm_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  -- AUTHORIZATION CHECK: Verify caller is member of the firm
  IF NOT public.is_firm_member(p_firm_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of the specified firm';
  END IF;

  INSERT INTO public.workflow_configs (
    firm_id,
    notice_type,
    name,
    description,
    is_active,
    is_default
  ) VALUES (
    p_firm_id,
    'gambling',
    'Gambling Premises Licence',
    'Workflow for Gambling Act 2005 premises licence applications',
    TRUE,
    TRUE
  ) RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_stages (workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days, deadline_name) VALUES
    (v_workflow_id, 'Draft', 'draft', 0, '#94a3b8', TRUE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Pre-Application', 'pre-application', 1, '#a78bfa', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Submitted', 'submitted', 2, '#60a5fa', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Authority Notification', 'authority-notification', 3, '#f59e0b', FALSE, FALSE, TRUE, 'fixed_days', 7, 'Notify Authorities'),
    (v_workflow_id, 'Advertising', 'advertising', 4, '#fbbf24', FALSE, FALSE, TRUE, 'fixed_days', 28, 'Consultation End'),
    (v_workflow_id, 'Assessment', 'assessment', 5, '#818cf8', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Hearing', 'hearing', 6, '#f97316', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Decision', 'decision', 7, '#a855f7', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Appeal Period', 'appeal-period', 8, '#ef4444', FALSE, FALSE, TRUE, 'fixed_days', 21, 'Appeal Window Closes'),
    (v_workflow_id, 'Complete', 'complete', 9, '#22c55e', FALSE, TRUE, FALSE, NULL, NULL, NULL);

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_default_gambling_workflow IS 'Creates default gambling workflow. Verifies caller is firm member before proceeding.';

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This migration fixes the issue from 20260121000002 where we couldn't create
-- auth.is_firm_member due to permission denied on the auth schema.
--
-- Solution: Create public.is_firm_member instead and update all SECURITY DEFINER
-- functions to reference public.is_firm_member instead of auth.is_firm_member.

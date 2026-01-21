import { Router } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All workflow routes require authentication
router.use(requireAuth);

/**
 * GET /api/workflow/configs
 * Returns all active workflows for the user's firm
 */
router.get('/configs', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const firmId = req.user?.organizationId;

    if (!firmId) {
      return res.status(400).json({ error: 'No firm context' });
    }

    const { data, error } = await supabase
      .from('workflow_configs')
      .select(`
        *,
        stages:workflow_stages(*)
      `)
      .eq('firm_id', firmId)
      .eq('is_active', true)
      .order('notice_type');

    if (error) {
      console.error('[workflow-configs] Error fetching configs:', error);
      return res.status(500).json({ error: 'Failed to fetch workflow configurations' });
    }

    // Sort stages by position within each config
    const configs = data?.map(config => ({
      ...config,
      stages: config.stages?.sort((a: any, b: any) => a.position - b.position)
    })) || [];

    return res.json({ configs });
  } catch (error: any) {
    console.error('[workflow-configs] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/workflow/configs/:noticeType
 * Returns the workflow configuration for a specific notice type
 */
router.get('/configs/:noticeType', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const firmId = req.user?.organizationId;
    const { noticeType } = req.params;

    if (!firmId) {
      return res.status(400).json({ error: 'No firm context' });
    }

    if (!noticeType) {
      return res.status(400).json({ error: 'Notice type is required' });
    }

    const { data, error } = await supabase
      .from('workflow_configs')
      .select(`
        *,
        stages:workflow_stages(*)
      `)
      .eq('firm_id', firmId)
      .eq('notice_type', noticeType)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('[workflow-configs/:noticeType] Error:', error);
      return res.status(500).json({ error: 'Failed to fetch workflow configuration' });
    }

    if (!data) {
      return res.status(404).json({ error: 'No workflow found for this notice type' });
    }

    // Sort stages by position
    const config = {
      ...data,
      stages: data.stages?.sort((a: any, b: any) => a.position - b.position) || []
    };

    return res.json({ config });
  } catch (error: any) {
    console.error('[workflow-configs/:noticeType] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/workflow/notices/:noticeId/status
 * Returns the workflow status for a specific notice with current stage details
 */
router.get('/notices/:noticeId/status', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const firmId = req.user?.organizationId;
    const { noticeId } = req.params;

    if (!firmId) {
      return res.status(400).json({ error: 'No firm context' });
    }

    if (!noticeId) {
      return res.status(400).json({ error: 'Notice ID is required' });
    }

    const { data, error } = await supabase
      .from('notice_workflow_status')
      .select(`
        *,
        current_stage:workflow_stages(*),
        workflow:workflow_configs(*)
      `)
      .eq('notice_id', noticeId)
      .eq('firm_id', firmId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[workflow/notices/:noticeId/status] Error:', error);
      return res.status(500).json({ error: 'Failed to fetch notice workflow status' });
    }

    if (!data) {
      return res.status(404).json({ error: 'No workflow status found for this notice' });
    }

    // Calculate is_overdue in application layer (deadline_date < NOW())
    const isOverdue = data.deadline_date
      ? new Date(data.deadline_date) < new Date()
      : false;

    const status = {
      ...data,
      is_overdue: isOverdue
    };

    return res.json({ status });
  } catch (error: any) {
    console.error('[workflow/notices/:noticeId/status] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/workflow/notices/:noticeId/transition
 * Moves a notice to a new workflow stage
 */
router.post('/notices/:noticeId/transition', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const firmId = req.user?.organizationId;
    const userId = req.user?.id;
    const { noticeId } = req.params;
    const { toStageId, notes } = req.body;

    if (!firmId) {
      return res.status(400).json({ error: 'No firm context' });
    }

    if (!noticeId) {
      return res.status(400).json({ error: 'Notice ID is required' });
    }

    if (!toStageId) {
      return res.status(400).json({ error: 'Target stage ID is required' });
    }

    // Verify notice belongs to this firm before transitioning
    const { data: status, error: statusError } = await supabase
      .from('notice_workflow_status')
      .select('id, firm_id')
      .eq('notice_id', noticeId)
      .single();

    if (statusError && statusError.code !== 'PGRST116') {
      console.error('[workflow/notices/:noticeId/transition] Status check error:', statusError);
      return res.status(500).json({ error: 'Failed to verify notice access' });
    }

    if (!status) {
      return res.status(404).json({ error: 'No workflow status found for this notice' });
    }

    if (status.firm_id !== firmId) {
      return res.status(403).json({ error: 'Access denied to this notice' });
    }

    // Call the transition function
    const { data, error } = await supabase.rpc('transition_notice_stage', {
      p_notice_id: noticeId,
      p_to_stage_id: toStageId,
      p_notes: notes || null,
      p_transition_type: 'manual'
    });

    if (error) {
      console.error('[workflow/notices/:noticeId/transition] Transition error:', error);
      return res.status(400).json({ error: error.message || 'Failed to transition notice' });
    }

    return res.json({ historyId: data, success: true });
  } catch (error: any) {
    console.error('[workflow/notices/:noticeId/transition] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

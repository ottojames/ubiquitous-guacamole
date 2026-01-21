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

export default router;

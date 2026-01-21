import { Router } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All firm template routes require authentication
router.use(requireAuth);

/**
 * GET /api/firm/templates
 * Returns all templates for the user's firm
 * Query params: notice_type (optional filter)
 */
router.get('/', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const firmId = req.user?.organizationId;
    const noticeType = req.query.notice_type as string | undefined;

    if (!firmId) {
      return res.status(400).json({ error: 'No firm context' });
    }

    let query = supabase
      .from('firm_notice_templates')
      .select('*')
      .eq('firm_id', firmId)
      .eq('is_active', true)
      .order('name');

    if (noticeType) {
      query = query.eq('notice_type', noticeType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[firm-templates] Error fetching templates:', error);
      return res.status(500).json({ error: 'Failed to fetch templates' });
    }

    return res.json({ templates: data || [] });
  } catch (error: any) {
    console.error('[firm-templates] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

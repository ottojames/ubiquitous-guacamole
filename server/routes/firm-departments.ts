import { Router } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All firm department routes require authentication
router.use(requireAuth);

/**
 * GET /api/firm/departments
 * Returns all departments for the user's firm
 */
router.get('/', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const firmId = req.user?.organizationId;

    if (!firmId) {
      return res.status(400).json({ error: 'No firm context' });
    }

    const { data, error } = await supabase
      .from('firm_departments')
      .select('*')
      .eq('firm_id', firmId)
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('[firm-departments] Error fetching departments:', error);
      return res.status(500).json({ error: 'Failed to fetch departments' });
    }

    return res.json({ departments: data || [] });
  } catch (error: any) {
    console.error('[firm-departments] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

import { Router } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';

const router = Router();

/**
 * GET /api/stats
 * Returns real counts from the database for the homepage
 */
router.get('/', async (_req, res) => {
  try {
    const supabase = getServiceSupabaseClient();

    // Run all count queries in parallel for performance
    const [noticesResult, representationsResult, councilsResult] = await Promise.all([
      supabase.from('notices').select('id', { count: 'exact', head: true }),
      supabase.from('representations').select('id', { count: 'exact', head: true }),
      supabase.from('councils').select('id', { count: 'exact', head: true }),
    ]);

    // Check for errors
    if (noticesResult.error || representationsResult.error || councilsResult.error) {
      console.error('Stats query error:', {
        notices: noticesResult.error,
        representations: representationsResult.error,
        councils: councilsResult.error,
      });
      return res.status(500).json({
        ok: false,
        error: { code: 'DB_ERROR', message: 'Failed to fetch stats' },
      });
    }

    // Return real counts
    return res.json({
      ok: true,
      data: {
        notices: noticesResult.count || 0,
        representations: representationsResult.count || 0,
        councils: councilsResult.count || 0,
      },
    });
  } catch (err) {
    console.error('Stats endpoint error:', err);
    return res.status(500).json({
      ok: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
});

export default router;

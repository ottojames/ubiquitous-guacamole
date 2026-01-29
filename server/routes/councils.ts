import { Router } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';

const router = Router();

/**
 * GET /api/councils
 * Search councils by name
 */
router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim();

  const sb = getServiceSupabaseClient();

  // If query provided, filter by name, otherwise return all
  let query = sb
    .from('councils')
    .select('id, name, slug')
    .order('name');

  if (q) {
    query = query.ilike('name', `%${q}%`).limit(10);
  }

  const { data, error } = await query;

  if (error) {
    return res
      .status(500)
      .json({ ok: false, error: { code: 'DB_ERROR', message: error.message } });
  }

  res.json(data || []);
});

/**
 * GET /api/councils/:councilName/licensing-requirements
 * Returns licensing authority requirements for a council
 * Used to auto-populate form fields and provide guidance
 */
router.get('/:councilName/licensing-requirements', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const { councilName } = req.params;

    if (!councilName) {
      return res.status(400).json({ error: 'Council name is required' });
    }

    // Decode URL-encoded council name
    const decodedName = decodeURIComponent(councilName);

    // Try exact match first, then partial match
    let { data } = await supabase
      .from('council_licensing_requirements')
      .select('*')
      .ilike('council_name', decodedName)
      .single();

    // If no exact match, try partial match
    if (!data) {
      const { data: partialMatch } = await supabase
        .from('council_licensing_requirements')
        .select('*')
        .ilike('council_name', `%${decodedName}%`)
        .limit(1)
        .single();
      data = partialMatch;
    }

    if (!data) {
      // Return default requirements if no specific data found
      return res.json({
        council_name: decodedName,
        consultation_period_days: 28,
        requires_newspaper_advert: true,
        found: false,
        message: 'No specific requirements found for this council. Using standard defaults.'
      });
    }

    return res.json({ ...data, found: true });
  } catch (error: any) {
    console.error('[council-requirements] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch council requirements' });
  }
});

/**
 * GET /api/councils/search-with-requirements
 * Search councils with their licensing requirements
 */
router.get('/search-with-requirements', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const q = String(req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    // Search councils and join with requirements
    const { data: councils, error } = await supabase
      .from('councils')
      .select('id, name, slug')
      .ilike('name', `%${q}%`)
      .limit(limit);

    if (error) {
      console.error('[council-search] Error:', error);
      return res.status(500).json({ error: 'Search failed' });
    }

    // Enrich with licensing requirements
    const enrichedCouncils = await Promise.all(
      (councils || []).map(async (council) => {
        const { data: requirements } = await supabase
          .from('council_licensing_requirements')
          .select('licensing_email, licensing_phone, licensing_website_url, special_policy_areas')
          .ilike('council_name', `%${council.name}%`)
          .limit(1)
          .single();

        return {
          ...council,
          hasLicensingRequirements: !!requirements,
          licensing: requirements || null
        };
      })
    );

    return res.json(enrichedCouncils);
  } catch (error: any) {
    console.error('[council-search-requirements] Error:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * POST /api/councils/licensing-requirements
 * Create or update council licensing requirements (admin only)
 */
router.post('/licensing-requirements', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const requirements = req.body;

    if (!requirements.council_name) {
      return res.status(400).json({ error: 'Council name is required' });
    }

    const { data, error } = await supabase
      .from('council_licensing_requirements')
      .upsert({
        ...requirements,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'council_name'
      })
      .select()
      .single();

    if (error) {
      console.error('[council-requirements-upsert] Error:', error);
      return res.status(500).json({ error: 'Failed to save requirements' });
    }

    return res.json(data);
  } catch (error: any) {
    console.error('[council-requirements-upsert] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

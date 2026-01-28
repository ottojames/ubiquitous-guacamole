import { Router } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';

const router = Router();

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

export default router;


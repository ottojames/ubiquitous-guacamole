import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return res
      .status(500)
      .json({ ok: false, error: { code: 'NO_SUPABASE', message: 'Supabase not configured' } });
  }

  const sb = createClient(url, key);
  const { data, error } = await sb
    .from('councils')
    .select('id, name, email')
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(10);

  if (error) {
    return res
      .status(500)
      .json({ ok: false, error: { code: 'DB_ERROR', message: error.message } });
  }

  res.json(data || []);
});

export default router;


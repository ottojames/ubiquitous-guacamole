import { Router } from 'express';
import { searchAddress } from '../services/addressProvider';

const router = Router();

router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ ok: true, results: [] });

  if (!process.env.ADDRESS_PROVIDER) {
    return res.json({ ok: true, results: [] });
  }

  try {
    const results = await searchAddress(q);
    return res.json({ ok: true, results });
  } catch (e) {
    console.error('[ADDRESS_SEARCH_ERR]', e);
    return res.json({ ok: true, results: [] });
  }
});

export default router;

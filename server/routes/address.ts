import { Router } from 'express'
import { searchAddress } from '../services/addressProvider'

const router = Router()

router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    if (!q) return res.json({ suggestions: [] })
    const results = await searchAddress(q)
    return res.json({ suggestions: results })
  } catch (err) {
    return res.json({ suggestions: [] })
  }
})

export default router

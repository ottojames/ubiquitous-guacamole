import { Router } from 'express'
import multer from 'multer'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
})

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: { code: 'NO_FILE', message: 'No file uploaded' } })
    }

    const meta = {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    }

    // Echo back any form fields we care about
    const applicantEmail = String(req.body.applicantEmail || '')

    return res.status(200).json({
      ok: true,
      message: 'upload received',
      meta,
      applicantEmail
    })
  } catch (err: any) {
    console.error('[upload] error:', err)
    return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: err?.message || 'Unknown' } })
  }
})

export default router

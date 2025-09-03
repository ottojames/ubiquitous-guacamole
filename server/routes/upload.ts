import { Router } from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import slugify from 'slugify'
import { ocrFile } from '../utils/ocr'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

const router = Router()

router.post('/', upload.single('file'), async (req, res) => {
  const requestId = randomUUID()
  const file = req.file
  if (!file) {
    return res.status(400).json({
      ok: false,
      code: 'NO_FILE',
      message: 'No file provided',
      requestId,
    })
  }

  try {
    const now = new Date()
    const safeName = slugify(file.originalname, { lower: true })
    const path = `uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(
      now.getDate(),
    ).padStart(2, '0')}/${requestId}-${safeName}`

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const bucket = process.env.SUPABASE_BUCKET || 'notices'

    const uploaded = await supabase.storage
      .from(bucket)
      .upload(path, file.buffer, { contentType: file.mimetype })
    if (uploaded.error) throw uploaded.error

    const signed = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10)
    if (signed.error) throw signed.error

    const ocr_text = await ocrFile(
      file.buffer,
      file.mimetype,
      extname(file.originalname).toLowerCase(),
    )

    const applicantEmail = req.body['applicantEmail']
    const uploaderId = req.body['uploaderId']

    const row = await supabase
      .from('uploads')
      .insert({
        bucket,
        path,
        file_name: safeName,
        mime_type: file.mimetype,
        size_bytes: file.size,
        applicant_email: applicantEmail,
        ocr_text,
        status: 'processed',
        public_url: signed.data.signedUrl,
        uploader_id: uploaderId ?? null, // allow NULL when anonymous
      })
      .select()
      .single()

    if (row.error) {
      return res.status(500).json({
        ok: false,
        error: { code: 'DB_INSERT_FAIL', message: row.error.message },
      })
    }

    console.log(`[upload] ${requestId} ${file.originalname} ${file.size} -> ${path}`)
    res.json({ ok: true, ...row.data, publicUrl: row.data?.public_url })
  } catch (err: any) {
    console.error(`[upload ERR] ${requestId}`, err)
    res.status(500).json({
      ok: false,
      error: { code: 'UPLOAD_FAILED', message: err?.message || 'Upload failed' },
      requestId,
    })
  }
})

export default router


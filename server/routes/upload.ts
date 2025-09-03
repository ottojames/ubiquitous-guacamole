import { Router } from 'express'
import Busboy from 'busboy'
import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import slugify from 'slugify'
import { ocrFile } from '../utils/ocr'

const router = Router()

router.post('/', (req, res) => {
  const bb = Busboy({ headers: req.headers, limits: { fileSize: 10 * 1024 * 1024 } })
  let fileBuffer: Buffer | null = null
  let filename = ''
  let mimeType = ''
  let size = 0
  let fileHandled = false
  const fields: Record<string, string> = {}
  const requestId = randomUUID()

  bb.on('field', (name, val) => {
    fields[name] = val
  })

  bb.on('file', (_name, file, info) => {
    fileHandled = true
    filename = info.filename
    mimeType = info.mimeType
    const chunks: Buffer[] = []
    file.on('data', (d) => {
      chunks.push(d)
      size += d.length
    })
    file.on('limit', () => {
      res.status(413).json({ ok: false, code: 'FILE_TOO_LARGE', message: 'File too large', requestId })
    })
    file.on('end', () => {
      fileBuffer = Buffer.concat(chunks)
    })
  })

  bb.on('close', async () => {
    if (res.headersSent) return
    if (!fileHandled || !fileBuffer) {
      return res.status(400).json({ ok: false, code: 'NO_FILE', message: 'No file provided', requestId })
    }
    try {
      const now = new Date()
      const safeName = slugify(filename, { lower: true })
      const path = `uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${requestId}-${safeName}`
      const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const bucket = process.env.SUPABASE_BUCKET || 'notices'
      const uploaded = await supabase.storage.from(bucket).upload(path, fileBuffer, { contentType: mimeType })
      if (uploaded.error) throw uploaded.error
      const signed = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365 * 10)
      if (signed.error) throw signed.error
      const ocr_text = await ocrFile(fileBuffer, mimeType, extname(filename).toLowerCase())
      const applicantEmail = fields['applicantEmail']
      const uploaderId = fields['uploaderId']
      const row = await supabase
        .from('uploads')
        .insert({
          bucket,
          path,
          file_name: safeName,
          mime_type: mimeType,
          size_bytes: size,
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
      console.log(`[upload] ${requestId} ${filename} ${size} -> ${path}`)
      res.json({ ok: true, ...row.data, publicUrl: row.data?.public_url })
    } catch (err: any) {
      console.error(`[upload ERR] ${requestId}`, err)
      res.status(500).json({ ok: false, error: { code: 'UPLOAD_FAILED', message: err?.message || 'Upload failed' }, requestId })
    }
  })

  req.pipe(bb)
})

export default router

import { Router } from 'express'
import Busboy from 'busboy'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import slugify from 'slugify'

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
      const path = `uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${requestId}-${slugify(filename, { lower: true })}`
      const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const bucket = process.env.SUPABASE_BUCKET || 'notices'
      const { error } = await supa.storage.from(bucket).upload(path, fileBuffer, { contentType: mimeType })
      if (error) throw error
      const { data: pub } = supa.storage.from(bucket).getPublicUrl(path)
      console.log(`[upload] ${requestId} ${filename} ${size} -> ${path}`)
      res.json({ ok: true, path, publicUrl: pub?.publicUrl, mime: mimeType })
    } catch (err: any) {
      console.error(`[upload ERR] ${requestId}`, err)
      res.status(500).json({ ok: false, code: 'UPLOAD_FAILED', message: err?.message || 'Upload failed', requestId })
    }
  })

  req.pipe(bb)
})

export default router

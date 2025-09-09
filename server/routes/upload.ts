import { Router } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { extname } from 'node:path';
import slugify from 'slugify';
import { ocrFile } from '../utils/ocr';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'text/plain',
      'application/rtf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('INVALID_TYPE'));
  },
});

const router = Router();

router.get('/', (_req, res) =>
  res.status(400).json({ ok: false, code: 'NO_FILE', message: 'No file provided' }),
);

router.post('/', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ ok: false, code: 'NO_FILE', message: 'No file provided' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const bucket = process.env.SUPABASE_BUCKET || 'blue-notices';

  const uploaderId = req.body['uploaderId'];
  const safe = slugify(file.originalname, { lower: true, strict: true });
  const path = `${uploaderId || 'anon'}/${Date.now()}_${safe}`;

  try {
    const uploaded = await supabase.storage
      .from(bucket)
      .upload(path, file.buffer, { contentType: file.mimetype });
    if (uploaded.error) {
      console.error('[STORAGE_UPLOAD_FAIL]', uploaded.error);
      return res.status(500).json({
        ok: false,
        error: { code: 'STORAGE_UPLOAD_FAIL', message: uploaded.error.message },
      });
    }

    const signed = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60);
    if (signed.error || !signed.data?.signedUrl) {
      console.error('[SIGNED_URL_FAIL]', signed.error);
      return res.status(500).json({
        ok: false,
        error: {
          code: 'SIGNED_URL_FAIL',
          message: signed.error?.message || 'Failed to create signed URL',
        },
      });
    }

    const skipOcr = String(req.query.skipOcr) === '1';
    let ocr_text = '';
    if (!skipOcr) {
      ocr_text = await ocrFile(
        file.buffer,
        file.mimetype,
        extname(file.originalname).toLowerCase(),
      );
    }

    const row = await supabase
      .from('uploads')
      .insert({
        bucket,
        path,
        file_name: file.originalname,
        mime_type: file.mimetype,
        size_bytes: file.size,
        applicant_email: req.body['applicantEmail'],
        ocr_text,
        status: 'processed',
        public_url: signed.data.signedUrl,
        uploader_id: uploaderId || null,
      })
      .select()
      .single();

    if (row.error) {
      console.error('[DB_INSERT_FAIL]', row.error);
      return res.status(500).json({
        ok: false,
        error: { code: 'DB_INSERT_FAIL', message: row.error.message },
      });
    }

    res.json({ ok: true, id: row.data.id, signed_url: signed.data.signedUrl, ocr_text });
  } catch (err: any) {
    console.error('[UPLOAD_ERR]', err);
    res.status(500).json({
      ok: false,
      error: { code: 'UPLOAD_FAILED', message: err?.message || 'Upload failed' },
    });
  }
});

export default router;

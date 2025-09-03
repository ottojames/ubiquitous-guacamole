import { Router } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { ocrFile } from '../utils/ocr';
import { sendConfirmation } from '../utils/mailer';

const router = Router();

const storage = multer.memoryStorage();
const allowed = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'text/plain',
  'application/rtf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  },
}).single('file');

router.post('/', upload, async (req, res) => {
  try {
    const file = req.file;
    const {
      applicantEmail,
      applicantName,
      councilName,
      councilEmail,
      premisesAddress,
      uploaderId,
    } = req.body as Record<string, string>;

    if (!file) {
      return res.status(400).json({ ok: false, error: { code: 'NO_FILE', message: 'file is required' } });
    }
    if (!applicantEmail) {
      return res
        .status(400)
        .json({ ok: false, error: { code: 'NO_EMAIL', message: 'applicantEmail is required' } });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ ok: false, error: { code: 'NO_SUPABASE', message: 'Supabase not configured' } });
    }
    const sb = createClient(supabaseUrl, supabaseKey);

    const sanitized = file.originalname.replace(/[^a-z0-9_.-]/gi, '_');
    const uid = uploaderId || 'anon';
    const filePath = `${uid}/${Date.now()}_${sanitized}`;

    const { error: uploadError } = await sb.storage
      .from('blue-notices')
      .upload(filePath, file.buffer, { contentType: file.mimetype });
    if (uploadError) {
      return res
        .status(500)
        .json({ ok: false, error: { code: 'STORAGE_UPLOAD_FAILED', message: uploadError.message } });
    }

    const { data: signedData } = await sb.storage
      .from('blue-notices')
      .createSignedUrl(filePath, 3600);
    const signedUrl = signedData?.signedUrl || '';

    const ext = path.extname(sanitized).toLowerCase();
    const ocr_text = await ocrFile(file.buffer, file.mimetype, ext);

    const { data: row, error: dbError } = await sb
      .from('uploads')
      .insert({
        bucket: 'blue-notices',
        path: filePath,
        file_name: sanitized,
        mime_type: file.mimetype,
        size_bytes: file.size,
        applicant_email: applicantEmail,
        ocr_text,
        status: 'processed',
        public_url: signedUrl,
        uploader_id: uploaderId || null,
      })
      .select()
      .single();
    if (dbError) {
      return res
        .status(500)
        .json({ ok: false, error: { code: 'DB_INSERT_FAILED', message: dbError.message } });
    }

    sendConfirmation({
      to: applicantEmail,
      applicantName: applicantName || undefined,
      fileName: sanitized,
      signedUrl,
      councilName: councilName || undefined,
      councilEmail: councilEmail || undefined,
      premisesAddress: premisesAddress || undefined,
    });

    return res.json({ ok: true, id: row.id, path: filePath, signed_url: signedUrl, ocr_text });
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ ok: false, error: { code: 'UPLOAD_ERROR', message: err?.message || 'Server error' } });
  }
});

export default router;


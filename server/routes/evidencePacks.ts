import express from 'express';
import { generateEvidencePack } from '../utils/evidencePackGenerator.js';
import { getServiceSupabaseClient } from '../lib/supabase.js';

const router = express.Router();

/**
 * Generate and download evidence pack for a notice
 * GET /api/evidence-packs/:noticeId
 */
router.get('/:noticeId', async (req, res) => {
  try {
    const { noticeId } = req.params;
    const {
      includeRepresentations = 'true',
      includeAuditTrail = 'true',
      includeOriginalDocuments = 'true'
    } = req.query;

    // Get Supabase client
    const supabase = getServiceSupabaseClient();

    // Verify notice exists
    const { data: notice, error: noticeError } = await supabase
      .from('notices')
      .select('id, application_type, notice_type, created_at, published_at')
      .eq('id', noticeId)
      .single();

    if (noticeError || !notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    // Generate evidence pack
    const evidencePackBuffer = await generateEvidencePack({
      noticeId,
      includeRepresentations: includeRepresentations === 'true',
      includeAuditTrail: includeAuditTrail === 'true',
      includeOriginalDocuments: includeOriginalDocuments === 'true',
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const noticeType = (notice.application_type || notice.notice_type || 'notice')
      .toLowerCase()
      .replace(/\s+/g, '_');
    const filename = `evidence_pack_${noticeType}_${noticeId.substring(0, 8)}_${timestamp}.zip`;

    // Set headers and send
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', evidencePackBuffer.length);

    res.send(evidencePackBuffer);

  } catch (error) {
    console.error('Error generating evidence pack:', error);
    res.status(500).json({
      error: 'Failed to generate evidence pack',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate evidence pack metadata (preview without download)
 * GET /api/evidence-packs/:noticeId/metadata
 */
router.get('/:noticeId/metadata', async (req, res) => {
  try {
    const { noticeId } = req.params;

    // Get Supabase client
    const supabase = getServiceSupabaseClient();

    // Verify notice exists
    const { data: notice, error: noticeError } = await supabase
      .from('notices')
      .select('id, application_type, notice_type, created_at, published_at, document_url, proof_pdf_url')
      .eq('id', noticeId)
      .single();

    if (noticeError || !notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    // Count representations
    const { count: repsCount, error: repsError } = await supabase
      .from('representations')
      .select('*', { count: 'exact', head: true })
      .eq('notice_id', noticeId);

    // Count audit logs
    const { count: auditCount, error: auditError } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('resource_type', 'notice')
      .eq('resource_id', noticeId);

    const metadata = {
      notice_id: notice.id,
      notice_type: notice.application_type || notice.notice_type,
      published_at: notice.published_at || notice.created_at,
      contents: {
        publication_certificate: true,
        original_documents: !!(notice.document_url || notice.proof_pdf_url),
        representations_count: repsCount || 0,
        audit_logs_count: auditCount || 0,
      },
      estimated_files: 3 + (notice.document_url ? 1 : 0) + (notice.proof_pdf_url ? 1 : 0),
    };

    res.json(metadata);

  } catch (error) {
    console.error('Error generating evidence pack metadata:', error);
    res.status(500).json({
      error: 'Failed to generate evidence pack metadata',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';
import { generatePublicationCertificate, generatePaymentReceipt } from '../utils/certificateGenerator.js';

const router = Router();

/**
 * Generate a publication certificate for a notice
 * GET /api/certificates/publication/:noticeId
 */
router.get('/publication/:noticeId', async (req: Request, res: Response) => {
  try {
    const { noticeId } = req.params;

    const supabase = getServiceSupabaseClient();

    // Fetch notice details
    const { data: notice, error } = await supabase
      .from('notices')
      .select(`
        *,
        councils:council_id(name),
        organizations:organization_id(name)
      `)
      .eq('id', noticeId)
      .single();

    if (error || !notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    // Check if notice is published
    if (notice.status !== 'published') {
      return res.status(400).json({ error: 'Certificate only available for published notices' });
    }

    // Generate certificate data
    const certificateData = {
      noticeId: notice.id,
      noticeType: notice.notice_type || 'Public Notice',
      applicantName: notice.applicant_name,
      premisesName: notice.premises?.name,
      premisesAddress: notice.premises ?
        `${notice.premises.address || ''}, ${notice.premises.postcode || ''}`.trim() :
        undefined,
      publishedDate: new Date(notice.created_at),
      publishedBy: notice.organizations?.[0]?.name ||
                   notice.councils?.[0]?.name ||
                   'CivicNotices User',
      publicationUrl: `https://civicnotices.co.uk/notices/${notice.id}`,
      noticeText: notice.notice_text || '',
      representationsDeadline: notice.reps_deadline ? new Date(notice.reps_deadline) : undefined,
      certificateNumber: notice.certificate_number
    };

    // Generate PDF
    const pdfBuffer = await generatePublicationCertificate(certificateData);

    // Store certificate number if not already stored
    if (!notice.certificate_number) {
      const certificateNumber = `CERT-${notice.id.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      await supabase
        .from('notices')
        .update({ certificate_number: certificateNumber })
        .eq('id', noticeId);
    }

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${noticeId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({
      error: 'Failed to generate certificate',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate a payment receipt for a notice
 * GET /api/certificates/receipt/:noticeId
 */
router.get('/receipt/:noticeId', async (req: Request, res: Response) => {
  try {
    const { noticeId } = req.params;

    const supabase = getServiceSupabaseClient();

    // Fetch notice and payment details
    const { data: notice, error } = await supabase
      .from('notices')
      .select('*')
      .eq('id', noticeId)
      .single();

    if (error || !notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    // Generate receipt data
    const receiptData = {
      noticeId: notice.id,
      amount: 50, // Standard price - should come from payment records
      currency: 'GBP',
      paymentDate: new Date(notice.created_at),
      paymentMethod: 'Card', // Should come from payment records
      customerEmail: notice.applicant_email || 'customer@example.com',
      description: `Publication of ${notice.notice_type || 'Public Notice'}`
    };

    // Generate PDF
    const pdfBuffer = await generatePaymentReceipt(receiptData);

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${noticeId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({
      error: 'Failed to generate receipt',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Verify a certificate by its number
 * GET /api/certificates/verify/:certificateNumber
 */
router.get('/verify/:certificateNumber', async (req: Request, res: Response) => {
  try {
    const { certificateNumber } = req.params;

    const supabase = getServiceSupabaseClient();

    // Find notice by certificate number
    const { data: notice, error } = await supabase
      .from('notices')
      .select(`
        id,
        notice_type,
        status,
        created_at,
        applicant_name,
        premises
      `)
      .eq('certificate_number', certificateNumber)
      .single();

    if (error || !notice) {
      return res.status(404).json({
        valid: false,
        error: 'Certificate not found'
      });
    }

    res.json({
      valid: true,
      certificate: {
        number: certificateNumber,
        noticeId: notice.id,
        noticeType: notice.notice_type,
        publishedDate: notice.created_at,
        status: notice.status,
        applicant: notice.applicant_name,
        premises: notice.premises?.name
      }
    });

  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({
      valid: false,
      error: 'Failed to verify certificate'
    });
  }
});

export default router;
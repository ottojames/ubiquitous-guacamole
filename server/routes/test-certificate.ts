import { Router, Request, Response } from 'express';
import { generatePublicationCertificate } from '../utils/certificateGenerator.js';

const router = Router();

/**
 * Generate a test publication certificate with mock data
 * GET /api/test-certificate
 */
router.get('/test-certificate', async (req: Request, res: Response) => {
  try {
    // Create mock certificate data for testing
    const mockCertificateData = {
      noticeId: 'test-' + Date.now(),
      noticeType: 'Premises Licence Application',
      applicantName: 'Test Applicant Ltd',
      premisesName: 'The Test Pub',
      premisesAddress: '123 Test Street, London, SW1A 1AA',
      publishedDate: new Date(),
      publishedBy: 'Westminster City Council',
      publicationUrl: 'https://civicnotices.co.uk/notices/test-notice',
      noticeText: `NOTICE OF APPLICATION

PREMISES LICENCE

PREMISES
The Test Pub
123 Test Street, London
SW1A 1AA

APPLICANT
Test Applicant Ltd
456 Business Road, London

LICENSABLE ACTIVITIES
• Sale of alcohol by retail
• Provision of regulated entertainment
• Late night refreshment

OPENING HOURS
Monday to Sunday: 11:00 - 23:00

REPRESENTATIONS
Representations concerning this application must be made in writing to the licensing authority by 14 February 2026.

Representations should be sent to:
Licensing Department
Westminster City Council
64 Victoria Street
London SW1E 6QP

The register and application records may be inspected at the licensing authority during normal office hours.

Licensing Authority: Westminster City Council`,
      representationsDeadline: new Date('2026-02-14'),
      certificateNumber: 'CERT-TEST-' + Date.now().toString(36).toUpperCase()
    };

    // Generate PDF
    const pdfBuffer = await generatePublicationCertificate(mockCertificateData);

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="test-certificate.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating test certificate:', error);
    res.status(500).json({
      error: 'Failed to generate test certificate',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
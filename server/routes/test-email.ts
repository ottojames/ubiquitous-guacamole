import { Router, Request, Response } from 'express';
import { sendNoticeConfirmation } from '../services/email.js';

const router = Router();

/**
 * Test email service
 * GET /api/test-email
 */
router.get('/test-email', async (req: Request, res: Response) => {
  try {
    // Test with the allowed email address for Resend test mode
    const testEmail = 'team@statutoryadvertising.net';

    const testData = {
      noticeId: 'test-' + Date.now(),
      noticeType: 'Premises Licence Application',
      premisesName: 'Test Pub',
      premisesAddress: '123 Test Street, London, SW1A 1AA',
      applicantName: 'Test Applicant Ltd',
      noticeText: 'This is a test notice for email service verification.',
      viewUrl: 'https://civicnotices.co.uk/notices/test'
    };

    const result = await sendNoticeConfirmation(testEmail, testData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        to: testEmail,
        noticeId: testData.noticeId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send test email'
      });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
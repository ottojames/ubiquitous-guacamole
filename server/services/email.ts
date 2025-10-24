import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface NoticeConfirmationData {
  noticeId: string;
  noticeType: string;
  premisesName?: string;
  premisesAddress?: string;
  applicantName?: string;
  noticeText: string;
  viewUrl: string;
}

/**
 * Send confirmation email after notice is published
 */
export async function sendNoticeConfirmation(
  to: string,
  data: NoticeConfirmationData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('REPLACE')) {
      console.warn('[Email] Resend API key not configured, skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    const subject = `Your notice has been published - ${data.noticeType}`;

    const html = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${subject}</title>
  <!--[if mso]>
  <style>
    * { font-family: sans-serif !important; }
  </style>
  <![endif]-->
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!--<![endif]-->
</head>
<body style="margin: 0; padding: 0; width: 100%; word-break: break-word; -webkit-font-smoothing: antialiased; background-color: #f6f9fc;">
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Your notice has been published successfully on CivicNotices
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center" style="padding: 0 20px;">

        <!-- Main Container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">

          <!-- Header -->
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center; background-color: #ffffff; border-radius: 12px 12px 0 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 56px; height: 56px; background-color: #0066ff; border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="color: #ffffff; font-size: 28px; line-height: 56px; font-weight: bold;">✓</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 24px 0 8px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 24px; font-weight: 600; color: #0a0a0a; letter-spacing: -0.02em; line-height: 1.3;">
                Notice Published
              </h1>
              <p style="margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #737373; line-height: 1.5;">
                Your notice is now live and visible to the public
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background-color: #e5e5e5;"></div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">

              <!-- Notice Details Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; border-radius: 8px; padding: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 16px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #0a0a0a; text-transform: uppercase; letter-spacing: 0.05em;">
                      Notice Details
                    </p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #737373; padding-right: 16px; width: 120px;">Type</td>
                              <td style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #0a0a0a; font-weight: 500; text-align: right;">${data.noticeType}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ${data.premisesName ? `
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #737373; padding-right: 16px; width: 120px;">Premises</td>
                              <td style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #0a0a0a; font-weight: 500; text-align: right;">${data.premisesName}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.premisesAddress ? `
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #737373; padding-right: 16px; width: 120px; vertical-align: top;">Address</td>
                              <td style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #0a0a0a; font-weight: 500; text-align: right;">${data.premisesAddress}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.applicantName ? `
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #737373; padding-right: 16px; width: 120px;">Applicant</td>
                              <td style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #0a0a0a; font-weight: 500; text-align: right;">${data.applicantName}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 12px 0;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #737373; padding-right: 16px; width: 120px; vertical-align: top;">Notice ID</td>
                              <td style="font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 13px; color: #0a0a0a; font-weight: 500; text-align: right; word-break: break-all;">${data.noticeId}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.viewUrl}" style="display: inline-block; background-color: #0066ff; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600; line-height: 1.5;">
                      View Published Notice →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 6px; padding: 16px 20px; margin: 24px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #92400e;">
                      What happens next?
                    </p>
                    <p style="margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #78350f; line-height: 1.6;">
                      Your notice is now searchable on CivicNotices. If you've arranged newspaper publication, you'll receive separate confirmation from the publisher.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 4px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #a3a3a3; line-height: 1.5;">
                CivicNotices
              </p>
              <p style="margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #a3a3a3; line-height: 1.5;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Your notice has been published - ${data.noticeType}

Thank you for publishing your notice with CivicNotices. Your notice is now live and visible to the public.

Notice Summary:
- Notice Type: ${data.noticeType}
${data.premisesName ? `- Premises: ${data.premisesName}` : ''}
${data.premisesAddress ? `- Address: ${data.premisesAddress}` : ''}
${data.applicantName ? `- Applicant: ${data.applicantName}` : ''}
- Notice ID: ${data.noticeId}

View your published notice: ${data.viewUrl}

What happens next?
Your notice is now live on CivicNotices and searchable by the public. If you've arranged for newspaper publication, you'll receive separate confirmation from the publisher.

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The CivicNotices Team
    `;

    console.log('[Email] Sending confirmation to:', to);

    const result = await resend.emails.send({
      from: 'CivicNotices <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
      text,
    });

    // Check if there's an error in the result
    if (result.error) {
      console.error('[Email] Resend API returned error:', result.error);
      return {
        success: false,
        error: result.error.message || 'Failed to send email'
      };
    }

    console.log('[Email] Sent successfully:', result);
    return { success: true };

  } catch (error: any) {
    console.error('[Email] Failed to send confirmation:', error);
    return { success: false, error: error.message };
  }
}

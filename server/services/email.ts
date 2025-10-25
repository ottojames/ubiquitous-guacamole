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

export interface RepresentationConfirmationData {
  representationId: string;
  noticeType: string;
  premisesName?: string;
  premisesAddress?: string;
  stance: 'support' | 'object' | 'comment';
  submitterName: string;
  submitterEmail: string;
  deadline?: string;
  noticeUrl: string;
}

export interface DeadlineReminderData {
  noticeId: string;
  noticeType: string;
  premisesName?: string;
  premisesAddress?: string;
  deadline: string;
  hoursRemaining: number;
  noticeUrl: string;
  recipientEmail: string;
}

export interface DailySummaryData {
  councilName: string;
  date: string;
  newRepresentations: {
    noticeId: string;
    noticeType: string;
    premisesName?: string;
    representationCount: number;
    supportCount: number;
    objectCount: number;
    commentCount: number;
    unreadCount: number;
    noticeUrl: string;
  }[];
  totalNew: number;
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

/**
 * Send confirmation email after representation is submitted
 */
export async function sendRepresentationConfirmation(
  data: RepresentationConfirmationData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('REPLACE')) {
      console.warn('[Email] Resend API key not configured, skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    const stanceLabels = {
      support: 'Support',
      object: 'Objection',
      comment: 'Comment'
    };
    const stanceColors = {
      support: '#16a34a',
      object: '#dc2626',
      comment: '#2563eb'
    };

    const subject = `Your ${stanceLabels[data.stance].toLowerCase()} has been received - ${data.noticeType}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f6f9fc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center" style="padding: 0 20px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">

          <!-- Header -->
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 56px; height: 56px; background-color: ${stanceColors[data.stance]}; border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="color: #ffffff; font-size: 28px; line-height: 56px;">✓</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 24px 0 8px; font-size: 24px; font-weight: 600; color: #0a0a0a;">
                ${stanceLabels[data.stance]} Received
              </h1>
              <p style="margin: 0; font-size: 15px; color: #737373;">
                Thank you for your submission
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px;"><div style="height: 1px; background-color: #e5e5e5;"></div></td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">

              <p style="margin: 0 0 24px; font-size: 15px; color: #0a0a0a; line-height: 1.6;">
                Hi ${data.submitterName},
              </p>

              <p style="margin: 0 0 24px; font-size: 15px; color: #0a0a0a; line-height: 1.6;">
                We've successfully received your ${stanceLabels[data.stance].toLowerCase()} regarding the ${data.noticeType} notice${data.premisesName ? ` for <strong>${data.premisesName}</strong>` : ''}.
              </p>

              <!-- Details Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 16px; font-size: 13px; font-weight: 600; color: #0a0a0a; text-transform: uppercase; letter-spacing: 0.05em;">
                      Submission Details
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-size: 14px; color: #737373; width: 140px;">Reference</td>
                              <td style="font-family: 'Menlo', monospace; font-size: 13px; color: #0a0a0a; font-weight: 500; text-align: right;">${data.representationId}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-size: 14px; color: #737373; width: 140px;">Type</td>
                              <td style="font-size: 14px; color: ${stanceColors[data.stance]}; font-weight: 600; text-align: right;">${stanceLabels[data.stance]}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-size: 14px; color: #737373; width: 140px;">Notice Type</td>
                              <td style="font-size: 14px; color: #0a0a0a; font-weight: 500; text-align: right;">${data.noticeType}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ${data.premisesAddress ? `
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-size: 14px; color: #737373; width: 140px; vertical-align: top;">Address</td>
                              <td style="font-size: 14px; color: #0a0a0a; font-weight: 500; text-align: right;">${data.premisesAddress}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.deadline ? `
                      <tr>
                        <td style="padding: 12px 0;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-size: 14px; color: #737373; width: 140px;">Deadline</td>
                              <td style="font-size: 14px; color: #0a0a0a; font-weight: 500; text-align: right;">${data.deadline}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; font-size: 15px; color: #0a0a0a; line-height: 1.6;">
                Your submission will be reviewed by the licensing authority and considered as part of the decision-making process.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.noticeUrl}" style="display: inline-block; background-color: #0066ff; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600;">
                      View Notice →
                    </a>
                  </td>
                </tr>
              </table>

              ${data.deadline ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #eff6ff; border-left: 3px solid #2563eb; border-radius: 6px; padding: 16px 20px; margin: 24px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #1e40af;">
                      What happens next?
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #1e3a8a; line-height: 1.6;">
                      The consultation period ends on <strong>${data.deadline}</strong>. After this date, the licensing authority will review all representations and make a decision.
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #a3a3a3;">CivicNotices</p>
              <p style="margin: 0; font-size: 12px; color: #a3a3a3;">
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
Your ${stanceLabels[data.stance]} has been received

Hi ${data.submitterName},

We've successfully received your ${stanceLabels[data.stance].toLowerCase()} regarding the ${data.noticeType} notice${data.premisesName ? ` for ${data.premisesName}` : ''}.

Submission Details:
- Reference: ${data.representationId}
- Type: ${stanceLabels[data.stance]}
- Notice Type: ${data.noticeType}
${data.premisesAddress ? `- Address: ${data.premisesAddress}` : ''}
${data.deadline ? `- Deadline: ${data.deadline}` : ''}

Your submission will be reviewed by the licensing authority and considered as part of the decision-making process.

View the notice: ${data.noticeUrl}

${data.deadline ? `The consultation period ends on ${data.deadline}. After this date, the licensing authority will review all representations and make a decision.` : ''}

Best regards,
The CivicNotices Team
    `;

    console.log('[Email] Sending representation confirmation to:', data.submitterEmail);

    const result = await resend.emails.send({
      from: 'CivicNotices <onboarding@resend.dev>',
      to: [data.submitterEmail],
      subject,
      html,
      text,
    });

    if (result.error) {
      console.error('[Email] Resend API returned error:', result.error);
      return { success: false, error: result.error.message || 'Failed to send email' };
    }

    console.log('[Email] Representation confirmation sent successfully:', result);
    return { success: true };

  } catch (error: any) {
    console.error('[Email] Failed to send representation confirmation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send deadline reminder email
 */
export async function sendDeadlineReminder(
  data: DeadlineReminderData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('REPLACE')) {
      console.warn('[Email] Resend API key not configured, skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    const subject = `Reminder: ${data.hoursRemaining}h until deadline - ${data.noticeType}`;
    const urgencyColor = data.hoursRemaining <= 24 ? '#dc2626' : '#f59e0b';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f6f9fc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center" style="padding: 0 20px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">

          <!-- Header -->
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 56px; height: 56px; background-color: ${urgencyColor}; border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="color: #ffffff; font-size: 28px; line-height: 56px;">⏰</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 24px 0 8px; font-size: 24px; font-weight: 600; color: #0a0a0a;">
                Deadline Approaching
              </h1>
              <p style="margin: 0; font-size: 15px; color: #737373;">
                ${data.hoursRemaining} hours remaining to make your representation
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px;"><div style="height: 1px; background-color: #e5e5e5;"></div></td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">

              <p style="margin: 0 0 24px; font-size: 15px; color: #0a0a0a; line-height: 1.6;">
                This is a reminder that the consultation period for the following notice is closing soon:
              </p>

              <!-- Notice Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-size: 14px; color: #737373; width: 120px;">Notice Type</td>
                              <td style="font-size: 14px; color: #0a0a0a; font-weight: 500; text-align: right;">${data.noticeType}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ${data.premisesName ? `
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-size: 14px; color: #737373; width: 120px;">Premises</td>
                              <td style="font-size: 14px; color: #0a0a0a; font-weight: 500; text-align: right;">${data.premisesName}</td>
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
                              <td style="font-size: 14px; color: #737373; width: 120px; vertical-align: top;">Address</td>
                              <td style="font-size: 14px; color: #0a0a0a; font-weight: 500; text-align: right;">${data.premisesAddress}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 12px 0;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-size: 14px; color: #737373; width: 120px;">Deadline</td>
                              <td style="font-size: 14px; color: ${urgencyColor}; font-weight: 600; text-align: right;">${data.deadline}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; font-size: 15px; color: #0a0a0a; line-height: 1.6;">
                If you wish to make a representation (support, objection, or comment), please do so before the deadline.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.noticeUrl}" style="display: inline-block; background-color: ${urgencyColor}; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600;">
                      Make Representation →
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 6px; padding: 16px 20px; margin: 24px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">
                      <strong>Important:</strong> Representations submitted after the deadline may not be considered by the licensing authority.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #a3a3a3;">CivicNotices</p>
              <p style="margin: 0; font-size: 12px; color: #a3a3a3;">
                This is an automated reminder. Please do not reply to this email.
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
Deadline Reminder: ${data.hoursRemaining}h remaining

This is a reminder that the consultation period for the following notice is closing soon:

Notice Details:
- Type: ${data.noticeType}
${data.premisesName ? `- Premises: ${data.premisesName}` : ''}
${data.premisesAddress ? `- Address: ${data.premisesAddress}` : ''}
- Deadline: ${data.deadline}

If you wish to make a representation (support, objection, or comment), please do so before the deadline.

Make your representation: ${data.noticeUrl}

IMPORTANT: Representations submitted after the deadline may not be considered by the licensing authority.

Best regards,
The CivicNotices Team
    `;

    console.log('[Email] Sending deadline reminder to:', data.recipientEmail);

    const result = await resend.emails.send({
      from: 'CivicNotices <onboarding@resend.dev>',
      to: [data.recipientEmail],
      subject,
      html,
      text,
    });

    if (result.error) {
      console.error('[Email] Resend API returned error:', result.error);
      return { success: false, error: result.error.message || 'Failed to send email' };
    }

    console.log('[Email] Deadline reminder sent successfully:', result);
    return { success: true };

  } catch (error: any) {
    console.error('[Email] Failed to send deadline reminder:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send daily summary email to council officers
 */
export async function sendDailySummary(
  to: string,
  data: DailySummaryData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('REPLACE')) {
      console.warn('[Email] Resend API key not configured, skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    const subject = `Daily Summary: ${data.totalNew} new representation${data.totalNew !== 1 ? 's' : ''} - ${data.councilName}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f6f9fc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center" style="padding: 0 20px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">

          <!-- Header -->
          <tr>
            <td style="padding: 48px 40px 32px;">
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #0a0a0a;">
                Daily Representation Summary
              </h1>
              <p style="margin: 0; font-size: 15px; color: #737373;">
                ${data.councilName} • ${data.date}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px;"><div style="height: 1px; background-color: #e5e5e5;"></div></td>
          </tr>

          <!-- Summary Stats -->
          <tr>
            <td style="padding: 32px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px; font-size: 48px; font-weight: 700; color: #ffffff; line-height: 1;">
                      ${data.totalNew}
                    </p>
                    <p style="margin: 0; font-size: 15px; font-weight: 500; color: #ffffff; opacity: 0.9;">
                      New Representation${data.totalNew !== 1 ? 's' : ''} Received
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${data.newRepresentations.length > 0 ? `
          <!-- Notice List -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <p style="margin: 0 0 16px; font-size: 13px; font-weight: 600; color: #0a0a0a; text-transform: uppercase; letter-spacing: 0.05em;">
                Breakdown by Notice
              </p>

              ${data.newRepresentations.map(notice => `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #0a0a0a;">
                      ${notice.premisesName || notice.noticeType}
                    </p>
                    <p style="margin: 0 0 16px; font-size: 13px; color: #737373;">
                      ${notice.noticeType}
                    </p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                      <tr>
                        <td style="width: 33.33%; padding: 8px 0;">
                          <p style="margin: 0 0 4px; font-size: 24px; font-weight: 700; color: #16a34a;">
                            ${notice.supportCount}
                          </p>
                          <p style="margin: 0; font-size: 12px; color: #737373;">
                            Support
                          </p>
                        </td>
                        <td style="width: 33.33%; padding: 8px 0; border-left: 1px solid #e5e5e5; border-right: 1px solid #e5e5e5; text-align: center;">
                          <p style="margin: 0 0 4px; font-size: 24px; font-weight: 700; color: #dc2626;">
                            ${notice.objectCount}
                          </p>
                          <p style="margin: 0; font-size: 12px; color: #737373;">
                            Objections
                          </p>
                        </td>
                        <td style="width: 33.33%; padding: 8px 0; text-align: right;">
                          <p style="margin: 0 0 4px; font-size: 24px; font-weight: 700; color: #2563eb;">
                            ${notice.commentCount}
                          </p>
                          <p style="margin: 0; font-size: 12px; color: #737373;">
                            Comments
                          </p>
                        </td>
                      </tr>
                    </table>

                    ${notice.unreadCount > 0 ? `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                      <tr>
                        <td>
                          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #92400e;">
                            ${notice.unreadCount} unread
                          </p>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    <a href="${notice.noticeUrl}" style="display: inline-block; background-color: #0066ff; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      View Representations →
                    </a>
                  </td>
                </tr>
              </table>
              `).join('')}
            </td>
          </tr>
          ` : `
          <tr>
            <td style="padding: 0 40px 32px;">
              <p style="margin: 0; font-size: 15px; color: #737373; text-align: center;">
                No new representations were received in the last 24 hours.
              </p>
            </td>
          </tr>
          `}

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #a3a3a3;">CivicNotices</p>
              <p style="margin: 0; font-size: 12px; color: #a3a3a3;">
                This is an automated daily summary. Please do not reply to this email.
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
Daily Representation Summary
${data.councilName} • ${data.date}

${data.totalNew} New Representation${data.totalNew !== 1 ? 's' : ''} Received

${data.newRepresentations.length > 0 ? `
Breakdown by Notice:

${data.newRepresentations.map(notice => `
${notice.premisesName || notice.noticeType}
${notice.noticeType}

Support: ${notice.supportCount} | Objections: ${notice.objectCount} | Comments: ${notice.commentCount}
${notice.unreadCount > 0 ? `${notice.unreadCount} unread` : ''}

View representations: ${notice.noticeUrl}
`).join('\n---\n')}
` : 'No new representations were received in the last 24 hours.'}

Best regards,
The CivicNotices Team
    `;

    console.log('[Email] Sending daily summary to:', to);

    const result = await resend.emails.send({
      from: 'CivicNotices <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
      text,
    });

    if (result.error) {
      console.error('[Email] Resend API returned error:', result.error);
      return { success: false, error: result.error.message || 'Failed to send email' };
    }

    console.log('[Email] Daily summary sent successfully:', result);
    return { success: true };

  } catch (error: any) {
    console.error('[Email] Failed to send daily summary:', error);
    return { success: false, error: error.message };
  }
}

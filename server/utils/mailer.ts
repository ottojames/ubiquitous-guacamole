import nodemailer from 'nodemailer';

export interface ConfirmationArgs {
  to: string;
  applicantName?: string;
  fileName: string;
  signedUrl?: string;
  councilName?: string;
  councilEmail?: string;
  premisesAddress?: string;
}

export async function sendConfirmation(args: ConfirmationArgs): Promise<void> {
  try {
    const resp = await fetch('http://localhost:5174/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (resp.ok) return;
  } catch (e) {
    // ignore and fallback to SMTP
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const text = `Your file ${args.fileName} has been received.` +
      (args.signedUrl ? ` View file: ${args.signedUrl}` : '');
    const html = `<p>Your file ${args.fileName} has been received.</p>` +
      (args.signedUrl ? `<p><a href="${args.signedUrl}">View file</a></p>` : '');

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: args.to,
      subject: 'Upload received',
      text,
      html,
    });
  } catch (e) {
    console.error('sendConfirmation error', e);
  }
}


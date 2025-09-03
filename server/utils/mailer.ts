import nodemailer from 'nodemailer';

export interface MailArgs {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendConfirmation(args: MailArgs): Promise<void> {
  try {
    const resp = await fetch('http://localhost:5174/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: args.to,
        subject: args.subject,
        text: args.text,
        html: args.html,
      }),
    });
    if (resp.ok) return;
  } catch (e) {
    // ignore and fallback
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
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
    });
  } catch (e) {
    console.error('sendConfirmation error', e);
  }
}

import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

let resendInstance: Resend | null = null;

const getResendClient = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions) => {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`\n⚠️ [EmailService] RESEND_API_KEY is not configured.`);
    console.warn(`[EmailService] Mocking email send to: ${options.to}`);
    console.warn(`[EmailService] Subject: ${options.subject}`);
    const strippedHtml = options.html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    console.warn(`[EmailService] Content preview: ${strippedHtml}\n`);
    return { id: 'mock-resend-id' };
  }

  try {
    const data = await resend.emails.send({
      from: 'AgriLog <onboarding@resend.dev>', // Default Resend test email
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    
    return data;
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
};

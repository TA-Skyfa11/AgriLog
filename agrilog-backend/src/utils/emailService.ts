import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions) => {
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

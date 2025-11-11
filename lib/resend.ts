import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY is not set. Email notifications will be disabled.');
}

export const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourdomain.com';
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@yourdomain.com';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';


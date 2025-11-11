import { Resend } from 'resend';
import { render } from '@react-email/render';
import { VisitorArrivalEmail } from '../emails/visitor-arrival';

// Initialize Resend client ONLY when needed (lazy initialization)
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set. Add it to your .env file to enable email notifications.');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export interface SendVisitorArrivalEmailParams {
  to: string;
  hostName: string;
  visitorName: string;
  visitorCompany: string;
  visitorEmail: string;
  visitorPhone: string;
  reasonForVisit: string;
  checkInTime: string;
  visitorId: string;
  acceptUrl?: string;
  declineUrl?: string;
}

/**
 * Send visitor arrival notification email to host
 */
export async function sendVisitorArrivalEmail(params: SendVisitorArrivalEmailParams) {
  try {
    const emailHtml = render(
      VisitorArrivalEmail({
        hostName: params.hostName,
        visitorName: params.visitorName,
        visitorCompany: params.visitorCompany,
        visitorEmail: params.visitorEmail,
        visitorPhone: params.visitorPhone,
        reasonForVisit: params.reasonForVisit,
        checkInTime: params.checkInTime,
        visitorId: params.visitorId,
        acceptUrl: params.acceptUrl,
        declineUrl: params.declineUrl,
      })
    );

    const resend = getResendClient(); // Get client only when actually sending
    
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Syncco Visitor Management <noreply@yourdomain.com>',
      to: params.to,
      subject: `Visitor Arrival: ${params.visitorName} is here to see you`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in sendVisitorArrivalEmail:', error);
    throw error;
  }
}

/**
 * Send SMS notification (Twilio integration - optional)
 */
export async function sendVisitorArrivalSMS(params: {
  to: string;
  hostName: string;
  visitorName: string;
  visitorCompany: string;
  reasonForVisit: string;
}) {
  // TODO: Implement Twilio SMS integration
  // For now, this is a placeholder
  console.log('SMS notification would be sent to:', params.to);
  console.log('Message:', `Hi ${params.hostName}, ${params.visitorName} from ${params.visitorCompany} is here to see you (${params.reasonForVisit}).`);
  
  return { success: true, message: 'SMS not yet implemented' };
}

/**
 * Format date for email display
 */
export function formatEmailDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Generate secure token for email action links (Accept/Decline)
 */
export function generateActionToken(visitorId: string, staffId: string): string {
  // In production, use a proper JWT or encrypted token
  // For now, using a simple base64 encoding
  const payload = {
    visitorId,
    staffId,
    timestamp: Date.now(),
  };
  
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/**
 * Verify action token
 */
export function verifyActionToken(token: string): { visitorId: string; staffId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString());
    
    // Check if token is not older than 24 hours
    const hoursSinceCreation = (Date.now() - decoded.timestamp) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      console.warn('Token expired');
      return null;
    }
    
    return {
      visitorId: decoded.visitorId,
      staffId: decoded.staffId,
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}


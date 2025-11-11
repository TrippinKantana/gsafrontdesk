import { render } from '@react-email/components';
import TicketCreatedEmail from '@/emails/ticket-created';
import TicketUpdatedEmail from '@/emails/ticket-updated';
import TicketMessageEmail from '@/emails/ticket-message';

let resendClient: any = null;

function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    try {
      const { Resend } = require('resend');
      resendClient = new Resend(process.env.RESEND_API_KEY);
    } catch (error) {
      console.error('Failed to initialize Resend client:', error);
    }
  }
  return resendClient;
}

interface TicketCreatedNotification {
  ticketNumber: string;
  ticketTitle: string;
  description: string;
  requesterName: string;
  requesterEmail: string;
  priority: string;
  category?: string;
  ticketId: string;
}

interface TicketUpdatedNotification {
  ticketNumber: string;
  ticketTitle: string;
  oldStatus: string;
  newStatus: string;
  updatedBy: string;
  ticketId: string;
  requesterEmail: string;
}

interface TicketMessageNotification {
  ticketNumber: string;
  ticketTitle: string;
  senderName: string;
  message: string;
  ticketId: string;
  recipientEmails: string[];
}

export async function sendTicketCreatedEmail(data: TicketCreatedNotification): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('Resend not configured - skipping ticket creation email');
    return false;
  }

  try {
    const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/it/tickets/${data.ticketId}`;

    const html = render(
      TicketCreatedEmail({
        ticketNumber: data.ticketNumber,
        ticketTitle: data.ticketTitle,
        requesterName: data.requesterName,
        priority: data.priority,
        category: data.category,
        ticketUrl,
      })
    );

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@syncco.app',
      to: data.requesterEmail,
      subject: `Ticket Created: ${data.ticketTitle} [#${data.ticketNumber}]`,
      html,
    });

    console.log(`✅ Ticket creation email sent to ${data.requesterEmail}`);
    return true;
  } catch (error: any) {
    console.error('Failed to send ticket creation email:', error);
    return false;
  }
}

export async function sendTicketUpdatedEmail(data: TicketUpdatedNotification): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('Resend not configured - skipping ticket update email');
    return false;
  }

  try {
    const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/it/tickets/${data.ticketId}`;

    const html = render(
      TicketUpdatedEmail({
        ticketNumber: data.ticketNumber,
        ticketTitle: data.ticketTitle,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
        updatedBy: data.updatedBy,
        ticketUrl,
      })
    );

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@syncco.app',
      to: data.requesterEmail,
      subject: `Ticket Updated: ${data.ticketTitle} [#${data.ticketNumber}]`,
      html,
    });

    console.log(`✅ Ticket update email sent to ${data.requesterEmail}`);
    return true;
  } catch (error: any) {
    console.error('Failed to send ticket update email:', error);
    return false;
  }
}

export async function sendTicketMessageEmail(data: TicketMessageNotification): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('Resend not configured - skipping ticket message email');
    return false;
  }

  try {
    const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/it/tickets/${data.ticketId}`;

    const html = render(
      TicketMessageEmail({
        ticketNumber: data.ticketNumber,
        ticketTitle: data.ticketTitle,
        senderName: data.senderName,
        message: data.message.substring(0, 200) + (data.message.length > 200 ? '...' : ''),
        ticketUrl,
      })
    );

    // Send to all recipients
    for (const email of data.recipientEmails) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@syncco.app',
        to: email,
        subject: `New Message: ${data.ticketTitle} [#${data.ticketNumber}]`,
        html,
      });
    }

    console.log(`✅ Ticket message emails sent to ${data.recipientEmails.length} recipient(s)`);
    return true;
  } catch (error: any) {
    console.error('Failed to send ticket message email:', error);
    return false;
  }
}

export async function sendTicketAssignmentEmail(
  ticketNumber: string,
  ticketTitle: string,
  assignedToEmail: string,
  ticketId: string
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('Resend not configured - skipping ticket assignment email');
    return false;
  }

  try {
    const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/it/tickets/${ticketId}`;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@syncco.app',
      to: assignedToEmail,
      subject: `Ticket Assigned to You: ${ticketTitle} [#${ticketNumber}]`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🎫 New Ticket Assignment</h2>
          <p>A support ticket has been assigned to you.</p>
          <p><strong>Ticket:</strong> #${ticketNumber} - ${ticketTitle}</p>
          <p><a href="${ticketUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Ticket</a></p>
        </div>
      `,
    });

    console.log(`✅ Ticket assignment email sent to ${assignedToEmail}`);
    return true;
  } catch (error: any) {
    console.error('Failed to send ticket assignment email:', error);
    return false;
  }
}


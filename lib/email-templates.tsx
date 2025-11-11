/**
 * Email templates for visitor notifications
 * These are simple HTML templates that can be enhanced with react-email later
 */

interface VisitorArrivalEmailProps {
  hostName: string;
  visitorName: string;
  visitorCompany: string;
  visitorEmail: string;
  visitorPhone: string;
  reasonForVisit: string;
  checkInTime: string;
  acceptUrl?: string;
  declineUrl?: string;
}

export function getVisitorArrivalEmailHtml(props: VisitorArrivalEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visitor Arrival Notification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #3b82f6;
    }
    .header h1 {
      margin: 0;
      color: #1e40af;
      font-size: 24px;
    }
    .alert-badge {
      display: inline-block;
      background-color: #3b82f6;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .info-section {
      background-color: #f8fafc;
      border-left: 4px solid #3b82f6;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-row {
      display: flex;
      margin: 10px 0;
    }
    .info-label {
      font-weight: 600;
      min-width: 140px;
      color: #64748b;
    }
    .info-value {
      color: #1e293b;
    }
    .reason-badge {
      display: inline-block;
      background-color: #dbeafe;
      color: #1e40af;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
    }
    .action-buttons {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      margin: 0 10px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s;
    }
    .button-accept {
      background-color: #10b981;
      color: white;
    }
    .button-accept:hover {
      background-color: #059669;
    }
    .button-decline {
      background-color: #ef4444;
      color: white;
    }
    .button-decline:hover {
      background-color: #dc2626;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 13px;
    }
    @media only screen and (max-width: 600px) {
      .button {
        display: block;
        margin: 10px 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="alert-badge">🔔 VISITOR ARRIVAL</div>
      <h1>New Visitor at Reception</h1>
    </div>

    <p style="font-size: 16px; margin-bottom: 10px;">
      Hi <strong>${props.hostName}</strong>,
    </p>
    <p style="font-size: 15px; color: #64748b; margin-bottom: 25px;">
      You have a visitor waiting for you at the front desk.
    </p>

    <div class="info-section">
      <div class="info-row">
        <span class="info-label">Visitor Name:</span>
        <span class="info-value"><strong>${props.visitorName}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Company:</span>
        <span class="info-value">${props.visitorCompany}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Reason for Visit:</span>
        <span class="info-value"><span class="reason-badge">${props.reasonForVisit}</span></span>
      </div>
      <div class="info-row">
        <span class="info-label">Check-in Time:</span>
        <span class="info-value">${props.checkInTime}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-value"><a href="mailto:${props.visitorEmail}" style="color: #3b82f6;">${props.visitorEmail}</a></span>
      </div>
      <div class="info-row">
        <span class="info-label">Phone:</span>
        <span class="info-value"><a href="tel:${props.visitorPhone}" style="color: #3b82f6;">${props.visitorPhone}</a></span>
      </div>
    </div>

    ${props.acceptUrl && props.declineUrl ? `
    <div class="action-buttons">
      <p style="margin-bottom: 20px; color: #64748b; font-size: 14px;">
        Please respond to let the front desk know if you can meet with this visitor:
      </p>
      <a href="${props.acceptUrl}" class="button button-accept">✓ Accept Meeting</a>
      <a href="${props.declineUrl}" class="button button-decline">✗ Decline Meeting</a>
    </div>
    ` : ''}

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⚠️ Note:</strong> The visitor is currently waiting at reception. Please respond promptly or notify the front desk if you're unavailable.
      </p>
    </div>

    <div class="footer">
      <p>This is an automated notification from Syncco Visitor Management System.</p>
      <p>Need help? Contact <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@yourdomain.com'}" style="color: #3b82f6;">Support</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getVisitorArrivalEmailText(props: VisitorArrivalEmailProps): string {
  return `
VISITOR ARRIVAL NOTIFICATION

Hi ${props.hostName},

You have a visitor waiting for you at the front desk.

VISITOR DETAILS:
- Name: ${props.visitorName}
- Company: ${props.visitorCompany}
- Reason for Visit: ${props.reasonForVisit}
- Check-in Time: ${props.checkInTime}
- Email: ${props.visitorEmail}
- Phone: ${props.visitorPhone}

${props.acceptUrl ? `
RESPOND TO THIS VISITOR:
- Accept Meeting: ${props.acceptUrl}
- Decline Meeting: ${props.declineUrl}
` : ''}

The visitor is currently waiting at reception. Please respond promptly or notify the front desk if you're unavailable.

---
This is an automated notification from Syncco Visitor Management System.
  `.trim();
}

interface HostResponseEmailProps {
  visitorName: string;
  hostName: string;
  responseStatus: 'accepted' | 'declined';
  responseNote?: string;
  meetingLocation?: string;
}

export function getHostResponseEmailHtml(props: HostResponseEmailProps): string {
  const isAccepted = props.responseStatus === 'accepted';
  const statusColor = isAccepted ? '#10b981' : '#ef4444';
  const statusIcon = isAccepted ? '✓' : '✗';
  const statusText = isAccepted ? 'ACCEPTED' : 'DECLINED';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Response</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .status-badge {
      display: inline-block;
      background-color: ${statusColor};
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 15px;
    }
    .message-box {
      background-color: #f8fafc;
      border-left: 4px solid ${statusColor};
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="status-badge">${statusIcon} MEETING ${statusText}</div>
      <h1 style="color: #1e293b; margin: 0;">Response from ${props.hostName}</h1>
    </div>

    <p style="font-size: 16px;">
      Hi <strong>${props.visitorName}</strong>,
    </p>
    <p style="font-size: 15px; color: #64748b;">
      ${isAccepted 
        ? `<strong>${props.hostName}</strong> has accepted your meeting request and will meet with you shortly.` 
        : `<strong>${props.hostName}</strong> is currently unavailable and cannot meet at this time.`}
    </p>

    ${props.responseNote ? `
    <div class="message-box">
      <p style="margin: 0; font-weight: 600; color: #475569; margin-bottom: 8px;">Message from ${props.hostName}:</p>
      <p style="margin: 0; color: #1e293b;">"${props.responseNote}"</p>
    </div>
    ` : ''}

    ${isAccepted && props.meetingLocation ? `
    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-weight: 600; color: #1e40af; margin-bottom: 5px;">📍 Meeting Location:</p>
      <p style="margin: 0; color: #1e40af; font-size: 15px;">${props.meetingLocation}</p>
    </div>
    ` : ''}

    <p style="font-size: 14px; color: #64748b; margin-top: 25px;">
      ${isAccepted 
        ? 'Please wait at reception and someone will come to meet you shortly.' 
        : 'Please check with the front desk for further assistance.'}
    </p>

    <div class="footer">
      <p>This is an automated notification from Syncco Visitor Management System.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getHostResponseEmailText(props: HostResponseEmailProps): string {
  const isAccepted = props.responseStatus === 'accepted';
  return `
MEETING RESPONSE FROM ${props.hostName.toUpperCase()}

Hi ${props.visitorName},

${isAccepted 
  ? `${props.hostName} has ACCEPTED your meeting request and will meet with you shortly.` 
  : `${props.hostName} is currently UNAVAILABLE and cannot meet at this time.`}

${props.responseNote ? `\nMessage from ${props.hostName}:\n"${props.responseNote}"\n` : ''}
${isAccepted && props.meetingLocation ? `\nMeeting Location: ${props.meetingLocation}\n` : ''}

${isAccepted 
  ? 'Please wait at reception and someone will come to meet you shortly.' 
  : 'Please check with the front desk for further assistance.'}

---
This is an automated notification from Syncco Visitor Management System.
  `.trim();
}


# 📧 Notification System Setup Guide

## Overview

The Syncco Visitor Management System now includes a comprehensive notification system that automatically alerts staff members when visitors arrive.

---

## ✅ Phase 3: Notification System - COMPLETED

### Features Implemented:

1. **Email Notifications**
   - Beautiful HTML email templates using React Email
   - Automatic notifications sent when visitors check in
   - Includes visitor details (name, company, reason, time)
   - Accept/Decline buttons in email
   - Respects staff notification preferences

2. **Notification Logging**
   - All notifications logged in `VisitorNotification` table
   - Tracks status (pending, sent, failed, delivered)
   - Stores message content and error messages
   - Provides notification history per visitor

3. **Staff Preferences**
   - `notifyEmail` - Enable/disable email notifications
   - `notifySMS` - Enable/disable SMS notifications (placeholder)
   - `notifyOnVisitorArrival` - Master toggle for all notifications

---

## 🚀 Setup Instructions

### 1. Get a Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (3,000 emails/month free)
3. Verify your sending domain or use Resend's testing domain
4. Navigate to API Keys section
5. Create a new API key

### 2. Configure Environment Variables

Add these to your `.env` file:

```env
# Required
RESEND_API_KEY="re_your_api_key_here"
FROM_EMAIL="Syncco Visitor Management <noreply@yourdomain.com>"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# For local development
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important Notes:**
- For production, use your verified domain in `FROM_EMAIL`
- For testing, you can use `onboarding@resend.dev` as the FROM_EMAIL
- `NEXT_PUBLIC_APP_URL` is used to generate Accept/Decline links in emails

### 3. Verify Domain (Production Only)

For production use, verify your domain in Resend:

1. Go to Resend Dashboard → Domains
2. Add your domain (e.g., `yourdomain.com`)
3. Add the DNS records provided by Resend to your DNS provider
4. Wait for verification (usually a few minutes)
5. Update `FROM_EMAIL` to use your verified domain

---

## 📧 Email Template

The visitor arrival email includes:

- **Visitor Details**:
  - Full Name
  - Company/Organization
  - Email (clickable mailto link)
  - Phone (clickable tel link)
  - Reason for Visit
  - Check-In Time

- **Action Buttons**:
  - ✓ Accept Meeting (green button)
  - ✗ Decline Meeting (red button)
  - Link to Employee Dashboard

- **Professional Styling**:
  - Responsive design
  - Works in all major email clients
  - Branded with Syncco/Lantern Cybersecurity

---

## 🔧 How It Works

### Flow:

1. **Visitor Checks In**
   - Visitor fills out check-in form at kiosk/tablet
   - Form includes: Name, Company, Email, Phone, Reason for Visit, Who to See
   - Visitor data is saved to database

2. **System Finds Host**
   - System looks up staff member by name (`whomToSee` field)
   - Checks if staff member has notifications enabled

3. **Notification Sent**
   - If `notifyOnVisitorArrival` is true:
     - Email sent if `notifyEmail` is true and `email` is provided
     - SMS sent if `notifySMS` is true and `phone` is provided (placeholder)
   - All notifications are logged in `visitor_notifications` table

4. **Host Receives Notification**
   - Email arrives with visitor details
   - Host can click "Accept" or "Decline" button
   - Clicking button opens `/employee/respond` page (Phase 4)

5. **Notification Logged**
   - Status: `pending`, `sent`, `failed`, `delivered`
   - Error messages captured if sending fails
   - Visible in admin dashboard for auditing

---

## 🧪 Testing

### Test Email Notification:

1. Ensure environment variables are set:
```bash
RESEND_API_KEY=re_xxx
FROM_EMAIL="Test <onboarding@resend.dev>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

2. Create a test staff member:
   - Go to `/dashboard/staff`
   - Add staff with:
     - Full Name: "Test Employee"
     - Email: your-email@example.com
     - `notifyEmail`: ✓ Checked
     - `notifyOnVisitorArrival`: ✓ Checked (default)

3. Check in as a visitor:
   - Go to `/visitor/checkin`
   - Fill out form
   - Select "Test Employee" as "Who are you here to see?"
   - Submit

4. Check your email:
   - You should receive a visitor arrival notification within 30 seconds
   - Email should include visitor details and Accept/Decline buttons

5. Check notification log:
   - Query the `visitor_notifications` table
   - Should see an entry with `status: 'sent'`

### Test Scenarios:

| Scenario | Expected Behavior |
|----------|-------------------|
| Staff email enabled | Email sent, status: 'sent' |
| Staff email disabled | No email sent |
| Staff email missing | Email not sent (logged as skipped) |
| `notifyOnVisitorArrival` = false | No notifications sent |
| Invalid email address | Email fails, status: 'failed', error logged |
| Resend API key missing | Email fails with API error |

---

## 🔍 Troubleshooting

### Email Not Sending

**Problem**: Visitor checks in but no email is received.

**Solutions**:
1. Check environment variables:
   ```bash
   echo $RESEND_API_KEY
   echo $FROM_EMAIL
   ```

2. Check server logs for errors:
   ```bash
   npm run dev
   # Look for "Error sending email:" messages
   ```

3. Verify staff member settings:
   - `email` field is filled
   - `notifyEmail` is true
   - `notifyOnVisitorArrival` is true
   - Staff member `isActive` is true

4. Check `visitor_notifications` table:
   ```sql
   SELECT * FROM visitor_notifications 
   WHERE "visitorId" = 'visitor_id_here'
   ORDER BY "createdAt" DESC;
   ```
   - Look at `status` and `errorMessage` fields

5. Test Resend API directly:
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer re_your_api_key" \
     -H "Content-Type: application/json" \
     -d '{"from":"onboarding@resend.dev","to":"test@example.com","subject":"Test","html":"Test"}'
   ```

### Email Goes to Spam

**Solutions**:
1. Verify your domain in Resend
2. Add SPF, DKIM, and DMARC records to your DNS
3. Use a professional `FROM_EMAIL` address
4. Avoid spam trigger words in subject/content
5. Warm up your sending domain gradually

### Accept/Decline Links Not Working

**Problem**: Clicking buttons in email shows 404 or error.

**Solutions**:
1. Verify `NEXT_PUBLIC_APP_URL` is correct
2. Ensure `/employee/respond` route exists (Phase 4)
3. Check token generation and verification logic
4. Token expires after 24 hours - check timestamp

---

## 📊 Monitoring

### Notification Statistics

Access notification stats via tRPC:
```typescript
const stats = trpc.notification.getNotificationStats.useQuery({
  startDate: new Date('2025-01-01'),
  endDate: new Date(),
});

// Returns:
// {
//   total: 100,
//   sent: 95,
//   failed: 5,
//   pending: 0,
//   byType: { email: 95, sms: 5 }
// }
```

### Notification History

View notifications for a specific visitor:
```typescript
const notifications = trpc.notification.getVisitorNotifications.useQuery({
  visitorId: 'visitor_id_here',
});

// Returns array of notifications with status, timestamps, errors
```

---

## 🔐 Security

### Action Token System

Accept/Decline links use a simple token system:

1. **Token Generation**:
   - Encodes `visitorId`, `staffId`, and `timestamp`
   - Base64URL encoded
   - Includes in email as query parameter

2. **Token Verification**:
   - Decodes token
   - Checks if token is < 24 hours old
   - Verifies `visitorId` and `staffId` match

3. **Expiration**:
   - Tokens expire after 24 hours
   - User is shown an error if token is expired

**Note**: For production, consider using proper JWT tokens with signing for added security.

---

## 📚 API Reference

### `notification.sendVisitorArrival`

**Type**: Public Mutation

**Input**:
```typescript
{
  visitorId: string
}
```

**Returns**:
```typescript
{
  success: boolean;
  notifications: Array<{
    type: 'email' | 'sms';
    status: 'sent' | 'failed' | 'pending';
    id?: string;
    error?: string;
  }>;
  message: string;
}
```

**Description**: Sends visitor arrival notifications to the host staff member based on their preferences.

---

### `notification.getVisitorNotifications`

**Type**: Protected Query

**Input**:
```typescript
{
  visitorId: string
}
```

**Returns**:
```typescript
Array<{
  id: string;
  visitorId: string;
  recipientType: 'email' | 'sms';
  recipientValue: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  sentAt: Date | null;
  deliveredAt: Date | null;
  messageType: 'check-in' | 'check-out' | 'meeting-reminder';
  messageContent: string | null;
  errorMessage: string | null;
  createdAt: Date;
}>
```

**Description**: Retrieves all notification attempts for a specific visitor.

---

### `notification.getNotificationStats`

**Type**: Protected Query

**Input**:
```typescript
{
  startDate?: Date;
  endDate?: Date;
}
```

**Returns**:
```typescript
{
  total: number;
  sent: number;
  failed: number;
  pending: number;
  byType: {
    email: number;
    sms: number;
  };
}
```

**Description**: Gets notification statistics for a date range (or all time if no dates provided).

---

## 🔮 Future Enhancements (Phases 4-7)

### Phase 4: Employee Response
- [ ] Accept/Decline handling
- [ ] Update visitor status in real-time
- [ ] Send confirmation to receptionist

### Phase 5: Employee Dashboard
- [ ] Show pending visitor notifications
- [ ] Notification preferences UI
- [ ] Notification history

### Phase 6: Meeting Reminders
- [ ] Send reminder before scheduled meetings
- [ ] Recurring meeting notifications

### SMS Integration (Optional)
- [ ] Install Twilio SDK
- [ ] Implement `sendVisitorArrivalSMS`
- [ ] Add SMS templates
- [ ] Test SMS delivery

---

## 📝 Checklist

- [ ] Resend account created
- [ ] API key obtained and added to `.env`
- [ ] Domain verified (production only)
- [ ] `FROM_EMAIL` configured
- [ ] `NEXT_PUBLIC_APP_URL` set correctly
- [ ] Test staff member created with email
- [ ] Test visitor check-in performed
- [ ] Email received successfully
- [ ] Notification logged in database
- [ ] Email styling looks correct in inbox
- [ ] Accept/Decline links generated (ready for Phase 4)

---

**Status**: Phase 3 Complete ✅
**Next Phase**: Phase 4 - Employee Response System


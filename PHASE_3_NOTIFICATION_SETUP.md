# 📧 Phase 3: Notification System - Setup Guide

## ✅ Implementation Complete!

The notification system is now fully implemented and ready to use.

---

## 🔧 Installation Steps

### 1. Install Resend Package

```bash
npm install resend
```

### 2. Get Your Resend API Key

1. Sign up for Resend at https://resend.com (free tier: 3,000 emails/month)
2. Verify your sending domain (or use resend's test domain for development)
3. Generate an API key from the dashboard
4. Copy the API key (starts with `re_`)

### 3. Configure Environment Variables

Add these to your `.env` file:

```env
# Email Notifications (Required for Phase 3)
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=noreply@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For Development:**
- Use `onboarding@resend.dev` as the FROM_EMAIL during testing
- Resend's test domain allows you to send to any email address

**For Production:**
- Add and verify your domain in Resend dashboard
- Update `FROM_EMAIL` to use your verified domain (e.g., `noreply@syncco.com`)

### 4. Apply Database Migration

Run the Prisma migration to create the notification tables:

```bash
npx prisma db push
```

This will create:
- `visitor_notifications` table
- `company_suggestions` table
- `meetings` table
- New columns in `visitors` and `staff` tables

### 5. Restart Development Server

```bash
npm run dev
```

---

## 🎨 What's Been Implemented

### 1. **Email Templates** (`lib/email-templates.tsx`)

#### Visitor Arrival Email
- Beautiful HTML email sent to staff members
- Includes visitor details: name, company, reason, time, contact info
- Professional design with responsive layout
- Placeholders for Accept/Decline buttons (Phase 4)

#### Host Response Email
- Sent to visitors when host accepts/declines
- Different styling for accepted vs. declined
- Optional meeting location and custom message

### 2. **Resend Integration** (`lib/resend.ts`)

- Configured Resend client with API key
- Environment variable validation
- Graceful degradation if API key is missing

### 3. **Notification Router** (`server/routers/notification.ts`)

#### Procedures:
- **`sendVisitorArrival`** (Public)
  - Sends email notification to host staff
  - Checks staff notification preferences
  - Logs notification in database
  - Non-blocking (won't fail check-in if email fails)
  
- **`sendHostResponse`** (Protected)
  - Sends response email to visitor
  - Includes host's decision and optional note
  - Logs notification

- **`getHistory`** (Protected)
  - View all notifications for a visitor
  - Useful for troubleshooting

- **`getFailedNotifications`** (Protected)
  - Admin view of failed notifications
  - Includes error messages

- **`retryNotification`** (Protected)
  - Retry sending failed notifications
  - Placeholder for future enhancement

### 4. **Check-In Integration**

- Visitor check-in form now triggers notification
- Asynchronous send (doesn't block user experience)
- Toast notification confirms host was notified
- Error handling prevents check-in failure

---

## 📋 How It Works

### Flow:

1. **Visitor Checks In**
   ```
   Visitor fills form → Creates visitor record → Returns success
   ```

2. **Notification Triggered** (Asynchronous)
   ```
   Look up host staff → Check preferences → Send email → Log result
   ```

3. **Email Delivered**
   ```
   Host receives email → Views visitor details → Can respond (Phase 4)
   ```

### Staff Notification Preferences:

Staff members have these notification settings (in `Staff` model):
- `notifyEmail` (default: true) - Enable/disable email notifications
- `notifySMS` (default: false) - Enable/disable SMS notifications
- `notifyOnVisitorArrival` (default: true) - Master toggle for visitor notifications

These can be configured in the Staff Management page.

---

## 🧪 Testing

### 1. Test Email Sending

1. Make sure `RESEND_API_KEY` is set in `.env`
2. Add a staff member with a valid email address
3. Check in as a visitor, selecting that staff member
4. Check the staff member's email inbox

**Expected Result:**
- Email arrives within 10-30 seconds
- Subject: "🔔 Visitor Arrival: [Name] from [Company]"
- Email contains all visitor details

### 2. Test Notification Preferences

1. In Staff Management, edit a staff member
2. Uncheck "Allow Visitor Notifications"
3. Check in as a visitor for that staff member
4. No email should be sent

### 3. Test Error Handling

1. Set `RESEND_API_KEY` to an invalid value
2. Check in as a visitor
3. Check-in should still succeed
4. Error logged in console
5. Notification marked as "failed" in database

### 4. View Notification History

In the admin dashboard (future enhancement), you'll be able to:
- View all notifications sent
- See delivery status
- Retry failed notifications

---

## 📊 Database Schema

### VisitorNotification Table

```prisma
model VisitorNotification {
  id              String    @id @default(cuid())
  visitorId       String
  recipientType   String    // "email" or "sms"
  recipientValue  String    // email address or phone number
  status          String    // "pending", "sent", "failed", "delivered"
  sentAt          DateTime?
  deliveredAt     DateTime?
  messageType     String    // "check-in", "check-out", "meeting-reminder"
  messageContent  String?   // Full text of message
  errorMessage    String?   // If failed
  createdAt       DateTime
}
```

---

## 🔍 Troubleshooting

### Email Not Sending?

**Check:**
1. ✅ `RESEND_API_KEY` is set in `.env`
2. ✅ API key is valid (not revoked)
3. ✅ `FROM_EMAIL` is correct
4. ✅ Staff member has a valid email address
5. ✅ Staff member has `notifyEmail = true` and `notifyOnVisitorArrival = true`
6. ✅ Check server console for errors

**Common Errors:**

```
Error: "Domain not verified"
Solution: Use onboarding@resend.dev for testing, or verify your domain in Resend dashboard
```

```
Error: "Invalid API key"
Solution: Regenerate API key from Resend dashboard, update .env
```

```
Error: "Rate limit exceeded"
Solution: You've exceeded Resend's free tier (3,000 emails/month), upgrade plan or wait
```

### Notification Marked as Failed?

Query the database:
```sql
SELECT * FROM visitor_notifications WHERE status = 'failed' ORDER BY "createdAt" DESC LIMIT 10;
```

Check the `errorMessage` column for details.

### How to View Logs?

Check your Next.js server console for these messages:
- `✓ Email sent to [email] for visitor [name]` - Success
- `Email notification skipped for [name]: [reason]` - Skipped (preference or missing data)
- `Email send error: [error]` - Failed

---

## 🚀 Next Steps

### Phase 4: Employee Response System (Next)

Now that notifications are working, Phase 4 will add:
- Accept/Decline buttons in emails
- Token-based authentication for responses
- Real-time updates to receptionist dashboard
- Response logging and audit trail

### SMS Integration (Optional)

To add SMS notifications:

1. Install Twilio:
```bash
npm install twilio
```

2. Add to `.env`:
```env
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
```

3. Create `lib/twilio.ts` similar to `lib/resend.ts`

4. Update `notification.sendVisitorArrival` to check `staff.notifySMS`

---

## 📈 Performance Considerations

### Non-Blocking Design

Notifications are sent **asynchronously** and do **not block** visitor check-in:
- Visitor check-in completes immediately
- Notification is triggered in the background
- If notification fails, check-in still succeeds
- Failed notifications are logged for retry

### Rate Limiting

Resend free tier limits:
- 100 emails/day in development
- 3,000 emails/month in production
- Need more? Upgrade to paid plan

### Email Deliverability

To improve deliverability:
1. ✅ Verify your sending domain (SPF, DKIM, DMARC)
2. ✅ Use a professional FROM_EMAIL address
3. ✅ Monitor bounce rates in Resend dashboard
4. ✅ Don't send to spam traps or invalid addresses

---

## 📚 Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Email Templates](https://resend.com/docs/send-with-react)
- [Domain Verification Guide](https://resend.com/docs/dashboard/domains/introduction)
- [Resend API Reference](https://resend.com/docs/api-reference/introduction)

---

## ✅ Checklist

Before moving to Phase 4, confirm:

- [ ] `npm install resend` completed
- [ ] `RESEND_API_KEY` added to `.env`
- [ ] `FROM_EMAIL` configured
- [ ] Database migration applied (`npx prisma db push`)
- [ ] Test email sent successfully
- [ ] Staff notification preferences working
- [ ] Error handling tested (invalid API key, etc.)
- [ ] Notification logging in database verified

---

**Phase 3 Status: ✅ COMPLETE**

**Ready for Phase 4: Employee Response System** 🎉


# Visitor Management System - Enhanced Features Implementation Guide

## Overview

This document outlines the implementation of comprehensive enhancements to the Syncco Visitor Management System, including notifications, employee responses, meeting scheduling, and more.

## 🗄️ **Phase 1: Database Schema (COMPLETED ✅)**

### New Models Added:

#### **Meeting** Model
- Manages employee meetings and bookings
- Includes calendar integration fields (Google/Outlook)
- Tracks meeting status and attendees
- Links to visitors upon check-in

#### **VisitorNotification** Model
- Logs all notifications sent (email/SMS)
- Tracks delivery status
- Stores message content for audit

#### **CompanySuggestion** Model
- Auto-suggests previously entered companies
- Tracks usage frequency
- Improves data consistency

### Enhanced Existing Models:

####**Visitor** Model - New Fields:
- `reasonForVisit`: Meeting, Delivery, Interview, Service, Other
- `hostStaffId`: Link to Staff member
- `meetingId`: Link to scheduled meeting
- `hostResponseStatus`: pending, accepted, declined
- `hostResponseTime`: When host responded
- `hostResponseNote`: Optional message from host

#### **Staff** Model - New Fields:
- `phone`: For SMS notifications
- `notifyEmail`: Email notification preference
- `notifySMS`: SMS notification preference
- `notifyOnVisitorArrival`: Automatic notification toggle

### Migration Status:
**⚠️ DATABASE MIGRATION PENDING**

Run the migration endpoint to apply schema changes:
```bash
curl http://localhost:3000/api/migrate-v2
```

Or manually run Prisma migration when database is stable:
```bash
npx prisma db push
```

---

## 📋 **Phase 2: Visitor Check-In Form Enhancements (IN PROGRESS 🔄)**

### Features to Implement:

#### 1. **Reason for Visit** Field
- Required dropdown/select field
- Options: Meeting, Delivery, Interview, Service, Maintenance, Other
- Custom input for "Other"
- Displayed in:
  - Admin dashboard
  - Employee notifications
  - Visitor badge/confirmation

#### 2. **Enhanced Company/Origin** Field
- Auto-suggest from previous entries
- Manual entry support
- Handles:
  - Company names
  - Branch locations
  - Independent visitors (optional)
- Smart capitalization
- Duplicate prevention
- Placeholder: "Enter company, branch, organization, or location"

### Implementation Files:
- `app/(public)/visitor/checkin/page.tsx` - Update form
- `server/routers/visitor.ts` - Add company suggestions logic
- `server/routers/company.ts` - NEW: Company suggestions router

---

## 📧 **Phase 3: Notification System (PENDING)**

### Email Service Setup:

**Recommended: Resend** (https://resend.com/)
- Developer-friendly API
- High deliverability
- React email templates
- Free tier: 3,000 emails/month

**Alternative: SendGrid, AWS SES, Postmark**

### Implementation Steps:

1. **Install Dependencies:**
```bash
npm install resend react-email
```

2. **Environment Variables:**
```env
RESEND_API_KEY=re_xxx
FROM_EMAIL=noreply@yourdomain.com
```

3. **Create Email Templates:**
- `emails/visitor-arrival.tsx` - Host notification
- `emails/visitor-accepted.tsx` - Visitor confirmation
- `emails/visitor-declined.tsx` - Visitor declined

4. **Create Notification Router:**
- `server/routers/notification.ts`
- `sendVisitorArrivalNotification(visitorId)`
- `sendHostResponseNotification(visitorId, response)`

5. **Integration Points:**
- Call on visitor check-in (visitor.create)
- Call on host response (meeting.respond)
- Log all notifications in `VisitorNotification` table

### SMS Integration (Optional):

**Recommended: Twilio**
```bash
npm install twilio
```

```env
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 👤 **Phase 4: Employee Response System (PENDING)**

### Features:

1. **Email Notification Links:**
- "Accept Meeting" button → `/employee/respond?token=xxx&action=accept`
- "Decline Meeting" button → `/employee/respond?token=xxx&action=decline`
- Secure token-based authentication

2. **Employee Dashboard Response:**
- Show pending visitor notifications
- Accept/Decline buttons
- Optional response message
- Real-time updates to receptionist

3. **Response API:**
```typescript
// server/routers/employee.ts
respondToVisitor({
  visitorId: string,
  action: 'accept' | 'decline',
  note?: string
})
```

4. **Real-Time Updates:**
- Use tRPC subscriptions or Pusher
- Update receptionist dashboard instantly
- Notify visitor at kiosk

---

## 💼 **Phase 5: Employee Dashboard (PENDING)**

### Separate from Admin Dashboard

**Route Structure:**
```
/employee           - Employee landing page
/employee/dashboard - Main dashboard
/employee/meetings  - Calendar view
/employee/visitors  - Pending visitor responses
/employee/settings  - Notification preferences
```

### Features:

1. **Pending Visitors Section:**
- List of visitors waiting for response
- Quick Accept/Decline actions
- View visitor details

2. **Today's Schedule:**
- Upcoming meetings
- Current visitors
- Meeting status

3. **Notification Preferences:**
- Toggle email/SMS
- Set notification schedule (working hours)
- Auto-accept settings

### Access Control:
- Staff with `canLogin = true` can access
- Redirect to employee dashboard after login
- Role-based routing in middleware

---

## 📅 **Phase 6: Meeting/Booking System (PENDING)**

### Calendar UI

**Recommended Library: FullCalendar or react-big-calendar**

```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
```

### Features:

1. **Create Meeting:**
- Date/Time picker
- Duration
- Meeting title & description
- Expected visitors (multiple)
- Location/room
- Notes

2. **Calendar Integration:**

**Google Calendar:**
```bash
npm install googleapis
```
- OAuth2 authentication
- Sync meetings bidirectionally
- Store `googleCalendarEventId`

**Microsoft Outlook:**
```bash
npm install @microsoft/microsoft-graph-client
```
- MSAL authentication
- Sync with Outlook calendar
- Store `outlookCalendarEventId`

3. **Meeting Router:**
```typescript
// server/routers/meeting.ts
create({ title, startTime, endTime, ... })
update({ id, ...changes })
delete({ id })
getUpcoming({ hostId })
linkVisitor({ meetingId, visitorId })
```

---

## 🖥️ **Phase 7: Receptionist Meeting View (PENDING)**

### Dashboard Enhancements:

1. **Today's Meetings Tab:**
- Show all scheduled meetings for the day
- Filter by time (upcoming, in-progress, completed)
- Quick actions:
  - Mark as in-progress
  - Mark as completed
  - Cancel meeting

2. **Check-In Integration:**
- When visitor checks in, automatically link to their meeting
- Display meeting time on confirmation screen
- Show host name and location
- Update meeting status to "in-progress"

3. **Meeting Details:**
- Expected vs. actual check-in time
- Host availability status
- Meeting notes
- Quick message to host

### UI Components:

```typescript
<MeetingList meetings={todaysMeetings} />
<MeetingCard meeting={meeting} />
<VisitorMeetingLink visitorId={id} meetingId={meetingId} />
```

---

## 🔧 **Technical Implementation Details**

### tRPC Router Structure:

```
server/routers/
  ├── visitor.ts          (enhanced)
  ├── staff.ts            (enhanced)
  ├── notification.ts     (NEW)
  ├── meeting.ts          (NEW)
  ├── employee.ts         (NEW)
  ├── company.ts          (NEW)
  └── _app.ts             (updated)
```

### Real-Time Updates:

**Option 1: tRPC Subscriptions (WebSockets)**
```typescript
// server/routers/visitor.ts
onVisitorUpdate: publicProcedure
  .subscription(() => {
    return observable<Visitor>((emit) => {
      // Emit updates
    });
  })
```

**Option 2: Pusher (Recommended for multi-server)**
```bash
npm install pusher pusher-js
```

```env
PUSHER_APP_ID=xxx
PUSHER_KEY=xxx
PUSHER_SECRET=xxx
PUSHER_CLUSTER=xxx
```

### Authentication & Authorization:

#### **Clerk Roles:**
1. `admin` - Full access
2. `receptionist` - Dashboard access
3. `employee` - Employee dashboard access

Update Clerk metadata:
```typescript
await clerk.users.updateUserMetadata(userId, {
  publicMetadata: {
    role: 'employee',
    staffId: 'xxx'
  }
});
```

#### **Middleware Updates:**
```typescript
// middleware.ts
if (pathname.startsWith('/employee')) {
  // Check if user is employee
  if (user.publicMetadata.role !== 'employee') {
    return redirect('/dashboard');
  }
}
```

---

## 📱 **Mobile & Tablet Responsiveness**

All new features must be:
- Touch-friendly (larger buttons, spacing)
- Responsive breakpoints (mobile, tablet, desktop)
- PWA-compatible
- Optimized for kiosk mode

### Tested Viewports:
- Mobile: 375px, 414px
- Tablet: 768px, 1024px
- Desktop: 1280px+

---

## 🚀 **Deployment Checklist**

### Environment Variables Required:
```env
# Existing
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# New - Email/SMS
RESEND_API_KEY=
FROM_EMAIL=
TWILIO_ACCOUNT_SID= (optional)
TWILIO_AUTH_TOKEN= (optional)
TWILIO_PHONE_NUMBER= (optional)

# New - Calendar Integration
GOOGLE_CLIENT_ID= (optional)
GOOGLE_CLIENT_SECRET= (optional)
MICROSOFT_CLIENT_ID= (optional)
MICROSOFT_CLIENT_SECRET= (optional)

# New - Real-Time
PUSHER_APP_ID= (optional)
PUSHER_KEY= (optional)
PUSHER_SECRET= (optional)
PUSHER_CLUSTER= (optional)
```

### Database:
- Run migrations
- Seed test data
- Verify indexes

### Testing:
- End-to-end visitor check-in flow
- Notification delivery (email/SMS)
- Employee response workflow
- Meeting creation & linking
- Real-time updates
- Calendar sync

---

## 📊 **Success Metrics**

Track these after deployment:
- Notification delivery rate
- Employee response time
- Meeting check-in accuracy
- System adoption rate
- User satisfaction (surveys)

---

## 🆘 **Troubleshooting**

### Notifications Not Sending:
1. Check RESEND_API_KEY
2. Verify FROM_EMAIL domain
3. Check staff notification preferences
4. Review VisitorNotification logs

### Calendar Sync Issues:
1. Re-authenticate OAuth
2. Check API quotas
3. Verify event permissions
4. Check timezone settings

### Real-Time Updates Not Working:
1. Check WebSocket connection
2. Verify Pusher credentials
3. Check firewall/proxy settings
4. Review subscription logic

---

## 📚 **Additional Resources**

- [Resend Documentation](https://resend.com/docs)
- [Twilio SMS Guide](https://www.twilio.com/docs/sms)
- [Google Calendar API](https://developers.google.com/calendar)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/overview)
- [tRPC Subscriptions](https://trpc.io/docs/subscriptions)
- [Pusher Channels](https://pusher.com/docs/channels/)

---

## 🎯 **Current Status**

✅ Phase 1: Database Schema - COMPLETED
🔄 Phase 2: Visitor Form Updates - IN PROGRESS
⏳ Phase 3: Notifications - PENDING
⏳ Phase 4: Employee Response - PENDING
⏳ Phase 5: Employee Dashboard - PENDING
⏳ Phase 6: Meeting/Booking - PENDING
⏳ Phase 7: Receptionist View - PENDING

**Estimated Timeline:** 2-3 weeks for full implementation
**Priority Order:** Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7


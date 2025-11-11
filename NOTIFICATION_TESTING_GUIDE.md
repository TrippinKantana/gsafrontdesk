# Notification System Testing Guide

## Quick Test Instructions

### Prerequisites
1. Database is running (Neon)
2. Application is started (`npm run dev`)
3. You have at least 2 test users with different roles

---

## Test Scenario 1: Visitor Response Notification

### Setup
- **User A**: Receptionist
- **User B**: Employee

### Steps
1. **As Receptionist (User A)**:
   - Go to `/dashboard`
   - Check in a visitor
   - Select "User B" as "Whom to See"
   - Complete check-in

2. **As Employee (User B)**:
   - Go to `/employee/dashboard`
   - See pending visitor notification
   - Click "Accept" or "Decline"
   - Add optional note

3. **As Receptionist (User A)**:
   - **Check notification bell** 🔔
   - Should see "Staff Accepted/Declined Visitor" notification
   - Click notification → redirects to dashboard
   - Mark as read or delete

**Expected Result**: ✅ Receptionist receives real-time notification when staff responds

---

## Test Scenario 2: IT Ticket Notifications

### Setup
- **User A**: Employee
- **User B**: IT Staff

### Steps
1. **As Employee (User A)**:
   - Go to `/employee/dashboard`
   - Click "Create Ticket" button
   - Fill in title, description, priority
   - Submit ticket

2. **As IT Staff (User B)**:
   - **Check notification bell** 🔔
   - Should see "New Support Ticket" notification
   - Click notification → redirects to ticket detail
   - Assign ticket to yourself
   - Change status to "In Progress"
   - Add a message

3. **As Employee (User A)**:
   - **Check notification bell** 🔔
   - Should see 2 notifications:
     - "Ticket Assigned to You" (if you assigned to yourself)
     - "Ticket Status Updated"
     - "New Message on Ticket"
   - Click any notification → redirects to ticket

**Expected Result**: ✅ Both parties receive notifications for ticket events

---

## Test Scenario 3: Meeting Notifications

### Setup
- **User A**: Employee

### Steps
1. **As Employee (User A)**:
   - Go to `/employee/meetings`
   - Click "Schedule Meeting"
   - Fill in meeting details
   - Submit

2. **Check notification bell** 🔔
   - Should see "Meeting Scheduled" notification
   - Click notification → redirects to meetings page

3. **As Admin/Receptionist**:
   - Go to `/dashboard/meetings`
   - Find the meeting
   - Change status to "Cancelled"

4. **As Employee (User A)**:
   - **Check notification bell** 🔔
   - Should see "Meeting Cancelled" notification

**Expected Result**: ✅ Employee receives meeting confirmation and update notifications

---

## UI/UX Tests

### Notification Bell Behavior
- [ ] Bell icon displays in all navigation bars
- [ ] Unread count badge shows correct number
- [ ] Badge shows "9+" when > 9 unread
- [ ] Clicking bell opens dropdown
- [ ] Dropdown stays open until closed

### Notification List
- [ ] Unread notifications have blue background
- [ ] Unread notifications have blue dot indicator
- [ ] Read notifications have white background
- [ ] Timestamps show relative time (5m ago, 2h ago)
- [ ] Emoji icons display for each type
- [ ] Long messages are truncated with "..."

### Actions
- [ ] Clicking notification navigates to correct page
- [ ] "Mark all read" button appears when unread exist
- [ ] "Mark all read" marks all as read instantly
- [ ] "Clear read" button appears when read exist
- [ ] "Clear read" deletes all read notifications
- [ ] Hover shows individual actions (mark read, delete)
- [ ] Mark read button works per notification
- [ ] Delete button works per notification

### Real-time Updates
- [ ] Unread count updates every 30 seconds
- [ ] New notifications appear automatically
- [ ] UI updates immediately after actions
- [ ] No page refresh required

### Mobile
- [ ] Notification bell appears in mobile nav drawer
- [ ] Dropdown works correctly on mobile
- [ ] Touch interactions work smoothly
- [ ] Notifications readable on small screens

---

## Organization Isolation Tests

### Multi-tenant Safety
1. Create 2 organizations in Clerk
2. Add User A to Org 1
3. Add User B to Org 2
4. User A creates a ticket in Org 1
5. **Check**: User B should NOT see this notification
6. Switch User A to Org 2
7. **Check**: Notification should NOT appear in Org 2

**Expected Result**: ✅ Notifications are organization-specific

---

## Performance Tests

### Load Test
- [ ] Create 20+ notifications
- [ ] Check dropdown scroll works smoothly
- [ ] Check loading state displays briefly
- [ ] Check no lag when opening dropdown

### Auto-refresh Test
- [ ] Leave dropdown closed
- [ ] Create notification from another session
- [ ] Wait 30 seconds
- [ ] Check unread count updates automatically

---

## Error Handling

### Network Errors
- [ ] Disconnect internet
- [ ] Try to mark notification as read
- [ ] Check appropriate error handling
- [ ] Reconnect and verify it works

### Permission Errors
- [ ] Try to access notification from another org
- [ ] Should fail gracefully

---

## Console Check

Open browser console and check for:
- ✅ `[Notification] Receptionist notified of visitor response`
- ✅ `[Notification] Notified X IT staff of new ticket`
- ✅ `[Notification] IT staff notified of ticket assignment`
- ✅ `[Notification] Ticket creator notified of status change`
- ✅ `[Notification] Created X ticket message notifications`
- ✅ `[Notification] Host notified of meeting creation`
- ✅ `[Notification] Host notified of meeting update`

---

## Quick Verification Checklist

- [ ] Receptionist receives visitor response notifications
- [ ] IT staff receives ticket creation notifications
- [ ] IT staff receives ticket assignment notifications
- [ ] Employees receive ticket status change notifications
- [ ] Both parties receive ticket message notifications
- [ ] Employees receive meeting scheduled notifications
- [ ] Employees receive meeting update notifications
- [ ] Notification bell shows unread count
- [ ] Clicking notification navigates correctly
- [ ] Mark as read works
- [ ] Delete works
- [ ] Auto-refresh works (30s)
- [ ] Mobile integration works
- [ ] Organization isolation works

---

## Common Issues & Solutions

### Issue: Notifications not appearing
**Check**:
1. Database schema updated? (`npx prisma db push`)
2. Organization context present? (User must be in an org)
3. Console logs showing notification creation?
4. User has `clerkUserId` set?

### Issue: Unread count not updating
**Check**:
1. Notification dropdown component imported correctly?
2. tRPC client configured properly?
3. Network tab showing API calls every 30s?

### Issue: Clicking notification doesn't navigate
**Check**:
1. `actionUrl` field populated in notification?
2. Next.js router working correctly?
3. User has permission to access target page?

---

## Success Criteria

✅ All notification types trigger correctly  
✅ UI updates in real-time  
✅ Organization isolation maintained  
✅ Mobile experience smooth  
✅ No console errors  
✅ Performance acceptable (< 1s load time)  
✅ Email + in-app notifications both work  

Ready to test! 🚀




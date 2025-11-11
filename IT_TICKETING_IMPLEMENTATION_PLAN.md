# 🎫 IT Support Ticketing System - Implementation Plan

## Overview
Comprehensive IT ticketing system integrated into the existing visitor management platform with role-based access control.

---

## 🗂️ Phase Breakdown

### ✅ Phase 1: Database Schema (IN PROGRESS)
**Files Modified:**
- `prisma/schema.prisma`

**New Models Added:**
1. **Staff** - Enhanced with `role` field:
   - `role`: Employee, Receptionist, Admin, IT Staff
   
2. **Ticket**:
   - `ticketNumber`: Unique auto-generated ID (TKT-20231105-001)
   - `title`, `description`, `priority`, `status`, `category`
   - `createdBy` (Staff relation)
   - `assignedTo` (IT Staff relation)
   - `resolutionNotes`, `resolvedAt`, `closedAt`

3. **TicketMessage**:
   - Two-way messaging between requester and IT staff
   - `isInternal` flag for IT-only notes
   - Thread tracking

4. **TicketAttachment**:
   - File uploads (screenshots, documents)
   - File metadata (size, type, URL)

5. **TicketNotification**:
   - Email notification tracking
   - Status: pending, sent, failed

---

### Phase 2: tRPC Router & API
**Files to Create:**
- `server/routers/ticket.ts`

**Endpoints:**
- `create` - Create new ticket (any authenticated user)
- `getAll` - Get all tickets (IT Staff & Admin only)
- `getMyTickets` - Get tickets created by current user
- `getById` - Get ticket details with messages
- `update` - Update ticket (status, priority, assignment)
- `assign` - Assign ticket to IT staff
- `resolve` - Mark ticket as resolved
- `close` - Close ticket
- `addMessage` - Add message to ticket thread
- `uploadAttachment` - Handle file uploads
- `getMetrics` - Get ticket statistics (IT Dashboard)

---

### Phase 3: Role-Based Routing
**Files to Modify:**
- `app/page.tsx` - Update routing logic
- `middleware.ts` - Add IT dashboard routes
- `server/routers/staff.ts` - Add role to staff CRUD

**Routing Logic:**
```
User Signs In → Check Role:
├─ Employee → /employee/dashboard
├─ Receptionist → /dashboard (receptionist view)
├─ Admin → /dashboard (admin view)
└─ IT Staff → /it/dashboard
```

---

### Phase 4: IT Staff Dashboard
**Files to Create:**
- `app/(it)/it/dashboard/page.tsx`
- `app/(it)/it/tickets/page.tsx`
- `app/(it)/it/tickets/[id]/page.tsx`
- `components/it-nav.tsx`

**Features:**
- Ticket queue (Open, In Progress, Resolved)
- Metrics cards:
  - Total Open Tickets
  - Average Response Time
  - Resolved vs. Unresolved
  - Ticket Volume by Department
- Filter by status, priority, requester, department
- Search tickets
- Assign tickets to self/others
- Update ticket status
- Add internal notes
- View ticket history

---

### Phase 5: Ticket Creation (All Dashboards)
**Files to Create:**
- `components/tickets/create-ticket-dialog.tsx`
- `components/tickets/ticket-list.tsx`
- `components/tickets/ticket-detail.tsx`

**Files to Modify:**
- `app/(employee)/employee/dashboard/page.tsx` - Add "Submit IT Ticket" button
- `app/(dashboard)/dashboard/page.tsx` - Add "Submit IT Ticket" button (for admin/receptionist)

**Form Fields:**
- Title (required)
- Description (required, textarea)
- Priority (dropdown: Low, Medium, High, Critical)
- Category (dropdown: Hardware, Software, Network, Access, Other)
- Attachments (optional, multiple files)

---

### Phase 6: Messaging System
**Files to Create:**
- `components/tickets/message-thread.tsx`
- `components/tickets/message-input.tsx`

**Features:**
- Real-time message display
- Show sender name, timestamp
- Distinguish between requester and IT staff messages
- Internal notes (IT staff only, highlighted differently)
- File attachments in messages
- Auto-scroll to latest message
- Message notifications

---

### Phase 7: Email Notifications
**Files to Create:**
- `lib/ticket-email.ts`
- `emails/ticket-created.tsx`
- `emails/ticket-updated.tsx`
- `emails/ticket-message.tsx`
- `emails/ticket-resolved.tsx`

**Notification Triggers:**
1. **New Ticket Created**:
   - To: IT Staff (all or specific assignment)
   - Content: Ticket details, link to view
   
2. **Ticket Assigned**:
   - To: Assigned IT staff, Ticket creator
   - Content: Assignment notification
   
3. **New Message**:
   - To: Requester (if IT staff sent) or Assigned IT staff (if requester sent)
   - Content: Message preview, link to ticket
   
4. **Status Update**:
   - To: Requester
   - Content: New status, update details
   
5. **Ticket Resolved**:
   - To: Requester
   - Content: Resolution notes, close ticket option

---

## 🔐 Role-Based Permissions

| Action | Employee | Receptionist | Admin | IT Staff |
|--------|----------|--------------|-------|----------|
| Create Ticket | ✅ | ✅ | ✅ | ✅ |
| View Own Tickets | ✅ | ✅ | ✅ | ✅ |
| View All Tickets | ❌ | ❌ | ✅ | ✅ |
| Assign Tickets | ❌ | ❌ | ✅ | ✅ |
| Update Status | ❌ | ❌ | Partial | ✅ |
| Add Internal Notes | ❌ | ❌ | ❌ | ✅ |
| Resolve/Close | ❌ | ❌ | Partial | ✅ |
| View Metrics | ❌ | ❌ | ✅ | ✅ |

---

## 📊 Database Schema Details

### Ticket Model
```prisma
model Ticket {
  id            String   @id @default(cuid())
  ticketNumber  String   @unique
  title         String
  description   String   @db.Text
  priority      String   @default("Medium")
  status        String   @default("Open")
  category      String?
  
  createdById   String
  createdBy     Staff    @relation(...)
  
  assignedToId  String?
  assignedTo    Staff?   @relation(...)
  
  resolutionNotes String? @db.Text
  resolvedAt    DateTime?
  closedAt      DateTime?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  messages      TicketMessage[]
  attachments   TicketAttachment[]
}
```

---

## 🎨 UI Components

### Ticket Priority Colors
- **Low**: Gray (`bg-gray-100 text-gray-800`)
- **Medium**: Blue (`bg-blue-100 text-blue-800`)
- **High**: Orange (`bg-orange-100 text-orange-800`)
- **Critical**: Red (`bg-red-100 text-red-800`)

### Ticket Status Colors
- **Open**: Blue (`bg-blue-100 text-blue-800`)
- **In Progress**: Yellow (`bg-yellow-100 text-yellow-800`)
- **Resolved**: Green (`bg-green-100 text-green-800`)
- **Closed**: Gray (`bg-gray-100 text-gray-800`)

---

## 🔔 Notification Flow

```
User Creates Ticket
    ↓
1. Save to database
2. Generate ticket number (TKT-YYYYMMDD-XXX)
3. Send email to IT staff team
4. Log notification in TicketNotification table
    ↓
IT Staff Responds
    ↓
1. Save message to database
2. Update ticket updatedAt timestamp
3. Send email to ticket creator
4. Log notification
    ↓
Ticket Resolved
    ↓
1. Update ticket status = "Resolved"
2. Set resolvedAt timestamp
3. Add resolution notes
4. Send resolution email to creator
5. Log notification
```

---

## 📁 File Upload Strategy

**Storage Options:**
1. **UploadThing** (Current system)
2. **AWS S3** (Scalable)
3. **Cloudinary** (Image optimization)

**Validation:**
- Max file size: 10MB per file
- Allowed types: Images (jpg, png, gif), Documents (pdf, docx, txt), Archives (zip)
- Virus scanning (optional, via third-party service)

**Storage Schema:**
```typescript
TicketAttachment {
  fileName: "screenshot.png"
  fileUrl: "https://uploadthing.com/..."
  fileSize: 2048576 // bytes
  fileType: "image/png"
  uploadedById: "staff_id"
}
```

---

## 🧪 Testing Checklist

### Ticket Creation
- [ ] Employee can create ticket
- [ ] Receptionist can create ticket
- [ ] Admin can create ticket
- [ ] IT Staff can create ticket
- [ ] Email notification sent to IT team
- [ ] Ticket number is unique and sequential
- [ ] File attachments upload successfully

### Ticket Management (IT Staff)
- [ ] IT staff can view all tickets
- [ ] Filter by status works
- [ ] Filter by priority works
- [ ] Search by title/description works
- [ ] Can assign ticket to self
- [ ] Can assign ticket to another IT staff member
- [ ] Status updates save correctly
- [ ] Resolution notes are saved

### Messaging
- [ ] Messages appear in thread immediately
- [ ] Sender name and timestamp display
- [ ] Email notifications sent on new message
- [ ] Internal notes only visible to IT staff

### Permissions
- [ ] Employees cannot access IT dashboard
- [ ] Employees can only see their own tickets
- [ ] IT staff can see all tickets
- [ ] Admin has full access

---

## 🚀 Deployment Steps

1. **Update Database Schema**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

2. **Add Environment Variables**:
   ```env
   UPLOADTHING_SECRET=...
   UPLOADTHING_APP_ID=...
   IT_SUPPORT_EMAIL=support@company.com
   ```

3. **Update Existing Staff Records**:
   ```sql
   UPDATE staff SET role = 'Admin' WHERE email = 'admin@company.com';
   UPDATE staff SET role = 'IT Staff' WHERE department = 'IT';
   ```

4. **Test All Flows**:
   - Create tickets from each role
   - Verify routing
   - Test notifications
   - Check permissions

---

## 📈 Future Enhancements (Phase 8+)

- [ ] SLA (Service Level Agreement) tracking
- [ ] Automatic ticket routing based on category
- [ ] Knowledge base integration
- [ ] Chat widget for instant support
- [ ] Mobile app for IT staff
- [ ] Ticket templates for common issues
- [ ] Customer satisfaction surveys
- [ ] Advanced analytics dashboard
- [ ] Integration with external tools (Slack, Teams)
- [ ] AI-powered ticket categorization

---

**Implementation Date**: November 5, 2025
**Estimated Completion**: Phases 1-7 in current session
**Status**: 🟡 Phase 1 In Progress


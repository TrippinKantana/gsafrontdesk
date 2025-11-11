# Front Desk Visitor Management System - Architecture Overview

## System Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: tRPC (type-safe API), Prisma ORM
- **Database**: PostgreSQL (Neon)
- **Authentication**: Clerk
- **File Storage**: UploadThing
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: TanStack Query (via tRPC)

### Project Structure

```
gsafrontdesk/
├── app/
│   ├── (auth)/              # Clerk authentication pages
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/         # Protected receptionist dashboard
│   │   └── dashboard/
│   ├── (public)/            # Public visitor kiosk
│   │   └── visitor/
│   ├── api/
│   │   ├── trpc/[trpc]/     # tRPC API handler
│   │   └── uploadthing/      # UploadThing file upload
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Root redirect
│   └── globals.css          # Global styles
├── components/
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── trpc.ts              # tRPC client setup
│   ├── uploadthing.ts       # UploadThing client
│   └── utils.ts             # Utility functions
├── server/
│   ├── db.ts                # Prisma client singleton
│   ├── trpc.ts              # tRPC server setup
│   └── routers/
│       ├── visitor.ts       # Visitor operations
│       ├── receptionist.ts # Receptionist operations
│       └── _app.ts          # Root router
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed script
└── middleware.ts            # Clerk middleware
```

## Database Schema

### Models

#### Receptionist
- `id` (String, CUID)
- `clerkUserId` (String, unique) - Links to Clerk user
- `fullName` (String)
- `email` (String)
- `location` (String, optional) - For multi-location support
- `createdAt`, `updatedAt` (DateTime)

#### Visitor
- `id` (String, CUID)
- `fullName` (String)
- `company` (String)
- `email` (String)
- `phone` (String)
- `photoUrl` (String, optional)
- `whomToSee` (String) - Staff member name
- `checkInTime` (DateTime, auto-set)
- `checkOutTime` (DateTime, optional)
- `receptionistId` (String, FK, optional)

#### CheckInLog
- `id` (String, CUID)
- `visitorId` (String, FK)
- `status` (String) - "CHECKED_IN" or "CHECKED_OUT"
- `timestamp` (DateTime)

## API Routes (tRPC)

### Visitor Router (`server/routers/visitor.ts`)

#### Public Procedures
- `create` - Create new visitor check-in (public, no auth required)

#### Protected Procedures
- `list` - Get visitors with filters (today/week/all, optional receptionist filter)
- `getById` - Get single visitor details
- `checkout` - Mark visitor as checked out
- `export` - Export visitors as CSV data

### Receptionist Router (`server/routers/receptionist.ts`)

#### Protected Procedures
- `getOrCreate` - Get or create receptionist profile from Clerk user
- `getCurrent` - Get current receptionist
- `getStaffList` - Get list of staff members (for visitor dropdown)

## Authentication Flow

1. **Public Routes** (defined in `middleware.ts`):
   - `/` - Root redirect
   - `/visitor` - Visitor kiosk (no auth)
   - `/api/trpc/visitor.create` - Public visitor creation
   - `/api/uploadthing/*` - File uploads

2. **Protected Routes**:
   - `/dashboard` - Receptionist dashboard (requires Clerk auth)
   - All other routes default to protected

3. **Clerk Integration**:
   - Uses `clerkMiddleware` for route protection
   - Receptionist profiles linked via `clerkUserId`
   - Session management handled by Clerk

## Visitor Check-In Flow

1. Visitor accesses `/visitor` (public kiosk)
2. Fills out form:
   - Full Name (required)
   - Company (required)
   - Email (required)
   - Phone (required)
   - Whom to See (dropdown, required)
   - Photo (optional, via UploadThing)
3. On submit:
   - Form validated with Zod
   - tRPC `visitor.create` called
   - Visitor record created with auto-timestamp
   - CheckInLog entry created with "CHECKED_IN" status
   - Success confirmation shown
4. Receptionist sees new visitor in dashboard (real-time via query refetch)

## Receptionist Dashboard Flow

1. Receptionist signs in via Clerk (`/sign-in`)
2. Dashboard loads (`/dashboard`):
   - Receptionist profile created/fetched
   - Visitors list fetched with current filter
3. Features:
   - **Filters**: Today, This Week, All Visitors
   - **View Details**: Click visitor card to see full details + photo
   - **Check Out**: Mark visitor as checked out
   - **Export CSV**: Download visitor data
4. Real-time updates via tRPC query refetching

## File Upload Flow

1. Visitor uploads photo via UploadThing component
2. Upload handled by `/api/uploadthing/core.ts`
3. File stored in UploadThing cloud storage
4. URL returned and stored in `visitor.photoUrl`
5. Photo displayed in dashboard visitor details

## Security Considerations

1. **Public Visitor Creation**: Only `visitor.create` is public; all other procedures require auth
2. **Protected Procedures**: Use `protectedProcedure` which validates Clerk session
3. **Data Filtering**: Receptionists can filter by their own ID (multi-receptionist support)
4. **File Uploads**: UploadThing handles file validation and storage security

## Deployment Checklist

1. **Environment Variables**:
   - `DATABASE_URL` - Neon PostgreSQL connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
   - `CLERK_SECRET_KEY` - Clerk secret key
   - `UPLOADTHING_SECRET` - UploadThing secret
   - `UPLOADTHING_APP_ID` - UploadThing app ID
   - `NEXT_PUBLIC_APP_URL` - Application URL

2. **Database Setup**:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

3. **Clerk Configuration**:
   - Set up Clerk application
   - Configure sign-in/sign-up pages
   - Set redirect URLs for production

4. **UploadThing Configuration**:
   - Create UploadThing app
   - Configure allowed file types and sizes
   - Set up CORS if needed

## Future Enhancements

- Real-time notifications via WebSockets or Server-Sent Events
- SMS/Email notifications to staff when visitor checks in
- QR code generation for visitor badges
- Visitor history and analytics
- Multi-location support with location-based filtering
- Staff directory management (replace static list)
- Visitor pre-registration system
- Integration with security systems

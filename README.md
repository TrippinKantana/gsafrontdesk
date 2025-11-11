# Front Desk Visitor Management System

A comprehensive visitor management system for government or enterprise office environments with public kiosk interface and authenticated receptionist dashboard.

## Features

### Visitor View (Public Kiosk)
- Touch-friendly full-screen interface
- Visitor information capture (name, company, email, phone, whom to see)
- Photo capture via device camera
- Auto-timestamp on check-in
- Real-time receptionist notification

### Receptionist/Admin View (Authenticated)
- Clerk authentication for receptionist login
- Live visitor list with filters (Today, This Week, All)
- Visitor check-out functionality
- CSV export for visitor logs
- Visitor detail modal with photo and information
- Multi-receptionist support with location-based filtering

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Type Safety**: tRPC + TanStack Query
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Authentication**: Clerk
- **Styling**: TailwindCSS + shadcn/ui
- **File Uploads**: UploadThing

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- Clerk account
- UploadThing account (for photo uploads)

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your:
- `DATABASE_URL` (Neon PostgreSQL connection string)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
- `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`
- `NEXT_PUBLIC_APP_URL`

3. Set up the database:
```bash
npx prisma db push
npx prisma db seed
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── (auth)/           # Clerk authentication pages
│   ├── (public)/         # Public visitor kiosk
│   ├── (dashboard)/      # Protected receptionist dashboard
│   └── api/              # API routes (tRPC, UploadThing)
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   └── ...              # Custom components
├── server/              # tRPC server setup
│   ├── routers/         # tRPC routers
│   └── db.ts            # Prisma client
├── lib/                 # Utilities
└── prisma/              # Prisma schema and migrations
```

## Database Schema

- **Receptionist**: Clerk user accounts for reception staff
- **Visitor**: Visitor check-in records
- **CheckInLog**: Audit trail of check-in/check-out events

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

## Deployment

The application is ready for deployment on Vercel or Railway. Ensure all environment variables are set in your deployment platform.

## License

Private/Proprietary

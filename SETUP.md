# Setup Instructions

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (recommend Neon for managed hosting)
- Clerk account (for authentication)
- UploadThing account (for photo storage)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# UploadThing (for photo uploads)
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=your_app_id

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

#### Option A: Using Neon (Recommended)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL` in `.env`
4. Run migrations:

```bash
npx prisma db push
npx prisma db seed
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database
3. Update `DATABASE_URL` in `.env`
4. Run migrations:

```bash
npx prisma db push
npx prisma db seed
```

### 4. Clerk Setup

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your keys to `.env`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Configure Clerk:
   - Go to User & Authentication → Email, Phone, Username
   - Enable email/phone or username sign-in as needed
   - Set Sign-in redirect URL: `http://localhost:3000/dashboard`
   - Set Sign-up redirect URL: `http://localhost:3000/dashboard`

### 5. UploadThing Setup

1. Sign up at [uploadthing.com](https://uploadthing.com)
2. Create a new app
3. Copy your keys to `.env`:
   - `UPLOADTHING_SECRET`
   - `UPLOADTHING_APP_ID`
4. Configure allowed file types in `app/api/uploadthing/core.ts` if needed

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Test the Application

#### Test Visitor Flow:
1. Navigate to `/visitor`
2. Fill out the form
3. Upload a photo (optional)
4. Submit check-in
5. Verify confirmation screen

#### Test Receptionist Flow:
1. Navigate to `/sign-in`
2. Sign in with Clerk
3. Should redirect to `/dashboard`
4. View visitor list
5. Click a visitor to see details
6. Test checkout functionality
7. Test CSV export

## Common Issues

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Ensure database is accessible
- Check if SSL is required (add `?sslmode=require` to connection string)

### Clerk Authentication Not Working
- Verify keys are correct in `.env`
- Check Clerk dashboard for redirect URLs
- Ensure middleware is configured correctly

### UploadThing Upload Fails
- Verify `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` are correct
- Check file size limits (configured in `app/api/uploadthing/core.ts`)
- Ensure CORS is configured if needed

### tRPC Errors
- Check that all environment variables are set
- Verify database schema is up to date (`npx prisma db push`)
- Check browser console for detailed error messages

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Railway

1. Connect GitHub repository
2. Add PostgreSQL service
3. Add environment variables
4. Deploy

### Environment Variables for Production

Update these values:
- `DATABASE_URL` - Production database URL
- `NEXT_PUBLIC_APP_URL` - Production domain URL
- Clerk keys should use production keys from Clerk dashboard
- UploadThing keys should use production keys

## Database Migrations

After schema changes:

```bash
# Generate migration
npx prisma migrate dev --name migration_name

# Apply to production
npx prisma migrate deploy
```

## Seed Data

To populate database with sample data:

```bash
npx prisma db seed
```

Note: This will create sample receptionists and visitors. Receptionist Clerk user IDs need to match actual Clerk users.

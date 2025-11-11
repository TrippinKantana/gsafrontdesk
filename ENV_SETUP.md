# Environment Variables Setup Guide

## Step 1: Create your .env file

Copy the template and create your actual `.env` file:

```bash
# On Windows (PowerShell)
Copy-Item .env.example .env

# On Mac/Linux
cp .env.example .env
```

Or manually create a file named `.env` in the root directory.

## Step 2: Fill in each environment variable

### 1. DATABASE_URL (PostgreSQL)

**Option A: Using Neon (Recommended - Free Tier Available)**

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string from the dashboard
4. It will look like:
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Paste it into `.env` as:
   ```env
   DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

**Option B: Using Supabase**

1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Project Settings → Database
3. Copy the connection string (URI format)
4. Paste into `.env`

**Option C: Local PostgreSQL**

If you have PostgreSQL installed locally:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/gsafrontdesk?schema=public"
```

---

### 2. Clerk Authentication Keys

1. Go to [clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Go to **API Keys** in the sidebar
4. You'll see two keys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)
5. Copy them to your `.env`:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
   CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
   ```

**Important:** Use `pk_test_` and `sk_test_` for development. Use `pk_live_` and `sk_live_` for production.

---

### 3. UploadThing Keys (for photo uploads)

1. Go to [uploadthing.com](https://uploadthing.com) and sign up
2. Create a new app
3. Go to **API Keys** section
4. You'll see:
   - **Secret Key** (starts with `sk_live_` or `sk_test_`)
   - **App ID** (usually a short identifier)
5. Copy them to your `.env`:
   ```env
   UPLOADTHING_SECRET=sk_live_xxxxxxxxxxxxxxxxxxxx
   UPLOADTHING_APP_ID=your_app_id_here
   ```

---

### 4. NEXT_PUBLIC_APP_URL

This is your application's URL:

**For development:**
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For production:**
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Complete .env file example

```env
# Database
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_51AbC123...
CLERK_SECRET_KEY=sk_test_51AbC123...

# UploadThing
UPLOADTHING_SECRET=sk_live_abc123...
UPLOADTHING_APP_ID=abc123xyz

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Important Security Notes

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Never share your secret keys** publicly
3. **Use test keys** for development, **live keys** for production
4. **Keep your `.env` file secure** - It contains sensitive credentials

---

## Quick Setup Checklist

- [ ] Created `.env` file from `.env.example`
- [ ] Set up Neon/Supabase database and copied `DATABASE_URL`
- [ ] Created Clerk account and copied both keys
- [ ] Created UploadThing account and copied keys
- [ ] Set `NEXT_PUBLIC_APP_URL` to `http://localhost:3000`
- [ ] Verified all values are in quotes if they contain special characters

---

## Testing Your Setup

After setting up your `.env` file, test it:

1. **Database connection:**
   ```bash
   npx prisma db push
   ```
   If this works, your database connection is correct.

2. **Start the dev server:**
   ```bash
   npm run dev
   ```
   If it starts without errors, your environment variables are set up correctly!



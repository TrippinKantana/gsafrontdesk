# Netlify Environment Variables Setup

## Critical: Update NEXT_PUBLIC_APP_URL

After deploying to Netlify, you **must** update the `NEXT_PUBLIC_APP_URL` environment variable to your Netlify URL.

### Steps:

1. **Go to Netlify Dashboard**
   - Navigate to your site: `cosmic-cannoli-ea8d1e.netlify.app`
   - Click on **Site settings** → **Environment variables**

2. **Update NEXT_PUBLIC_APP_URL**
   - Find `NEXT_PUBLIC_APP_URL` in the list
   - Click **Edit**
   - Change from: `http://localhost:3000`
   - Change to: `https://cosmic-cannoli-ea8d1e.netlify.app`
   - Click **Save**

3. **Redeploy**
   - After updating, trigger a new deploy:
     - Go to **Deploys** tab
     - Click **Trigger deploy** → **Deploy site**
   - Or push a new commit to trigger automatic deploy

## Update Clerk Redirect URLs

You also need to update Clerk to allow redirects to your Netlify URL:

1. **Go to Clerk Dashboard**
   - Navigate to [dashboard.clerk.com](https://dashboard.clerk.com)
   - Select your application

2. **Update Allowed Redirect URLs**
   - Go to **User & Authentication** → **Email, Phone, Username**
   - Scroll to **Redirect URLs** section
   - Add your Netlify URLs:
     ```
     https://cosmic-cannoli-ea8d1e.netlify.app
     https://cosmic-cannoli-ea8d1e.netlify.app/dashboard
     https://cosmic-cannoli-ea8d1e.netlify.app/sign-in
     https://cosmic-cannoli-ea8d1e.netlify.app/sign-up
     ```
   - Keep `http://localhost:3000` for local development
   - Click **Save**

3. **Update After Sign-In/Sign-Up URLs** (if configured)
   - In Clerk Dashboard → **Paths**
   - Update:
     - **After sign-in path**: `/dashboard` (or `/`)
     - **After sign-up path**: `/onboarding` (or `/dashboard`)

## Update Google Calendar OAuth (If Using)

If you're using Google Calendar integration:

1. **Go to Google Cloud Console**
   - Navigate to [console.cloud.google.com](https://console.cloud.google.com)
   - Select your project
   - Go to **APIs & Services** → **Credentials**

2. **Update OAuth 2.0 Client**
   - Click on your OAuth client ID
   - Under **Authorized JavaScript origins**, add:
     ```
     https://cosmic-cannoli-ea8d1e.netlify.app
     ```
   - Under **Authorized redirect URIs**, add:
     ```
     https://cosmic-cannoli-ea8d1e.netlify.app/api/calendar/google/callback
     ```
   - Click **Save**

3. **Update Netlify Environment Variables**
   - In Netlify Dashboard → **Environment variables**
   - Update `GOOGLE_REDIRECT_URI`:
     ```
     https://cosmic-cannoli-ea8d1e.netlify.app/api/calendar/google/callback
     ```
   - Or leave it unset (it will use `NEXT_PUBLIC_APP_URL` automatically)

## Update Outlook Calendar OAuth (If Using)

If you're using Outlook Calendar integration:

1. **Go to Azure Portal**
   - Navigate to [portal.azure.com](https://portal.azure.com)
   - Go to **Azure Active Directory** → **App registrations**
   - Select your app

2. **Update Redirect URIs**
   - Go to **Authentication**
   - Under **Redirect URIs**, add:
     ```
     https://cosmic-cannoli-ea8d1e.netlify.app/api/calendar/outlook/callback
     ```
   - Click **Save**

3. **Update Netlify Environment Variables**
   - In Netlify Dashboard → **Environment variables**
   - Update `OUTLOOK_REDIRECT_URI`:
     ```
     https://cosmic-cannoli-ea8d1e.netlify.app/api/calendar/outlook/callback
     ```
   - Or leave it unset (it will use `NEXT_PUBLIC_APP_URL` automatically)

## Complete Environment Variables Checklist

Make sure these are set in Netlify:

- ✅ `DATABASE_URL` - Your Neon database connection string
- ✅ `NEXT_PUBLIC_APP_URL` - `https://cosmic-cannoli-ea8d1e.netlify.app` (with https!)
- ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- ✅ `CLERK_SECRET_KEY` - Your Clerk secret key
- ✅ `RESEND_API_KEY` - Your Resend API key (for emails)
- ✅ `FROM_EMAIL` - Your sender email address
- ✅ `GOOGLE_CLIENT_ID` - (if using Google Calendar)
- ✅ `GOOGLE_CLIENT_SECRET` - (if using Google Calendar)
- ✅ `GOOGLE_REDIRECT_URI` - (optional, will use NEXT_PUBLIC_APP_URL if not set)
- ✅ `OUTLOOK_CLIENT_ID` - (if using Outlook Calendar)
- ✅ `OUTLOOK_CLIENT_SECRET` - (if using Outlook Calendar)
- ✅ `OUTLOOK_REDIRECT_URI` - (optional, will use NEXT_PUBLIC_APP_URL if not set)

## Important Notes

1. **Always use HTTPS** in production URLs (not HTTP)
2. **Redeploy after changing environment variables** - Netlify needs to rebuild with new values
3. **Keep localhost URLs** in your local `.env` file for development
4. **Test after deployment** - Make sure redirects work correctly

## Troubleshooting

### App crashes after login
- ✅ Check `NEXT_PUBLIC_APP_URL` is set correctly in Netlify
- ✅ Verify Clerk redirect URLs include your Netlify domain
- ✅ Check browser console for errors
- ✅ Check Netlify function logs for server errors

### Redirect loops
- ✅ Check Clerk redirect URLs are correct
- ✅ Verify middleware is not blocking redirects
- ✅ Check that `NEXT_PUBLIC_APP_URL` matches your actual Netlify URL

### OAuth not working
- ✅ Verify OAuth redirect URIs match exactly (including https)
- ✅ Check that OAuth credentials are set in Netlify environment variables
- ✅ Verify OAuth apps (Google/Microsoft) have correct redirect URIs configured


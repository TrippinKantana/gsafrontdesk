# Google Calendar OAuth Setup for Multi-Tenant Application

## Overview

In a multi-tenant application, you need **ONE set of OAuth credentials** that all users will use to connect their individual Google Calendars. Each user authorizes your application, and their tokens are stored separately in the database.

## Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter project name: `Front Desk Calendar Sync` (or your app name)
5. Click **"Create"**
6. Wait for the project to be created and select it

### 2. Enable Google Calendar API

1. In the Google Cloud Console, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google Calendar API"**
3. Click on it and click **"Enable"**
4. Wait for it to enable (usually takes a few seconds)

### 3. Configure OAuth Consent Screen

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Choose **"External"** (unless you're using Google Workspace, then choose "Internal")
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: Your application name (e.g., "Front Desk System")
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **"Save and Continue"**
6. On **"Scopes"** page:
   - Click **"Add or Remove Scopes"**
   - Search for and add:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Click **"Update"** then **"Save and Continue"**
7. On **"Test users"** page (if in Testing mode):
   - Add test user emails if you want to test before publishing
   - Or skip for now
8. Click **"Save and Continue"**
9. Review and click **"Back to Dashboard"**

### 4. Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"OAuth client ID"**
3. If prompted, select **"Web application"** as the application type
4. Fill in the details:
   - **Name**: `Front Desk Calendar Sync` (or any name)
   - **Authorized JavaScript origins**: 
     ```
     http://localhost:3000
     https://yourdomain.com
     ```
     (Add your production domain when ready)
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/calendar/google/callback
     https://yourdomain.com/api/calendar/google/callback
     ```
     (Add your production callback URL when ready)
5. Click **"Create"**
6. **IMPORTANT**: A popup will show your **Client ID** and **Client Secret**
   - Copy both immediately (you won't be able to see the secret again!)
   - If you lose it, you'll need to create new credentials

### 5. Add Credentials to Environment Variables

Add these to your `.env` file:

```env
# Google Calendar OAuth (one set for all users)
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/google/callback
```

**For production**, update `GOOGLE_REDIRECT_URI` to:
```env
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/calendar/google/callback
```

### 6. Publish Your App (When Ready for Production)

1. Go back to **"OAuth consent screen"**
2. Click **"PUBLISH APP"** button
3. Confirm the publishing
4. Note: It may take a few days for Google to review your app if you request sensitive scopes

**For Testing**: You can keep it in "Testing" mode and add test users. This works for up to 100 test users.

## How It Works

1. **User clicks "Connect"** → Your app redirects to Google's OAuth page
2. **User authorizes** → Google redirects back with an authorization code
3. **Your app exchanges code for tokens** → Gets access token and refresh token
4. **Tokens stored in database** → Each user's tokens stored separately in `Staff` table
5. **Future requests** → Your app uses each user's stored tokens to sync their calendar

## Important Notes

- ✅ **One OAuth Client ID/Secret** for the entire application
- ✅ **Each user gets their own tokens** stored in the database
- ✅ **Tokens are user-specific** - User A's meetings sync to User A's calendar
- ✅ **Refresh tokens** allow long-term access without re-authorization
- ⚠️ **Keep Client Secret secure** - Never commit it to git
- ⚠️ **Add production redirect URI** before deploying

## Testing

1. Start your dev server: `npm run dev`
2. Navigate to the meetings page
3. Click "Connect" next to Google Calendar
4. You should be redirected to Google's authorization page
5. Sign in and authorize
6. You'll be redirected back and your calendar will be connected

## Troubleshooting

### "redirect_uri_mismatch" Error
- Make sure the redirect URI in Google Cloud Console **exactly matches** `GOOGLE_REDIRECT_URI` in your `.env`
- Check for trailing slashes, http vs https, etc.

### "Access blocked: This app's request is invalid"
- Your app might be in Testing mode and the user isn't added as a test user
- Add the user's email to "Test users" in OAuth consent screen
- Or publish your app (for production)

### "invalid_client" Error
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Make sure there are no extra spaces or quotes in `.env`

### Tokens Not Working
- Check server logs for detailed error messages
- Verify the Google Calendar API is enabled
- Make sure the scopes are correctly configured

## Production Checklist

- [ ] OAuth consent screen published
- [ ] Production redirect URI added to Google Cloud Console
- [ ] `GOOGLE_REDIRECT_URI` updated in production `.env`
- [ ] Client Secret stored securely (not in git)
- [ ] Tested with multiple users
- [ ] Error handling tested

## Security Best Practices

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Use environment variables** in production (Vercel, Railway, etc.)
3. **Rotate secrets** if they're ever exposed
4. **Monitor OAuth usage** in Google Cloud Console
5. **Set up alerts** for unusual activity

---

That's it! Once you add the credentials to `.env` and restart your server, users will be able to connect their Google Calendars.


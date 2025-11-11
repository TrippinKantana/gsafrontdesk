# Calendar Sync Setup Guide

This guide explains how to set up calendar synchronization with Google Calendar and Microsoft Outlook.

## Overview

The calendar sync feature allows employees to automatically sync their meetings to their personal calendars (Google Calendar or Outlook). When a meeting is created, updated, or deleted in the system, it will automatically sync to the connected calendars.

## Features

- ✅ **Google Calendar Integration** - Sync meetings to Google Calendar
- ✅ **Microsoft Outlook Integration** - Sync meetings to Outlook
- ✅ **Automatic Sync** - Meetings are automatically synced when created/updated/deleted
- ✅ **OAuth Authentication** - Secure OAuth 2.0 authentication
- ✅ **Token Refresh** - Automatic token refresh for Google Calendar

## Prerequisites

1. Google Cloud Console account (for Google Calendar)
2. Microsoft Azure account (for Outlook)
3. Environment variables configured

## Setup Instructions

### 1. Google Calendar Setup

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

#### Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External (or Internal for G Suite)
   - App name: Your app name
   - User support email: Your email
   - Developer contact: Your email
   - Add scopes: `https://www.googleapis.com/auth/calendar`, `https://www.googleapis.com/auth/calendar.events`
   - Save and continue
4. Create OAuth client ID:
   - Application type: Web application
   - Name: Front Desk Calendar Sync
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/calendar/google/callback
     https://yourdomain.com/api/calendar/google/callback
     ```
   - Click "Create"
5. Copy the **Client ID** and **Client Secret**

#### Step 3: Add to Environment Variables

Add to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/google/callback
```

For production, update `GOOGLE_REDIRECT_URI` to your production URL.

---

### 2. Microsoft Outlook Setup

#### Step 1: Register Application in Azure

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Fill in the details:
   - Name: Front Desk Calendar Sync
   - Supported account types: Accounts in any organizational directory and personal Microsoft accounts
   - Redirect URI: 
     - Type: Web
     - URI: `http://localhost:3000/api/calendar/outlook/callback`
5. Click "Register"

#### Step 2: Configure API Permissions

1. In your app registration, go to "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Select "Delegated permissions"
5. Add the following permissions:
   - `Calendars.ReadWrite`
   - `User.Read`
6. Click "Add permissions"
7. Click "Grant admin consent" (if you have admin rights)

#### Step 3: Create Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Add description: "Calendar Sync Secret"
4. Set expiration (recommended: 24 months)
5. Click "Add"
6. **Copy the secret value immediately** (you won't be able to see it again)

#### Step 4: Add to Environment Variables

Add to your `.env` file:

```env
OUTLOOK_CLIENT_ID=your_application_id_here
OUTLOOK_CLIENT_SECRET=your_client_secret_here
OUTLOOK_REDIRECT_URI=http://localhost:3000/api/calendar/outlook/callback
```

For production, update `OUTLOOK_REDIRECT_URI` to your production URL.

---

## Database Migration

After setting up the environment variables, run the database migration to add the calendar fields:

```bash
npx prisma db push
```

Or if using migrations:

```bash
npx prisma migrate dev --name add_calendar_sync
```

## Usage

### For Employees

1. Navigate to the Meetings page (`/employee/meetings`)
2. Scroll to the "Calendar Integration" section
3. Click "Connect" next to Google Calendar or Microsoft Outlook
4. Authorize the application in the OAuth flow
5. You'll be redirected back to the meetings page
6. Your calendar is now connected!

### How It Works

- **Creating a Meeting**: When you create a meeting, it's automatically added to your connected calendars
- **Updating a Meeting**: When you update a meeting (time, location, etc.), the calendar event is updated
- **Deleting a Meeting**: When you delete a meeting, it's removed from your calendars
- **Multiple Calendars**: You can connect both Google Calendar and Outlook simultaneously

## Troubleshooting

### Google Calendar Issues

**Error: "redirect_uri_mismatch"**
- Make sure the redirect URI in Google Cloud Console matches exactly with `GOOGLE_REDIRECT_URI` in your `.env`
- Include both `http://localhost:3000` (dev) and your production URL

**Error: "invalid_grant"**
- Token may have expired. Try disconnecting and reconnecting your calendar
- Make sure `GOOGLE_REDIRECT_URI` matches the one in Google Cloud Console

**Meetings not syncing**
- Check that the Google Calendar API is enabled in Google Cloud Console
- Verify your OAuth credentials are correct
- Check server logs for error messages

### Outlook Issues

**Error: "AADSTS50011: Redirect URI mismatch"**
- Make sure the redirect URI in Azure Portal matches exactly with `OUTLOOK_REDIRECT_URI` in your `.env`
- The URI must be exactly the same (including trailing slashes)

**Error: "AADSTS70011: Invalid scope"**
- Verify that the required permissions are added in Azure Portal
- Make sure admin consent is granted

**Meetings not syncing**
- Check that the Microsoft Graph API permissions are granted
- Verify your client secret hasn't expired
- Check server logs for error messages

## Security Notes

- OAuth tokens are stored encrypted in the database
- Tokens are only used to sync calendar events
- Users can disconnect their calendars at any time
- Refresh tokens are stored securely for automatic token renewal

## Future Enhancements

- [ ] Two-way sync (sync calendar changes back to the system)
- [ ] Custom calendar support (iCal/CalDAV)
- [ ] Calendar event reminders
- [ ] Bulk calendar operations
- [ ] Calendar conflict detection

## Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure OAuth redirect URIs match exactly
4. Test the OAuth flow in a new incognito window


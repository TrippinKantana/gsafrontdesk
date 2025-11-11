# Staff Login Access Setup

## Overview

The system now supports creating login credentials for staff members (receptionists/clerks) from the Admin Dashboard. This allows multiple staff members to access the platform with their own credentials.

## Features Implemented

### 1. **Database Schema Updates** ✅
Added new fields to the `Staff` model:
- `canLogin` (Boolean) - Whether the staff member can log into the platform
- `clerkUserId` (String, unique) - Link to Clerk authentication user
- `username` (String, unique) - Username for login

### 2. **Staff Management UI** ✅

**New Form Fields:**
- **"Allow Login Access"** checkbox
  - When checked, creates Clerk authentication credentials
  - Displays username field (optional - auto-generated from email if blank)
  - Shows warning message about temporary password

**Password Management:**
- Auto-generated secure password (12 characters with uppercase, lowercase, numbers, symbols)
- Displayed in a modal after creation/update with:
  - Copy to clipboard button
  - Clear instructions for first-time login
  - Warning that password cannot be retrieved later

**Staff List Display:**
- New "Login" column showing who has login access
- "Reset Password" button (Key icon) for staff with login access
- Badge indicating "Can Login" status

### 3. **Backend Logic** ✅

**When Creating/Updating Staff with Login Access:**
1. Validates that email is provided (required for Clerk)
2. Generates username (from email or custom input)
3. Generates secure random password
4. Creates Clerk user account
5. Creates/updates Receptionist record (links Clerk to dashboard access)
6. Stores `clerkUserId` and `username` in Staff table
7. Returns temporary password to display to admin

**Password Reset:**
- Generates new secure password
- Updates Clerk user password
- Displays new password to admin

### 4. **Security Features** ✅
- Passwords are never stored in database (handled by Clerk)
- Temporary passwords must be changed on first login
- Email validation required for login access
- Unique username enforcement
- Clerk handles all authentication/session management

## How to Use

### Creating a Staff Member with Login Access

1. Navigate to **Dashboard → Staff Management**
2. Click **"Add Staff Member"**
3. Fill in required fields:
   - Full Name *
   - Email * (required for login)
   - Department (optional)
   - Title (optional)
4. Check **"Allow Login Access"**
5. (Optional) Enter a custom username or leave blank to auto-generate
6. Click **"Create"**
7. **Important:** A modal will appear with the temporary password
   - Copy this password immediately
   - Share it securely with the staff member
   - The password cannot be retrieved later

### Enabling Login for Existing Staff

1. Click **Edit** on an existing staff member
2. Check **"Allow Login Access"**
3. Follow steps 5-7 above

### Resetting Password

1. Click the **Key icon** next to a staff member with login access
2. A new temporary password will be generated
3. Copy and share it securely with the staff member

### Staff Member Login Process

1. Staff member navigates to `/sign-in`
2. Enters their username/email and temporary password
3. Clerk will prompt them to change password on first login
4. After successful login, they have full access to the Admin Dashboard

## Database Migration Required

⚠️ **Important:** Before this feature works, you need to run the database migration:

```bash
npx prisma migrate dev --name add_staff_login_fields
```

**If migration fails due to database connection:**
1. Check your `.env` file has correct `DATABASE_URL`
2. Ensure your Neon database is running
3. Verify network connectivity
4. Run the migration again once database is accessible

## Technical Implementation

### Files Modified/Created

1. **`prisma/schema.prisma`**
   - Added `canLogin`, `clerkUserId`, `username` fields to `Staff` model

2. **`server/routers/staff.ts`**
   - Added Clerk integration
   - Password generation logic
   - Create/update mutations handle Clerk user creation
   - New `resetPassword` procedure
   - Links Staff to Receptionist table for dashboard access

3. **`app/(dashboard)/dashboard/staff/page.tsx`**
   - Added login access checkbox and username field
   - Password display modal with copy functionality
   - Reset password button
   - "Login" column in staff table
   - Mobile-responsive login indicators

### How It Works

1. **Staff Table** stores basic info + `canLogin`, `clerkUserId`, `username`
2. **Clerk** handles authentication (passwords, sessions, security)
3. **Receptionist Table** links Clerk users to dashboard permissions
4. **Admin** creates credentials → **Staff logs in** → **Clerk validates** → **Dashboard access granted**

### Multi-Shift Support

✅ **Fully supports 2-4 clerks with rotating shifts:**
- Each staff member gets unique credentials
- All see same visitor data (no filtering by receptionist)
- All can check in/out visitors
- All can manage staff
- All can view analytics
- Session management handled by Clerk

## Security Best Practices

1. **Always share temporary passwords securely** (encrypted channel, not plain text)
2. **Require password change on first login**
3. **Regularly audit staff with login access**
4. **Revoke access immediately** when staff leaves (uncheck "Allow Login Access")
5. **Use strong, unique usernames**
6. **Enable 2FA in Clerk** (optional enhancement)

## Future Enhancements

Potential improvements:
- Role-based permissions (admin vs clerk)
- Activity logging per staff member
- Password expiration policies
- Email notifications for credential creation
- Self-service password reset via email
- 2FA enforcement

## Troubleshooting

### "Email is required to create login credentials"
- Ensure the staff member has a valid email address entered

### "Failed to create Clerk user"
- Check Clerk API keys in `.env`
- Verify Clerk project is active
- Check for duplicate email/username

### Password reset not working
- Verify staff member has `clerkUserId` (was created with login access)
- Check Clerk API connectivity

### Migration failed
- Ensure database is accessible
- Check `.env` DATABASE_URL is correct
- Try running migration again after fixing connection

## Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs for Clerk API errors
3. Verify database migration completed successfully
4. Ensure `.env` has correct Clerk and database credentials


# 🔄 Emergency Rollback Instructions

If the application is broken after Phase 3 implementation, follow these steps:

## Option 1: Quick Fix (Recommended)

The changes have been made to be backward-compatible. Just refresh your browser with a hard refresh:

**Windows/Linux:** `Ctrl + Shift + R`
**Mac:** `Cmd + Shift + R`

## Option 2: Disable New Features Temporarily

Edit your `.env` file and comment out the new variables:

```env
# RESEND_API_KEY="re_xxx"
# FROM_EMAIL="..."
# NEXT_PUBLIC_APP_URL="..."
```

Then restart the dev server:
```bash
npm run dev
```

## Option 3: Revert Database Changes

If you need to completely roll back the database changes:

```bash
# This will revert the schema to the previous version
npx prisma db push --force-reset
```

⚠️ **WARNING:** This will delete ALL data in your database!

## Option 4: Restore from Backup

If you have a database backup, restore it using your database provider's tools (Neon Console).

## What Changed?

### Database:
- Added optional columns to `Visitor` table
- Added optional columns to `Staff` table  
- Created new tables: `meetings`, `visitor_notifications`, `company_suggestions`

### Code:
- Updated visitor check-in form
- Added notification system
- Added company auto-suggestions

## If You're Still Stuck:

1. **Check browser console for errors** (`F12` → Console tab)
2. **Check terminal for server errors**
3. **Try clearing browser cache** completely
4. **Delete `.next` folder and restart**:
   ```bash
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

## Get Back to Working State:

The simplest solution is to make the `reasonForVisit` field optional, which has been done. The old check-in flow should work exactly as before.


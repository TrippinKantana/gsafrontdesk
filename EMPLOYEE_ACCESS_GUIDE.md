# 👤 Employee Dashboard Access Guide

## Overview

The system now has two separate dashboards:
1. **Admin/Receptionist Dashboard** (`/dashboard`) - For administrative staff
2. **Employee Dashboard** (`/employee/dashboard`) - For regular staff members

---

## 🔐 How Employee Login Works

### When Creating a Staff Member:

1. **Go to Staff Management** (`/dashboard/staff`)
2. **Add a new staff member**
3. **Check "Allow Login Access"** ✅
4. **Fill in:**
   - Full Name
   - Email (required for login)
   - Username (optional - will auto-generate from email if not provided)
   - Department, Title (optional)
5. **Click "Create"**
6. **A temporary password will be generated and shown** - Save this securely!

---

## 🚪 How Employees Sign In

### Step 1: Go to Sign-In Page
- Navigate to `/sign-in` or click "Sign In" from the home page

### Step 2: Enter Credentials
- **Email or Username**: The email/username you set for the staff member
- **Password**: The temporary password that was generated

### Step 3: Automatic Routing
- If the user has a **Staff profile** → Redirected to `/employee/dashboard`
- If the user is an **Admin/Receptionist** → Redirected to `/dashboard`

---

## 🔄 How the Routing Works

### On First Load (`/` page):
```
1. Check if user is signed in
2. If signed in:
   a. Query: Does user have an employee (Staff) profile?
   b. If YES → Redirect to /employee/dashboard
   c. If NO → Redirect to /dashboard (admin)
3. If not signed in → Redirect to /visitor
```

### After Sign-In:
- User is redirected to `/` (root)
- Root page checks their role
- Automatically routes to correct dashboard

---

## 🧪 Testing Employee Access

### Test Scenario 1: Create Employee and Login

1. **As Admin**, go to `/dashboard/staff`
2. **Create staff member:**
   ```
   Full Name: John Doe
   Email: john.doe@example.com
   Allow Login Access: ✅
   ```
3. **Copy the temporary password** (e.g., `Abc123!@#xyz`)
4. **Sign out** from admin account
5. **Go to `/sign-in`**
6. **Sign in as John Doe:**
   - Email: `john.doe@example.com`
   - Password: `[paste temporary password]`
7. **Should redirect to `/employee/dashboard`** ✅

### Test Scenario 2: Admin Login

1. **Go to `/sign-in`**
2. **Sign in with admin credentials** (Clerk account without Staff profile)
3. **Should redirect to `/dashboard`** (Admin Dashboard) ✅

---

## 🎯 What Employees Can Do

### Employee Dashboard Features:

1. **View Profile**
   - See their department, title, email, phone
   - View current notification preferences

2. **Manage Pending Visitors**
   - See list of visitors waiting for them
   - Accept or decline meeting requests
   - Add optional notes with their response

3. **Notification Preferences**
   - Toggle visitor arrival notifications on/off
   - Enable/disable email notifications
   - Control SMS notifications (when configured)

4. **Upcoming Features** (Phases 6 & 7):
   - Calendar view of meetings
   - Schedule new meetings
   - Sync with Gmail/Outlook
   - View meeting history

---

## 🔧 Troubleshooting

### Problem: Employee gets "Access Denied" after login

**Solution:**
1. Check that the staff member has `canLogin = true` in the database
2. Verify they have a `clerkUserId` linked in the Staff table
3. Ensure their email in Clerk matches their Staff email

### Problem: Employee redirected to Admin Dashboard instead of Employee Dashboard

**Solution:**
1. The system checks if the user has a Staff profile
2. If no Staff profile found → Routes to Admin Dashboard
3. Verify the staff member was created with "Allow Login Access" checked

### Problem: "Staff profile not found" error

**Solution:**
1. The Clerk user exists, but no linked Staff record
2. Go to Staff Management and create/link the staff member
3. Ensure `clerkUserId` in Staff table matches the Clerk user ID

### Problem: Can't sign in with temporary password

**Solution:**
1. Password might have expired or been changed
2. Use the "Reset Password" button in Staff Management
3. A new temporary password will be generated

---

## 🔐 Security Notes

### Temporary Passwords:
- Generated automatically when "Allow Login Access" is enabled
- 12 characters with uppercase, lowercase, numbers, and symbols
- Should be changed by the employee on first login (Clerk handles this)

### Password Reset:
- Admins can reset employee passwords from Staff Management
- Click the key icon (🔑) next to the staff member
- New temporary password will be generated

### Access Control:
- Employees can only see/respond to their own visitors
- Employees cannot access admin functions
- Separate routing ensures proper access control

---

## 📝 Current Limitations

1. **No automatic password change prompt** - Employees use temporary password until they manually change it via Clerk
2. **No bulk employee import** - Must add staff one by one
3. **Calendar features not yet implemented** - Phase 6 in progress

---

## 🚀 Quick Reference

| User Type | Has Staff Profile | Login Route | Dashboard Route |
|-----------|-------------------|-------------|-----------------|
| Admin | ❌ No | `/sign-in` | `/dashboard` |
| Receptionist | ❌ No | `/sign-in` | `/dashboard` |
| Employee | ✅ Yes | `/sign-in` | `/employee/dashboard` |

---

## 📞 Support

If an employee cannot access their dashboard:
1. Verify they were created with login access enabled
2. Check the Staff Management page for their record
3. Use "Reset Password" to generate new credentials
4. Ensure they're using the correct email/username

---

**Updated:** November 5, 2025
**Status:** Phases 4 & 5 Complete - Employee Dashboard Fully Functional ✅


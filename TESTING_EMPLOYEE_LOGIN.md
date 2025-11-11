# 🧪 Testing Employee Login & Dashboard

## Quick Test Steps

### ✅ Step 1: Create an Employee Account

1. **Sign in as Admin** (go to `/sign-in` with your Clerk admin account)
2. **Navigate to Staff Management**: `/dashboard/staff`
3. **Click "Add Staff Member"**
4. **Fill in the form:**
   ```
   Full Name: Test Employee
   Email: test.employee@example.com
   Department: IT
   Title: Software Engineer
   ✅ Allow Login Access: CHECKED
   ```
5. **Click "Create"**
6. **📋 COPY THE TEMPORARY PASSWORD** that appears in the success dialog
   - Example: `Abc123XYZ!@#`
   - You'll need this in the next step!

---

### ✅ Step 2: Sign Out from Admin Account

1. Click your profile icon (top right)
2. Click "Sign Out"
3. You should be redirected to `/visitor`

---

### ✅ Step 3: Sign In as the Employee

1. **Go to `/sign-in`** (or click "Sign In" if prompted)
2. **Enter the employee credentials:**
   ```
   Email: test.employee@example.com
   Password: [paste the temporary password from Step 1]
   ```
3. **Click "Continue" / "Sign In"**

---

### ✅ Step 4: Verify Automatic Routing

**What should happen:**
1. After successful sign-in → Redirected to `/` (root page)
2. Root page checks: "Does this user have a Staff profile?"
3. **YES** → Automatically redirected to `/employee/dashboard` ✅
4. You should now see the **Employee Dashboard** with:
   - Your profile (name, department, title)
   - Notification preferences
   - Pending visitors section (empty for now)
   - "Calendar & Meetings (Coming Soon)" card

---

### ✅ Step 5: Test Pending Visitor Notification

To test the visitor response system:

1. **Open a new incognito/private browser window**
2. **Go to `/visitor/checkin`**
3. **Fill out the check-in form:**
   ```
   Full Name: John Doe
   Company: Acme Corp
   Email: john@acme.com
   Phone: 555-1234
   Who are you here to see?: Test Employee (select from dropdown)
   Reason for Visit: Meeting
   ```
4. **Submit the form**
5. **Switch back to your employee dashboard** (logged in as test.employee@example.com)
6. **Refresh the page** (or wait 10 seconds for auto-refresh)
7. **You should now see "John Doe" in the Pending Visitors section!**
8. **Click "Accept" or "Decline"** to respond

---

## 🔍 Troubleshooting

### Problem: After login, redirected to Admin Dashboard instead of Employee Dashboard

**Check:**
- Did you check "Allow Login Access" when creating the staff?
- Is the staff record in the database? (Check `/dashboard/staff`)
- Does the "Login" column show "✅ Yes" for this staff member?

**Solution:**
1. Go back to Staff Management (as admin)
2. Edit the staff member
3. Ensure "Allow Login Access" is checked
4. Save
5. Try signing in again as the employee

---

### Problem: "Access Denied" or "Staff profile not found"

**This means:**
- The Clerk user exists, but there's no linked Staff record in the database
- OR the `clerkUserId` field in Staff table doesn't match

**Solution:**
1. Sign in as admin
2. Go to Staff Management
3. Check if the staff member exists in the list
4. If not, create them again with "Allow Login Access" checked
5. If they exist, try deleting and recreating them

---

### Problem: Can't sign in - "Invalid credentials"

**Solution:**
1. The temporary password might be incorrect
2. Sign in as admin
3. Go to Staff Management
4. Find the staff member
5. Click the 🔑 (key icon) next to their name
6. This generates a NEW temporary password
7. Copy it and try signing in again

---

## 📊 Expected Behavior Summary

| User Type | Has Staff Profile? | Sign-In Route | Final Destination |
|-----------|-------------------|---------------|-------------------|
| **Admin** | ❌ No | `/sign-in` | `/dashboard` (Admin Dashboard) |
| **Receptionist** | ❌ No | `/sign-in` | `/dashboard` (Admin Dashboard) |
| **Employee** | ✅ Yes | `/sign-in` | `/employee/dashboard` (Employee Dashboard) |

---

## 🎯 Key Features to Test

### Employee Dashboard:
- ✅ Profile display with department, title, email
- ✅ Notification preferences (toggle email/SMS/visitor arrival)
- ✅ Pending visitors list (updates every 10 seconds)
- ✅ Accept/Decline visitor requests
- ✅ Add optional notes when responding

### Response via Email Link:
- ✅ Check your email (if RESEND_API_KEY is configured)
- ✅ Click "Accept Meeting" or "Decline Meeting" buttons
- ✅ Should show success page with visitor details
- ✅ Response should update in receptionist dashboard

---

## 🚀 What's Working Now (Phases 4 & 5)

✅ **Phase 4: Employee Response System**
- Accept/Decline visitor notifications
- Token-based email links
- Manual response from dashboard
- Real-time updates

✅ **Phase 5: Employee Dashboard**
- Separate employee portal
- View pending visitors
- Quick response buttons
- Notification preferences
- Profile management

---

## 🔜 Coming Next (Phases 6 & 7)

⏳ **Phase 6: Meeting/Booking System**
- Calendar view
- Schedule meetings
- Gmail/Outlook sync
- Meeting reminders

⏳ **Phase 7: Receptionist Meeting View**
- Show scheduled meetings
- Link meetings to check-ins
- Meeting status tracking

---

**Need Help?**
- Check the `EMPLOYEE_ACCESS_GUIDE.md` for detailed documentation
- Check console logs for errors
- Verify `.env` has correct database and Clerk keys

**Last Updated:** November 5, 2025


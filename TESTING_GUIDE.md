# 🧪 Multi-Tenant Testing Guide

## 🚀 **Before You Start**

### **CRITICAL: Enable Organizations in Clerk**

1. Open: https://dashboard.clerk.com
2. Select your application
3. Navigate to: **Configure → Organizations**
4. **Toggle "Enable organizations" → ON**
5. Set "Allow users to create organizations" → ON
6. Click **"Save Changes"**

⚠️ **Without this step, the system won't work!**

---

## ✅ **Test 1: Create First Organization**

### **Steps:**
1. Open: http://localhost:3000
2. You'll be redirected to `/select-organization`
3. Click **"Create organization"**
4. Enter name: **"Company A"**
5. Click **"Create"**

### **Expected Results:**
- ✅ Redirected to `/onboarding` (loading screen)
- ✅ Then redirected to `/dashboard`
- ✅ Organization switcher shows "Company A"
- ✅ No errors in console

---

## ✅ **Test 2: Create Staff in Company A**

### **Steps:**
1. Go to **Staff Management**
2. Click **"Add Staff Member"**
3. Fill in:
   - **Full Name**: Alice Johnson
   - **Email**: alice@companya.com
   - **Department**: Engineering
   - **Title**: Engineer
   - **Role**: Employee
   - **Can Login**: ✅ Checked
4. Click **"Create"**

### **Expected Results:**
- ✅ Staff created successfully
- ✅ Temporary password displayed
- ✅ Alice appears in staff list
- ✅ No console errors

---

## ✅ **Test 3: Create Second Organization**

### **Steps:**
1. Click **Organization Switcher** (top right navigation)
2. Click **"+ Create organization"**
3. Enter name: **"Company B"**
4. Click **"Create"**

### **Expected Results:**
- ✅ Redirected to `/onboarding`
- ✅ Then redirected to `/dashboard`
- ✅ Organization switcher now shows "Company B"
- ✅ **Staff list is EMPTY** (no Alice)

---

## ✅ **Test 4: Create Staff in Company B**

### **Steps:**
1. Go to **Staff Management**
2. Click **"Add Staff Member"**
3. Fill in:
   - **Full Name**: Bob Smith
   - **Email**: bob@companyb.com
   - **Department**: Sales
   - **Title**: Sales Rep
   - **Role**: Employee
   - **Can Login**: ✅ Checked
4. Click **"Create"**

### **Expected Results:**
- ✅ Bob created successfully
- ✅ Bob appears in staff list
- ✅ **Alice is NOT visible** (different org)
- ✅ Only 1 staff member visible (Bob)

---

## ✅ **Test 5: Test Organization Switching**

### **Steps:**
1. Click **Organization Switcher**
2. Select **"Company A"**
3. Go to **Staff Management**
4. **Verify**: Only Alice is visible
5. Click **Organization Switcher**
6. Select **"Company B"**
7. Go to **Staff Management**
8. **Verify**: Only Bob is visible

### **Expected Results:**
- ✅ Switching organizations works
- ✅ Data changes based on selected organization
- ✅ **No cross-organization data visible**
- ✅ Page reloads after switching

---

## ✅ **Test 6: Test Data Isolation**

### **For Company A:**
1. Select "Company A"
2. Create 2 more staff members
3. Note the total count

### **For Company B:**
1. Select "Company B"
2. **Verify**: Only Bob visible (not the 2 new staff from Company A)
3. Create 3 staff members
4. **Verify**: Total of 4 staff (Bob + 3 new)

### **Expected Results:**
- ✅ Each organization has separate staff lists
- ✅ No data leakage between organizations
- ✅ Counts are independent per organization

---

## ✅ **Test 7: Test Role-Based Routing**

### **Create Admin User:**
1. In Company A, create staff:
   - Name: Admin User
   - Email: admin@companya.com
   - **Role**: Admin
   - **Can Login**: ✅ Checked
2. Copy the temporary password

### **Test Admin Login:**
1. Open incognito/private browser
2. Go to: http://localhost:3000/sign-in
3. Sign in as `admin@companya.com`
4. **Expected**: Redirected to `/dashboard` (Admin Dashboard)

### **Create Employee User:**
1. In Company A, create staff:
   - Name: Employee User
   - Email: employee@companya.com
   - **Role**: Employee
   - **Can Login**: ✅ Checked
2. Copy temporary password

### **Test Employee Login:**
1. Open different incognito window
2. Sign in as `employee@companya.com`
3. **Expected**: Redirected to `/employee/dashboard` (Employee Dashboard)
4. **Verify**: Employee cannot access `/dashboard` (admin)

---

## ⚠️ **Known Issues to Expect**

### **Issue 1: Visitor Check-In**
- **Status**: Not yet multi-tenant
- **Impact**: Public visitor check-in doesn't have organization context
- **Workaround**: Will be fixed in next update

### **Issue 2: Old Test Data**
- **Status**: Existing data has no organizationId
- **Impact**: Won't show up in any organization
- **Fix**: Delete old test data or assign organizationId manually

### **Issue 3: Some Routers Not Updated**
- **Status**: Visitor, Meeting, Ticket routers need organizationId filter
- **Impact**: Those features may show all data (not isolated yet)
- **Reference**: See `ROUTER_UPDATE_CHECKLIST.md`

---

## 🐛 **Troubleshooting**

### **Error: "No organization context"**

**Cause:** User hasn't selected an organization

**Fix:**
1. Click Organization Switcher
2. Select or create an organization
3. Refresh page

---

### **Error: "Can't reach database"**

**Cause:** Neon database auto-paused

**Fix:**
1. Go to Neon console
2. Click database
3. Click "Resume"
4. Refresh page

---

### **Staff List is Empty**

**Possible Causes:**
1. Wrong organization selected (switch orgs)
2. No staff created yet (add staff)
3. organizationId missing (check database)

**Debug:**
```sql
-- Check staff organizationId
SELECT id, "fullName", "organizationId" FROM staff;

-- Check organizations
SELECT id, "clerkOrgId", name FROM organizations;
```

---

### **Can't Create Organization**

**Cause:** Organizations not enabled in Clerk

**Fix:**
1. Go to Clerk Dashboard
2. Enable Organizations feature
3. Save and refresh

---

## 📊 **Success Criteria**

Your multi-tenant system is working if:

- ✅ Can create multiple organizations
- ✅ Each org has separate staff lists
- ✅ Switching organizations changes data
- ✅ No cross-organization data visible
- ✅ Organization switcher works
- ✅ Role-based routing still works
- ✅ Staff creation includes organizationId

---

## 🎯 **What's Next**

After testing:

1. **Update remaining routers** (see `ROUTER_UPDATE_CHECKLIST.md`)
2. **Fix visitor check-in** for multi-tenant
3. **Test all features** (meetings, tickets, analytics)
4. **Add organization settings page**
5. **Deploy to production**

---

**You're now running a fully multi-tenant SaaS platform!** 🚀

Each organization operates independently with complete data isolation.



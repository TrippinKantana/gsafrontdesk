# 🚀 Multi-Tenant Implementation Guide

## Step-by-Step Implementation

Follow these steps to convert your single-tenant app to a fully multi-tenant SaaS platform with Clerk Organizations.

---

## 📋 **Pre-Implementation Checklist**

Before you begin:

- [ ] **Backup your database** (export from Neon dashboard)
- [ ] **Backup your `.env` file**
- [ ] **Commit all current changes to git**
- [ ] **Have Clerk Dashboard open** (dashboard.clerk.com)
- [ ] **Have Neon Console open** (console.neon.tech)

---

## 🎯 **Phase 1: Enable Clerk Organizations** (5 minutes)

### **Step 1.1: Enable Organizations in Clerk**

1. Go to **Clerk Dashboard** → https://dashboard.clerk.com
2. Select your application
3. Click **"Configure"** → **"Organizations"**
4. Toggle **"Enable organizations"** → **ON**
5. Configure settings:
   - ✅ **Allow users to create organizations** → ON
   - ✅ **Maximum organizations per user** → Unlimited (or set limit)
   - ✅ **Enable member roles** → ON
   - ✅ **Enable member invitations** → ON

### **Step 1.2: Configure Organization Settings**

1. Under **"Organization settings"**:
   - ✅ **Organization name** → Required
   - ✅ **Organization slug** → Auto-generate
   - ✅ **Allow profile changes** → ON

2. Under **"Member roles"**:
   - Keep default roles: `org:admin` and `org:member`

3. Click **"Save changes"**

---

## 🗄️ **Phase 2: Update Database Schema** (10 minutes)

### **Step 2.1: Backup Current Schema**

```bash
cd c:\Users\cyrus\Desktop\gsafrontdesk

# Backup current schema
cp prisma/schema.prisma prisma/schema-backup-single-tenant.prisma
```

### **Step 2.2: Apply Multi-Tenant Schema**

```bash
# Replace with multi-tenant schema
cp prisma/schema-multitenant.prisma prisma/schema.prisma
```

### **Step 2.3: Create Migration**

**⚠️ IMPORTANT:** This will modify your database structure. Make sure you have a backup!

```bash
# Generate migration
npx prisma migrate dev --name add_multi_tenant_organization_support

# This will:
# 1. Create Organization table
# 2. Add organizationId to all tables
# 3. Create new indexes
# 4. Apply constraints
```

### **Step 2.4: Regenerate Prisma Client**

```bash
npx prisma generate
```

---

## ⚙️ **Phase 3: Create Organization Context** (15 minutes)

### **Step 3.1: Update tRPC Context**

Create `server/context.ts`:

```typescript
import { auth } from '@clerk/nextjs/server';
import { db } from './db';

export async function createTRPCContext() {
  const { userId, orgId } = await auth();
  
  if (!userId) {
    return { db, userId: null, organizationId: null };
  }
  
  return {
    db,
    userId,
    organizationId: orgId, // ✅ Organization context for all queries
  };
}
```

### **Step 3.2: Update `server/trpc.ts`**

```typescript
import { createTRPCContext } from './context';

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.organizationId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      userId: ctx.userId,
      organizationId: ctx.organizationId,
    },
  });
});
```

---

## 🔄 **Phase 4: Create Organization Router** (10 minutes)

Create `server/routers/organization.ts`:

```typescript
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const organizationRouter = createTRPCRouter({
  // Sync Clerk organization to database
  syncOrganization: protectedProcedure
    .input(z.object({
      clerkOrgId: z.string(),
      name: z.string(),
      slug: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.db.organization.upsert({
        where: { clerkOrgId: input.clerkOrgId },
        create: {
          clerkOrgId: input.clerkOrgId,
          name: input.name,
          slug: input.slug,
        },
        update: {
          name: input.name,
          slug: input.slug,
        },
      });
      
      return org;
    }),
  
  // Get current organization
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organizationId) {
      return null;
    }
    
    return await ctx.db.organization.findUnique({
      where: { clerkOrgId: ctx.organizationId },
    });
  }),
  
  // Update organization settings
  updateSettings: protectedProcedure
    .input(z.object({
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      website: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.organization.update({
        where: { clerkOrgId: ctx.organizationId },
        data: input,
      });
    }),
});
```

Add to `server/routers/_app.ts`:

```typescript
import { organizationRouter } from './organization';

export const appRouter = createTRPCRouter({
  // ... existing routers
  organization: organizationRouter,
});
```

---

## 🔧 **Phase 5: Update All Routers for Multi-Tenancy** (30 minutes)

### **Critical: Add organizationId to ALL queries and mutations**

**Example: Update `server/routers/staff.ts`:**

```typescript
// BEFORE (single-tenant)
getAll: protectedProcedure.query(async ({ ctx }) => {
  return await ctx.db.staff.findMany({
    orderBy: { fullName: 'asc' },
  });
});

// AFTER (multi-tenant) ✅
getAll: protectedProcedure.query(async ({ ctx }) => {
  return await ctx.db.staff.findMany({
    where: {
      organizationId: ctx.organizationId, // ✅ Filter by org
    },
    orderBy: { fullName: 'asc' },
  });
});

// BEFORE (single-tenant)
create: protectedProcedure
  .input(/* ... */)
  .mutation(async ({ ctx, input }) => {
    return await ctx.db.staff.create({
      data: input,
    });
  });

// AFTER (multi-tenant) ✅
create: protectedProcedure
  .input(/* ... */)
  .mutation(async ({ ctx, input }) => {
    return await ctx.db.staff.create({
      data: {
        ...input,
        organizationId: ctx.organizationId, // ✅ Assign to org
      },
    });
  });
```

**Routers to update:**

- [ ] `server/routers/staff.ts` - Add organizationId filtering
- [ ] `server/routers/visitor.ts` - Add organizationId filtering
- [ ] `server/routers/meeting.ts` - Add organizationId filtering
- [ ] `server/routers/ticket.ts` - Add organizationId filtering
- [ ] `server/routers/analytics.ts` - Calculate per organization
- [ ] `server/routers/company.ts` - Suggestions per organization

---

## 🎨 **Phase 6: Update UI Components** (20 minutes)

### **Step 6.1: Add Organization Switcher to Navigation**

Update `components/dashboard-nav.tsx`:

```typescript
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';

export function DashboardNav() {
  return (
    <nav className="border-b bg-white">
      <div className="container flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Image src="/syncco_logo.svg" alt="Logo" width={120} height={40} />
          {/* Navigation items */}
        </div>
        
        <div className="flex items-center gap-4">
          {/* ✅ Organization Switcher */}
          <OrganizationSwitcher
            afterSelectOrganizationUrl="/"
            afterCreateOrganizationUrl="/onboarding"
            appearance={{
              elements: {
                rootBox: 'flex items-center',
              },
            }}
          />
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
    </nav>
  );
}
```

### **Step 6.2: Create Organization Onboarding Page**

Create `app/onboarding/page.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useOrganization } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const { organization, isLoaded } = useOrganization();
  const router = useRouter();
  const syncOrg = trpc.organization.syncOrganization.useMutation();
  
  useEffect(() => {
    if (isLoaded && organization) {
      syncOrg.mutate({
        clerkOrgId: organization.id,
        name: organization.name,
        slug: organization.slug || organization.id,
      }, {
        onSuccess: () => {
          router.push('/dashboard');
        },
        onError: (error) => {
          console.error('Failed to sync organization:', error);
        },
      });
    }
  }, [isLoaded, organization]);
  
  if (!isLoaded || syncOrg.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Setting up your organization...
          </h2>
          <p className="text-gray-600">
            Please wait while we configure your workspace.
          </p>
        </div>
      </div>
    );
  }
  
  return null;
}
```

### **Step 6.3: Create Organization Selection Page**

Create `app/select-organization/page.tsx`:

```typescript
import { OrganizationList } from '@clerk/nextjs';

export default function SelectOrganizationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-8">
          Select an Organization
        </h1>
        <OrganizationList
          afterSelectOrganizationUrl="/"
          afterCreateOrganizationUrl="/onboarding"
        />
      </div>
    </div>
  );
}
```

---

## 🔐 **Phase 7: Update Authentication Flow** (15 minutes)

### **Step 7.1: Update Middleware**

Update `middleware.ts`:

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const publicRoutes = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/visitor(.*)',
  '/api/trpc(.*)',
];

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId } = await auth();
  const { pathname } = req.nextUrl;
  
  // Allow public routes
  const isPublic = publicRoutes.some(route => 
    new RegExp(`^${route.replace(/\(.*\)/g, '.*')}$`).test(pathname)
  );
  
  if (isPublic) {
    return NextResponse.next();
  }
  
  // Require authentication
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
  
  // Require organization context (except for select-organization page)
  if (!orgId && !pathname.startsWith('/select-organization')) {
    return NextResponse.redirect(new URL('/select-organization', req.url));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### **Step 7.2: Update Root Page**

Update `app/page.tsx`:

```typescript
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/server/db';

export default async function HomePage() {
  const { userId, orgId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  if (!orgId) {
    redirect('/select-organization');
  }
  
  // Get user's staff profile in this organization
  const staff = await db.staff.findFirst({
    where: {
      clerkUserId: userId,
      organizationId: orgId, // ✅ Filter by org
    },
  });
  
  // If no staff profile, user might be org admin - check organization
  if (!staff) {
    const org = await db.organization.findUnique({
      where: { clerkOrgId: orgId },
    });
    
    if (!org) {
      redirect('/onboarding');
    }
    
    // Org exists but no staff profile - redirect to admin dashboard
    redirect('/dashboard');
  }
  
  // Route based on role
  switch (staff.role) {
    case 'Admin':
      redirect('/dashboard');
    case 'IT Staff':
      redirect('/it/dashboard');
    case 'Receptionist':
      redirect('/dashboard');
    case 'Employee':
    default:
      redirect('/employee/dashboard');
  }
}
```

---

## 🧪 **Phase 8: Testing Multi-Tenancy** (20 minutes)

### **Test Scenario 1: Create Multiple Organizations**

1. **Sign up as User A:**
   - Create account → Create organization "Company A"
   - Should redirect to `/onboarding` → then `/dashboard`

2. **Add staff to Company A:**
   - Go to Staff Management
   - Create staff member with role "Employee"
   - ✅ Verify: Staff created successfully

3. **Check visitor management:**
   - Check in a visitor for Company A
   - ✅ Verify: Visitor appears in dashboard

4. **Sign up as User B:**
   - Create new account → Create organization "Company B"
   - Should redirect to `/onboarding` → then `/dashboard`

5. **Add staff to Company B:**
   - Create different staff member
   - Check in different visitor

6. **Verify Data Isolation:**
   - User A should only see Company A data
   - User B should only see Company B data
   - ✅ **No cross-organization data visible**

### **Test Scenario 2: Organization Switching**

1. **User A joins Company B:**
   - User B invites User A to Company B
   - User A accepts invitation

2. **Switch between organizations:**
   - Use Organization Switcher in nav
   - Switch from Company A to Company B
   - ✅ Verify: Dashboard data changes
   - ✅ Verify: Staff list changes
   - ✅ Verify: Visitor list changes

---

## 📊 **Phase 9: Data Migration (If you have existing data)** (Optional)

If you already have data, run this migration:

Create `scripts/migrate-existing-data.ts`:

```typescript
import { db } from '../server/db';
import { clerkClient } from '@clerk/nextjs/server';

async function migrateExistingData() {
  console.log('Starting data migration...');
  
  // Create default organization
  const defaultOrg = await db.organization.create({
    data: {
      clerkOrgId: 'org_default_migration',
      name: 'Default Organization',
      slug: 'default',
    },
  });
  
  console.log(`Created default organization: ${defaultOrg.id}`);
  
  // Update all existing staff
  const staffCount = await db.staff.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id },
  });
  console.log(`Updated ${staffCount.count} staff members`);
  
  // Update all existing visitors
  const visitorCount = await db.visitor.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id },
  });
  console.log(`Updated ${visitorCount.count} visitors`);
  
  // Update all existing meetings
  const meetingCount = await db.meeting.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id },
  });
  console.log(`Updated ${meetingCount.count} meetings`);
  
  // Update all existing tickets
  const ticketCount = await db.ticket.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id },
  });
  console.log(`Updated ${ticketCount.count} tickets`);
  
  console.log('Migration complete!');
}

migrateExistingData()
  .catch(console.error)
  .finally(() => process.exit());
```

Run: `tsx scripts/migrate-existing-data.ts`

---

## ✅ **Post-Implementation Checklist**

- [ ] **All routers filter by organizationId**
- [ ] **Organization switcher visible in nav**
- [ ] **Onboarding flow works**
- [ ] **Data isolation verified** (multiple orgs tested)
- [ ] **Role-based routing works** (all 4 roles tested)
- [ ] **No console errors**
- [ ] **Database indexes optimized**
- [ ] **Backup created before migration**

---

## 🚨 **Troubleshooting**

### **Issue: "No organization context"**
- **Solution:** User hasn't selected/created an organization. Redirect to `/select-organization`

### **Issue: "Data from wrong organization appearing"**
- **Solution:** Check that all queries include `organizationId` filter

### **Issue: "Can't create staff/visitors"**
- **Solution:** Ensure `organizationId` is being passed in create mutations

### **Issue: "Migration fails"**
- **Solution:** Rollback with: `npx prisma migrate reset` and restore backup

---

## 📞 **Need Help?**

If you encounter issues:
1. Check console for errors
2. Verify Clerk organization is enabled
3. Ensure `.env` has correct Clerk keys
4. Test with fresh organizations
5. Check database for `organizationId` values

---

**Your SaaS platform is now fully multi-tenant!** 🎉



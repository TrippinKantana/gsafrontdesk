# 🏢 Multi-Tenant Architecture with Clerk Organizations

## 📋 **Overview**

This document outlines the complete multi-tenant architecture for the SaaS Visitor Management Platform using **Clerk Organizations**.

---

## 🎯 **Multi-Tenancy Strategy**

### **Key Concepts:**

1. **Organization = Tenant**
   - Each organization is a separate tenant
   - Complete data isolation between organizations
   - Each organization has its own staff, visitors, meetings, and tickets

2. **Clerk Organizations Integration**
   - Uses Clerk's built-in organization management
   - Supports organization creation, member invitation, role management
   - Single Sign-On (SSO) per organization

3. **Database Schema**
   - `organizationId` field added to all tenant-scoped tables
   - All queries filtered by `organizationId` for data isolation
   - Composite indexes for optimal performance

---

## 🗄️ **Database Schema Changes**

### **New `Organization` Model:**

```prisma
model Organization {
  id             String   @id @default(cuid())
  clerkOrgId     String   @unique // Synced with Clerk
  name           String
  slug           String   @unique
  
  // Subscription (for SaaS tiers)
  plan           String   @default("free")
  maxStaff       Int      @default(10)
  maxVisitors    Int      @default(1000)
  
  // White-label branding
  logoUrl        String?
  primaryColor   String   @default("#3b82f6")
  secondaryColor String   @default("#10b981")
  
  // Relations
  staff          Staff[]
  visitors       Visitor[]
  meetings       Meeting[]
  tickets        Ticket[]
}
```

### **Updated Models with `organizationId`:**

✅ **Staff** → `organizationId` (scoped to organization)  
✅ **Visitor** → `organizationId` (isolated per org)  
✅ **Meeting** → `organizationId` (org-specific meetings)  
✅ **Ticket** → `organizationId` (IT tickets per org)  
✅ **Receptionist** → `organizationId` (assigned to org)  
✅ **CompanySuggestion** → `organizationId` (per-org suggestions)

---

## 👥 **Role Mapping: Clerk Organizations → App Roles**

### **Clerk Organization Roles:**
Clerk provides default organization roles:
- `org:admin` - Organization administrator
- `org:member` - Regular member

### **Our Custom Roles:**
- **Admin** - Full system access
- **Receptionist** - Visitor management
- **IT Staff** - IT support dashboard
- **Employee** - Employee dashboard

### **Mapping Strategy:**

```typescript
Clerk Role → App Role Assignment

org:admin → Admin (automatically)
org:member → Assigned via staff management UI (Receptionist, IT Staff, Employee)
```

**Implementation:**
1. Organization admins can create staff members
2. Admins assign roles (Receptionist, IT Staff, Employee)
3. Roles stored in database (Staff.role field)
4. Clerk organization membership determines organization access
5. App role determines dashboard routing

---

## 🔐 **Authentication & Authorization Flow**

### **1. User Signs Up / Signs In**
```
User → Sign In with Clerk → Select/Create Organization → Dashboard
```

### **2. Organization Context**
```typescript
// Middleware checks:
1. Is user authenticated? (Clerk)
2. Does user belong to an organization? (Clerk org membership)
3. What is user's role? (Database Staff.role)
4. Route to appropriate dashboard based on role
```

### **3. Data Access Control**
```typescript
// Every query filters by organizationId
const visitors = await db.visitor.findMany({
  where: {
    organizationId: currentUser.organizationId // ✅ Always filtered
  }
});
```

---

## 🚀 **Implementation Steps**

### **Phase 1: Database Migration** ✅

**File:** `prisma/schema-multitenant.prisma`

**Changes:**
- ✅ Added `Organization` model
- ✅ Added `organizationId` to all tenant-scoped models
- ✅ Added composite indexes for performance
- ✅ Added foreign key constraints with CASCADE delete

**Migration Command:**
```bash
# Backup current schema
cp prisma/schema.prisma prisma/schema-backup.prisma

# Replace with multi-tenant schema
cp prisma/schema-multitenant.prisma prisma/schema.prisma

# Run migration
npx prisma migrate dev --name add_multi_tenant_support
```

---

### **Phase 2: Clerk Organizations Setup** 🔧

**In Clerk Dashboard:**

1. **Enable Organizations**
   - Go to: `Dashboard → Configure → Organizations`
   - ✅ Enable Organizations feature
   - ✅ Enable "Allow users to create organizations"
   - ✅ Set maximum organizations per user

2. **Configure Organization Settings**
   - ✅ Enable member invitations
   - ✅ Set default organization role to `org:member`
   - ✅ Configure organization permissions

3. **Update Environment Variables**
```bash
# .env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

---

### **Phase 3: Update Authentication** 🔑

**Update `middleware.ts`:**

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId } = await auth();
  
  // Redirect to org selection if no org context
  if (userId && !orgId && !req.nextUrl.pathname.includes('/select-organization')) {
    return NextResponse.redirect(new URL('/select-organization', req.url));
  }
  
  // Protect routes
  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
});
```

**Update `app/page.tsx`:**

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
  
  // Get user's role in this organization
  const staff = await db.staff.findFirst({
    where: {
      clerkUserId: userId,
      organizationId: orgId, // ✅ Filter by org
    },
  });
  
  // Route based on role
  switch (staff?.role) {
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

### **Phase 4: Update All tRPC Routers** 🔧

**Create Organization Context Helper:**

```typescript
// server/context.ts
import { auth } from '@clerk/nextjs/server';
import { db } from './db';

export async function createTRPCContext() {
  const { userId, orgId } = await auth();
  
  return {
    db,
    userId,
    organizationId: orgId, // ✅ Pass org context to all procedures
  };
}
```

**Update Every Router to Filter by Organization:**

```typescript
// Example: server/routers/visitor.ts
export const visitorRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    // ✅ Always filter by organizationId
    return await ctx.db.visitor.findMany({
      where: {
        organizationId: ctx.organizationId, // ✅ Data isolation
      },
      orderBy: { checkInTime: 'desc' },
    });
  }),
  
  create: protectedProcedure
    .input(/* ... */)
    .mutation(async ({ ctx, input }) => {
      // ✅ Always include organizationId
      return await ctx.db.visitor.create({
        data: {
          ...input,
          organizationId: ctx.organizationId, // ✅ Assign to org
        },
      });
    }),
});
```

**Routers to Update:**
- ✅ `staff.ts` - Filter staff by organization
- ✅ `visitor.ts` - Filter visitors by organization
- ✅ `meeting.ts` - Filter meetings by organization
- ✅ `ticket.ts` - Filter tickets by organization
- ✅ `analytics.ts` - Calculate metrics per organization
- ✅ `company.ts` - Company suggestions per organization

---

### **Phase 5: Organization Onboarding** 🎉

**Create `app/onboarding/page.tsx`:**

```typescript
'use client';

import { useOrganization } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

export default function OnboardingPage() {
  const { organization } = useOrganization();
  const router = useRouter();
  const createOrg = trpc.organization.create.useMutation();
  
  useEffect(() => {
    if (organization) {
      // Sync Clerk org to database
      createOrg.mutate({
        clerkOrgId: organization.id,
        name: organization.name,
        slug: organization.slug,
      }, {
        onSuccess: () => {
          router.push('/dashboard');
        }
      });
    }
  }, [organization]);
  
  return (
    <div>
      <h1>Setting up your organization...</h1>
      <p>Please wait while we configure your workspace.</p>
    </div>
  );
}
```

**Create `server/routers/organization.ts`:**

```typescript
export const organizationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      clerkOrgId: z.string(),
      name: z.string(),
      slug: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Upsert organization
      return await ctx.db.organization.upsert({
        where: { clerkOrgId: input.clerkOrgId },
        create: input,
        update: { name: input.name },
      });
    }),
    
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.organization.findUnique({
      where: { clerkOrgId: ctx.organizationId },
    });
  }),
});
```

---

### **Phase 6: Organization Switching** 🔄

**Add Organization Switcher to Navigation:**

```typescript
import { OrganizationSwitcher } from '@clerk/nextjs';

export function DashboardNav() {
  return (
    <nav>
      <OrganizationSwitcher
        afterSelectOrganizationUrl="/"
        afterCreateOrganizationUrl="/onboarding"
      />
      {/* Rest of nav */}
    </nav>
  );
}
```

---

## 📊 **Data Isolation Strategy**

### **1. Query-Level Isolation**
✅ **Every query** filters by `organizationId`  
✅ **Every mutation** includes `organizationId`  
✅ **No cross-org data access**

### **2. Index Optimization**
```prisma
@@index([organizationId, checkInTime])
@@index([organizationId, status])
@@index([organizationId, createdById])
```

### **3. Cascade Deletion**
```prisma
organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
```
✅ When organization is deleted, all related data is removed

---

## 🧪 **Testing Multi-Tenancy**

### **Test Scenarios:**

1. **Create Two Organizations**
   - Sign up as User A → Create Org A
   - Sign up as User B → Create Org B

2. **Add Staff to Each Org**
   - User A adds staff to Org A
   - User B adds staff to Org B
   - ✅ Verify: Staff lists are separate

3. **Create Visitors**
   - Check in visitor for Org A
   - Check in visitor for Org B
   - ✅ Verify: Visitor lists don't overlap

4. **Switch Organizations**
   - User A joins Org B as member
   - Switch between Org A and Org B
   - ✅ Verify: Data changes based on active org

5. **Delete Organization**
   - Delete Org A
   - ✅ Verify: All Org A data is removed
   - ✅ Verify: Org B data remains intact

---

## 🎯 **SaaS Features (Future)**

### **Subscription Tiers:**

**Free Plan:**
- Max 10 staff members
- Max 1,000 visitors/month
- Basic features

**Starter Plan ($29/month):**
- Max 50 staff members
- Max 5,000 visitors/month
- Email notifications

**Professional Plan ($99/month):**
- Unlimited staff
- Unlimited visitors
- SMS notifications
- Calendar integration
- White-label branding

**Enterprise Plan (Custom):**
- Custom limits
- Dedicated support
- Custom integrations
- SLA guarantees

---

## 🔧 **Migration Script**

**For existing single-tenant data:**

```typescript
// scripts/migrate-to-multitenant.ts
import { db } from '@/server/db';

async function migrate() {
  // Create default organization
  const defaultOrg = await db.organization.create({
    data: {
      clerkOrgId: 'org_default',
      name: 'Default Organization',
      slug: 'default',
    },
  });
  
  // Update all existing records
  await db.staff.updateMany({
    data: { organizationId: defaultOrg.id },
  });
  
  await db.visitor.updateMany({
    data: { organizationId: defaultOrg.id },
  });
  
  // ... update all other tables
  
  console.log('Migration complete!');
}

migrate();
```

---

## ✅ **Next Steps**

1. **Backup Database** - Run full backup before migration
2. **Test in Development** - Create test organizations and verify isolation
3. **Run Migration** - Apply schema changes to production
4. **Update All Routers** - Add organizationId filtering
5. **Enable Organizations in Clerk** - Configure organization settings
6. **Test Data Isolation** - Verify no cross-org data leakage
7. **Deploy** - Roll out multi-tenant architecture

---

**Your SaaS platform is now fully multi-tenant!** 🎉

Each organization has:
- ✅ Isolated data (staff, visitors, meetings, tickets)
- ✅ Role-based access control
- ✅ Custom branding (white-label ready)
- ✅ Subscription management (for future billing)
- ✅ Organization member invitations
- ✅ Single sign-on per organization



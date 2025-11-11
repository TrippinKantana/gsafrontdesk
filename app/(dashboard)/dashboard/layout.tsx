import { redirect } from 'next/navigation';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { DashboardNav } from '@/components/dashboard-nav';
import { TopNavbar } from '@/components/top-navbar';
import { SidebarProvider } from '@/components/sidebar-context';
import { DashboardPrefetcher } from '@/components/dashboard-prefetcher';
import { db } from '@/server/db';
import { getUserProfile } from '@/lib/auth-helpers';

// Force dynamic rendering - prevent static analysis
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // ✅ SECURITY: Check user role server-side before rendering admin dashboard
  // Redirect unauthorized users (Employee, IT Staff) to their correct dashboards
  const userProfile = await getUserProfile();
  
  if (userProfile) {
    // Redirect non-admin/receptionist users to their correct dashboards
    if (userProfile.role === 'Employee') {
      redirect('/employee/dashboard');
    } else if (userProfile.role === 'IT Staff') {
      redirect('/it/dashboard');
    }
    // Admin and Receptionist can proceed
  }

  // ✅ Sync organization from Clerk to database if present
  if (orgId) {
    try {
      const clerk = await clerkClient();
      const organization = await clerk.organizations.getOrganization({ organizationId: orgId });
      
      // Upsert ensures organization exists in DB and name is always synced from Clerk
      await db.organization.upsert({
        where: { clerkOrgId: orgId },
        create: {
          clerkOrgId: orgId,
          name: organization.name,
          slug: organization.slug || orgId,
        },
        update: {
          name: organization.name,
          slug: organization.slug || orgId,
        },
      });
      
      console.log('[Dashboard Layout] ✅ Organization synced:', organization.name);
    } catch (error) {
      console.error('[Dashboard Layout] ❌ Failed to sync organization:', error);
    }
  }
  // Note: Client-side components handle organization context via useAuth()

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <DashboardNav />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto bg-gray-50">
            {/* Temporarily disabled prefetcher to debug navigation issue */}
            {/* <DashboardPrefetcher /> */}
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

import { redirect } from 'next/navigation';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { ITNav } from '@/components/it-nav';
import { TopNavbar } from '@/components/top-navbar';
import { SidebarProvider } from '@/components/sidebar-context';
import { db } from '@/server/db';
import { getUserProfile } from '@/lib/auth-helpers';

// Force dynamic rendering - prevent static analysis
export const dynamic = 'force-dynamic';

export default async function ITLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // ✅ SECURITY: Check user role server-side - only IT Staff and Admin can access
  const userProfile = await getUserProfile();
  
  // SECURITY: Deny access if user profile doesn't exist
  if (!userProfile) {
    console.error('[IT Layout] ❌ User profile not found for userId:', userId);
    redirect('/sign-in');
  }
  
  // Redirect non-IT users to their correct dashboards
  if (userProfile.role !== 'IT Staff' && userProfile.role !== 'Admin') {
    if (userProfile.role === 'Employee') {
      redirect('/employee/dashboard');
    } else if (userProfile.role === 'Receptionist') {
      redirect('/dashboard');
    } else {
      redirect('/dashboard');
    }
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
      
      console.log('[IT Layout] ✅ Organization synced:', organization.name);
    } catch (error) {
      console.error('[IT Layout] ❌ Failed to sync organization:', error);
    }
  }
  // Note: Client-side components handle organization context via useAuth()

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <ITNav />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}


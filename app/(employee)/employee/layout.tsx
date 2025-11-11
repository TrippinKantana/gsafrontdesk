import { redirect } from 'next/navigation';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { EmployeeNav } from '@/components/employee-nav';
import { TopNavbar } from '@/components/top-navbar';
import { SidebarProvider } from '@/components/sidebar-context';
import { db } from '@/server/db';
import { getUserProfile } from '@/lib/auth-helpers';

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // ✅ SECURITY: Check user role server-side - Employees, IT Staff, and Admin can access
  const userProfile = await getUserProfile();
  
  if (userProfile) {
    // Receptionist should go to admin dashboard
    if (userProfile.role === 'Receptionist') {
      redirect('/dashboard');
    }
    // Employee, IT Staff, and Admin can proceed
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
      
      console.log('[Employee Layout] ✅ Organization synced:', organization.name);
    } catch (error) {
      console.error('[Employee Layout] ❌ Failed to sync organization:', error);
    }
  }
  // Note: Client-side components handle organization context via useAuth()

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <EmployeeNav />
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



import { redirect } from 'next/navigation';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { EmployeeNav } from '@/components/employee-nav';
import { TopNavbar } from '@/components/top-navbar';
import { SidebarProvider } from '@/components/sidebar-context';
import { db } from '@/server/db';
import { getUserProfile } from '@/lib/auth-helpers';

// Force dynamic rendering - prevent static analysis
export const dynamic = 'force-dynamic';

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // ✅ Sync organization from Clerk to database FIRST (needed for profile creation)
  let organization: { id: string } | null = null;
  if (orgId) {
    try {
      const clerk = await clerkClient();
      const clerkOrg = await clerk.organizations.getOrganization({ organizationId: orgId });
      
      const syncedOrg = await db.organization.upsert({
        where: { clerkOrgId: orgId },
        create: {
          clerkOrgId: orgId,
          name: clerkOrg.name,
          slug: clerkOrg.slug || orgId,
        },
        update: {
          name: clerkOrg.name,
          slug: clerkOrg.slug || orgId,
        },
      });
      
      organization = { id: syncedOrg.id };
      console.log('[Employee Layout] ✅ Organization synced:', clerkOrg.name);
    } catch (error) {
      console.error('[Employee Layout] ❌ Failed to sync organization:', error);
    }
  }

  // ✅ SECURITY: Check user role server-side - Employees, IT Staff, and Admin can access
  let userProfile = await getUserProfile();
  
  // If user profile doesn't exist, check if user is organization admin and auto-create
  if (!userProfile && orgId && organization) {
    try {
      const clerk = await clerkClient();
      const memberships = await clerk.users.getOrganizationMembershipList({ userId });
      const orgMembership = memberships.data.find(
        (m) => m.organization.id === orgId
      );
      
      const isOrgAdmin = orgMembership?.role === 'org:admin' || orgMembership?.role === 'org:creator';
      
      if (isOrgAdmin) {
        console.log('[Employee Layout] 🎯 User is org admin but no profile - auto-creating Admin profile');
        
        const clerkUser = await clerk.users.getUser(userId);
        const fullName = clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress || 'Admin User';
        
        const newStaff = await db.staff.upsert({
          where: { clerkUserId: userId },
          create: {
            organizationId: organization.id,
            fullName: fullName,
            email: clerkUser.emailAddresses[0]?.emailAddress || null,
            role: 'Admin',
            canLogin: true,
            clerkUserId: userId,
            isActive: true,
          },
          update: {
            role: 'Admin',
            canLogin: true,
            isActive: true,
            organizationId: organization.id,
            fullName: fullName,
            email: clerkUser.emailAddresses[0]?.emailAddress || null,
          },
        });
        
        console.log('[Employee Layout] ✅ Auto-created/updated Admin profile:', newStaff.id);
        
        userProfile = {
          id: newStaff.id,
          fullName: newStaff.fullName,
          email: newStaff.email,
          role: 'Admin' as const,
          department: newStaff.department,
          title: newStaff.title,
        };
      }
    } catch (error) {
      console.error('[Employee Layout] ❌ Error auto-creating admin profile:', error);
    }
  }
  
  // If still no profile, redirect to dashboard (admin can create profiles there)
  if (!userProfile) {
    console.log('[Employee Layout] ⚠️ User profile not found - redirecting to dashboard for setup');
    redirect('/dashboard');
  }
  
  // Receptionist should go to admin dashboard
  if (userProfile.role === 'Receptionist') {
    redirect('/dashboard');
  }
  // Employee, IT Staff, and Admin can proceed

  // Note: Organization sync moved above for profile creation
  // Client-side components handle organization context via useAuth()

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




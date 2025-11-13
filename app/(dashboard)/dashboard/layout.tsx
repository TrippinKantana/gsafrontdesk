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

  // ✅ Sync organization from Clerk to database FIRST (needed for profile creation)
  let organization: { id: string } | null = null;
  if (orgId) {
    try {
      const clerk = await clerkClient();
      const clerkOrg = await clerk.organizations.getOrganization({ organizationId: orgId });
      
      // Upsert ensures organization exists in DB and name is always synced from Clerk
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
      console.log('[Dashboard Layout] ✅ Organization synced:', clerkOrg.name);
    } catch (error) {
      console.error('[Dashboard Layout] ❌ Failed to sync organization:', error);
    }
  }

  // ✅ SECURITY: Check user role server-side before rendering admin dashboard
  // Redirect unauthorized users (Employee, IT Staff) to their correct dashboards
  let userProfile = await getUserProfile();
  
  // If user profile doesn't exist, check if user is organization admin
  // If they are an org admin, auto-create their Admin profile
  if (!userProfile && orgId && organization) {
    try {
      const clerk = await clerkClient();
      
      // Check if user is an organization admin in Clerk
      // Get user's memberships and find the one for this organization
      const memberships = await clerk.users.getOrganizationMembershipList({ userId });
      const orgMembership = memberships.data.find(
        (m) => m.organization.id === orgId
      );
      
      const isOrgAdmin = orgMembership?.role === 'org:admin' || orgMembership?.role === 'org:creator';
      
      if (isOrgAdmin) {
        console.log('[Dashboard Layout] 🎯 User is org admin but no profile - auto-creating Admin profile');
        
        // Get user info from Clerk
        const clerkUser = await clerk.users.getUser(userId);
        const fullName = clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress || 'Admin User';
        
        // Use upsert to handle race condition: if another process creates the profile
        // between getUserProfile() and this call, upsert will update instead of failing
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
            // If profile already exists, ensure it's set as Admin and active
            role: 'Admin',
            canLogin: true,
            isActive: true,
            organizationId: organization.id, // Update org in case it changed
            fullName: fullName, // Update name in case it changed in Clerk
            email: clerkUser.emailAddresses[0]?.emailAddress || null,
          },
        });
        
        console.log('[Dashboard Layout] ✅ Auto-created/updated Admin profile:', newStaff.id);
        
        // Fetch the newly created/updated profile
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
      console.error('[Dashboard Layout] ❌ Error auto-creating admin profile:', error);
    }
  }
  
  // If still no profile after auto-creation attempt, allow access anyway
  // Organization creators should have been auto-created above
  // If they still don't have a profile, they can access the dashboard to set up their organization
  if (!userProfile) {
    console.log('[Dashboard Layout] ⚠️ User profile not found for userId:', userId, '- allowing access for organization setup');
    // Allow access - user can set up their organization
    // Don't redirect based on role since we don't have a profile
  } else {
    // Redirect non-admin/receptionist users to their correct dashboards
    if (userProfile.role === 'Employee') {
      redirect('/employee/dashboard');
    } else if (userProfile.role === 'IT Staff') {
      redirect('/it/dashboard');
    }
    // Admin and Receptionist can proceed
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

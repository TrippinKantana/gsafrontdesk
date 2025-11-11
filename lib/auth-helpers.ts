import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';

export type UserRole = 'Employee' | 'Receptionist' | 'Admin' | 'IT Staff';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  department: string | null;
  title: string | null;
}

/**
 * Get the authenticated user's profile and role from the database
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  try {
    const staff = await db.staff.findUnique({
      where: { clerkUserId: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        title: true,
      },
    });

    if (!staff) return null;
    
    // Ensure role matches UserRole type
    const role = staff.role as UserRole;
    if (!['Employee', 'Receptionist', 'Admin', 'IT Staff'].includes(role)) {
      return null;
    }
    
    return {
      id: staff.id,
      fullName: staff.fullName,
      email: staff.email,
      role,
      department: staff.department,
      title: staff.title,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Check if user can access admin dashboard
 */
export function canAccessAdminDashboard(role: UserRole | undefined): boolean {
  return hasRole(role, ['Admin', 'Receptionist']);
}

/**
 * Check if user can access IT dashboard
 */
export function canAccessITDashboard(role: UserRole | undefined): boolean {
  return hasRole(role, ['Admin', 'IT Staff']);
}

/**
 * Check if user can access employee dashboard
 */
export function canAccessEmployeeDashboard(role: UserRole | undefined): boolean {
  // All authenticated staff members can access employee dashboard
  return hasRole(role, ['Employee', 'Receptionist', 'Admin', 'IT Staff']);
}

/**
 * Get redirect URL based on user role
 */
export function getDefaultDashboardForRole(role: UserRole): string {
  switch (role) {
    case 'Admin':
      return '/dashboard';
    case 'Receptionist':
      return '/dashboard';
    case 'IT Staff':
      return '/it/dashboard';
    case 'Employee':
    default:
      return '/employee/dashboard';
  }
}



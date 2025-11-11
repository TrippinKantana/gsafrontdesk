import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/lib/auth-helpers';

export default async function RootPage() {
  const { userId } = await auth();

  console.log('[Root Page] User signed in:', !!userId);

  // Not signed in - redirect to landing page
  if (!userId) {
    console.log('[Root Page] Not signed in, redirecting to /landing');
    redirect('/landing');
  }

  // ✅ Get user's role server-side to redirect directly to correct dashboard
  // This prevents security breach of showing admin dashboard before redirect
  try {
    const userProfile = await getUserProfile();
    
    if (userProfile) {
      console.log('[Root Page] User role detected:', userProfile.role);
      
      // Redirect based on role - SECURITY: Direct redirect, no intermediate page load
      if (userProfile.role === 'Employee') {
        console.log('[Root Page] Redirecting Employee to /employee/dashboard');
        redirect('/employee/dashboard');
      } else if (userProfile.role === 'IT Staff') {
        console.log('[Root Page] Redirecting IT Staff to /it/dashboard');
        redirect('/it/dashboard');
      } else {
        // Admin or Receptionist go to admin dashboard
        console.log('[Root Page] Redirecting Admin/Receptionist to /dashboard');
        redirect('/dashboard');
      }
    } else {
      // User doesn't have a profile yet - might be a new admin
      // Redirect to admin dashboard where they can set up their profile
      console.log('[Root Page] No profile found, redirecting to /dashboard');
      redirect('/dashboard');
    }
  } catch (error) {
    console.error('[Root Page] Error fetching user profile:', error);
    // On error, redirect to admin dashboard as fallback
    redirect('/dashboard');
  }
}

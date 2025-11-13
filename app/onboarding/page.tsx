'use client';

import { useEffect } from 'react';
import { useOrganization } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Loader2 } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function OnboardingPage() {
  const { organization, isLoaded } = useOrganization();
  const router = useRouter();
  const syncOrg = trpc.organization.syncOrganization.useMutation();
  
  useEffect(() => {
    // Only run once when organization is loaded
    if (!isLoaded) return;
    
    if (organization) {
      console.log('Syncing organization:', organization.name);
      
      syncOrg.mutate({
        clerkOrgId: organization.id,
        name: organization.name,
        slug: organization.slug || organization.id,
      }, {
        onSuccess: async (data) => {
          console.log('Organization synced successfully:', data);
          
          // Immediately redirect to dashboard - dashboard layout will handle profile creation
          // No delay, no waiting - seamless experience
          router.replace('/dashboard');
        },
        onError: (error) => {
          console.error('Failed to sync organization:', error);
          // Still redirect immediately - dashboard layout will handle it
          router.replace('/dashboard');
        },
      });
    } else {
      // No organization - redirect to dashboard anyway
      router.replace('/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, organization?.id]); // Only depend on isLoaded and organization.id (stable reference)
  
  // Show minimal loading state while syncing - redirect happens immediately after
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Setting up your organization...
        </h2>
      </div>
    </div>
  );
}


'use client';

import { useEffect } from 'react';
import { useOrganization } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Loader2, Building2, CheckCircle } from 'lucide-react';

export default function OnboardingPage() {
  const { organization, isLoaded } = useOrganization();
  const router = useRouter();
  const syncOrg = trpc.organization.syncOrganization.useMutation();
  
  useEffect(() => {
    if (isLoaded && organization) {
      console.log('Syncing organization:', organization.name);
      
      syncOrg.mutate({
        clerkOrgId: organization.id,
        name: organization.name,
        slug: organization.slug || organization.id,
      }, {
        onSuccess: (data) => {
          console.log('Organization synced successfully:', data);
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        },
        onError: (error) => {
          console.error('Failed to sync organization:', error);
          // Still redirect to dashboard after a delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        },
      });
    }
  }, [isLoaded, organization]);
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading...
          </h2>
        </div>
      </div>
    );
  }
  
  if (syncOrg.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Syncco!
          </h2>
          <p className="text-gray-600 mb-4">
            Your organization has been set up successfully.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center max-w-md px-4">
        <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Setting up your organization
        </h2>
        <p className="text-gray-600 mb-6">
          We're configuring your workspace and preparing your dashboard. 
          This will only take a moment...
        </p>
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-sm text-gray-500">Please wait...</span>
        </div>
        
        {syncOrg.isError && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Taking longer than expected... You'll be redirected shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


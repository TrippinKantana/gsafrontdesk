'use client';

import { useEffect, Suspense } from 'react';
import { useOrganizationList } from '@clerk/nextjs';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AutoSelectOrgContent() {
  const { setActive, isLoaded } = useOrganizationList();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = searchParams.get('orgId');

  useEffect(() => {
    const selectOrganization = async () => {
      if (!isLoaded || !setActive || !orgId) {
        return;
      }

      try {
        console.log('[Auto Select] Setting organization:', orgId);
        await setActive({ organization: orgId });
        console.log('[Auto Select] Organization set successfully');
        
        // Wait a moment for session to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Redirect to dashboard
        console.log('[Auto Select] Redirecting to dashboard...');
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('[Auto Select] Error setting organization:', error);
        // Fall back to select-organization page
        router.push('/select-organization');
      }
    };

    selectOrganization();
  }, [isLoaded, setActive, orgId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Setting up your workspace...</p>
      </div>
    </div>
  );
}

export default function AutoSelectOrgPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    }>
      <AutoSelectOrgContent />
    </Suspense>
  );
}


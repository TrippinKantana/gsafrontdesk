'use client';

import { useOrganization, useAuth } from '@clerk/nextjs';
import { Building2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { OrganizationList } from '@clerk/nextjs';

export default function SelectOrganizationPage() {
  const { organization } = useOrganization();
  const { orgId } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // If organization is selected, redirect to dashboard
    if (organization && orgId && !isRedirecting) {
      console.log('[Select Org] Organization selected:', organization.name);
      setIsRedirecting(true);
      
      // Small delay to ensure session is synced
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    }
  }, [organization, orgId, isRedirecting]);

  // Show loading state when redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Select Organization
          </h1>
          <p className="text-gray-600">
            You belong to multiple organizations. Please choose one to continue.
          </p>
        </div>

        <div className="flex justify-center">
          <OrganizationList
            hidePersonal={true}
            skipInvitationScreen={false}
            appearance={{
              elements: {
                rootBox: {
                  width: '100%',
                  maxWidth: '600px',
                },
                card: {
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e5e7eb',
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}


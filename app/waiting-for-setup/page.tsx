'use client';

import { useEffect } from 'react';
import { User, Mail, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserButton } from '@clerk/nextjs';
import { useOrganization } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

export default function WaitingForSetupPage() {
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const router = useRouter();
  const ensureAdmin = trpc.organization.ensureAdminProfile.useMutation();
  
  // Check if profile exists (poll every 10 seconds)
  const { data: profile } = trpc.employee.getProfile.useQuery(undefined, {
    refetchInterval: 10000, // Check every 10 seconds
    retry: false,
  });

  // On mount, try to ensure admin profile if user is org admin
  useEffect(() => {
    if (orgLoaded && organization && !profile) {
      console.log('[Waiting Page] Attempting to ensure admin profile for org admin');
      ensureAdmin.mutate(undefined, {
        onSuccess: (result) => {
          if (result.success && result.created) {
            console.log('[Waiting Page] ✅ Admin profile created, redirecting to dashboard');
            router.replace('/dashboard');
          } else if (result.success && !result.created) {
            console.log('[Waiting Page] Profile already exists');
          } else {
            console.log('[Waiting Page] User is not org admin');
          }
        },
        onError: (error) => {
          console.error('[Waiting Page] Failed to ensure admin profile:', error);
        },
      });
    }
  }, [orgLoaded, organization, profile, ensureAdmin, router]);

  // If profile is found, redirect to appropriate dashboard
  useEffect(() => {
    if (profile) {
      console.log('[Waiting Page] Profile found, redirecting to dashboard');
      // Redirect based on role
      if (profile.role === 'Employee') {
        router.replace('/employee/dashboard');
      } else if (profile.role === 'IT Staff') {
        router.replace('/it/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [profile, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-12">
      <div className="absolute top-4 right-4">
        <UserButton afterSignOutUrl="/landing" />
      </div>

      <div className="max-w-md w-full">
        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <User className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">Account Setup Required</CardTitle>
            <CardDescription className="text-base mt-2">
              Your account is waiting to be configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2">What's happening?</h3>
              <p className="text-sm text-amber-800 mb-3">
                You've successfully signed in, but your profile hasn't been set up in the system yet.
              </p>
              {orgLoaded && organization && (
                <div className="mt-3 pt-3 border-t border-amber-300">
                  <div className="flex items-center gap-2 text-sm text-amber-800">
                    <Building2 className="h-4 w-4" />
                    <span>Organization: <strong>{organization.name}</strong></span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What to do next:</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Contact your organization administrator to add you to the system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>An admin needs to create your staff profile with your role and permissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Once your profile is created, you'll be able to access your dashboard</span>
                </li>
              </ul>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>This page automatically checks every 10 seconds for your profile.</p>
              <p className="mt-1">Once an admin creates your profile, you'll be redirected automatically.</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.location.href = 'mailto:support@yourdomain.com'}
              >
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


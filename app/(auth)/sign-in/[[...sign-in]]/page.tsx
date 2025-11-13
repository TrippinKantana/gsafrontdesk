'use client';

import { SignIn, useUser } from '@clerk/nextjs';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  
  // After sign-in, redirect to root page which will check user type and route appropriately
  const redirectUrl = searchParams.get('redirect_url') || '/';

  // If user is already signed in, redirect them away from sign-in page
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      console.log('[SignIn Page] User already signed in, redirecting to:', redirectUrl);
      router.replace(redirectUrl);
    }
  }, [isLoaded, isSignedIn, redirectUrl, router]);

  // Show loading state while checking auth status
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If already signed in, don't render sign-in form (redirect will happen)
  if (isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Syncco</h1>
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl",
            }
          }}
          fallbackRedirectUrl={redirectUrl}
        />
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            New employee? Your admin will provide login credentials.
          </p>
        </div>
      </div>
    </div>
  );
}

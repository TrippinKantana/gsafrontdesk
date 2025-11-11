'use client';

import { SignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const searchParams = useSearchParams();
  // After sign-in, redirect to root page which will check user type and route appropriately
  const redirectUrl = searchParams.get('redirect_url') || '/';

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
          forceRedirectUrl={redirectUrl}
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

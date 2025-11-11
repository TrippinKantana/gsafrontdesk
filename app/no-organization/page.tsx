'use client';

import { Building2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserButton } from '@clerk/nextjs';

export default function NoOrganizationPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-12">
      <div className="absolute top-4 right-4">
        <UserButton afterSignOutUrl="/landing" />
      </div>

      <div className="max-w-md w-full">
        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">No Organization Found</CardTitle>
            <CardDescription className="text-base mt-2">
              You're not currently part of any organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What to do next:</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Contact your organization administrator to get an invitation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Check your email for an organization invite link</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Make sure you're using the correct email address</span>
                </li>
              </ul>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>Need help? Contact your system administrator</p>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = 'mailto:support@yourdomain.com'}
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





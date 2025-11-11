'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';

export default function VisitorLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 safe-area-inset">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center mb-2">
            <Image 
              src="/syncco_logo.svg" 
              alt="Syncco Logo" 
              width={120} 
              height={60}
              priority
            />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">Welcome</CardTitle>
          <CardDescription className="text-lg">
            Please select an option below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/visitor/checkin" className="block">
            <Button 
              className="w-full h-16 text-lg font-medium bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <LogIn className="mr-3 h-6 w-6" />
              Check In
            </Button>
          </Link>
          <Link href="/visitor/checkout" className="block">
            <Button 
              variant="outline" 
              className="w-full h-16 text-lg font-medium border-2 hover:bg-gray-50"
              size="lg"
            >
              <LogOut className="mr-3 h-6 w-6" />
              Check Out
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

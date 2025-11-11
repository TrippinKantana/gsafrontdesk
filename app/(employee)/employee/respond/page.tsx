'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function EmployeeRespondPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const action = searchParams.get('action') as 'accept' | 'decline' | null;
  
  const [note, setNote] = useState('');
  const [hasResponded, setHasResponded] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);

  const respondMutation = trpc.employee.respondToVisitor.useMutation({
    onSuccess: (data) => {
      setHasResponded(true);
      setResponseData(data);
    },
  });

  useEffect(() => {
    // Auto-respond if action and token are in URL (from email link)
    if (token && action && !hasResponded && !respondMutation.isPending) {
      respondMutation.mutate({ token, action, note: '' });
    }
  }, [token, action]); // Only run once on mount

  if (!token || !action) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-center">Invalid Link</CardTitle>
            <CardDescription className="text-center">
              This response link is invalid or incomplete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (respondMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-center">Processing Response...</CardTitle>
            <CardDescription className="text-center">
              Please wait while we process your response.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Error state
  if (respondMutation.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-center text-red-600">Error</CardTitle>
            <CardDescription className="text-center">
              {respondMutation.error.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => respondMutation.mutate({ token, action, note })}
              className="w-full"
            >
              Try Again
            </Button>
            <Link href="/employee/dashboard">
              <Button variant="outline" className="w-full">
                Go to Employee Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (hasResponded && responseData) {
    const isAccepted = action === 'accept';
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${
              isAccepted ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {isAccepted ? (
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-gray-600" />
              )}
            </div>
            <CardTitle className="text-center">
              {responseData.alreadyResponded 
                ? 'Already Responded' 
                : isAccepted ? 'Meeting Accepted' : 'Meeting Declined'}
            </CardTitle>
            <CardDescription className="text-center">
              {responseData.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {responseData.visitor && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm text-gray-700">Visitor Details:</h3>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Name:</span> {responseData.visitor.fullName}</p>
                  <p><span className="font-medium">Company:</span> {responseData.visitor.company}</p>
                  <p><span className="font-medium">Check-in:</span> {new Date(responseData.visitor.checkInTime).toLocaleString()}</p>
                </div>
              </div>
            )}

            {isAccepted && !responseData.alreadyResponded && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ℹ️ The front desk has been notified. Your visitor will be directed to meet you shortly.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Link href="/employee/dashboard">
                <Button className="w-full">
                  Go to Employee Dashboard
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show manual response form (if auto-response failed)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Respond to Visitor</CardTitle>
          <CardDescription>
            {action === 'accept' ? 'Accept' : 'Decline'} this meeting request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Optional Message</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)..."
              rows={3}
            />
          </div>
          
          <Button
            onClick={() => respondMutation.mutate({ token, action, note })}
            className={`w-full ${
              action === 'accept' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {action === 'accept' ? 'Accept Meeting' : 'Decline Meeting'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


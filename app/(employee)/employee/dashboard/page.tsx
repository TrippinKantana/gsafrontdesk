'use client';

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Clock, Mail, User, Calendar, Ticket as TicketIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { CreateTicketDialog } from '@/components/tickets/create-ticket-dialog';
import { Button } from '@/components/ui/button';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function EmployeeDashboardPage() {
  const { toast } = useToast();

  // Fetch employee profile
  const { data: profile, isLoading: profileLoading } = trpc.employee.getProfile.useQuery();

  // Fetch pending visitors count for dashboard display
  const { data: pendingVisitors = [] } = trpc.employee.getPendingVisitors.useQuery(
    undefined,
    { refetchInterval: 10000 } // Auto-refresh every 10 seconds
  );

  // Preferences mutation
  const updatePreferences = trpc.employee.updatePreferences.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Notification preferences updated.',
      });
    },
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              You don't have an employee profile. Please contact your administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome, {profile.fullName}</p>
        </div>
        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Need help? Submit or view your support tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <CreateTicketDialog />
              <Link href="/employee/tickets">
                <Button variant="outline" className="w-full sm:w-auto">
                  <TicketIcon className="h-4 w-4 mr-2" />
                  View My Tickets
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Employee information and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Department</Label>
                <p className="font-medium">{profile.department || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Title</Label>
                <p className="font-medium">{profile.title || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Email</Label>
                <p className="font-medium">{profile.email || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Phone</Label>
                <p className="font-medium">{profile.phone || 'Not specified'}</p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <Label className="text-sm font-semibold mb-3 block">Notification Preferences</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {profile.notifyOnVisitorArrival ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                    <span className="text-sm">Visitor Arrival Notifications</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePreferences.mutate({ notifyOnVisitorArrival: !profile.notifyOnVisitorArrival })}
                  >
                    {profile.notifyOnVisitorArrival ? 'Disable' : 'Enable'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">Email Notifications</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePreferences.mutate({ notifyEmail: !profile.notifyEmail })}
                  >
                    {profile.notifyEmail ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visitors Quick Link */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle>Visitors</CardTitle>
            <CardDescription>
              Manage pending visitors and view your complete visitor history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {pendingVisitors.length > 0 ? (
                    <span className="font-semibold text-purple-700">
                      {pendingVisitors.length} visitor{pendingVisitors.length !== 1 ? 's' : ''} waiting for your response
                    </span>
                  ) : (
                    <span>No pending visitors at the moment</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  View and manage all visitors who came to see you
                </p>
              </div>
              <Link href="/employee/visitors">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <User className="h-4 w-4 mr-2" />
                  View Visitors
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Meetings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar & Meetings</CardTitle>
            <CardDescription>
              Schedule meetings and view your upcoming appointments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/employee/meetings">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Calendar className="h-4 w-4 mr-2" />
                Go to Meetings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}


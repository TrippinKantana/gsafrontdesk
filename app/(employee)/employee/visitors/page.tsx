'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Building2, User, LogOut, LogIn } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function VisitorsPage() {
  const { toast } = useToast();
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [responseNote, setResponseNote] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [responseAction, setResponseAction] = useState<'accept' | 'decline'>('accept');

  // Fetch employee profile first
  const { data: profile, isLoading: profileLoading } = trpc.employee.getProfile.useQuery();

  // Fetch pending visitors
  const { data: pendingVisitors = [], refetch: refetchPending, isLoading: pendingLoading } = trpc.employee.getPendingVisitors.useQuery(
    undefined,
    { 
      refetchInterval: 10000, // Auto-refresh every 10 seconds
      enabled: !!profile, // Only fetch if profile exists
    }
  );

  // Fetch all visitors (current and past)
  const { data: allVisitors = [], refetch: refetchAllVisitors, isLoading: allVisitorsLoading } = trpc.employee.getAllVisitors.useQuery(
    undefined,
    { 
      refetchInterval: 10000, // Auto-refresh every 10 seconds
      enabled: !!profile, // Only fetch if profile exists
    }
  );

  // Separate current and past visitors
  const currentVisitors = allVisitors.filter(v => !v.checkOutTime);
  const pastVisitors = allVisitors.filter(v => v.checkOutTime);

  // Response mutation
  const respondMutation = trpc.employee.respondFromDashboard.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message,
      });
      refetchPending();
      refetchAllVisitors();
      setIsDialogOpen(false);
      setSelectedVisitor(null);
      setResponseNote('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleRespond = (visitor: any, action: 'accept' | 'decline') => {
    setSelectedVisitor(visitor);
    setResponseAction(action);
    setIsDialogOpen(true);
  };

  const submitResponse = () => {
    if (!selectedVisitor) return;
    
    respondMutation.mutate({
      visitorId: selectedVisitor.id,
      action: responseAction,
      note: responseNote,
    });
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
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
            <Link href="/employee/dashboard">
              <Button className="w-full">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Visitors</h1>
          <p className="text-sm text-gray-600">Manage and view all visitors who came to see you</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Visitor Management</CardTitle>
            <CardDescription>
              View pending visitors awaiting your response and browse your complete visitor history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">
                  Pending Visitors ({pendingVisitors.length})
                </TabsTrigger>
                <TabsTrigger value="history">
                  Visitor History ({allVisitors.length})
                </TabsTrigger>
              </TabsList>
              
              {/* Pending Visitors Tab */}
              <TabsContent value="pending" className="mt-4">
                {pendingLoading ? (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Loading visitors...</p>
                  </div>
                ) : pendingVisitors.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No pending visitors</p>
                    <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingVisitors.map((visitor) => (
                      <Card key={visitor.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div>
                                <h3 className="font-semibold text-lg">{visitor.fullName}</h3>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {visitor.company}
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-600">Email:</span>
                                  <p className="font-medium">{visitor.email}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Phone:</span>
                                  <p className="font-medium">{visitor.phone}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Reason:</span>
                                  <p className="font-medium">{visitor.reasonForVisit || 'Not specified'}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600 flex items-center gap-1">
                                    <LogIn className="h-3 w-3" />
                                    Check-in Time:
                                  </span>
                                  <p className="font-medium">
                                    {new Date(visitor.checkInTime).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleRespond(visitor, 'accept')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRespond(visitor, 'decline')}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Decline
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Visitor History Tab */}
              <TabsContent value="history" className="mt-4">
                <Tabs defaultValue="current" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="current">
                      Current Visitors ({currentVisitors.length})
                    </TabsTrigger>
                    <TabsTrigger value="past">
                      Past Visitors ({pastVisitors.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="current" className="mt-0">
                    {allVisitorsLoading ? (
                      <div className="text-center py-8">
                        <Clock className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Loading visitors...</p>
                      </div>
                    ) : currentVisitors.length === 0 ? (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No current visitors</p>
                        <p className="text-sm text-gray-500 mt-1">All visitors have checked out</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentVisitors.map((visitor) => {
                          const getStatusBadge = () => {
                            if (visitor.hostResponseStatus === 'accepted') {
                              return <Badge className="bg-green-100 text-green-800 border-green-300">Accepted</Badge>;
                            } else if (visitor.hostResponseStatus === 'declined') {
                              return <Badge className="bg-red-100 text-red-800 border-red-300">Declined</Badge>;
                            } else {
                              return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
                            }
                          };

                          const getBorderColor = () => {
                            if (visitor.hostResponseStatus === 'accepted') return 'border-l-green-500';
                            if (visitor.hostResponseStatus === 'declined') return 'border-l-red-500';
                            return 'border-l-blue-500';
                          };

                          return (
                            <Card key={visitor.id} className={`border-l-4 ${getBorderColor()}`}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold text-lg">{visitor.fullName}</h3>
                                      {getStatusBadge()}
                                    </div>
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />
                                      {visitor.company}
                                    </p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-600">Email:</span>
                                        <p className="font-medium">{visitor.email}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Phone:</span>
                                        <p className="font-medium">{visitor.phone}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Reason:</span>
                                        <p className="font-medium">{visitor.reasonForVisit || 'Not specified'}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 flex items-center gap-1">
                                          <LogIn className="h-3 w-3" />
                                          Check-in:
                                        </span>
                                        <p className="font-medium">
                                          {new Date(visitor.checkInTime).toLocaleString()}
                                        </p>
                                      </div>
                                      {visitor.hostResponseTime && (
                                        <div>
                                          <span className="text-gray-600">Response Time:</span>
                                          <p className="font-medium">
                                            {new Date(visitor.hostResponseTime).toLocaleString()}
                                          </p>
                                        </div>
                                      )}
                                      {visitor.hostResponseNote && (
                                        <div className="md:col-span-2">
                                          <span className="text-gray-600">Your Note:</span>
                                          <p className="font-medium italic">{visitor.hostResponseNote}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {visitor.hostResponseStatus === 'pending' && (
                                    <div className="flex flex-col gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleRespond(visitor, 'accept')}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Accept
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRespond(visitor, 'decline')}
                                        className="border-red-300 text-red-600 hover:bg-red-50"
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Decline
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="past" className="mt-0">
                    {allVisitorsLoading ? (
                      <div className="text-center py-8">
                        <Clock className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Loading visitors...</p>
                      </div>
                    ) : pastVisitors.length === 0 ? (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No past visitors</p>
                        <p className="text-sm text-gray-500 mt-1">Your visitor history will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pastVisitors.map((visitor) => {
                          const getStatusBadge = () => {
                            if (visitor.hostResponseStatus === 'accepted') {
                              return <Badge className="bg-green-100 text-green-800 border-green-300">Accepted</Badge>;
                            } else if (visitor.hostResponseStatus === 'declined') {
                              return <Badge className="bg-red-100 text-red-800 border-red-300">Declined</Badge>;
                            } else {
                              return <Badge className="bg-gray-100 text-gray-800 border-gray-300">No Response</Badge>;
                            }
                          };

                          const getBorderColor = () => {
                            if (visitor.hostResponseStatus === 'accepted') return 'border-l-green-500';
                            if (visitor.hostResponseStatus === 'declined') return 'border-l-red-500';
                            return 'border-l-gray-400';
                          };

                          return (
                            <Card key={visitor.id} className={`border-l-4 ${getBorderColor()}`}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold text-lg">{visitor.fullName}</h3>
                                      {getStatusBadge()}
                                    </div>
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />
                                      {visitor.company}
                                    </p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-600">Email:</span>
                                        <p className="font-medium">{visitor.email}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Phone:</span>
                                        <p className="font-medium">{visitor.phone}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Reason:</span>
                                        <p className="font-medium">{visitor.reasonForVisit || 'Not specified'}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 flex items-center gap-1">
                                          <LogIn className="h-3 w-3" />
                                          Check-in:
                                        </span>
                                        <p className="font-medium">
                                          {new Date(visitor.checkInTime).toLocaleString()}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 flex items-center gap-1">
                                          <LogOut className="h-3 w-3" />
                                          Check-out:
                                        </span>
                                        <p className="font-medium">
                                          {visitor.checkOutTime ? new Date(visitor.checkOutTime).toLocaleString() : 'Not checked out'}
                                        </p>
                                      </div>
                                      {visitor.hostResponseTime && (
                                        <div>
                                          <span className="text-gray-600">Response Time:</span>
                                          <p className="font-medium">
                                            {new Date(visitor.hostResponseTime).toLocaleString()}
                                          </p>
                                        </div>
                                      )}
                                      {visitor.hostResponseNote && (
                                        <div className="md:col-span-2">
                                          <span className="text-gray-600">Your Note:</span>
                                          <p className="font-medium italic">{visitor.hostResponseNote}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Response Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseAction === 'accept' ? 'Accept Meeting' : 'Decline Meeting'}
            </DialogTitle>
            <DialogDescription>
              {selectedVisitor && `Respond to ${selectedVisitor.fullName}'s visit request`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="response-note">Message (Optional)</Label>
              <Textarea
                id="response-note"
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                placeholder={
                  responseAction === 'accept'
                    ? "e.g., I'll be right down to meet you..."
                    : "e.g., I'm in a meeting. Please reschedule..."
                }
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={submitResponse}
                disabled={respondMutation.isPending}
                className={`flex-1 ${
                  responseAction === 'accept'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {respondMutation.isPending ? 'Sending...' : responseAction === 'accept' ? 'Accept' : 'Decline'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


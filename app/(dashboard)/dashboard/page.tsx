'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth, useOrganizationList } from '@clerk/nextjs';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate, formatTime } from '@/lib/utils';
import { Download, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

type FilterType = 'today' | 'week' | 'all';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { orgId } = useAuth();
  const { setActive, userMemberships } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const router = useRouter();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterType>('today');
  const [selectedVisitor, setSelectedVisitor] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Auto-activate organization if user has exactly one and none is active
  useEffect(() => {
    const autoActivateOrg = async () => {
      if (!isLoaded || !user || orgId || !setActive) return;
      
      const memberships = userMemberships.data || [];
      
      if (memberships.length === 1) {
        console.log('[Dashboard] Auto-activating single organization:', memberships[0].organization.name);
        try {
          await setActive({ organization: memberships[0].organization.id });
          console.log('[Dashboard] Organization activated successfully');
          // Refresh to load org-specific data
          window.location.reload();
        } catch (error) {
          console.error('[Dashboard] Failed to activate organization:', error);
        }
      } else if (memberships.length === 0) {
        console.log('[Dashboard] User has no organizations');
        router.push('/no-organization');
      }
    };

    autoActivateOrg();
  }, [isLoaded, user, orgId, setActive, userMemberships, router]);

  // Check user's role and redirect if needed
  const { data: employeeProfile, error: profileError, isLoading: isLoadingProfile } = trpc.employee.getProfile.useQuery(
    undefined,
    { 
      enabled: isLoaded && !!user?.id,
      retry: 2, // Retry twice if it fails
    }
  );

  useEffect(() => {
    if (profileError) {
      console.error('[Dashboard] Error fetching profile:', profileError);
      // If profile not found, user might not be in the system yet
      // Stay on dashboard for now (admin can create their profile)
      return;
    }

    if (isLoadingProfile) {
      // Still loading, wait
      return;
    }

    if (employeeProfile) {
      console.log('[Dashboard] User role detected:', employeeProfile.role);
      // Redirect employees and IT staff to their respective dashboards
      if (employeeProfile.role === 'Employee') {
        console.log('[Dashboard] Redirecting to employee dashboard');
        router.replace('/employee/dashboard');
        return; // Prevent further execution
      } else if (employeeProfile.role === 'IT Staff') {
        console.log('[Dashboard] Redirecting to IT dashboard');
        router.replace('/it/dashboard');
        return; // Prevent further execution
      } else {
        console.log('[Dashboard] User is Admin/Receptionist, staying on dashboard');
      }
      // Admin and Receptionist stay on this dashboard
    }
  }, [employeeProfile, profileError, isLoadingProfile, router]);

  // Create receptionist profile on mount (but don't block visitor list)
  const createReceptionist = trpc.receptionist.getOrCreate.useMutation();

  useEffect(() => {
    if (user?.id && !createReceptionist.isPending) {
      createReceptionist.mutate(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user.id to prevent infinite loops

  // Fetch visitors - show all visitors regardless of receptionist
  const { data: visitors, refetch, isLoading: isLoadingVisitors } = trpc.visitor.list.useQuery(
    {
      filter,
    },
    {
      refetchInterval: 10000, // Auto-refresh every 10 seconds (reduced from 5)
      staleTime: 3000, // Consider data fresh for 3 seconds (reduces unnecessary refetches)
      cacheTime: 60000, // Keep in cache for 1 minute
      // Show cached data immediately while refetching in background
      refetchOnWindowFocus: false, // Don't refetch on window focus for better UX
    }
  );

  // Use visitor data from list if available, otherwise fetch
  const visitorFromList = visitors?.find((v) => v.id === selectedVisitor);
  const { data: fetchedVisitorDetails, isLoading: isLoadingDetails } = trpc.visitor.getById.useQuery(
    { id: selectedVisitor! },
    { 
      enabled: !!selectedVisitor && !visitorFromList, // Only fetch if not in list
    }
  );
  
  // Use data from list first, fallback to fetched data
  const visitorDetails = visitorFromList || fetchedVisitorDetails;

  const checkoutMutation = trpc.visitor.checkout.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Visitor checked out successfully',
      });
      refetch();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const exportData = trpc.visitor.export.useQuery(
    {
      filter,
    }
  );

  const handleExport = () => {
    if (!exportData.data) return;

    const csvHeaders = [
      'Full Name',
      'Company',
      'Email',
      'Phone',
      'Who to See',
      'Check-In Time',
      'Check-Out Time',
      'Status',
    ];

    const csvRows = exportData.data.map((visitor) => [
      visitor.fullName,
      visitor.company,
      visitor.email,
      visitor.phone,
      visitor.whomToSee,
      formatDate(visitor.checkInTime),
      visitor.checkOutTime ? formatDate(visitor.checkOutTime) : 'N/A',
      visitor.checkOutTime ? 'Checked Out' : 'Checked In',
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitors-${filter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: 'Visitor data has been exported to CSV',
    });
  };

  const openVisitorDetails = (visitorId: string) => {
    setSelectedVisitor(visitorId);
    setIsDialogOpen(true);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Visitor Dashboard</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress}
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Button variant="outline" onClick={handleExport} size="sm" className="text-xs md:text-sm">
                <Download className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Filters */}
        <Card className="mb-4 md:mb-6">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base md:text-lg">Filters</CardTitle>
                <CardDescription className="text-xs md:text-sm">View visitors by time period</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filter === 'today' ? 'default' : 'outline'}
                  onClick={() => setFilter('today')}
                  size="sm"
                  className="text-xs md:text-sm"
                >
                  Today
                </Button>
                <Button
                  variant={filter === 'week' ? 'default' : 'outline'}
                  onClick={() => setFilter('week')}
                  size="sm"
                  className="text-xs md:text-sm"
                >
                  This Week
                </Button>
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  size="sm"
                  className="text-xs md:text-sm"
                >
                  All Visitors
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Visitors List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base md:text-lg">Visitors ({visitors?.length || 0})</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  {filter === 'today' && 'Visitors checked in today'}
                  {filter === 'week' && 'Visitors checked in this week'}
                  {filter === 'all' && 'All visitors'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            {isLoadingVisitors && !visitors ? (
              <div className="space-y-3 md:space-y-4">
                {/* Skeleton loaders for better UX */}
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-200 flex-shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 md:h-5 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-3 md:h-4 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 md:h-4 bg-gray-200 rounded w-1/4"></div>
                        </div>
                        <div className="h-5 md:h-6 bg-gray-200 rounded w-16 md:w-20"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !visitors || visitors.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-muted-foreground">
                <User className="mx-auto h-10 w-10 md:h-12 md:w-12 mb-3 md:mb-4 opacity-50" />
                <p className="text-sm md:text-base">No visitors found for the selected period.</p>
                {filter === 'all' && (
                  <p className="text-xs md:text-sm mt-2">There are no visitors in the system yet.</p>
                )}
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {visitors.map((visitor) => (
                  <Card
                    key={visitor.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openVisitorDetails(visitor.id)}
                  >
                    <CardContent className="p-3 md:p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
                        {visitor.photoUrl ? (
                          <Image
                            src={visitor.photoUrl}
                            alt={visitor.fullName}
                            width={64}
                            height={64}
                            className="rounded-full object-cover w-12 h-12 md:w-16 md:h-16 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <User className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base md:text-lg truncate">{visitor.fullName}</h3>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{visitor.company}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">
                            Visiting: {visitor.whomToSee}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 md:mt-1">
                            Checked in: {formatDate(visitor.checkInTime)}
                          </p>
                          {/* Response Status */}
                          {visitor.hostResponseStatus && visitor.hostResponseStatus !== 'pending' && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-2">
                                {visitor.hostResponseStatus === 'accepted' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    ✓ Accepted
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    ✗ Declined
                                  </span>
                                )}
                                {visitor.hostResponseTime && (
                                  <span className="text-xs text-gray-500">
                                    {formatDate(visitor.hostResponseTime)}
                                  </span>
                                )}
                              </div>
                              {visitor.hostResponseNote && (
                                <p className="text-xs text-gray-600 italic truncate">
                                  "{visitor.hostResponseNote}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="self-start sm:self-auto flex flex-col gap-2">
                          {visitor.checkOutTime ? (
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs md:text-sm whitespace-nowrap">
                              Checked Out
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs md:text-sm whitespace-nowrap">
                              Checked In
                            </span>
                          )}
                          {visitor.hostResponseStatus === 'pending' && !visitor.checkOutTime && (
                            <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs md:text-sm whitespace-nowrap">
                              Awaiting Response
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visitor Details Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            // Reset selected visitor when dialog closes
            setSelectedVisitor(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Visitor Details</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">Complete information about the visitor</DialogDescription>
          </DialogHeader>
          {!visitorDetails && isLoadingDetails ? (
            <div className="py-6 md:py-8 text-center">
              <p className="text-sm md:text-base text-muted-foreground">Loading visitor details...</p>
            </div>
          ) : visitorDetails ? (
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 md:gap-4">
                {visitorDetails.photoUrl ? (
                  <Image
                    src={visitorDetails.photoUrl}
                    alt={visitorDetails.fullName}
                    width={128}
                    height={128}
                    className="rounded-full object-cover w-20 h-20 md:w-32 md:h-32"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-10 w-10 md:h-16 md:w-16 text-gray-400" />
                  </div>
                )}
                <div className="text-center sm:text-left">
                  <h3 className="text-xl md:text-2xl font-bold">{visitorDetails.fullName}</h3>
                  <p className="text-base md:text-lg text-muted-foreground">{visitorDetails.company}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm md:text-base break-words">{visitorDetails.email}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm md:text-base">{visitorDetails.phone}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Visiting</p>
                  <p className="text-sm md:text-base">{visitorDetails.whomToSee}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Check-In Time</p>
                  <p className="text-sm md:text-base">{formatDate(visitorDetails.checkInTime)}</p>
                </div>
                {visitorDetails.checkOutTime && (
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Check-Out Time</p>
                    <p className="text-sm md:text-base">{formatDate(visitorDetails.checkOutTime)}</p>
                  </div>
                )}
                {/* Response Status */}
                {visitorDetails.hostResponseStatus && visitorDetails.hostResponseStatus !== 'pending' && (
                  <>
                    <div>
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">Response Status</p>
                      <div className="mt-1">
                        {visitorDetails.hostResponseStatus === 'accepted' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-green-100 text-green-800">
                            ✓ Accepted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-red-100 text-red-800">
                            ✗ Declined
                          </span>
                        )}
                      </div>
                    </div>
                    {visitorDetails.hostResponseTime && (
                      <div>
                        <p className="text-xs md:text-sm font-medium text-muted-foreground">Response Time</p>
                        <p className="text-sm md:text-base">{formatDate(visitorDetails.hostResponseTime)}</p>
                      </div>
                    )}
                    {visitorDetails.hostResponseNote && (
                      <div className="sm:col-span-2">
                        <p className="text-xs md:text-sm font-medium text-muted-foreground">Response Message</p>
                        <p className="text-sm md:text-base text-gray-700 italic mt-1 p-2 bg-gray-50 rounded">
                          "{visitorDetails.hostResponseNote}"
                        </p>
                      </div>
                    )}
                  </>
                )}
                {visitorDetails.hostResponseStatus === 'pending' && !visitorDetails.checkOutTime && (
                  <div className="sm:col-span-2">
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Status</p>
                    <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-800 mt-1">
                      ⏳ Awaiting Response from {visitorDetails.whomToSee}
                    </span>
                  </div>
                )}
              </div>

              {!visitorDetails.checkOutTime && (
                <Button
                  onClick={() => checkoutMutation.mutate({ id: visitorDetails.id })}
                  disabled={checkoutMutation.isPending}
                  className="w-full"
                  size="sm"
                >
                  {checkoutMutation.isPending ? 'Checking Out...' : 'Check Out Visitor'}
                </Button>
              )}
            </div>
          ) : (
            <div className="py-6 md:py-8 text-center">
              <p className="text-sm md:text-base text-muted-foreground">No visitor details available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

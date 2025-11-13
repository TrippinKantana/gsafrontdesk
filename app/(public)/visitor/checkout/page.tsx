'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowLeft, Search, LogOut } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { CheckoutConfirmDialog } from '@/components/checkout-confirm-dialog';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<{
    type: 'single' | 'bulk';
    visitorId?: string;
    visitorName?: string;
    companyName?: string;
    visitorCount?: number;
  } | null>(null);
  const { toast } = useToast();

  // Search for visitors
  const { data: searchResults = [], refetch: refetchSearch } = trpc.visitor.search.useQuery(
    { query: searchQuery },
    {
      enabled: false, // Don't auto-search, wait for button click
    }
  );

  // Checkout mutation
  const checkoutMutation = trpc.visitor.checkoutPublic.useMutation({
    onSuccess: () => {
      toast({
        title: 'Check-out successful!',
        description: 'Thank you for visiting. Have a great day!',
      });
      // Refetch search results to update the list
      if (searchQuery) {
        refetchSearch();
      }
      setConfirmDialogOpen(false);
      setPendingCheckout(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check out. Please try again.',
        variant: 'destructive',
      });
      setConfirmDialogOpen(false);
      setPendingCheckout(null);
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Please enter a search term',
        description: 'Enter a name or company to search for visitors.',
        variant: 'destructive',
      });
      return;
    }
    setHasSearched(true);
    setIsSearching(true);
    try {
      await refetchSearch();
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckout = (visitorId: string, visitorName: string) => {
    setPendingCheckout({
      type: 'single',
      visitorId,
      visitorName,
    });
    setConfirmDialogOpen(true);
  };

  const handleCheckoutAll = (companyName: string) => {
    const companyVisitors = searchResults.filter((v) => 
      v.company.toLowerCase() === companyName.toLowerCase()
    );
    
    setPendingCheckout({
      type: 'bulk',
      companyName,
      visitorCount: companyVisitors.length,
    });
    setConfirmDialogOpen(true);
  };

  const handleConfirmCheckout = () => {
    if (!pendingCheckout) return;

    if (pendingCheckout.type === 'single' && pendingCheckout.visitorId) {
      checkoutMutation.mutate({ id: pendingCheckout.visitorId });
    } else if (pendingCheckout.type === 'bulk' && pendingCheckout.companyName) {
      const companyVisitors = searchResults.filter((v) => 
        v.company.toLowerCase() === pendingCheckout.companyName!.toLowerCase()
      );
      
      // Check out all visitors from the company
      Promise.all(
        companyVisitors.map((visitor) =>
          checkoutMutation.mutateAsync({ id: visitor.id })
        )
      ).then(() => {
        toast({
          title: 'All checked out!',
          description: `Successfully checked out ${companyVisitors.length} visitor(s) from ${pendingCheckout.companyName}.`,
        });
        refetchSearch();
        setConfirmDialogOpen(false);
        setPendingCheckout(null);
      }).catch((error) => {
        toast({
          title: 'Error',
          description: 'Some checkouts failed. Please try again.',
          variant: 'destructive',
        });
        setConfirmDialogOpen(false);
        setPendingCheckout(null);
      });
    }
  };

  // Group results by company
  const groupedByCompany = searchResults.reduce((acc, visitor) => {
    const company = visitor.company;
    if (!acc[company]) {
      acc[company] = [];
    }
    acc[company].push(visitor);
    return acc;
  }, {} as Record<string, typeof searchResults>);

  const companies = Object.keys(groupedByCompany);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 safe-area-inset">
      <Card className="w-full max-w-3xl shadow-lg border-0">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-center gap-3">
            <Link href="/visitor">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <CardTitle className="text-2xl font-semibold text-center text-gray-900">Visitor Check-Out</CardTitle>
              <CardDescription className="text-center text-gray-600">
                Search for your name or company to check out
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Section */}
          <div className="space-y-3">
            <Label htmlFor="search" className="text-sm font-medium text-gray-700">
              Search by Name or Company
            </Label>
            <div className="flex gap-2">
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder="Enter your name or company name..."
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="h-11 px-6 bg-blue-600 hover:bg-blue-700"
              >
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Tip: Search by company name to see all visitors from that company
            </p>
          </div>

          {/* Results Section */}
          {hasSearched && (
            <div className="space-y-4">
              {isSearching ? (
                <div className="text-center py-8 text-gray-500">
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-2">No checked-in visitors found</p>
                  <p className="text-sm text-gray-500">
                    No visitors match your search. Please check your spelling or try a different search term.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Show companies first, then individual results */}
                  {companies.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Companies</h3>
                      {companies.map((company) => {
                        const companyVisitors = groupedByCompany[company];
                        const allCheckedOut = companyVisitors.every((v) => 
                          v.checkOutTime !== null && v.checkOutTime !== undefined
                        );
                        
                        return (
                          <Card key={company} className="border-2">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-lg">{company}</CardTitle>
                                  <CardDescription>
                                    {companyVisitors.length} visitor{companyVisitors.length !== 1 ? 's' : ''} checked in
                                  </CardDescription>
                                </div>
                                {!allCheckedOut && (
                                  <Button
                                    onClick={() => handleCheckoutAll(company)}
                                    variant="outline"
                                    size="sm"
                                    disabled={checkoutMutation.isPending}
                                  >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Check Out All
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {companyVisitors.map((visitor) => {
                                const isCheckedOut = visitor.checkOutTime !== null && visitor.checkOutTime !== undefined;
                                return (
                                  <div
                                    key={visitor.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${
                                      isCheckedOut 
                                        ? 'bg-gray-50 border-gray-200 opacity-60' 
                                        : 'bg-white border-gray-200'
                                    }`}
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">{visitor.fullName}</p>
                                      <div className="flex gap-4 text-sm text-gray-600 mt-1">
                                        <span>Visiting: {visitor.whomToSee}</span>
                                        <span>Checked in: {formatDate(visitor.checkInTime)}</span>
                                      </div>
                                    </div>
                                    {isCheckedOut ? (
                                      <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span className="text-sm font-medium">Checked Out</span>
                                      </div>
                                    ) : (
                                      <Button
                                        onClick={() => handleCheckout(visitor.id, visitor.fullName)}
                                        variant="outline"
                                        size="sm"
                                        disabled={checkoutMutation.isPending}
                                      >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Check Out
                                      </Button>
                                    )}
                                  </div>
                                );
                              })}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


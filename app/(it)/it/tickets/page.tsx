'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, Clock, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function ITTicketsPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Open' | 'In Progress' | 'Resolved' | 'Closed'>(
    (searchParams.get('status') as any) || 'all'
  );
  const [filterPriority, setFilterPriority] = useState<'all' | 'Low' | 'Medium' | 'High' | 'Critical'>(
    (searchParams.get('priority') as any) || 'all'
  );
  const [assignedToMe, setAssignedToMe] = useState(searchParams.get('assignedToMe') === 'true');

  // Fetch all tickets
  const { data: allTickets = [], isLoading, refetch } = trpc.ticket.getAll.useQuery(
    {
      status: filterStatus !== 'all' ? filterStatus : undefined,
      priority: filterPriority !== 'all' ? filterPriority : undefined,
      assignedToMe,
    },
    { refetchInterval: 15000 }
  );

  // Client-side search
  const tickets = allTickets.filter((ticket) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ticket.ticketNumber.toLowerCase().includes(query) ||
      ticket.title.toLowerCase().includes(query) ||
      ticket.createdBy.fullName.toLowerCase().includes(query) ||
      (ticket.assignedTo && ticket.assignedTo.fullName.toLowerCase().includes(query))
    );
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-600 mt-1">Manage and respond to support requests</p>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Showing {tickets.length} of {allTickets.length} ticket{allTickets.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ticket number, title, or requester..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggles */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'Open', 'In Progress', 'Resolved', 'Closed'].map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(status as any)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'Low', 'Medium', 'High', 'Critical'].map((priority) => (
                  <Button
                    key={priority}
                    variant={filterPriority === priority ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterPriority(priority as any)}
                  >
                    {priority}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="assignedToMe"
                checked={assignedToMe}
                onChange={(e) => setAssignedToMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="assignedToMe" className="text-sm font-medium text-gray-700">
                Show only my tickets
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Clock className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading tickets...</p>
            </CardContent>
          </Card>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">
                {searchQuery ? 'No tickets match your search' : 'No tickets found'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery ? (
                  <>
                    Try a different search term or{' '}
                    <button onClick={() => setSearchQuery('')} className="text-blue-600 underline">
                      clear search
                    </button>
                  </>
                ) : (
                  'Tickets will appear here when users submit support requests'
                )}
              </p>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Link key={ticket.id} href={`/it/tickets/${ticket.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <Ticket className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg text-gray-900">{ticket.title}</h3>
                            <span className="text-sm text-gray-600">#{ticket.ticketNumber}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600 font-medium">Requester:</span>
                          <p className="text-gray-900">{ticket.createdBy.fullName}</p>
                          <p className="text-xs text-gray-500">{ticket.createdBy.department || 'No department'}</p>
                        </div>

                        <div>
                          <span className="text-gray-600 font-medium">Assigned To:</span>
                          <p className="text-gray-900">
                            {ticket.assignedTo ? ticket.assignedTo.fullName : 'Unassigned'}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-600 font-medium">Created:</span>
                          <p className="text-gray-900">{format(new Date(ticket.createdAt), 'MMM dd, h:mm a')}</p>
                        </div>

                        <div>
                          <span className="text-gray-600 font-medium">Messages:</span>
                          <p className="text-gray-900">{ticket._count.messages} replies</p>
                        </div>
                      </div>

                      {/* Category */}
                      {ticket.category && (
                        <div className="flex items-center gap-2">
                          <Filter className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{ticket.category}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}


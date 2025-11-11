'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Users, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function ReceptionistMeetingsPage() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Get today's date for default filter
  const today = new Date().toISOString().split('T')[0];

  // Fetch all meetings - REMOVED date filter by default to show all meetings
  const { data: allMeetings = [], isLoading, refetch } = trpc.meeting.getAll.useQuery(
    {
      status: filterStatus,
      startDate: selectedDate || undefined, // Only apply if user selects a date
    },
    { refetchInterval: 15000 } // Refresh every 15 seconds
  );

  // Client-side search filtering by employee name, meeting title, or location
  const meetings = allMeetings.filter((meeting) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      meeting.host.fullName.toLowerCase().includes(query) ||
      meeting.title.toLowerCase().includes(query) ||
      (meeting.location && meeting.location.toLowerCase().includes(query))
    );
  });

  console.log('Meetings page - Total meetings:', allMeetings.length);
  console.log('Filtered meetings:', meetings.length);
  console.log('Filter status:', filterStatus);
  console.log('Selected date:', selectedDate);
  console.log('Search query:', searchQuery);

  // Fetch today's meetings for quick view
  const { data: todaysMeetings = [] } = trpc.meeting.getTodaysMeetings.useQuery(
    undefined,
    { refetchInterval: 15000 }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'in-progress':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Meeting Schedule</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            View all scheduled meetings and visitor appointments
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side (2/3 width on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <Card>
          <CardHeader>
            <CardTitle>All Meetings</CardTitle>
            <CardDescription>
              Showing {meetings.length} of {allMeetings.length} meeting{allMeetings.length !== 1 ? 's' : ''}
              {selectedDate && ` for ${format(new Date(selectedDate), 'MMM dd, yyyy')}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee name, meeting title, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Date</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {selectedDate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate('')}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedDate ? 'Showing meetings on selected date' : 'Showing all meetings'}
                </p>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Status</label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'scheduled', 'in-progress', 'completed', 'cancelled'].map((status) => (
                    <Button
                      key={status}
                      variant={filterStatus === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus(status as any)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meetings List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading meetings...</p>
              </CardContent>
            </Card>
          ) : meetings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">
                  {searchQuery ? 'No meetings match your search' : 'No meetings found'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {searchQuery ? (
                    <>
                      Try a different search term or{' '}
                      <button onClick={() => setSearchQuery('')} className="text-blue-600 underline">
                        clear search
                      </button>
                    </>
                  ) : selectedDate ? (
                    'Try selecting a different date'
                  ) : (
                    'Employees will schedule meetings from their dashboard'
                  )}
                </p>
              </CardContent>
            </Card>
          ) : (
            meetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1 space-y-3 w-full">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <Calendar className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg break-words">{meeting.title}</h3>
                            {meeting.description && (
                              <p className="text-sm text-gray-600 mt-1 break-words">{meeting.description}</p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border flex-shrink-0 ${getStatusColor(
                            meeting.status
                          )}`}
                        >
                          {getStatusIcon(meeting.status)}
                          <span className="hidden sm:inline">{meeting.status.replace('-', ' ')}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600 font-medium">Host:</span>
                          <p className="text-gray-900">
                            {meeting.host.fullName}
                            {meeting.host.department && ` (${meeting.host.department})`}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-600 font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Time:
                          </span>
                          <p className="text-gray-900">
                            {format(new Date(meeting.startTime), 'MMM dd, h:mm a')} -{' '}
                            {format(new Date(meeting.endTime), 'h:mm a')}
                          </p>
                        </div>

                        {meeting.location && (
                          <div>
                            <span className="text-gray-600 font-medium flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Location:
                            </span>
                            <p className="text-gray-900">{meeting.location}</p>
                          </div>
                        )}

                        <div>
                          <span className="text-gray-600 font-medium flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Expected Visitors:
                          </span>
                          <p className="text-gray-900">{meeting.expectedVisitors.join(', ') || 'None specified'}</p>
                        </div>
                      </div>

                      {meeting.visitor && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                          <p className="font-medium text-green-800 mb-1">
                            ✅ Visitor Checked In
                          </p>
                          <div className="text-green-700 space-y-1">
                            <p><span className="font-medium">Name:</span> {meeting.visitor.fullName}</p>
                            <p><span className="font-medium">Company:</span> {meeting.visitor.company}</p>
                            <p><span className="font-medium">Check-in:</span> {format(new Date(meeting.visitor.checkInTime), 'h:mm a')}</p>
                            {meeting.visitor.checkOutTime && (
                              <p><span className="font-medium">Check-out:</span> {format(new Date(meeting.visitor.checkOutTime), 'h:mm a')}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {meeting.notes && (
                        <div className="bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-700">
                          <span className="font-medium">Notes:</span> {meeting.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

          </div>

          {/* Right Sidebar - Today's Meetings (1/3 width on large screens) */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-blue-900 text-lg">Today's Meetings</CardTitle>
                  </div>
                  <CardDescription className="text-blue-700 text-xs">
                    {format(new Date(), 'EEEE, MMM d')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {todaysMeetings.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                      <p className="text-sm text-blue-800">No meetings today</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                      {todaysMeetings.map((meeting) => (
                        <div
                          key={meeting.id}
                          className="bg-white border border-blue-200 rounded-lg p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm text-gray-900 flex-1">{meeting.title}</h3>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${getStatusColor(
                                meeting.status
                              )}`}
                            >
                              {getStatusIcon(meeting.status)}
                            </span>
                          </div>

                          <div className="text-xs text-gray-600 space-y-1">
                            <p className="font-medium">
                              {meeting.host.fullName}
                            </p>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(meeting.startTime), 'h:mm a')} - {format(new Date(meeting.endTime), 'h:mm a')}
                            </div>
                            {meeting.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {meeting.location}
                              </div>
                            )}
                          </div>

                          {meeting.visitor && (
                            <div className="bg-green-50 border border-green-200 rounded p-2 text-xs">
                              <p className="font-medium text-green-800">
                                ✅ {meeting.visitor.fullName} checked in
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
  );
}


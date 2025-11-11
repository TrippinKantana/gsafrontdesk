'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, Users, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { CalendarConnection } from '@/components/calendar/calendar-connection';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function EmployeeMeetingsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled'>('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    expectedVisitors: '',
    notes: '',
  });

  // Fetch meetings
  const { data: meetings = [], refetch, isLoading } = trpc.meeting.getMyMeetings.useQuery(
    { status: filterStatus },
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  // Mutations
  const createMeeting = trpc.meeting.create.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Meeting created successfully!' });
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMeeting = trpc.meeting.update.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Meeting updated successfully!' });
      setIsEditDialogOpen(false);
      setSelectedMeeting(null);
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMeeting = trpc.meeting.delete.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Meeting deleted successfully!' });
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      expectedVisitors: '',
      notes: '',
    });
  };

  const handleCreate = () => {
    const visitors = formData.expectedVisitors
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v);

    createMeeting.mutate({
      ...formData,
      expectedVisitors: visitors,
    });
  };

  const handleEdit = (meeting: any) => {
    setSelectedMeeting(meeting);
    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      startTime: format(new Date(meeting.startTime), "yyyy-MM-dd'T'HH:mm"),
      endTime: format(new Date(meeting.endTime), "yyyy-MM-dd'T'HH:mm"),
      location: meeting.location || '',
      expectedVisitors: meeting.expectedVisitors.join(', '),
      notes: meeting.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedMeeting) return;

    const visitors = formData.expectedVisitors
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v);

    updateMeeting.mutate({
      id: selectedMeeting.id,
      ...formData,
      expectedVisitors: visitors,
    });
  };

  const handleDelete = (meetingId: string) => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      deleteMeeting.mutate({ id: meetingId });
    }
  };

  const handleStatusChange = (meetingId: string, status: string) => {
    updateMeeting.mutate({ id: meetingId, status: status as any });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Meetings</h1>
          <p className="text-sm text-gray-600">Schedule and manage your meetings</p>
        </div>
        {/* Actions & Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Meetings</CardTitle>
                <CardDescription>View and manage your upcoming meetings</CardDescription>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Meeting
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
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
                <p className="text-gray-600 font-medium">No meetings found</p>
                <p className="text-sm text-gray-500 mt-1">Click "Create Meeting" to schedule one</p>
              </CardContent>
            </Card>
          ) : (
            meetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-blue-600 mt-1" />
                        <div>
                          <h3 className="font-semibold text-lg">{meeting.title}</h3>
                          {meeting.description && (
                            <p className="text-sm text-gray-600 mt-1">{meeting.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>
                            {format(new Date(meeting.startTime), 'MMM dd, yyyy h:mm a')} -{' '}
                            {format(new Date(meeting.endTime), 'h:mm a')}
                          </span>
                        </div>

                        {meeting.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span>{meeting.location}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{meeting.expectedVisitors.length} expected visitor(s)</span>
                        </div>

                        <div>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                              meeting.status
                            )}`}
                          >
                            {meeting.status.replace('-', ' ')}
                          </span>
                        </div>
                      </div>

                      {meeting.visitor && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                          <p className="font-medium text-green-800">
                            ✅ Visitor checked in: {meeting.visitor.fullName} from {meeting.visitor.company}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(meeting)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {meeting.status === 'scheduled' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(meeting.id, 'in-progress')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(meeting.id, 'cancelled')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(meeting.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Calendar Connection */}
        <CalendarConnection />
      </div>

      {/* Create Meeting Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Meeting</DialogTitle>
            <DialogDescription>Schedule a meeting with visitors or colleagues</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-title">Meeting Title *</Label>
              <Input
                id="create-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Client Presentation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Meeting agenda or details..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-start">Start Time *</Label>
                <Input
                  id="create-start"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-end">End Time *</Label>
                <Input
                  id="create-end"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-location">Location</Label>
              <Input
                id="create-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Conference Room A, Building 2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-visitors">Expected Visitors</Label>
              <Input
                id="create-visitors"
                value={formData.expectedVisitors}
                onChange={(e) => setFormData({ ...formData, expectedVisitors: e.target.value })}
                placeholder="Comma-separated names or emails"
              />
              <p className="text-xs text-gray-500">e.g., John Doe, jane@example.com</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-notes">Notes</Label>
              <Textarea
                id="create-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMeeting.isPending} className="flex-1">
                {createMeeting.isPending ? 'Creating...' : 'Create Meeting'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Meeting Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meeting</DialogTitle>
            <DialogDescription>Update meeting details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Meeting Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start">Start Time *</Label>
                <Input
                  id="edit-start"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-end">End Time *</Label>
                <Input
                  id="edit-end"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-visitors">Expected Visitors</Label>
              <Input
                id="edit-visitors"
                value={formData.expectedVisitors}
                onChange={(e) => setFormData({ ...formData, expectedVisitors: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateMeeting.isPending} className="flex-1">
                {updateMeeting.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


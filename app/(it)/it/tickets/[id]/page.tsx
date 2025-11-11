'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Clock, ArrowLeft, Send, CheckCircle, XCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState<{
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | '';
    priority: 'Low' | 'Medium' | 'High' | 'Critical' | '';
    resolutionNotes: string;
  }>({
    status: '',
    priority: '',
    resolutionNotes: '',
  });

  // Fetch ticket details
  const { data: ticket, isLoading, refetch } = trpc.ticket.getById.useQuery(
    { id: params.id },
    { refetchInterval: 10000 }
  );

  // Add message mutation
  const addMessage = trpc.ticket.addMessage.useMutation({
    onSuccess: () => {
      setMessage('');
      setIsInternal(false);
      refetch();
      toast({ title: 'Message sent', description: 'Your message has been added to the ticket.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update ticket mutation
  const updateTicket = trpc.ticket.update.useMutation({
    onSuccess: () => {
      refetch();
      setIsUpdateDialogOpen(false);
      toast({ title: 'Ticket updated', description: 'The ticket has been updated successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    addMessage.mutate({
      ticketId: params.id,
      message: message.trim(),
      isInternal,
    });
  };

  const handleUpdateTicket = () => {
    updateTicket.mutate({
      id: params.id,
      status: (updateForm.status || undefined) as 'Open' | 'In Progress' | 'Resolved' | 'Closed' | undefined,
      priority: (updateForm.priority || undefined) as 'Low' | 'Medium' | 'High' | 'Critical' | undefined,
      resolutionNotes: updateForm.resolutionNotes || undefined,
    });
  };

  const openUpdateDialog = () => {
    if (ticket) {
      setUpdateForm({
        status: ticket.status as 'Open' | 'In Progress' | 'Resolved' | 'Closed' | '',
        priority: ticket.priority as 'Low' | 'Medium' | 'High' | 'Critical' | '',
        resolutionNotes: ticket.resolutionNotes || '',
      });
    }
    setIsUpdateDialogOpen(true);
  };

  if (isLoading || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Clock className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

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
      <div className="flex items-center gap-4">
        <Link href="/it/tickets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600">#{ticket.ticketNumber}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <CardTitle className="text-2xl">{ticket.title}</CardTitle>
                  <CardDescription className="mt-2">{ticket.description}</CardDescription>
                </div>
                <Button onClick={openUpdateDialog} variant="outline" size="sm">
                  Update Status
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Messages Thread */}
          <Card>
            <CardHeader>
              <CardTitle>Discussion ({ticket.messages.length})</CardTitle>
              <CardDescription>Communication thread for this ticket</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {ticket.messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No messages yet. Be the first to respond!</p>
                  </div>
                ) : (
                  ticket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg ${
                        msg.isInternal
                          ? 'bg-yellow-50 border border-yellow-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-gray-900">{msg.sender.fullName}</span>
                          <span className="text-xs text-gray-500">{msg.sender.role}</span>
                          {msg.isInternal && (
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                              Internal Note
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(msg.createdAt), 'MMM dd, h:mm a')}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="border-t pt-4">
                <Label htmlFor="message">Add Response</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                  className="mt-2"
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="internal"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="internal" className="text-sm text-gray-700">
                      Internal note (only visible to IT staff)
                    </label>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || addMessage.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {addMessage.isPending ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-gray-600 font-medium">Requester</p>
                <p className="text-gray-900">{ticket.createdBy.fullName}</p>
                <p className="text-xs text-gray-500">{ticket.createdBy.email}</p>
                <p className="text-xs text-gray-500">{ticket.createdBy.department || 'No department'}</p>
              </div>

              <div>
                <p className="text-gray-600 font-medium">Assigned To</p>
                <p className="text-gray-900">{ticket.assignedTo ? ticket.assignedTo.fullName : 'Unassigned'}</p>
              </div>

              {ticket.category && (
                <div>
                  <p className="text-gray-600 font-medium">Category</p>
                  <p className="text-gray-900">{ticket.category}</p>
                </div>
              )}

              <div>
                <p className="text-gray-600 font-medium">Created</p>
                <p className="text-gray-900">{format(new Date(ticket.createdAt), 'MMM dd, yyyy h:mm a')}</p>
              </div>

              {ticket.resolvedAt && (
                <div>
                  <p className="text-gray-600 font-medium">Resolved</p>
                  <p className="text-gray-900">{format(new Date(ticket.resolvedAt), 'MMM dd, yyyy h:mm a')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolution Notes */}
          {ticket.resolutionNotes && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg text-green-900">Resolution Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-800 whitespace-pre-wrap">{ticket.resolutionNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Ticket</DialogTitle>
            <DialogDescription>Update the ticket status, priority, or add resolution notes</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={updateForm.status}
                onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value as 'Open' | 'In Progress' | 'Resolved' | 'Closed' | '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={updateForm.priority}
                onChange={(e) => setUpdateForm({ ...updateForm, priority: e.target.value as 'Low' | 'Medium' | 'High' | 'Critical' | '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {(updateForm.status === 'Resolved' || updateForm.status === 'Closed') && (
              <div className="space-y-2">
                <Label htmlFor="resolutionNotes">Resolution Notes</Label>
                <Textarea
                  id="resolutionNotes"
                  value={updateForm.resolutionNotes}
                  onChange={(e) => setUpdateForm({ ...updateForm, resolutionNotes: e.target.value })}
                  placeholder="Describe how the issue was resolved..."
                  rows={4}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleUpdateTicket} disabled={updateTicket.isPending} className="flex-1">
                {updateTicket.isPending ? 'Updating...' : 'Update Ticket'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


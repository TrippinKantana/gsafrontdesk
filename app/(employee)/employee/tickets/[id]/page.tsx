'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, ArrowLeft, Send, User } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function EmployeeTicketDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [message, setMessage] = useState('');

  // Fetch ticket details
  const { data: ticket, isLoading, refetch } = trpc.ticket.getById.useQuery(
    { id: params.id },
    { refetchInterval: 10000 }
  );

  // Add message mutation
  const addMessage = trpc.ticket.addMessage.useMutation({
    onSuccess: () => {
      setMessage('');
      refetch();
      toast({ title: 'Message sent', description: 'Your message has been sent to the IT team.' });
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
      isInternal: false,
    });
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

  const canReply = ticket.status !== 'Closed';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/employee/tickets">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Tickets
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
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
                    <CardDescription className="mt-2 text-base">{ticket.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Messages Thread */}
            <Card>
              <CardHeader>
                <CardTitle>Discussion ({ticket.messages.length})</CardTitle>
                <CardDescription>
                  {canReply
                    ? 'Communicate with the IT team about this issue'
                    : 'This ticket has been closed'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Messages */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {ticket.messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No messages yet. The IT team will respond soon!</p>
                    </div>
                  ) : (
                    ticket.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-4 rounded-lg bg-gray-50 border border-gray-200"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-600" />
                            <span className="font-medium text-gray-900">{msg.sender.fullName}</span>
                            <span className="text-xs text-gray-500">{msg.sender.role}</span>
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
                {canReply ? (
                  <div className="border-t pt-4">
                    <Label htmlFor="message">Add Reply</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message to the IT team..."
                      rows={4}
                      className="mt-2"
                    />
                    <div className="flex items-center justify-end mt-3">
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
                ) : (
                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600">
                      This ticket is closed. If you need further assistance, please create a new ticket.
                    </p>
                  </div>
                )}
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
                  <p className="text-gray-600 font-medium">Assigned To</p>
                  <p className="text-gray-900">
                    {ticket.assignedTo ? ticket.assignedTo.fullName : 'Waiting for assignment'}
                  </p>
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
                  <CardTitle className="text-lg text-green-900">Resolution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-800 whitespace-pre-wrap">{ticket.resolutionNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



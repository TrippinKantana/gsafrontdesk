'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Ticket } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CreateTicketDialogProps {
  trigger?: React.ReactNode;
}

export function CreateTicketDialog({ trigger }: CreateTicketDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    category: '' as 'Hardware' | 'Software' | 'Network' | 'Access' | 'Other' | '',
  });

  const createTicket = trpc.ticket.create.useMutation({
    onSuccess: (ticket) => {
      toast({
        title: 'Ticket Created',
        description: `Ticket #${ticket.ticketNumber} has been submitted to IT support.`,
      });
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'Medium',
      category: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTicket.mutate({
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      category: formData.category || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Ticket className="h-4 w-4 mr-2" />
            Submit IT Ticket
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit IT Support Ticket</DialogTitle>
          <DialogDescription>
            Describe your issue and our IT team will assist you as soon as possible.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the issue..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide as much detail as possible about the issue..."
              rows={5}
              required
              minLength={10}
            />
            <p className="text-xs text-gray-500">Minimum 10 characters</p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category (optional)</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Network">Network</option>
              <option value="Access">Access/Permissions</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="Low">Low - Can wait a few days</option>
              <option value="Medium">Medium - Needed within 1-2 days</option>
              <option value="High">High - Needed today</option>
              <option value="Critical">Critical - System down / urgent</option>
            </select>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="font-medium text-blue-900 mb-2">📧 What happens next?</p>
            <ul className="text-blue-800 space-y-1 list-disc list-inside">
              <li>Your ticket will be sent to our IT support team</li>
              <li>You'll receive a confirmation email with your ticket number</li>
              <li>IT staff will review and respond as soon as possible</li>
              <li>You can track your ticket status in your dashboard</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTicket.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {createTicket.isPending ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


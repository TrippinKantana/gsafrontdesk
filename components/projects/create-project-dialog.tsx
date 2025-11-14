'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/ui/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId?: string;
  initialData?: {
    title?: string;
    description?: string;
    priority?: string;
    assignedToId?: string;
  };
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  ticketId,
  initialData,
}: CreateProjectDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>(
    (initialData?.priority as any) || 'Medium'
  );
  const [assignedToId, setAssignedToId] = useState<string | null>(
    initialData?.assignedToId || null
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  // Reset form when dialog opens/closes
  // Note: initialData is intentionally not in dependencies to avoid unnecessary resets
  // when parent re-renders with a new object reference
  useEffect(() => {
    if (open) {
      // Dialog opened - populate form with initialData if provided, otherwise reset
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setPriority((initialData.priority as any) || 'Medium');
        setAssignedToId(initialData.assignedToId || null);
        setDueDate(undefined);
      } else {
        setTitle('');
        setDescription('');
        setPriority('Medium');
        setAssignedToId(null);
        setDueDate(undefined);
      }
    } else {
      // Dialog closed - reset form to defaults
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setAssignedToId(null);
      setDueDate(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { data: itStaff = [] } = trpc.staff.getAll.useQuery(undefined, {
    select: (staff) => staff.filter((s) => s.role === 'IT Staff' || s.role === 'Admin'),
  });

  const utils = trpc.useUtils();

  const createProject = trpc.project.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Project created',
        description: 'The project has been created successfully.',
      });
      onOpenChange(false);
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setAssignedToId(null);
      setDueDate(undefined);
      // Invalidate queries to refresh data
      utils.project.getAll.invalidate();
      if (ticketId) {
        utils.ticket.getById.invalidate({ id: ticketId });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create project.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and description are required.',
        variant: 'destructive',
      });
      return;
    }

    createProject.mutate({
      title: title.trim(),
      description: description.trim(),
      priority,
      assignedToId: assignedToId || null,
      dueDate: dueDate,
      ticketId: ticketId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{ticketId ? 'Convert Ticket to Project' : 'Create New Project'}</DialogTitle>
          <DialogDescription>
            {ticketId
              ? 'Convert this ticket into a project to track it on the project board.'
              : 'Create a new project to track IT work and tasks.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign To</Label>
              <Select
                value={assignedToId || 'unassigned'}
                onValueChange={(value) => setAssignedToId(value === 'unassigned' ? null : value)}
              >
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Select IT staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {itStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.fullName} {staff.email ? `(${staff.email})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="dueDate"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dueDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? 'Creating...' : ticketId ? 'Convert to Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


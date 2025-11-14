'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Clock, User, UserPlus, Ticket, Calendar, Edit, Trash2 } from 'lucide-react';
import { TaskKanbanBoard } from '@/components/projects/task-kanban-board';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    assignedToId: string | null;
    dueDate: Date | null;
  }>({
    title: '',
    description: '',
    priority: 'Medium',
    assignedToId: null,
    dueDate: null,
  });

  // Fetch project details
  const { data: project, isLoading, refetch } = trpc.project.getById.useQuery(
    { id: params.id },
    { refetchInterval: 10000 }
  );

  // Fetch IT staff for assignment
  const { data: itStaff = [] } = trpc.staff.getAll.useQuery(undefined, {
    select: (staff) => staff.filter((s) => s.role === 'IT Staff' || s.role === 'Admin'),
  });

  // Update project mutation
  const updateProject = trpc.project.update.useMutation({
    onSuccess: () => {
      refetch();
      setIsEditDialogOpen(false);
      toast({ title: 'Project updated', description: 'The project has been updated successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update status mutation
  const updateStatus = trpc.project.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast({ title: 'Status updated', description: 'Project status has been updated.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete project mutation
  const deleteProject = trpc.project.delete.useMutation({
    onSuccess: () => {
      toast({ title: 'Project deleted', description: 'The project has been deleted.' });
      router.push('/it/projects');
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleAssignProject = (staffId: string | null) => {
    updateProject.mutate({
      id: params.id,
      assignedToId: staffId,
    });
  };

  const handleUpdateStatus = (status: 'To Do' | 'In Progress' | 'Waiting for Review' | 'Done') => {
    updateStatus.mutate({
      id: params.id,
      status,
    });
  };

  const openEditDialog = () => {
    if (project) {
      setEditForm({
        title: project.title,
        description: project.description,
        priority: project.priority as 'Low' | 'Medium' | 'High' | 'Critical',
        assignedToId: project.assignedToId || null,
        dueDate: project.dueDate ? new Date(project.dueDate) : null,
      });
    }
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    updateProject.mutate({
      id: params.id,
      title: editForm.title,
      description: editForm.description,
      priority: editForm.priority,
      assignedToId: editForm.assignedToId,
      dueDate: editForm.dueDate || undefined,
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      deleteProject.mutate({ id: params.id });
    }
  };

  if (isLoading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Clock className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading project...</p>
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
      case 'To Do':
        return 'bg-gray-100 text-gray-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Waiting for Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/it/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <CardTitle className="text-2xl">{project.title}</CardTitle>
                  <CardDescription className="mt-2">{project.description}</CardDescription>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={openEditDialog} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button onClick={handleDelete} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Tasks Kanban Board */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Manage project tasks with the Kanban board</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskKanbanBoard projectId={params.id} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-gray-600 font-medium">Status</p>
                <Select
                  value={project.status}
                  onValueChange={(value: any) => handleUpdateStatus(value)}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Do">To Do</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Waiting for Review">Waiting for Review</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-gray-600 font-medium">Creator</p>
                <p className="text-gray-900">{project.createdBy.fullName}</p>
                <p className="text-xs text-gray-500">{project.createdBy.email}</p>
              </div>

              <div>
                <p className="text-gray-600 font-medium mb-2">Assigned To</p>
                <Select
                  value={project.assignedToId || 'unassigned'}
                  onValueChange={(value) => handleAssignProject(value === 'unassigned' ? null : value)}
                  disabled={updateProject.isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select IT staff">
                      {project.assignedTo ? project.assignedTo.fullName : 'Unassigned'}
                    </SelectValue>
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

              {project.ticket && (
                <div>
                  <p className="text-gray-600 font-medium">Linked Ticket</p>
                  <Link href={`/it/tickets/${project.ticket.id}`}>
                    <div className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-1">
                      <Ticket className="h-4 w-4" />
                      <span className="font-medium">#{project.ticket.ticketNumber}</span>
                    </div>
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">{project.ticket.title}</p>
                </div>
              )}

              {project.dueDate && (
                <div>
                  <p className="text-gray-600 font-medium">Due Date</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <p className="text-gray-900">{format(new Date(project.dueDate), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-gray-600 font-medium">Created</p>
                <p className="text-gray-900">{format(new Date(project.createdAt), 'MMM dd, yyyy h:mm a')}</p>
              </div>

              {project.completedAt && (
                <div>
                  <p className="text-gray-600 font-medium">Completed</p>
                  <p className="text-gray-900">{format(new Date(project.completedAt), 'MMM dd, yyyy h:mm a')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={editForm.priority}
                  onValueChange={(value: any) => setEditForm({ ...editForm, priority: value })}
                >
                  <SelectTrigger id="edit-priority">
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
                <Label htmlFor="edit-assignedTo">Assign To</Label>
                <Select
                  value={editForm.assignedToId || 'unassigned'}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, assignedToId: value === 'unassigned' ? null : value })
                  }
                >
                  <SelectTrigger id="edit-assignedTo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {itStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleEditSubmit} disabled={updateProject.isPending} className="flex-1">
                {updateProject.isPending ? 'Updating...' : 'Update Project'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


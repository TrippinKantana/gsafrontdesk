'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Task {
  id: string;
  title: string;
  description: string | null;
  columnId: string;
  assignedTo?: { id: string; fullName: string; email: string | null } | null;
  dueDate: Date | string | null;
  order: number;
  column: { id: string; name: string; color: string };
}

interface Column {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface TaskKanbanBoardProps {
  projectId: string;
}

function TaskCard({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-semibold">{task.title}</CardTitle>
            <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </div>
        </CardHeader>
        {task.description && (
          <CardContent className="pt-0">
            <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function DroppableColumn({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return <div ref={setNodeRef}>{children}</div>;
}

export function TaskKanbanBoard({ projectId }: TaskKanbanBoardProps) {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#3b82f6');
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

  const { data, isLoading, refetch } = trpc.project.getProjectBoard.useQuery(
    { projectId },
    {
      refetchInterval: 30000,
    }
  );

  const createColumn = trpc.project.createColumn.useMutation({
    onSuccess: () => {
      toast({ title: 'Column created', description: 'New column added successfully.' });
      setIsAddColumnDialogOpen(false);
      setNewColumnName('');
      setNewColumnColor('#3b82f6');
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateColumn = trpc.project.updateColumn.useMutation({
    onSuccess: () => {
      toast({ title: 'Column updated', description: 'Column updated successfully.' });
      setEditingColumn(null);
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteColumn = trpc.project.deleteColumn.useMutation({
    onSuccess: () => {
      toast({ title: 'Column deleted', description: 'Column removed successfully.' });
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const moveTask = trpc.project.moveTask.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      refetch();
    },
  });

  const columns = data?.columns || [];
  const tasks = data?.tasks || [];

  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    columns.forEach((col) => {
      grouped[col.id] = tasks.filter((task) => task.columnId === col.id);
    });
    return grouped;
  }, [columns, tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const columnId = over.id as string;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.columnId === columnId) return;

    moveTask.mutate({
      taskId,
      columnId,
    });
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Column name is required.',
        variant: 'destructive',
      });
      return;
    }

    createColumn.mutate({
      projectId,
      name: newColumnName.trim(),
      color: newColumnColor,
    });
  };

  const handleEditColumn = (column: Column) => {
    setEditingColumn(column);
  };

  const handleSaveColumn = () => {
    if (!editingColumn) return;
    if (!editingColumn.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Column name is required.',
        variant: 'destructive',
      });
      return;
    }

    updateColumn.mutate({
      id: editingColumn.id,
      name: editingColumn.name.trim(),
      color: editingColumn.color,
    });
  };

  const handleDeleteColumn = (columnId: string) => {
    if (confirm('Are you sure you want to delete this column? All tasks in this column will need to be moved first.')) {
      deleteColumn.mutate({ id: columnId });
    }
  };

  const handleAddTask = (columnId: string) => {
    setSelectedColumnId(columnId);
    setIsAddTaskDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const columnTasks = tasksByColumn[column.id] || [];
            const taskIds = columnTasks.map((t) => t.id);

            return (
              <DroppableColumn key={column.id} id={column.id}>
                <Card className="flex-1 min-w-[280px] max-w-[350px] h-full flex flex-col">
                  <CardHeader
                    className="pb-3 border-b"
                    style={{ borderBottomColor: column.color + '40' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: column.color }}
                        />
                        <CardTitle className="text-base font-semibold">{column.name}</CardTitle>
                        <span className="text-sm text-gray-500">({columnTasks.length})</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleEditColumn(column)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteColumn(column.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-4">
                    <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                      {columnTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                    </SortableContext>
                    <Button
                      variant="outline"
                      className="w-full mt-4 text-gray-500 hover:text-blue-600 hover:border-blue-300"
                      onClick={() => handleAddTask(column.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Task
                    </Button>
                  </CardContent>
                </Card>
              </DroppableColumn>
            );
          })}

          {/* Add Column Button */}
          <Card className="min-w-[200px] flex items-center justify-center border-dashed">
            <Button
              variant="ghost"
              className="w-full h-full min-h-[200px]"
              onClick={() => setIsAddColumnDialogOpen(true)}
            >
              <Plus className="h-6 w-6 mr-2" />
              Add Column
            </Button>
          </Card>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="opacity-90">
              <Card className="w-[280px]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">{activeTask.title}</CardTitle>
                </CardHeader>
              </Card>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add Column Dialog */}
      <Dialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Column</DialogTitle>
            <DialogDescription>Create a new column for your Kanban board</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="column-name">Column Name</Label>
              <Input
                id="column-name"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="e.g., In Review"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="column-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="column-color"
                  type="color"
                  value={newColumnColor}
                  onChange={(e) => setNewColumnColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={newColumnColor}
                  onChange={(e) => setNewColumnColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddColumnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddColumn} disabled={createColumn.isPending}>
              {createColumn.isPending ? 'Creating...' : 'Create Column'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog */}
      {editingColumn && (
        <Dialog open={!!editingColumn} onOpenChange={() => setEditingColumn(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Column</DialogTitle>
              <DialogDescription>Update column name and color</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-column-name">Column Name</Label>
                <Input
                  id="edit-column-name"
                  value={editingColumn.name}
                  onChange={(e) =>
                    setEditingColumn({ ...editingColumn, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-column-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-column-color"
                    type="color"
                    value={editingColumn.color}
                    onChange={(e) =>
                      setEditingColumn({ ...editingColumn, color: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={editingColumn.color}
                    onChange={(e) =>
                      setEditingColumn({ ...editingColumn, color: e.target.value })
                    }
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingColumn(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveColumn} disabled={updateColumn.isPending}>
                {updateColumn.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>Create a new task for this project</DialogDescription>
          </DialogHeader>
          <CreateTaskForm
            projectId={projectId}
            columnId={selectedColumnId!}
            onSuccess={() => {
              setIsAddTaskDialogOpen(false);
              setSelectedColumnId(null);
              refetch();
            }}
            onCancel={() => {
              setIsAddTaskDialogOpen(false);
              setSelectedColumnId(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateTaskForm({
  projectId,
  columnId,
  onSuccess,
  onCancel,
}: {
  projectId: string;
  columnId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | undefined>();

  const { data: itStaff = [] } = trpc.staff.getAll.useQuery(undefined, {
    select: (staff) => staff.filter((s) => s.role === 'IT Staff' || s.role === 'Admin'),
  });

  const createTask = trpc.project.createTask.useMutation({
    onSuccess: () => {
      toast({ title: 'Task created', description: 'Task added successfully.' });
      setTitle('');
      setDescription('');
      setAssignedToId(null);
      setDueDate(undefined);
      onSuccess();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Task title is required.',
        variant: 'destructive',
      });
      return;
    }

    createTask.mutate({
      projectId,
      columnId,
      title: title.trim(),
      description: description || undefined,
      assignedToId: assignedToId || undefined,
      dueDate: dueDate || undefined,
    });
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-description">Description (optional)</Label>
        <Textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Task description"
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-assignee">Assign To (optional)</Label>
        <select
          id="task-assignee"
          value={assignedToId || ''}
          onChange={(e) => setAssignedToId(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Unassigned</option>
          {itStaff.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.fullName}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={createTask.isPending}>
          {createTask.isPending ? 'Creating...' : 'Create Task'}
        </Button>
      </div>
    </div>
  );
}


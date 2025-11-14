'use client';

import { useState } from 'react';
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
} from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectCard } from './project-card';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

type ProjectStatus = 'To Do' | 'In Progress' | 'Waiting for Review' | 'Done';

interface Project {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: ProjectStatus;
  assignedTo?: {
    id: string;
    fullName: string;
    email?: string;
  } | null;
  dueDate?: Date | string | null;
  ticket?: {
    id: string;
    ticketNumber: string;
    title: string;
  } | null;
  _count?: {
    tasks: number;
  };
}

interface KanbanBoardProps {
  assignedToMe?: boolean;
  onProjectClick?: (projectId: string) => void;
}

const columns: { id: ProjectStatus; title: string }[] = [
  { id: 'To Do', title: 'To Do' },
  { id: 'In Progress', title: 'In Progress' },
  { id: 'Waiting for Review', title: 'Waiting for Review' },
  { id: 'Done', title: 'Done' },
];

// Droppable column component
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return <div ref={setNodeRef}>{children}</div>;
}

export function KanbanBoard({ assignedToMe = false, onProjectClick }: KanbanBoardProps) {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: boardData, isLoading, refetch } = trpc.project.getBoardData.useQuery(
    { assignedToMe },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const updateStatus = trpc.project.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast({
        title: 'Project updated',
        description: 'Project status has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update project status.',
        variant: 'destructive',
      });
      // Refetch to restore original state
      refetch();
    },
  });

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

    const projectId = active.id as string;
    const newStatus = over.id as ProjectStatus;

    // Find the project to get current status
    const allProjects = [
      ...(boardData?.['To Do'] || []),
      ...(boardData?.['In Progress'] || []),
      ...(boardData?.['Waiting for Review'] || []),
      ...(boardData?.['Done'] || []),
    ];
    const project = allProjects.find((p) => p.id === projectId);

    if (!project) return;

    // Only update if status actually changed
    if (project.status !== newStatus) {
      updateStatus.mutate({
        id: projectId,
        status: newStatus,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const activeProject = activeId
    ? [
        ...(boardData?.['To Do'] || []),
        ...(boardData?.['In Progress'] || []),
        ...(boardData?.['Waiting for Review'] || []),
        ...(boardData?.['Done'] || []),
      ].find((p) => p.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const projects = boardData?.[column.id] || [];
          const projectIds = projects.map((p) => p.id);

          return (
            <DroppableColumn key={column.id} id={column.id}>
              <div className="flex flex-col">
                <Card className="flex-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700">
                      {column.title}
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        ({projects.length})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto">
                    <SortableContext items={projectIds} strategy={verticalListSortingStrategy}>
                      {projects.map((project) => (
                        <ProjectCard
                          key={project.id}
                          id={project.id}
                          title={project.title}
                          description={project.description}
                          priority={project.priority}
                          assignedTo={project.assignedTo}
                          dueDate={project.dueDate}
                          ticket={project.ticket}
                          taskCount={project._count?.tasks}
                          onClick={() => onProjectClick?.(project.id)}
                        />
                      ))}
                    </SortableContext>
                    {projects.length === 0 && (
                      <div className="text-center text-sm text-gray-400 py-8">
                        No projects in this column
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeProject ? (
          <div className="opacity-90">
            <ProjectCard
              id={activeProject.id}
              title={activeProject.title}
              description={activeProject.description}
              priority={activeProject.priority}
              assignedTo={activeProject.assignedTo}
              dueDate={activeProject.dueDate}
              ticket={activeProject.ticket}
              taskCount={activeProject._count?.tasks}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}


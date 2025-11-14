'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Calendar, User, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  priority: string;
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
  taskCount?: number;
  onClick?: () => void;
}

export function ProjectCard({
  id,
  title,
  description,
  priority,
  assignedTo,
  dueDate,
  ticket,
  taskCount,
  onClick,
}: ProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-1"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">{title}</h3>
              <Badge className={`text-xs border ${getPriorityColor(priority)}`}>{priority}</Badge>
            </div>

            <p className="text-xs text-gray-600 line-clamp-2 mb-3">{description}</p>

            <div className="flex flex-col gap-2 text-xs text-gray-500">
              {assignedTo && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span className="truncate">{assignedTo.fullName}</span>
                </div>
              )}

              {dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(dueDate), 'MMM dd, yyyy')}</span>
                </div>
              )}

              {ticket && (
                <div className="flex items-center gap-1 text-blue-600">
                  <Ticket className="h-3 w-3" />
                  <span className="truncate">#{ticket.ticketNumber}</span>
                </div>
              )}

              {taskCount !== undefined && taskCount > 0 && (
                <div className="text-xs text-gray-500">
                  {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


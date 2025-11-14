'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { User, Calendar, Ticket, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface ProjectListCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    dueDate?: Date | string | null;
    assignedTo?: { fullName: string } | null;
    ticket?: { ticketNumber: string } | null;
    _count?: { tasks: number };
  };
}

export function ProjectListCard({ project }: ProjectListCardProps) {
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
      case 'Done':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Waiting for Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'To Do':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Link href={`/it/projects/${project.id}`} className="block">
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {project.description || 'No description'}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              <Badge variant="outline" className={`text-xs ${getPriorityColor(project.priority)}`}>
                {project.priority}
              </Badge>
              <Badge variant="outline" className={`text-xs ${getStatusColor(project.status)}`}>
                {project.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 text-sm text-gray-600">
            {project.assignedTo && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>{project.assignedTo.fullName}</span>
              </div>
            )}
            {project.ticket && (
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-gray-500" />
                <span>From Ticket #{project.ticket.ticketNumber}</span>
              </div>
            )}
            {project._count?.tasks !== undefined && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gray-500" />
                <span>{project._count.tasks} task{project._count.tasks !== 1 ? 's' : ''}</span>
              </div>
            )}
            {project.dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Due {format(new Date(project.dueDate), 'MMM dd, yyyy')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}


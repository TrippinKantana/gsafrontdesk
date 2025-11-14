'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KanbanBoard } from '@/components/projects/kanban-board';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Filter, Search } from 'lucide-react';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ProjectsPage() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleProjectClick = (projectId: string) => {
    router.push(`/it/projects/${projectId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage IT projects and track progress</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select
          value={assignedToMe ? 'me' : 'all'}
          onValueChange={(value) => setAssignedToMe(value === 'me')}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by assignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="me">Assigned to Me</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <KanbanBoard assignedToMe={assignedToMe} onProjectClick={handleProjectClick} />

      {/* Create Project Dialog */}
      <CreateProjectDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  );
}


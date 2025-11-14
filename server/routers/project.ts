import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const projectRouter = createTRPCRouter({
  // Create a new project (standalone or from ticket)
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().min(10, 'Description must be at least 10 characters'),
        priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
        assignedToId: z.string().nullable().optional(),
        dueDate: z.date().optional(),
        ticketId: z.string().optional(), // If converting from ticket
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Staff profile not found.',
        });
      }

      // Only IT Staff and Admin can create projects
      if (staff.role !== 'IT Staff' && staff.role !== 'Admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create projects.',
        });
      }

      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization context is required.',
        });
      }

      const organization = await ctx.db.organization.findUnique({
        where: { clerkOrgId: ctx.organizationId },
        select: { id: true },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found in database.',
        });
      }

      // If converting from ticket, verify ticket exists and belongs to organization
      if (input.ticketId) {
        const ticket = await ctx.db.ticket.findUnique({
          where: { id: input.ticketId },
          select: { organizationId: true, projectId: true },
        });

        if (!ticket) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Ticket not found.',
          });
        }

        if (ticket.organizationId !== organization.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Ticket does not belong to your organization.',
          });
        }

        if (ticket.projectId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Ticket has already been converted to a project.',
          });
        }
      }

      // Create project
      const project = await ctx.db.project.create({
        data: {
          title: input.title,
          description: input.description,
          priority: input.priority,
          assignedToId: input.assignedToId || null,
          dueDate: input.dueDate || null,
          ticketId: input.ticketId || null,
          createdById: staff.id,
          status: 'To Do',
          organizationId: organization.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              title: true,
            },
          },
        },
      });

      // Create default columns for the project
      const defaultColumns = [
        { name: 'To Do', color: '#6b7280', order: 0 },
        { name: 'In Progress', color: '#3b82f6', order: 1 },
        { name: 'Done', color: '#10b981', order: 2 },
      ];

      await ctx.db.projectColumn.createMany({
        data: defaultColumns.map((col) => ({
          projectId: project.id,
          name: col.name,
          color: col.color,
          order: col.order,
        })),
      });

      // If created from ticket, update ticket with projectId
      if (input.ticketId) {
        await ctx.db.ticket.update({
          where: { id: input.ticketId },
          data: { projectId: project.id },
        });
      }

      console.log(`[Project] Created project ${project.id} by ${staff.fullName}`);
      return project;
    }),

  // Get all projects with filters
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.enum(['all', 'To Do', 'In Progress', 'Waiting for Review', 'Done']).optional(),
        priority: z.enum(['all', 'Low', 'Medium', 'High', 'Critical']).optional(),
        assignedToMe: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Staff profile not found.',
        });
      }

      // Only IT Staff and Admin can view all projects
      if (staff.role !== 'IT Staff' && staff.role !== 'Admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view projects.',
        });
      }

      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization context is required.',
        });
      }

      const organization = await ctx.db.organization.findUnique({
        where: { clerkOrgId: ctx.organizationId },
        select: { id: true },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found in database.',
        });
      }

      const whereClause: any = {
        organizationId: organization.id,
      };

      if (input.status && input.status !== 'all') {
        whereClause.status = input.status;
      }

      if (input.priority && input.priority !== 'all') {
        whereClause.priority = input.priority;
      }

      if (input.assignedToMe) {
        whereClause.assignedToId = staff.id;
      }

      const projects = await ctx.db.project.findMany({
        where: whereClause,
        orderBy: [
          { status: 'asc' }, // To Do first
          { priority: 'desc' }, // Critical first
          { createdAt: 'desc' },
        ],
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              title: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        take: 200,
      });

      return projects;
    }),

  // Get project by ID with full details
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Staff profile not found.',
        });
      }

      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              title: true,
              description: true,
              status: true,
              priority: true,
            },
          },
          columns: {
            orderBy: {
              order: 'asc',
            },
          },
          tasks: {
            orderBy: [
              { order: 'asc' },
              { createdAt: 'asc' },
            ],
            include: {
              assignedTo: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
              column: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found.',
        });
      }

      // Check organization access
      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization context is required.',
        });
      }

      const organization = await ctx.db.organization.findUnique({
        where: { clerkOrgId: ctx.organizationId },
        select: { id: true },
      });

      if (!organization || project.organizationId !== organization.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this project.',
        });
      }

      return project;
    }),

  // Update project fields
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().min(10).optional(),
        priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
        assignedToId: z.string().nullable().optional(),
        dueDate: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Staff profile not found.',
        });
      }

      const { id, ...updateData } = input;

      // Check if project exists and user has access
      const existingProject = await ctx.db.project.findUnique({
        where: { id },
        include: { createdBy: true, assignedTo: true },
      });

      if (!existingProject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found.',
        });
      }

      // Check organization access
      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization context is required.',
        });
      }

      const organization = await ctx.db.organization.findUnique({
        where: { clerkOrgId: ctx.organizationId },
        select: { id: true },
      });

      if (!organization || existingProject.organizationId !== organization.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this project.',
        });
      }

      // Check permissions: creator, assigned staff, or Admin/IT Staff
      const canEdit =
        existingProject.createdById === staff.id ||
        existingProject.assignedToId === staff.id ||
        staff.role === 'Admin' ||
        staff.role === 'IT Staff';

      if (!canEdit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to edit this project.',
        });
      }

      const project = await ctx.db.project.update({
        where: { id },
        data: updateData,
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              title: true,
            },
          },
        },
      });

      console.log(`[Project] Updated project ${project.id}`);
      return project;
    }),

  // Update project status (for drag-and-drop)
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['To Do', 'In Progress', 'Waiting for Review', 'Done']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Staff profile not found.',
        });
      }

      const existingProject = await ctx.db.project.findUnique({
        where: { id: input.id },
      });

      if (!existingProject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found.',
        });
      }

      // Check organization access
      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization context is required.',
        });
      }

      const organization = await ctx.db.organization.findUnique({
        where: { clerkOrgId: ctx.organizationId },
        select: { id: true },
      });

      if (!organization || existingProject.organizationId !== organization.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this project.',
        });
      }

      // Only IT Staff and Admin can update status
      if (staff.role !== 'IT Staff' && staff.role !== 'Admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update project status.',
        });
      }

      const updateData: any = {
        status: input.status,
      };

      // If status is Done, set completedAt
      if (input.status === 'Done' && existingProject.status !== 'Done') {
        updateData.completedAt = new Date();
      } else if (input.status !== 'Done' && existingProject.status === 'Done') {
        // If moving away from Done, clear completedAt
        updateData.completedAt = null;
      }

      const project = await ctx.db.project.update({
        where: { id: input.id },
        data: updateData,
        include: {
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      console.log(`[Project] Updated status of project ${project.id} to ${input.status}`);
      return project;
    }),

  // Assign project to IT staff
  assign: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        assignedToId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Staff profile not found.',
        });
      }

      // Only IT Staff and Admin can assign projects
      if (staff.role !== 'IT Staff' && staff.role !== 'Admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to assign projects.',
        });
      }

      const project = await ctx.db.project.update({
        where: { id: input.id },
        data: { assignedToId: input.assignedToId },
        include: {
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      console.log(`[Project] Assigned project ${project.id} to ${project.assignedTo?.fullName || 'unassigned'}`);
      return project;
    }),

  // Convert ticket to project
  convertTicketToProject: protectedProcedure
    .input(
      z.object({
        ticketId: z.string(),
        title: z.string().min(1).optional(), // Optional override
        description: z.string().min(10).optional(), // Optional override
        priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(), // Optional override
        assignedToId: z.string().nullable().optional(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Staff profile not found.',
        });
      }

      // Only IT Staff and Admin can convert tickets to projects
      if (staff.role !== 'IT Staff' && staff.role !== 'Admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to convert tickets to projects.',
        });
      }

      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization context is required.',
        });
      }

      const organization = await ctx.db.organization.findUnique({
        where: { clerkOrgId: ctx.organizationId },
        select: { id: true },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found in database.',
        });
      }

      // Get ticket
      const ticket = await ctx.db.ticket.findUnique({
        where: { id: input.ticketId },
        include: {
          createdBy: true,
          assignedTo: true,
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found.',
        });
      }

      if (ticket.organizationId !== organization.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Ticket does not belong to your organization.',
        });
      }

      if (ticket.projectId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ticket has already been converted to a project.',
        });
      }

      // Create project from ticket
      const project = await ctx.db.project.create({
        data: {
          title: input.title || ticket.title,
          description: input.description || ticket.description,
          priority: input.priority || ticket.priority,
          assignedToId: input.assignedToId || ticket.assignedToId || null,
          dueDate: input.dueDate || null,
          ticketId: ticket.id,
          createdById: staff.id,
          status: 'To Do',
          organizationId: organization.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              title: true,
            },
          },
        },
      });

      // Update ticket with projectId
      await ctx.db.ticket.update({
        where: { id: ticket.id },
        data: { projectId: project.id },
      });

      console.log(`[Project] Converted ticket ${ticket.ticketNumber} to project ${project.id}`);
      return project;
    }),

  // Delete project
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Staff profile not found.',
        });
      }

      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
        include: { createdBy: true },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found.',
        });
      }

      // Check organization access
      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization context is required.',
        });
      }

      const organization = await ctx.db.organization.findUnique({
        where: { clerkOrgId: ctx.organizationId },
        select: { id: true },
      });

      if (!organization || project.organizationId !== organization.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this project.',
        });
      }

      // Only creator, Admin, or IT Staff can delete
      const canDelete =
        project.createdById === staff.id || staff.role === 'Admin' || staff.role === 'IT Staff';

      if (!canDelete) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this project.',
        });
      }

      // If project was created from ticket, unlink it
      if (project.ticketId) {
        await ctx.db.ticket.update({
          where: { id: project.ticketId },
          data: { projectId: null },
        });
      }

      await ctx.db.project.delete({
        where: { id: input.id },
      });

      console.log(`[Project] Deleted project ${input.id}`);
      return { success: true };
    }),

  // Get project columns and tasks for Kanban board
  getProjectBoard: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff || (staff.role !== 'IT Staff' && staff.role !== 'Admin')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this project.',
        });
      }

      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization context is required.',
        });
      }

      const organization = await ctx.db.organization.findUnique({
        where: { clerkOrgId: ctx.organizationId },
        select: { id: true },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found in database.',
        });
      }

      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId, organizationId: organization.id },
        include: {
          columns: {
            orderBy: { order: 'asc' },
          },
          tasks: {
            orderBy: [
              { order: 'asc' },
              { createdAt: 'asc' },
            ],
            include: {
              assignedTo: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
              column: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found.',
        });
      }

      return {
        columns: project.columns,
        tasks: project.tasks,
      };
    }),

  // Column Management
  createColumn: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().min(1, 'Column name is required'),
        color: z.string().default('#3b82f6'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff || (staff.role !== 'IT Staff' && staff.role !== 'Admin')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to manage columns.',
        });
      }

      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization context is required.',
        });
      }

      const organization = await ctx.db.organization.findUnique({
        where: { clerkOrgId: ctx.organizationId },
        select: { id: true },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found in database.',
        });
      }

      // Verify project belongs to organization
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId, organizationId: organization.id },
        select: { id: true },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found.',
        });
      }

      // Get max order to append at end
      const maxColumn = await ctx.db.projectColumn.findFirst({
        where: { projectId: input.projectId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const column = await ctx.db.projectColumn.create({
        data: {
          projectId: input.projectId,
          name: input.name,
          color: input.color,
          order: (maxColumn?.order ?? -1) + 1,
        },
      });

      return column;
    }),

  updateColumn: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        color: z.string().optional(),
        order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff || (staff.role !== 'IT Staff' && staff.role !== 'Admin')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update columns.',
        });
      }

      const { id, ...updateData } = input;

      const column = await ctx.db.projectColumn.update({
        where: { id },
        data: updateData,
      });

      return column;
    }),

  deleteColumn: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff || (staff.role !== 'IT Staff' && staff.role !== 'Admin')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete columns.',
        });
      }

      // Check if column has tasks - if so, we need to handle them
      const taskCount = await ctx.db.projectTask.count({
        where: { columnId: input.id },
      });

      if (taskCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot delete column with ${taskCount} task(s). Please move or delete tasks first.`,
        });
      }

      await ctx.db.projectColumn.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Task Management
  createTask: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        columnId: z.string(),
        title: z.string().min(1, 'Task title is required'),
        description: z.string().optional(),
        assignedToId: z.string().nullable().optional(),
        dueDate: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff || (staff.role !== 'IT Staff' && staff.role !== 'Admin')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create tasks.',
        });
      }

      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization context is required.',
        });
      }

      const organization = await ctx.db.organization.findUnique({
        where: { clerkOrgId: ctx.organizationId },
        select: { id: true },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found in database.',
        });
      }

      // Verify project belongs to organization
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId, organizationId: organization.id },
        select: { id: true },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found.',
        });
      }

      // Verify column belongs to project
      const column = await ctx.db.projectColumn.findUnique({
        where: { id: input.columnId, projectId: input.projectId },
        select: { id: true },
      });

      if (!column) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Column not found in this project.',
        });
      }

      // Get max order in column
      const maxTask = await ctx.db.projectTask.findFirst({
        where: { columnId: input.columnId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const task = await ctx.db.projectTask.create({
        data: {
          projectId: input.projectId,
          columnId: input.columnId,
          title: input.title,
          description: input.description || null,
          assignedToId: input.assignedToId || null,
          dueDate: input.dueDate || null,
          order: (maxTask?.order ?? -1) + 1,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          column: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      return task;
    }),

  updateTask: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        assignedToId: z.string().nullable().optional(),
        dueDate: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff || (staff.role !== 'IT Staff' && staff.role !== 'Admin')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update tasks.',
        });
      }

      const { id, ...updateData } = input;

      const task = await ctx.db.projectTask.update({
        where: { id },
        data: updateData,
        include: {
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          column: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      return task;
    }),

  moveTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        columnId: z.string(),
        order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff || (staff.role !== 'IT Staff' && staff.role !== 'Admin')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to move tasks.',
        });
      }

      // Get task to verify it exists
      const task = await ctx.db.projectTask.findUnique({
        where: { id: input.taskId },
        select: { id: true, columnId: true, projectId: true },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found.',
        });
      }

      // Verify column belongs to same project
      const column = await ctx.db.projectColumn.findUnique({
        where: { id: input.columnId, projectId: task.projectId },
        select: { id: true },
      });

      if (!column) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Column not found in this project.',
        });
      }

      // If moving to different column, update order
      let newOrder = input.order;
      if (task.columnId !== input.columnId || newOrder === undefined) {
        if (newOrder === undefined) {
          // Append to end of new column
          const maxTask = await ctx.db.projectTask.findFirst({
            where: { columnId: input.columnId },
            orderBy: { order: 'desc' },
            select: { order: true },
          });
          newOrder = (maxTask?.order ?? -1) + 1;
        }
      }

      const updatedTask = await ctx.db.projectTask.update({
        where: { id: input.taskId },
        data: {
          columnId: input.columnId,
          order: newOrder,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          column: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      return updatedTask;
    }),

  deleteTask: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff || (staff.role !== 'IT Staff' && staff.role !== 'Admin')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete tasks.',
        });
      }

      await ctx.db.projectTask.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});


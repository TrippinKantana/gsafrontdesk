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
          tasks: {
            orderBy: {
              createdAt: 'asc',
            },
            include: {
              assignedTo: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
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

  // Get board data (optimized for Kanban board)
  getBoardData: protectedProcedure
    .input(
      z.object({
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

      // Only IT Staff and Admin can view projects
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

      if (input.assignedToMe) {
        whereClause.assignedToId = staff.id;
      }

      // Fetch all projects for the board
      const projects = await ctx.db.project.findMany({
        where: whereClause,
        orderBy: [
          { priority: 'desc' }, // Critical first
          { createdAt: 'desc' },
        ],
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
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
      });

      // Organize by status for board columns
      const boardData = {
        'To Do': projects.filter((p) => p.status === 'To Do'),
        'In Progress': projects.filter((p) => p.status === 'In Progress'),
        'Waiting for Review': projects.filter((p) => p.status === 'Waiting for Review'),
        'Done': projects.filter((p) => p.status === 'Done'),
      };

      return boardData;
    }),
});


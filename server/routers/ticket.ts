import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  sendTicketCreatedEmail,
  sendTicketUpdatedEmail,
  sendTicketMessageEmail,
  sendTicketAssignmentEmail,
} from '@/lib/ticket-notifications';

// Helper function to generate ticket number
function generateTicketNumber(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TKT-${date}-${random}`;
}

export const ticketRouter = createTRPCRouter({
  // Create a new ticket
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().min(10, 'Description must be at least 10 characters'),
        priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
        category: z.enum(['Hardware', 'Software', 'Network', 'Access', 'Other']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      // Find staff member by Clerk user ID
      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Staff profile not found.',
        });
      }

      // ✅ Ensure organization context
      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization context is required to create a ticket.',
        });
      }

      // ✅ Look up organization by Clerk ID to get internal database ID
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

      // Generate unique ticket number
      let ticketNumber = generateTicketNumber();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await ctx.db.ticket.findUnique({
          where: { ticketNumber },
        });
        if (!existing) break;
        ticketNumber = generateTicketNumber();
        attempts++;
      }

      // Create ticket
      const ticket = await ctx.db.ticket.create({
        data: {
          ticketNumber,
          title: input.title,
          description: input.description,
          priority: input.priority,
          category: input.category,
          createdById: staff.id,
          status: 'Open',
          organizationId: organization.id, // ✅ Use internal database ID, not Clerk ID
        },
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
              department: true,
              role: true,
            },
          },
        },
      });

      console.log(`[Ticket] Created ${ticket.ticketNumber} by ${staff.fullName}`);

      // Send email notification to requester (confirmation)
      if (staff.email) {
        await sendTicketCreatedEmail({
          ticketNumber: ticket.ticketNumber,
          ticketTitle: ticket.title,
          description: ticket.description,
          requesterName: staff.fullName,
          requesterEmail: staff.email,
          priority: ticket.priority,
          category: ticket.category || undefined,
          ticketId: ticket.id,
        }).catch((error) => {
          console.error('Failed to send ticket creation email:', error);
        });
      }

      // ✅ Notify all IT staff about new ticket
      if (ctx.organizationId) {
        const itStaff = await ctx.db.staff.findMany({
          where: {
            organizationId: organization.id, // ✅ Use internal database ID, not Clerk ID
            role: 'IT Staff',
            clerkUserId: { not: null },
          },
          select: {
            id: true,
            clerkUserId: true,
            fullName: true,
          },
        });

        // Create notifications for all IT staff
        const notifications = itStaff.map((itMember) => ({
          organizationId: ctx.organizationId!,
          userId: itMember.clerkUserId!,
          staffId: itMember.id,
          type: 'ticket_created',
          title: 'New Support Ticket',
          message: `${staff.fullName} created a new ${ticket.priority} priority ticket: "${ticket.title}"`,
          relatedId: ticket.id,
          relatedType: 'ticket',
          actionUrl: `/it/tickets/${ticket.id}`,
          metadata: {
            ticketNumber: ticket.ticketNumber,
            priority: ticket.priority,
            category: ticket.category,
            requesterName: staff.fullName,
          },
        }));

        if (notifications.length > 0) {
          await ctx.db.notification.createMany({
            data: notifications,
          });
          console.log(`[Notification] Notified ${notifications.length} IT staff of new ticket`);
        }
      }

      return ticket;
    }),

  // Get all tickets (IT Staff & Admin only)
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.enum(['all', 'Open', 'In Progress', 'Resolved', 'Closed']).optional(),
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

      // Only IT Staff and Admin can view all tickets
      if (staff.role !== 'IT Staff' && staff.role !== 'Admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view all tickets.',
        });
      }

      // ✅ Ensure organization context
      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization context is required.',
        });
      }

      // ✅ Look up organization by Clerk ID to get internal database ID
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
        organizationId: organization.id, // ✅ Filter by organization using internal database ID
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

      const tickets = await ctx.db.ticket.findMany({
        where: whereClause,
        orderBy: [
          { status: 'asc' }, // Open first
          { priority: 'desc' }, // Critical first
          { createdAt: 'desc' },
        ],
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
              department: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          _count: {
            select: {
              messages: true,
              attachments: true,
            },
          },
        },
        take: 200,
      });

      return tickets;
    }),

  // Get my tickets (tickets created by current user)
  getMyTickets: protectedProcedure
    .input(
      z.object({
        status: z.enum(['all', 'Open', 'In Progress', 'Resolved', 'Closed']).optional(),
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

      const whereClause: any = {
        createdById: staff.id,
      };

      if (input.status && input.status !== 'all') {
        whereClause.status = input.status;
      }

      const tickets = await ctx.db.ticket.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      });

      return tickets;
    }),

  // Get ticket by ID with full details
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

      const ticket = await ctx.db.ticket.findUnique({
        where: { id: input.id },
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
              department: true,
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
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
            include: {
              sender: {
                select: {
                  id: true,
                  fullName: true,
                  role: true,
                },
              },
            },
          },
          attachments: true,
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found.',
        });
      }

      // Check permissions: creator, assigned IT staff, or Admin/IT Staff can view
      const canView =
        ticket.createdById === staff.id ||
        ticket.assignedToId === staff.id ||
        staff.role === 'Admin' ||
        staff.role === 'IT Staff';

      if (!canView) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this ticket.',
        });
      }

      // Filter internal messages if not IT staff/admin
      if (staff.role !== 'IT Staff' && staff.role !== 'Admin') {
        ticket.messages = ticket.messages.filter((msg) => !msg.isInternal);
      }

      return ticket;
    }),

  // Update ticket (status, priority, assignment)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']).optional(),
        priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
        assignedToId: z.string().nullable().optional(),
        resolutionNotes: z.string().optional(),
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

      // Only IT Staff and Admin can update tickets
      if (staff.role !== 'IT Staff' && staff.role !== 'Admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update tickets.',
        });
      }

      const { id, ...updateData } = input;

      // If status is changing to Resolved, set resolvedAt
      if (updateData.status === 'Resolved') {
        (updateData as any).resolvedAt = new Date();
      }

      // If status is changing to Closed, set closedAt
      if (updateData.status === 'Closed') {
        (updateData as any).closedAt = new Date();
      }

      const ticket = await ctx.db.ticket.update({
        where: { id },
        data: updateData,
        include: {
          createdBy: {
            select: {
              fullName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      });

      console.log(`[Ticket] Updated ${ticket.ticketNumber}: ${JSON.stringify(updateData)}`);

      // Fetch existing ticket for comparison
      const existingTicket = await ctx.db.ticket.findUnique({
        where: { id: input.id },
        include: { createdBy: true },
      });

      // Send email if status changed
      if (existingTicket && input.status && existingTicket.status !== input.status && ticket.createdBy.email) {
        await sendTicketUpdatedEmail({
          ticketNumber: ticket.ticketNumber,
          ticketTitle: ticket.title,
          oldStatus: existingTicket.status,
          newStatus: input.status,
          updatedBy: staff.fullName,
          ticketId: ticket.id,
          requesterEmail: ticket.createdBy.email,
        }).catch((error) => {
          console.error('Failed to send ticket update email:', error);
        });
      }

      // Send email if assigned to someone
      if (existingTicket && input.assignedToId && existingTicket.assignedToId !== input.assignedToId) {
        const assignedTo = await ctx.db.staff.findUnique({
          where: { id: input.assignedToId },
        });
        if (assignedTo && assignedTo.email) {
          await sendTicketAssignmentEmail(
            ticket.ticketNumber,
            ticket.title,
            assignedTo.email,
            ticket.id
          ).catch((error) => {
            console.error('Failed to send ticket assignment email:', error);
          });
        }

        // ✅ Notify assigned IT staff
        if (assignedTo?.clerkUserId && ctx.organizationId) {
          await ctx.db.notification.create({
            data: {
              organizationId: ctx.organizationId,
              userId: assignedTo.clerkUserId,
              staffId: assignedTo.id,
              type: 'ticket_assigned',
              title: 'Ticket Assigned to You',
              message: `You have been assigned to ticket ${ticket.ticketNumber}: "${ticket.title}"`,
              relatedId: ticket.id,
              relatedType: 'ticket',
              actionUrl: `/it/tickets/${ticket.id}`,
              metadata: {
                ticketNumber: ticket.ticketNumber,
                priority: ticket.priority,
                assignedBy: staff.fullName,
              },
            },
          });
          console.log('[Notification] IT staff notified of ticket assignment');
        }
      }

      // ✅ Notify ticket creator of status change
      if (existingTicket && input.status && existingTicket.status !== input.status) {
        const creator = await ctx.db.staff.findUnique({
          where: { id: ticket.createdById },
          select: { clerkUserId: true, fullName: true },
        });

        if (creator?.clerkUserId && ctx.organizationId) {
          await ctx.db.notification.create({
            data: {
              organizationId: ctx.organizationId,
              userId: creator.clerkUserId,
              staffId: ticket.createdById,
              type: 'ticket_status_changed',
              title: 'Ticket Status Updated',
              message: `Your ticket ${ticket.ticketNumber} status changed from "${existingTicket.status}" to "${input.status}"`,
              relatedId: ticket.id,
              relatedType: 'ticket',
              actionUrl: `/employee/tickets/${ticket.id}`,
              metadata: {
                ticketNumber: ticket.ticketNumber,
                oldStatus: existingTicket.status,
                newStatus: input.status,
                updatedBy: staff.fullName,
              },
            },
          });
          console.log('[Notification] Ticket creator notified of status change');
        }
      }

      return ticket;
    }),

  // Add message to ticket
  addMessage: protectedProcedure
    .input(
      z.object({
        ticketId: z.string(),
        message: z.string().min(1, 'Message cannot be empty'),
        isInternal: z.boolean().default(false),
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

      // Get ticket to check permissions
      const ticket = await ctx.db.ticket.findUnique({
        where: { id: input.ticketId },
        include: {
          createdBy: {
            select: {
              email: true,
            },
          },
          assignedTo: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found.',
        });
      }

      // Check permissions
      const canMessage =
        ticket.createdById === staff.id ||
        ticket.assignedToId === staff.id ||
        staff.role === 'Admin' ||
        staff.role === 'IT Staff';

      if (!canMessage) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to message this ticket.',
        });
      }

      // Only IT Staff and Admin can add internal notes
      if (input.isInternal && staff.role !== 'IT Staff' && staff.role !== 'Admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to add internal notes.',
        });
      }

      const message = await ctx.db.ticketMessage.create({
        data: {
          ticketId: input.ticketId,
          senderId: staff.id,
          message: input.message,
          isInternal: input.isInternal,
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              role: true,
            },
          },
        },
      });

      // Update ticket updatedAt
      await ctx.db.ticket.update({
        where: { id: input.ticketId },
        data: { updatedAt: new Date() },
      });

      console.log(`[Ticket] New message on ${ticket.ticketNumber} by ${staff.fullName}`);

      // Send email notification (skip internal notes for requester)
      if (!input.isInternal) {
        const recipientEmails: string[] = [];

        // Notify ticket creator if they didn't send this message
        if (ticket.createdBy.email && ticket.createdById !== staff.id) {
          recipientEmails.push(ticket.createdBy.email);
        }

        // Notify assigned IT staff if they didn't send this message
        if (ticket.assignedTo && ticket.assignedTo.email && ticket.assignedToId !== staff.id) {
          recipientEmails.push(ticket.assignedTo.email);
        }

        if (recipientEmails.length > 0) {
          await sendTicketMessageEmail({
            ticketNumber: ticket.ticketNumber,
            ticketTitle: ticket.title,
            senderName: staff.fullName,
            message: input.message,
            ticketId: ticket.id,
            recipientEmails,
          }).catch((error) => {
            console.error('Failed to send ticket message email:', error);
          });
        }

        // ✅ Create in-app notifications for recipients (skip internal notes)
        if (ctx.organizationId) {
          const notifications = [];

          // Notify ticket creator if they didn't send this message
          if (ticket.createdById !== staff.id) {
            const creator = await ctx.db.staff.findUnique({
              where: { id: ticket.createdById },
              select: { clerkUserId: true },
            });
            if (creator?.clerkUserId) {
              notifications.push({
                organizationId: ctx.organizationId,
                userId: creator.clerkUserId,
                staffId: ticket.createdById,
                type: 'ticket_message',
                title: 'New Message on Ticket',
                message: `${staff.fullName} replied to your ticket ${ticket.ticketNumber}: "${input.message.substring(0, 100)}${input.message.length > 100 ? '...' : ''}"`,
                relatedId: ticket.id,
                relatedType: 'ticket',
                actionUrl: `/employee/tickets/${ticket.id}`,
                metadata: {
                  ticketNumber: ticket.ticketNumber,
                  senderName: staff.fullName,
                },
              });
            }
          }

          // Notify assigned IT staff if they didn't send this message
          if (ticket.assignedToId && ticket.assignedToId !== staff.id) {
            const assignedStaff = await ctx.db.staff.findUnique({
              where: { id: ticket.assignedToId },
              select: { clerkUserId: true },
            });
            if (assignedStaff?.clerkUserId) {
              notifications.push({
                organizationId: ctx.organizationId,
                userId: assignedStaff.clerkUserId,
                staffId: ticket.assignedToId,
                type: 'ticket_message',
                title: 'New Message on Ticket',
                message: `${staff.fullName} added a message to ticket ${ticket.ticketNumber}: "${input.message.substring(0, 100)}${input.message.length > 100 ? '...' : ''}"`,
                relatedId: ticket.id,
                relatedType: 'ticket',
                actionUrl: `/it/tickets/${ticket.id}`,
                metadata: {
                  ticketNumber: ticket.ticketNumber,
                  senderName: staff.fullName,
                },
              });
            }
          }

          if (notifications.length > 0) {
            await ctx.db.notification.createMany({
              data: notifications,
            });
            console.log(`[Notification] Created ${notifications.length} ticket message notifications`);
          }
        }
      }

      return message;
    }),

  // Get ticket metrics (for IT dashboard)
  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }

    // ✅ Look up organization by Clerk ID to get internal database ID
    if (!ctx.organizationId) {
      console.log('[Ticket.getMetrics] No organizationId in context');
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No organization context. Please select an organization.',
      });
    }

    const organization = await ctx.db.organization.findUnique({
      where: { clerkOrgId: ctx.organizationId },
      select: { id: true },
    });

    if (!organization) {
      console.log('[Ticket.getMetrics] Organization not found in database:', ctx.organizationId);
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Organization not found in database. Please sync your organization first.',
      });
    }

    const staff = await ctx.db.staff.findUnique({
      where: { clerkUserId: ctx.userId },
    });

    if (!staff) {
      console.log('[Ticket.getMetrics] Staff not found for userId:', ctx.userId);
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Staff profile not found.',
      });
    }

    // Only IT Staff and Admin can view metrics
    if (staff.role !== 'IT Staff' && staff.role !== 'Admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to view ticket metrics.',
      });
    }

    // ✅ Filter all queries by organizationId
    const orgFilter = { organizationId: organization.id };

    console.log('[Ticket.getMetrics] Fetching metrics for organization:', {
      clerkOrgId: ctx.organizationId,
      internalId: organization.id,
      staffRole: staff.role,
    });

    const [
      totalOpen,
      totalInProgress,
      totalResolved,
      totalClosed,
      criticalOpen,
      highOpen,
      allTickets,
    ] = await Promise.all([
      ctx.db.ticket.count({ where: { ...orgFilter, status: 'Open' } }),
      ctx.db.ticket.count({ where: { ...orgFilter, status: 'In Progress' } }),
      ctx.db.ticket.count({ where: { ...orgFilter, status: 'Resolved' } }),
      ctx.db.ticket.count({ where: { ...orgFilter, status: 'Closed' } }),
      ctx.db.ticket.count({ where: { ...orgFilter, status: 'Open', priority: 'Critical' } }),
      ctx.db.ticket.count({ where: { ...orgFilter, status: 'Open', priority: 'High' } }),
      ctx.db.ticket.findMany({
        where: orgFilter,
        select: {
          createdAt: true,
          resolvedAt: true,
          createdBy: {
            select: {
              department: true,
            },
          },
        },
      }),
    ]);

    // Calculate average response time (for resolved tickets)
    const resolvedTickets = allTickets.filter((t) => t.resolvedAt);
    let avgResponseTime = 0;
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((sum, ticket) => {
        const diff = ticket.resolvedAt!.getTime() - ticket.createdAt.getTime();
        return sum + diff;
      }, 0);
      avgResponseTime = Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60)); // in hours
    }

    // Tickets by department
    const ticketsByDept: Record<string, number> = {};
    allTickets.forEach((ticket) => {
      const dept = ticket.createdBy.department || 'Unknown';
      ticketsByDept[dept] = (ticketsByDept[dept] || 0) + 1;
    });

    return {
      totalOpen,
      totalInProgress,
      totalResolved,
      totalClosed,
      criticalOpen,
      highOpen,
      avgResponseTimeHours: avgResponseTime,
      ticketsByDepartment: ticketsByDept,
    };
  }),
});


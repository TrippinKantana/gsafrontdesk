import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const notificationRouter = createTRPCRouter({
  // Get all notifications for current user
  getAll: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().optional(),
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.userId || !ctx.organizationId) {
        return [];
      }

      const whereClause: any = {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
      };

      if (input.unreadOnly) {
        whereClause.isRead = false;
      }

      return await ctx.db.notification.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        take: input.limit,
        include: {
          staff: {
            select: {
              fullName: true,
            },
          },
        },
      });
    }),

  // Get unread count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId || !ctx.organizationId) {
      return 0;
    }

    return await ctx.db.notification.count({
      where: {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        isRead: false,
      },
    });
  }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId || !ctx.organizationId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      // Verify notification belongs to user
      const notification = await ctx.db.notification.findUnique({
        where: { id: input.id },
      });

      if (!notification || notification.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      return await ctx.db.notification.update({
        where: { id: input.id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }),

  // Mark all as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.userId || !ctx.organizationId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }

    await ctx.db.notification.updateMany({
      where: {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  }),

  // Delete notification
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId || !ctx.organizationId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      // Verify notification belongs to user
      const notification = await ctx.db.notification.findUnique({
        where: { id: input.id },
      });

      if (!notification || notification.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      await ctx.db.notification.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Delete all read notifications
  deleteAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.userId || !ctx.organizationId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }

    await ctx.db.notification.deleteMany({
      where: {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        isRead: true,
      },
    });

    return { success: true };
  }),

  // Create notification (internal use - called by other routers)
  create: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        staffId: z.string().optional(),
        type: z.string(),
        title: z.string(),
        message: z.string(),
        relatedId: z.string().optional(),
        relatedType: z.string().optional(),
        actionUrl: z.string().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No organization context',
        });
      }

      return await ctx.db.notification.create({
        data: {
          ...input,
          organizationId: ctx.organizationId,
        },
      });
    }),
});

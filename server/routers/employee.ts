import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const employeeRouter = createTRPCRouter({
  // Public: Respond to visitor arrival (via email link token)
  respondToVisitor: publicProcedure
    .input(
      z.object({
        token: z.string(),
        action: z.enum(['accept', 'decline']),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Decode token (simplified - in production use JWT)
        const decoded = Buffer.from(input.token, 'base64url').toString();
        const { visitorId, staffId, timestamp } = JSON.parse(decoded);

        // Check token expiration (24 hours)
        const hoursSinceCreation = (Date.now() - timestamp) / (1000 * 60 * 60);
        if (hoursSinceCreation > 24) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This link has expired. Please contact the front desk.',
          });
        }

        // Get visitor
        const visitor = await ctx.db.visitor.findUnique({
          where: { id: visitorId },
        });

        if (!visitor) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Visitor not found.',
          });
        }

        // Check if already responded
        if (visitor.hostResponseStatus && visitor.hostResponseStatus !== 'pending') {
          return {
            success: true,
            alreadyResponded: true,
            previousResponse: visitor.hostResponseStatus,
            message: `You already ${visitor.hostResponseStatus} this meeting.`,
          };
        }

        // Update visitor with response
        const updatedVisitor = await ctx.db.visitor.update({
          where: { id: visitorId },
          data: {
            hostResponseStatus: input.action === 'accept' ? 'accepted' : 'declined',
            hostResponseTime: new Date(),
            hostResponseNote: input.note,
          },
          include: {
            receptionist: {
              select: {
                id: true,
                clerkUserId: true,
                fullName: true,
              },
            },
          },
        });

        // Get staff info for notification
        const staff = await ctx.db.staff.findUnique({
          where: { id: staffId },
          select: {
            fullName: true,
            clerkUserId: true,
          },
        });

        // ✅ Update the visitor_arrival notification to show accepted/declined status (if exists)
        // Find the original visitor_arrival notification for this visitor and staff member
        const visitorNotification = await ctx.db.notification.findFirst({
          where: {
            relatedId: updatedVisitor.id,
            relatedType: 'visitor',
            type: 'visitor_arrival',
            userId: staff?.clerkUserId || '',
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (visitorNotification && staff?.clerkUserId) {
          // Get the Clerk organization ID for the notification
          const staffRecord = await ctx.db.staff.findUnique({
            where: { id: staffId },
            select: { organizationId: true },
          });

          if (staffRecord) {
            const organization = await ctx.db.organization.findUnique({
              where: { id: staffRecord.organizationId },
              select: { clerkOrgId: true },
            });

            if (organization) {
              // Update the notification to show the response status
              await ctx.db.notification.update({
                where: { id: visitorNotification.id },
                data: {
                  title: `Visitor ${input.action === 'accept' ? 'Accepted' : 'Declined'}`,
                  message: `You ${input.action === 'accept' ? 'accepted' : 'declined'} the meeting with ${updatedVisitor.fullName} from ${updatedVisitor.company}${input.note ? `: "${input.note}"` : ''}`,
                  metadata: {
                    ...(visitorNotification.metadata as any || {}),
                    responseStatus: input.action === 'accept' ? 'accepted' : 'declined',
                    responseTime: new Date().toISOString(),
                    responseNote: input.note,
                  },
                },
              });
              console.log(`[Notification] Updated visitor_arrival notification to show ${input.action} status`);
            }
          }
        }

      // ✅ Send notification to ALL admins and receptionists in the organization
      const organization = await ctx.db.organization.findUnique({
        where: { id: updatedVisitor.organizationId },
        select: { clerkOrgId: true },
      });

      if (organization) {
        // Find all admins and receptionists in this organization
        const adminsAndReceptionists = await ctx.db.staff.findMany({
          where: {
            organizationId: updatedVisitor.organizationId,
            role: { in: ['Admin', 'Receptionist'] },
            clerkUserId: { not: null }, // Only those who can login
          },
          select: {
            id: true,
            clerkUserId: true,
            fullName: true,
          },
        });

        // Also get receptionists from the Receptionist table
        const receptionists = await ctx.db.receptionist.findMany({
          where: {
            organizationId: updatedVisitor.organizationId,
          },
          select: {
            id: true,
            clerkUserId: true,
            fullName: true,
          },
        });

        // Combine and deduplicate by clerkUserId
        const allRecipients = [
          ...adminsAndReceptionists,
          ...receptionists,
        ].filter((recipient, index, self) =>
          index === self.findIndex((r) => r.clerkUserId === recipient.clerkUserId)
        );

        // Create notifications for all admins/receptionists
        if (allRecipients.length > 0) {
          const notifications = allRecipients.map((recipient) => ({
            organizationId: organization.clerkOrgId,
            userId: recipient.clerkUserId!,
            staffId: recipient.id,
            type: 'visitor_response',
            title: `Staff ${input.action === 'accept' ? 'Accepted' : 'Declined'} Visitor`,
            message: `${staff?.fullName || 'Staff member'} has ${input.action === 'accept' ? 'accepted' : 'declined'} the meeting with ${updatedVisitor.fullName}${input.note ? `: "${input.note}"` : ''}`,
            relatedId: updatedVisitor.id,
            relatedType: 'visitor',
            actionUrl: '/dashboard',
            metadata: {
              visitorName: updatedVisitor.fullName,
              staffName: staff?.fullName,
              action: input.action,
              note: input.note,
            },
          }));

          await ctx.db.notification.createMany({
            data: notifications,
          });
          console.log(`[Notification] Notified ${allRecipients.length} admin(s)/receptionist(s) of visitor response`);
        }
      } else {
        console.warn('[Notification] Organization not found for admin/receptionist notification');
      }

        return {
          success: true,
          alreadyResponded: false,
          visitor: {
            id: updatedVisitor.id,
            fullName: updatedVisitor.fullName,
            company: updatedVisitor.company,
            checkInTime: updatedVisitor.checkInTime,
          },
          response: input.action,
          message: `You have ${input.action === 'accept' ? 'accepted' : 'declined'} the meeting with ${updatedVisitor.fullName}.`,
        };
      } catch (error) {
        console.error('Error in respondToVisitor:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process response. Please try again.',
        });
      }
    }),

  // Protected: Get pending visitor notifications for logged-in employee
  getPendingVisitors: protectedProcedure.query(async ({ ctx }) => {
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
        message: 'Staff profile not found. Please contact an administrator.',
      });
    }

    // Get pending visitors
    // Filter by staff name AND organizationId for multi-tenancy security
    const pendingVisitors = await ctx.db.visitor.findMany({
      where: {
        whomToSee: staff.fullName,
        organizationId: staff.organizationId, // ✅ Ensure multi-tenancy
        hostResponseStatus: 'pending',
        checkOutTime: null, // Still checked in
      },
      orderBy: {
        checkInTime: 'desc',
      },
      select: {
        id: true,
        fullName: true,
        company: true,
        email: true,
        phone: true,
        reasonForVisit: true,
        checkInTime: true,
      },
    });

    return pendingVisitors;
  }),

  // Protected: Get all visitors (current and past) for logged-in employee
  getAllVisitors: protectedProcedure.query(async ({ ctx }) => {
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
        message: 'Staff profile not found. Please contact an administrator.',
      });
    }

    // Get all visitors for this staff member
    // Filter by staff name AND organizationId for multi-tenancy security
    const allVisitors = await ctx.db.visitor.findMany({
      where: {
        whomToSee: staff.fullName,
        organizationId: staff.organizationId, // ✅ Ensure multi-tenancy
      },
      orderBy: {
        checkInTime: 'desc',
      },
      select: {
        id: true,
        fullName: true,
        company: true,
        email: true,
        phone: true,
        reasonForVisit: true,
        checkInTime: true,
        checkOutTime: true,
        hostResponseStatus: true,
        hostResponseTime: true,
        hostResponseNote: true,
      },
    });

    return allVisitors;
  }),

  // Protected: Respond to visitor from employee dashboard
  respondFromDashboard: protectedProcedure
    .input(
      z.object({
        visitorId: z.string(),
        action: z.enum(['accept', 'decline']),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      // Find staff member
      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
      });

      if (!staff) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Staff profile not found.',
        });
      }

      // Get visitor and verify it's for this staff member
      const visitor = await ctx.db.visitor.findUnique({
        where: { id: input.visitorId },
      });

      if (!visitor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Visitor not found.',
        });
      }

      if (visitor.whomToSee !== staff.fullName) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only respond to visitors who are here to see you.',
        });
      }

      // Update visitor
      const updatedVisitor = await ctx.db.visitor.update({
        where: { id: input.visitorId },
        data: {
          hostResponseStatus: input.action === 'accept' ? 'accepted' : 'declined',
          hostResponseTime: new Date(),
          hostResponseNote: input.note,
        },
        include: {
          receptionist: {
            select: {
              id: true,
              clerkUserId: true,
              fullName: true,
            },
          },
        },
      });

      // ✅ Update the visitor_arrival notification to show accepted/declined status
      // Find the original visitor_arrival notification for this visitor and staff member
      const visitorNotification = await ctx.db.notification.findFirst({
        where: {
          relatedId: updatedVisitor.id,
          relatedType: 'visitor',
          type: 'visitor_arrival',
          userId: staff.clerkUserId || '',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (visitorNotification) {
        // Get the Clerk organization ID for the notification
        const organization = await ctx.db.organization.findUnique({
          where: { id: staff.organizationId },
          select: { clerkOrgId: true },
        });

        if (organization) {
          // Update the notification to show the response status
          await ctx.db.notification.update({
            where: { id: visitorNotification.id },
            data: {
              title: `Visitor ${input.action === 'accept' ? 'Accepted' : 'Declined'}`,
              message: `You ${input.action === 'accept' ? 'accepted' : 'declined'} the meeting with ${updatedVisitor.fullName} from ${updatedVisitor.company}${input.note ? `: "${input.note}"` : ''}`,
              metadata: {
                ...(visitorNotification.metadata as any || {}),
                responseStatus: input.action === 'accept' ? 'accepted' : 'declined',
                responseTime: new Date().toISOString(),
                responseNote: input.note,
              },
            },
          });
          console.log(`[Notification] Updated visitor_arrival notification to show ${input.action} status`);
        }
      }

      // ✅ Send notification to ALL admins and receptionists in the organization
      const organization = await ctx.db.organization.findUnique({
        where: { id: updatedVisitor.organizationId },
        select: { clerkOrgId: true },
      });

      if (organization) {
        // Find all admins and receptionists in this organization
        const adminsAndReceptionists = await ctx.db.staff.findMany({
          where: {
            organizationId: updatedVisitor.organizationId,
            role: { in: ['Admin', 'Receptionist'] },
            clerkUserId: { not: null }, // Only those who can login
          },
          select: {
            id: true,
            clerkUserId: true,
            fullName: true,
          },
        });

        // Also get receptionists from the Receptionist table
        const receptionists = await ctx.db.receptionist.findMany({
          where: {
            organizationId: updatedVisitor.organizationId,
          },
          select: {
            id: true,
            clerkUserId: true,
            fullName: true,
          },
        });

        // Combine and deduplicate by clerkUserId
        const allRecipients = [
          ...adminsAndReceptionists,
          ...receptionists,
        ].filter((recipient, index, self) =>
          index === self.findIndex((r) => r.clerkUserId === recipient.clerkUserId)
        );

        // Create notifications for all admins/receptionists
        if (allRecipients.length > 0) {
          const notifications = allRecipients.map((recipient) => ({
            organizationId: organization.clerkOrgId,
            userId: recipient.clerkUserId!,
            staffId: recipient.id,
            type: 'visitor_response',
            title: `Staff ${input.action === 'accept' ? 'Accepted' : 'Declined'} Visitor`,
            message: `${staff.fullName} has ${input.action === 'accept' ? 'accepted' : 'declined'} the meeting with ${updatedVisitor.fullName}${input.note ? `: "${input.note}"` : ''}`,
            relatedId: updatedVisitor.id,
            relatedType: 'visitor',
            actionUrl: '/dashboard',
            metadata: {
              visitorName: updatedVisitor.fullName,
              staffName: staff.fullName,
              action: input.action,
              note: input.note,
            },
          }));

          await ctx.db.notification.createMany({
            data: notifications,
          });
          console.log(`[Notification] Notified ${allRecipients.length} admin(s)/receptionist(s) of visitor response`);
        }
      } else {
        console.warn('[Notification] Organization not found for admin/receptionist notification');
      }

      return {
        success: true,
        visitor: updatedVisitor,
        message: `Meeting ${input.action === 'accept' ? 'accepted' : 'declined'} successfully.`,
      };
    }),

  // Protected: Get employee profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }

    const staff = await ctx.db.staff.findUnique({
      where: { clerkUserId: ctx.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        department: true,
        title: true,
        role: true, // Added role for routing
        notifyEmail: true,
        notifySMS: true,
        notifyOnVisitorArrival: true,
      },
    });

    if (!staff) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Employee profile not found. Please contact an administrator.',
      });
    }

    return staff;
  }),

  // Protected: Update notification preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        notifyEmail: z.boolean().optional(),
        notifySMS: z.boolean().optional(),
        notifyOnVisitorArrival: z.boolean().optional(),
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

      const updatedStaff = await ctx.db.staff.update({
        where: { id: staff.id },
        data: input,
      });

      return {
        success: true,
        staff: updatedStaff,
        message: 'Notification preferences updated successfully.',
      };
    }),
});


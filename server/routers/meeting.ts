import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { syncMeetingToCalendar, updateMeetingInCalendar, deleteMeetingFromCalendar, getCalendarAuthUrl } from '@/lib/calendar';

export const meetingRouter = createTRPCRouter({
  // Create a new meeting
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
        startTime: z.string(), // ISO date string
        endTime: z.string(), // ISO date string
        location: z.string().optional(),
        expectedVisitors: z.array(z.string()),
        notes: z.string().optional(),
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
          message: 'Organization context is required to create a meeting.',
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

      // Create meeting
      const meeting = await ctx.db.meeting.create({
        data: {
          title: input.title,
          description: input.description,
          startTime: new Date(input.startTime),
          endTime: new Date(input.endTime),
          location: input.location,
          hostId: staff.id,
          organizationId: organization.id, // ✅ Use internal database ID, not Clerk ID
          expectedVisitors: input.expectedVisitors,
          notes: input.notes,
          status: 'scheduled',
        },
        include: {
          host: {
            select: {
              id: true,
              fullName: true,
              email: true,
              department: true,
              clerkUserId: true,
            },
          },
        },
      });

      // ✅ Sync to connected calendars
      const updateData: any = {};
      
      // Sync to Google Calendar if connected
      const googleConnected = (staff as any).googleCalendarConnected ?? false;
      const googleTokenStr = (staff as any).googleCalendarToken;
      
      if (googleConnected && googleTokenStr) {
        try {
          const googleToken = JSON.parse(googleTokenStr);
          const syncResult = await syncMeetingToCalendar('google', googleToken, {
            title: meeting.title,
            description: meeting.description || undefined,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            location: meeting.location || undefined,
            attendees: input.expectedVisitors.filter(v => v.includes('@')), // Only email addresses
          });

          if (syncResult.success && syncResult.eventId) {
            updateData.googleCalendarEventId = syncResult.eventId;
            
            // Update token if refreshed
            if (syncResult.updatedToken) {
              await ctx.db.staff.update({
                where: { id: staff.id },
                data: {
                  googleCalendarToken: JSON.stringify(syncResult.updatedToken),
                },
              });
            }
          } else {
            console.error('[Calendar] Google sync failed:', syncResult.error);
          }
        } catch (error: any) {
          console.error('[Calendar] Error syncing to Google Calendar:', error);
        }
      }

      // Sync to Outlook Calendar if connected
      const outlookConnected = (staff as any).outlookCalendarConnected ?? false;
      const outlookTokenStr = (staff as any).outlookCalendarToken;
      
      if (outlookConnected && outlookTokenStr) {
        try {
          const outlookToken = JSON.parse(outlookTokenStr);
          const syncResult = await syncMeetingToCalendar('outlook', outlookToken, {
            title: meeting.title,
            description: meeting.description || undefined,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            location: meeting.location || undefined,
            attendees: input.expectedVisitors.filter(v => v.includes('@')), // Only email addresses
          });

          if (syncResult.success && syncResult.eventId) {
            updateData.outlookCalendarEventId = syncResult.eventId;
          } else {
            console.error('[Calendar] Outlook sync failed:', syncResult.error);
          }
        } catch (error: any) {
          console.error('[Calendar] Error syncing to Outlook Calendar:', error);
        }
      }

      // Update meeting with calendar event IDs if any were created
      if (updateData.googleCalendarEventId || updateData.outlookCalendarEventId) {
        await ctx.db.meeting.update({
          where: { id: meeting.id },
          data: updateData,
        });
      }

      // ✅ Notify host about meeting creation confirmation
      if (staff.clerkUserId && ctx.organizationId) {
        const startTime = new Date(input.startTime);
        const formattedDate = startTime.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        const formattedTime = startTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        });

        await ctx.db.notification.create({
          data: {
            organizationId: ctx.organizationId,
            userId: staff.clerkUserId,
            staffId: staff.id,
            type: 'meeting_scheduled',
            title: 'Meeting Scheduled',
            message: `Your meeting "${meeting.title}" has been scheduled for ${formattedDate} at ${formattedTime}`,
            relatedId: meeting.id,
            relatedType: 'meeting',
            actionUrl: '/employee/meetings',
            metadata: {
              meetingTitle: meeting.title,
              startTime: input.startTime,
              location: input.location,
              expectedVisitors: input.expectedVisitors,
            },
          },
        });
        console.log('[Notification] Host notified of meeting creation');
      }

      return meeting;
    }),

  // Get all meetings for logged-in employee
  getMyMeetings: protectedProcedure
    .input(
      z.object({
        status: z.enum(['all', 'scheduled', 'in-progress', 'completed', 'cancelled']).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
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
        hostId: staff.id,
      };

      if (input.status && input.status !== 'all') {
        whereClause.status = input.status;
      }

      if (input.startDate) {
        whereClause.startTime = {
          gte: new Date(input.startDate),
        };
      }

      if (input.endDate) {
        whereClause.endTime = {
          lte: new Date(input.endDate),
        };
      }

      const meetings = await ctx.db.meeting.findMany({
        where: whereClause,
        orderBy: {
          startTime: 'asc',
        },
        include: {
          host: {
            select: {
              id: true,
              fullName: true,
              department: true,
            },
          },
          visitor: {
            select: {
              id: true,
              fullName: true,
              company: true,
              checkInTime: true,
              checkOutTime: true,
            },
          },
        },
      });

      return meetings;
    }),

  // Get all meetings (for receptionist dashboard)
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.enum(['all', 'scheduled', 'in-progress', 'completed', 'cancelled']).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      console.log('[Meeting.getAll] Input:', input);
      
      // ✅ Ensure organization context
      if (!ctx.organizationId) {
        return [];
      }

      // ✅ Look up organization by Clerk ID to get internal database ID
      const organization = await ctx.db.organization.findUnique({
        where: { clerkOrgId: ctx.organizationId },
        select: { id: true },
      });

      if (!organization) {
        return [];
      }
      
      const whereClause: any = {
        organizationId: organization.id, // ✅ Use internal database ID, not Clerk ID
      };

      if (input.status && input.status !== 'all') {
        whereClause.status = input.status;
      }

      if (input.startDate) {
        whereClause.startTime = {
          gte: new Date(input.startDate),
        };
      }

      if (input.endDate) {
        whereClause.endTime = {
          lte: new Date(input.endDate),
        };
      }

      console.log('[Meeting.getAll] Where clause:', whereClause);

      const meetings = await ctx.db.meeting.findMany({
        where: whereClause,
        orderBy: {
          startTime: 'asc',
        },
        include: {
          host: {
            select: {
              id: true,
              fullName: true,
              department: true,
              email: true,
            },
          },
          visitor: {
            select: {
              id: true,
              fullName: true,
              company: true,
              checkInTime: true,
              checkOutTime: true,
            },
          },
        },
        take: 200, // Limit for performance
      });

      console.log(`[Meeting.getAll] Found ${meetings.length} meetings`);
      if (meetings.length > 0) {
        console.log('[Meeting.getAll] First meeting:', meetings[0]);
      }

      return meetings;
    }),

  // Get single meeting by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.id },
        include: {
          host: true,
          visitor: true,
        },
      });

      if (!meeting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found.',
        });
      }

      // ✅ Verify meeting belongs to current organization
      if (ctx.organizationId && meeting.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Meeting not found in your organization',
        });
      }

      return meeting;
    }),

  // Update meeting
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        location: z.string().optional(),
        expectedVisitors: z.array(z.string()).optional(),
        status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      // ✅ Verify meeting belongs to organization
      const existingMeeting = await ctx.db.meeting.findUnique({
        where: { id: input.id },
      });

      if (!existingMeeting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found',
        });
      }

      if (ctx.organizationId && existingMeeting.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Meeting not found in your organization',
        });
      }

      const { id, ...updateData } = input;

      // Convert date strings to Date objects if provided
      const data: any = { ...updateData };
      if (data.startTime) {
        data.startTime = new Date(data.startTime);
      }
      if (data.endTime) {
        data.endTime = new Date(data.endTime);
      }

      const meeting = await ctx.db.meeting.update({
        where: { id },
        data,
        include: {
          host: true,
          visitor: true,
        },
      });

      // ✅ Sync calendar updates if meeting has calendar event IDs
      const hostGoogleConnected = (meeting.host as any).googleCalendarConnected ?? false;
      const hostGoogleToken = (meeting.host as any).googleCalendarToken;
      
      if (existingMeeting.googleCalendarEventId && hostGoogleConnected && hostGoogleToken) {
        try {
          const googleToken = JSON.parse(hostGoogleToken);
          await updateMeetingInCalendar('google', googleToken, existingMeeting.googleCalendarEventId, {
            title: meeting.title,
            description: meeting.description || undefined,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            location: meeting.location || undefined,
            attendees: meeting.expectedVisitors.filter((v: string) => v.includes('@')),
          });
        } catch (error: any) {
          console.error('[Calendar] Error updating Google Calendar event:', error);
        }
      }

      const hostOutlookConnected = (meeting.host as any).outlookCalendarConnected ?? false;
      const hostOutlookToken = (meeting.host as any).outlookCalendarToken;
      
      if (existingMeeting.outlookCalendarEventId && hostOutlookConnected && hostOutlookToken) {
        try {
          const outlookToken = JSON.parse(hostOutlookToken);
          await updateMeetingInCalendar('outlook', outlookToken, existingMeeting.outlookCalendarEventId, {
            title: meeting.title,
            description: meeting.description || undefined,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            location: meeting.location || undefined,
            attendees: meeting.expectedVisitors.filter((v: string) => v.includes('@')),
          });
        } catch (error: any) {
          console.error('[Calendar] Error updating Outlook Calendar event:', error);
        }
      }

      // ✅ Notify host if status changed (especially cancelled)
      if (input.status && existingMeeting.status !== input.status && meeting.host.clerkUserId && ctx.organizationId) {
        let notificationMessage = '';
        let notificationTitle = '';
        
        if (input.status === 'cancelled') {
          notificationTitle = 'Meeting Cancelled';
          notificationMessage = `Your meeting "${meeting.title}" has been cancelled`;
        } else if (input.status === 'completed') {
          notificationTitle = 'Meeting Completed';
          notificationMessage = `Your meeting "${meeting.title}" has been marked as completed`;
        } else if (input.status === 'in-progress') {
          notificationTitle = 'Meeting Started';
          notificationMessage = `Your meeting "${meeting.title}" is now in progress`;
        } else {
          notificationTitle = 'Meeting Updated';
          notificationMessage = `Your meeting "${meeting.title}" status changed to ${input.status}`;
        }

        await ctx.db.notification.create({
          data: {
            organizationId: ctx.organizationId,
            userId: meeting.host.clerkUserId,
            staffId: meeting.host.id,
            type: 'meeting_updated',
            title: notificationTitle,
            message: notificationMessage,
            relatedId: meeting.id,
            relatedType: 'meeting',
            actionUrl: '/employee/meetings',
            metadata: {
              meetingTitle: meeting.title,
              oldStatus: existingMeeting.status,
              newStatus: input.status,
            },
          },
        });
        console.log('[Notification] Host notified of meeting update');
      }

      return meeting;
    }),

  // Delete meeting
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      // ✅ Verify meeting belongs to organization
      const existingMeeting = await ctx.db.meeting.findUnique({
        where: { id: input.id },
        include: {
          host: true,
        },
      });

      if (!existingMeeting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found',
        });
      }

      if (ctx.organizationId && existingMeeting.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Meeting not found in your organization',
        });
      }

      // ✅ Delete from connected calendars before deleting meeting
      const deleteHostGoogleConnected = (existingMeeting.host as any).googleCalendarConnected ?? false;
      const deleteHostGoogleToken = (existingMeeting.host as any).googleCalendarToken;
      
      if (existingMeeting.googleCalendarEventId && deleteHostGoogleConnected && deleteHostGoogleToken) {
        try {
          const googleToken = JSON.parse(deleteHostGoogleToken);
          await deleteMeetingFromCalendar('google', googleToken, existingMeeting.googleCalendarEventId);
        } catch (error: any) {
          console.error('[Calendar] Error deleting Google Calendar event:', error);
          // Continue with meeting deletion even if calendar delete fails
        }
      }

      const deleteHostOutlookConnected = (existingMeeting.host as any).outlookCalendarConnected ?? false;
      const deleteHostOutlookToken = (existingMeeting.host as any).outlookCalendarToken;
      
      if (existingMeeting.outlookCalendarEventId && deleteHostOutlookConnected && deleteHostOutlookToken) {
        try {
          const outlookToken = JSON.parse(deleteHostOutlookToken);
          await deleteMeetingFromCalendar('outlook', outlookToken, existingMeeting.outlookCalendarEventId);
        } catch (error: any) {
          console.error('[Calendar] Error deleting Outlook Calendar event:', error);
          // Continue with meeting deletion even if calendar delete fails
        }
      }

      await ctx.db.meeting.delete({
        where: { id: input.id },
      });

      return { success: true, message: 'Meeting deleted successfully.' };
    }),

  // Link a visitor to a meeting (when they check in)
  linkVisitor: protectedProcedure
    .input(
      z.object({
        meetingId: z.string(),
        visitorId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update visitor to link to meeting
      await ctx.db.visitor.update({
        where: { id: input.visitorId },
        data: {
          meetingId: input.meetingId,
        },
      });

      // Update meeting status to in-progress
      await ctx.db.meeting.update({
        where: { id: input.meetingId },
        data: {
          status: 'in-progress',
        },
      });

      return { success: true, message: 'Visitor linked to meeting.' };
    }),

  // Get upcoming meetings for today (quick view)
  getTodaysMeetings: protectedProcedure.query(async ({ ctx }) => {
    // ✅ Ensure organization context
    if (!ctx.organizationId) {
      return [];
    }

    // ✅ Look up organization by Clerk ID to get internal database ID
    const organization = await ctx.db.organization.findUnique({
      where: { clerkOrgId: ctx.organizationId },
      select: { id: true },
    });

    if (!organization) {
      return [];
    }

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    const meetings = await ctx.db.meeting.findMany({
      where: {
        organizationId: organization.id, // ✅ Use internal database ID, not Clerk ID
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['scheduled', 'in-progress'],
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      include: {
        host: {
          select: {
            id: true,
            fullName: true,
            department: true,
          },
        },
        visitor: {
          select: {
            id: true,
            fullName: true,
            company: true,
            checkInTime: true,
          },
        },
      },
      take: 50,
    });

    return meetings;
  }),

  // Get calendar connection status
  getCalendarStatus: protectedProcedure.query(async ({ ctx }) => {
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

    // Safely access calendar fields (may not exist if Prisma client not regenerated)
    const googleConnected = (staff as any).googleCalendarConnected ?? false;
    const outlookConnected = (staff as any).outlookCalendarConnected ?? false;
    const customUrl = (staff as any).customCalendarUrl ?? null;

    return {
      google: googleConnected,
      outlook: outlookConnected,
      custom: !!customUrl,
    };
  }),

  // Get OAuth URL for calendar connection
  getCalendarAuthUrl: protectedProcedure
    .input(z.object({
      provider: z.enum(['google', 'outlook']),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const staff = await ctx.db.staff.findUnique({
        where: { clerkUserId: ctx.userId },
        select: { id: true },
      });

      if (!staff) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Staff profile not found.',
        });
      }

      try {
        const authUrl = await getCalendarAuthUrl(input.provider, staff.id);
        return { authUrl };
      } catch (error: any) {
        console.error(`[Calendar] Error getting ${input.provider} auth URL:`, error);
        
        // Check if it's a configuration error
        if (error.message?.includes('not configured') || error.message?.includes('credentials')) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: `${input.provider === 'google' ? 'Google' : 'Outlook'} calendar integration is not configured. Please contact your administrator.`,
          });
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get ${input.provider} calendar authorization URL: ${error.message || 'Unknown error'}`,
        });
      }
    }),

  // Disconnect calendar
  disconnectCalendar: protectedProcedure
    .input(z.object({
      provider: z.enum(['google', 'outlook']),
    }))
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

      const updateData: any = {};
      
      if (input.provider === 'google') {
        updateData.googleCalendarConnected = false;
        updateData.googleCalendarToken = null;
        updateData.googleCalendarRefreshToken = null;
      } else if (input.provider === 'outlook') {
        updateData.outlookCalendarConnected = false;
        updateData.outlookCalendarToken = null;
        updateData.outlookCalendarRefreshToken = null;
      }

      await ctx.db.staff.update({
        where: { id: staff.id },
        data: updateData,
      });

      return { success: true, message: `${input.provider} calendar disconnected` };
    }),
});


import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const visitorRouter = createTRPCRouter({
  // Public procedure for visitors to check in
  create: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(1, 'Full name is required'),
        company: z.string().min(1, 'Company is required'),
        email: z.string().email('Invalid email address'),
        phone: z.string().min(1, 'Phone number is required'),
        photoUrl: z.string().optional(),
        whomToSee: z.string().min(1, 'Please select who you are here to see'),
        reasonForVisit: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // ✅ Get organizationId from the staff member being visited
        const hostStaff = await ctx.db.staff.findFirst({
          where: {
            fullName: input.whomToSee,
            isActive: true,
          },
          select: {
            id: true,
            organizationId: true,
            clerkUserId: true,
            fullName: true,
          },
        });

        if (!hostStaff) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Staff member not found',
          });
        }

        // ✅ Check if staff member has a Clerk user ID (required for notifications)
        if (!hostStaff.clerkUserId) {
          console.warn(`[Visitor.create] Staff member ${hostStaff.fullName} (${hostStaff.id}) has no clerkUserId - notification will not be sent`);
        }

        // Create visitor with organizationId from host staff
        const visitor = await ctx.db.visitor.create({
          data: {
            fullName: input.fullName,
            company: input.company,
            email: input.email,
            phone: input.phone,
            photoUrl: input.photoUrl,
            whomToSee: input.whomToSee,
            reasonForVisit: input.reasonForVisit,
            hostStaffId: hostStaff.id, // Link to staff
            organizationId: hostStaff.organizationId, // ✅ Assign to organization
            checkInTime: new Date(),
            hostResponseStatus: 'pending',
            checkInLogs: {
              create: {
                status: 'CHECKED_IN',
                timestamp: new Date(),
              },
            },
          },
          include: {
            checkInLogs: true,
          },
        });

        // ✅ Record company usage for auto-suggestions (per organization)
        if (input.company && input.company !== 'N/A' && hostStaff.organizationId) {
          try {
            const normalizedName = input.company.toLowerCase().trim();
            const capitalizedName = input.company
              .trim()
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');

            const existing = await ctx.db.companySuggestion.findFirst({
              where: {
                organizationId: hostStaff.organizationId, // ✅ Per organization
                name: capitalizedName,
              },
            });

            if (existing) {
              await ctx.db.companySuggestion.update({
                where: { id: existing.id },
                data: {
                  useCount: { increment: 1 },
                  lastUsed: new Date(),
                },
              });
            } else {
              await ctx.db.companySuggestion.create({
                data: {
                  name: capitalizedName,
                  normalizedName,
                  organizationId: hostStaff.organizationId, // ✅ Assign to org
                  useCount: 1,
                  lastUsed: new Date(),
                },
              });
            }
          } catch (companyError) {
            console.error('Error recording company usage:', companyError);
          }
        }

        // ✅ Create notification for staff member (host) when visitor checks in
        if (hostStaff.clerkUserId) {
          try {
            // Get the Clerk organization ID from the internal organization ID
            const organization = await ctx.db.organization.findUnique({
              where: { id: hostStaff.organizationId },
              select: { clerkOrgId: true },
            });

            if (organization) {
              await ctx.db.notification.create({
                data: {
                  organizationId: organization.clerkOrgId, // Clerk organization ID (for filtering)
                  userId: hostStaff.clerkUserId, // Clerk user ID of the staff member
                  staffId: hostStaff.id,
                  type: 'visitor_arrival',
                  title: 'New Visitor Check-in',
                  message: `${visitor.fullName} from ${visitor.company} has checked in to see you${visitor.reasonForVisit ? `: ${visitor.reasonForVisit}` : ''}`,
                  relatedId: visitor.id,
                  relatedType: 'visitor',
                  actionUrl: '/employee/dashboard', // Link to employee dashboard
                  metadata: {
                    visitorName: visitor.fullName,
                    visitorCompany: visitor.company,
                    visitorEmail: visitor.email,
                    visitorPhone: visitor.phone,
                    reasonForVisit: visitor.reasonForVisit,
                    checkInTime: visitor.checkInTime.toISOString(),
                  },
                  isRead: false,
                },
              });
              console.log(`[Notification] Created visitor_arrival notification for staff ${hostStaff.fullName} (${hostStaff.clerkUserId})`);
            } else {
              console.warn(`[Notification] Organization not found for staff ${hostStaff.fullName} - skipping notification`);
            }
          } catch (notificationError) {
            // Don't fail the check-in if notification creation fails
            console.error('[Notification] Failed to create notification for visitor check-in:', notificationError);
          }
        } else {
          console.warn(`[Notification] Skipping notification - staff member ${hostStaff.fullName} has no clerkUserId`);
        }

        return visitor;
      } catch (error) {
        console.error('Error creating visitor:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create visitor',
        });
      }
    }),

  // Protected procedure for receptionists to list visitors
  list: protectedProcedure
    .input(
      z.object({
        filter: z.enum(['today', 'week', 'all']).default('today'),
        receptionistId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // ✅ Ensure organization context
      if (!ctx.organizationId) {
        console.log('[Visitor.list] No organizationId in context');
        return [];
      }

      // ✅ Look up organization by Clerk ID to get internal database ID
      const organization = await ctx.db.organization.findUnique({
        where: { clerkOrgId: ctx.organizationId },
        select: { id: true },
      });

      if (!organization) {
        console.log('[Visitor.list] Organization not found in database:', ctx.organizationId);
        return [];
      }

      console.log('[Visitor.list] Querying visitors for organization:', {
        clerkOrgId: ctx.organizationId,
        internalId: organization.id,
      });

      const now = new Date();
      // Create new Date objects to avoid mutating
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      startOfDay.setMinutes(0);
      startOfDay.setSeconds(0);
      startOfDay.setMilliseconds(0);
      
      // Calculate start of week (Sunday)
      const startOfWeek = new Date(now);
      const dayOfWeek = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday, etc.
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setMinutes(0);
      startOfWeek.setSeconds(0);
      startOfWeek.setMilliseconds(0);

      let whereClause: any = {
        organizationId: organization.id, // ✅ Use internal database ID, not Clerk ID
      };

      if (input.filter === 'today') {
        whereClause.checkInTime = {
          gte: startOfDay,
        };
      } else if (input.filter === 'week') {
        whereClause.checkInTime = {
          gte: startOfWeek,
        };
      }
      // For 'all', no date filter is applied - only org filter

      // Don't filter by receptionistId - show all visitors in this org
      // Receptionists can see all visitors within their organization

      // Optimize query - only fetch what's needed for the list view
      // Receptionist and checkInLogs can be fetched in details view if needed
      const visitors = await ctx.db.visitor.findMany({
        where: whereClause,
        orderBy: {
          checkInTime: 'desc',
        },
        // Only select fields needed for list view - much faster
        select: {
          id: true,
          fullName: true,
          company: true,
          email: true,
          phone: true,
          photoUrl: true,
          whomToSee: true,
          checkInTime: true,
          checkOutTime: true,
          hostResponseStatus: true,
          hostResponseTime: true,
          hostResponseNote: true,
          // Don't include relations for list - fetch in details if needed
        },
        // Add limit for "all" filter to prevent huge queries
        ...(input.filter === 'all' ? { take: 1000 } : {}), // Limit to 1000 for "all"
      });

      console.log('[Visitor.list] Found', visitors.length, 'visitors');
      return visitors;
    }),

  // Get single visitor by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const visitor = await ctx.db.visitor.findUnique({
        where: { id: input.id },
        include: {
          receptionist: true,
          checkInLogs: {
            orderBy: {
              timestamp: 'desc',
            },
          },
        },
      });

      if (!visitor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Visitor not found',
        });
      }

      // ✅ Verify visitor belongs to current organization
      if (ctx.organizationId && visitor.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Visitor not found in your organization',
        });
      }

      return visitor;
    }),

  // Public procedure to search visitors by name or company (for checkout)
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1, 'Search query is required'),
      })
    )
    .query(async ({ ctx, input }) => {
      const searchQuery = input.query.trim().toLowerCase();

      // Only return visitors who are checked in (not checked out)
      const visitors = await ctx.db.visitor.findMany({
        where: {
          AND: [
            {
              OR: [
                { fullName: { contains: searchQuery, mode: 'insensitive' } },
                { company: { contains: searchQuery, mode: 'insensitive' } },
              ],
            },
            {
              checkOutTime: null, // Only show checked-in visitors
            },
          ],
        },
        orderBy: {
          checkInTime: 'desc',
        },
        select: {
          id: true,
          fullName: true,
          company: true,
          checkInTime: true,
          checkOutTime: true,
          whomToSee: true,
        },
      });

      return visitors;
    }),

  // Public procedure to check out a visitor
  checkoutPublic: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const visitor = await ctx.db.visitor.findUnique({
        where: { id: input.id },
      });

      if (!visitor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Visitor not found',
        });
      }

      if (visitor.checkOutTime) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Visitor already checked out',
        });
      }

      const updated = await ctx.db.visitor.update({
        where: { id: input.id },
        data: {
          checkOutTime: new Date(),
          checkInLogs: {
            create: {
              status: 'CHECKED_OUT',
              timestamp: new Date(),
            },
          },
        },
      });

      return updated;
    }),

  // Check out a visitor (protected - for admin dashboard)
  checkout: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const visitor = await ctx.db.visitor.findUnique({
        where: { id: input.id },
      });

      if (!visitor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Visitor not found',
        });
      }

      if (visitor.checkOutTime) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Visitor already checked out',
        });
      }

      const updated = await ctx.db.visitor.update({
        where: { id: input.id },
        data: {
          checkOutTime: new Date(),
          checkInLogs: {
            create: {
              status: 'CHECKED_OUT',
              timestamp: new Date(),
            },
          },
        },
      });

      return updated;
    }),

  // Export visitors as CSV data
  export: protectedProcedure
    .input(
      z.object({
        filter: z.enum(['today', 'week', 'all']).default('all'),
        receptionistId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      // Create new Date objects to avoid mutating
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      startOfDay.setMinutes(0);
      startOfDay.setSeconds(0);
      startOfDay.setMilliseconds(0);
      
      // Calculate start of week (Sunday)
      const startOfWeek = new Date(now);
      const dayOfWeek = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday, etc.
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setMinutes(0);
      startOfWeek.setSeconds(0);
      startOfWeek.setMilliseconds(0);

      const whereClause: any = {};

      if (input.filter === 'today') {
        whereClause.checkInTime = {
          gte: startOfDay,
        };
      } else if (input.filter === 'week') {
        whereClause.checkInTime = {
          gte: startOfWeek,
        };
      }
      // For 'all', no date filter is applied - whereClause remains empty

      // Don't filter by receptionistId - show all visitors

      const visitors = await ctx.db.visitor.findMany({
        where: whereClause,
        orderBy: {
          checkInTime: 'desc',
        },
        include: {
          receptionist: {
            select: {
              fullName: true,
              location: true,
            },
          },
        },
      });

      return visitors;
    }),
});

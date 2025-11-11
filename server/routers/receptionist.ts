import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { clerkClient } from '@clerk/nextjs/server';

export const receptionistRouter = createTRPCRouter({
  // Get or create receptionist profile from Clerk user
  getOrCreate: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }

    let receptionist = await ctx.db.receptionist.findUnique({
      where: { clerkUserId: ctx.userId },
    });

    if (!receptionist) {
      // Fetch user details from Clerk
      const clerkUser = await clerkClient.users.getUser(ctx.userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress || 'unknown@office.gov';
      const fullName = clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.firstName || clerkUser.username || 'Receptionist';

      // Get organization ID if available
      let organizationId: string | null = null;
      if (ctx.organizationId) {
        const org = await ctx.db.organization.findUnique({
          where: { clerkOrgId: ctx.organizationId },
          select: { id: true },
        });
        organizationId = org?.id || null;
      }

      receptionist = await ctx.db.receptionist.create({
        data: {
          clerkUserId: ctx.userId,
          organizationId: organizationId || '', // Receptionist requires organizationId
          fullName,
          email,
          location: 'Main Reception', // Default location, can be updated later
        },
      });
    }

    return receptionist;
  }),

  // Get current receptionist
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }

    const receptionist = await ctx.db.receptionist.findUnique({
      where: { clerkUserId: ctx.userId },
    });

    return receptionist;
  }),

  // Get staff list for visitor dropdown
  getStaffList: protectedProcedure.query(async ({ ctx }) => {
    // In a real app, this would come from a Staff/Employee model
    // For now, return a static list
    return [
      'Dr. Jane Smith',
      'Mr. Robert Brown',
      'Ms. Emily Davis',
      'Dr. Michael Wilson',
      'Mrs. Sarah Johnson',
      'Mr. David Martinez',
      'Ms. Lisa Anderson',
    ];
  }),
});

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { clerkClient } from '@clerk/nextjs/server';

export const organizationRouter = createTRPCRouter({
  // Manually sync current organization to database
  syncToDB: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      // Get user's organizations from Clerk
      const clerk = await clerkClient();
      const memberships = await clerk.users.getOrganizationMembershipList({ userId: ctx.userId });
      
      if (memberships.data.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No organizations found',
        });
      }

      // Use the first organization (or active one if available)
      const clerkOrg = memberships.data[0].organization;
      
      // Upsert to database
      const dbOrg = await ctx.db.organization.upsert({
        where: { clerkOrgId: clerkOrg.id },
        create: {
          clerkOrgId: clerkOrg.id,
          name: clerkOrg.name,
          slug: clerkOrg.slug || clerkOrg.id,
        },
        update: {
          name: clerkOrg.name,
          slug: clerkOrg.slug || clerkOrg.id,
        },
      });

      console.log('[Organization] Synced to database:', dbOrg);
      
      return {
        success: true,
        organization: dbOrg,
        clerkOrgId: clerkOrg.id,
      };
    }),


  // Sync Clerk organization to database
  syncOrganization: publicProcedure
    .input(z.object({
      clerkOrgId: z.string(),
      name: z.string(),
      slug: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log('Syncing organization:', input);
      
      const org = await ctx.db.organization.upsert({
        where: { clerkOrgId: input.clerkOrgId },
        create: {
          clerkOrgId: input.clerkOrgId,
          name: input.name,
          slug: input.slug,
        },
        update: {
          name: input.name,
          slug: input.slug,
        },
      });
      
      return org;
    }),
  
  // Get current organization
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organizationId) {
      return null;
    }
    
    return await ctx.db.organization.findUnique({
      where: { clerkOrgId: ctx.organizationId },
    });
  }),
  
  // Update organization settings
  updateSettings: protectedProcedure
    .input(z.object({
      name: z.string().optional(), // ✅ Added name to sync with Clerk
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      website: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No organization context',
        });
      }
      
      console.log('[Organization] Updating settings:', input);
      
      return await ctx.db.organization.update({
        where: { clerkOrgId: ctx.organizationId },
        data: input,
      });
    }),
});


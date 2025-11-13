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

  // Auto-create Admin profile for organization admins
  ensureAdminProfile: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.userId || !ctx.organizationId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated or no organization context',
        });
      }

      try {
        // Check if profile already exists
        const existingProfile = await ctx.db.staff.findUnique({
          where: { clerkUserId: ctx.userId },
        });

        if (existingProfile) {
          console.log('[Organization] Profile already exists:', existingProfile.id);
          return {
            success: true,
            profile: existingProfile,
            created: false,
          };
        }

        // Get organization from database
        const organization = await ctx.db.organization.findUnique({
          where: { clerkOrgId: ctx.organizationId },
          select: { id: true },
        });

        if (!organization) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Organization not found in database. Please sync organization first.',
          });
        }

        // Check if user is an organization admin in Clerk
        const clerk = await clerkClient();
        const memberships = await clerk.users.getOrganizationMembershipList({ userId: ctx.userId });
        const orgMembership = memberships.data.find(
          (m) => m.organization.id === ctx.organizationId
        );

        const isOrgAdmin = orgMembership?.role === 'org:admin' || orgMembership?.role === 'org:creator';

        if (!isOrgAdmin) {
          console.log('[Organization] User is not org admin, skipping profile creation');
          return {
            success: false,
            profile: null,
            created: false,
            message: 'User is not an organization admin',
          };
        }

        // Get user info from Clerk
        const clerkUser = await clerk.users.getUser(ctx.userId);
        const fullName = clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress || 'Admin User';

        // Use upsert to handle race condition: if another process creates the profile
        // between the check and this call, upsert will update instead of failing
        const newStaff = await ctx.db.staff.upsert({
          where: { clerkUserId: ctx.userId },
          create: {
            organizationId: organization.id,
            fullName: fullName,
            email: clerkUser.emailAddresses[0]?.emailAddress || null,
            role: 'Admin',
            canLogin: true,
            clerkUserId: ctx.userId,
            isActive: true,
          },
          update: {
            // If profile already exists, ensure it's set as Admin and active
            role: 'Admin',
            canLogin: true,
            isActive: true,
            organizationId: organization.id, // Update org in case it changed
            fullName: fullName, // Update name in case it changed in Clerk
            email: clerkUser.emailAddresses[0]?.emailAddress || null,
          },
        });

        console.log('[Organization] ✅ Auto-created/updated Admin profile:', newStaff.id);

        return {
          success: true,
          profile: newStaff,
          created: true,
        };
      } catch (error: any) {
        console.error('[Organization] ❌ Error ensuring admin profile:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to ensure admin profile: ${error.message}`,
        });
      }
    }),
});


import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { clerkClient } from '@clerk/nextjs/server';

// Helper function to generate a random password
function generateRandomPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export const staffRouter = createTRPCRouter({
  // Public: Get active staff list for visitor check-in
  getActiveStaff: publicProcedure.query(async ({ ctx }) => {
    try {
      const staff = await ctx.db.staff.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          fullName: 'asc',
        },
        select: {
          fullName: true,
        },
      });

      return staff.map((s) => s.fullName);
    } catch (error) {
      console.error('Error fetching staff:', error);
      // Return empty array if there's an error (table might not exist yet)
      return [];
    }
  }),

  // Protected: Get all staff (for admin)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    // ✅ Filter by organization
    if (!ctx.organizationId) {
      console.log('[Staff.getAll] No organizationId in context');
      return [];
    }
    
    // ✅ Look up organization by Clerk ID to get internal database ID
    const organization = await ctx.db.organization.findUnique({
      where: { clerkOrgId: ctx.organizationId },
      select: { id: true },
    });

    if (!organization) {
      console.log('[Staff.getAll] Organization not found in database:', ctx.organizationId);
      return [];
    }

    console.log('[Staff.getAll] Querying staff for organization:', {
      clerkOrgId: ctx.organizationId,
      internalId: organization.id,
    });
    
    const staff = await ctx.db.staff.findMany({
      where: {
        organizationId: organization.id, // ✅ Use internal database ID, not Clerk ID
      },
      orderBy: {
        fullName: 'asc',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        department: true,
        title: true,
        role: true,
        isActive: true,
        canLogin: true,
        username: true,
        clerkUserId: true,
      },
    });

    console.log('[Staff.getAll] Found', staff.length, 'staff members');
    return staff;
  }),

  // Protected: Create new staff member
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(), // ✅ Pass from client
        fullName: z.string().min(1, 'Full name is required'),
        email: z.string().email().optional().nullable(),
        department: z.string().optional().nullable(),
        title: z.string().optional().nullable(),
        role: z.enum(['Employee', 'Receptionist', 'Admin', 'IT Staff']).default('Employee'),
        isActive: z.boolean().default(true),
        canLogin: z.boolean().default(false),
        username: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let clerkUserId: string | null = null;
      let generatedPassword: string | null = null;
      let organization: { id: string; clerkOrgId: string } | null = null;

      // If canLogin is true, create a Clerk user
      if (input.canLogin) {
        if (!input.email) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Email is required to create login credentials',
          });
        }

        // Generate username from email or use provided username
        const username = input.username || input.email.split('@')[0];
        
        // Generate a random password (user will be prompted to change it)
        generatedPassword = generateRandomPassword();

        try {
          // Create user in Clerk
          const clerk = await clerkClient();
          
          console.log('Creating Clerk user with:', {
            emailAddress: [input.email],
            username: username,
            firstName: input.fullName.split(' ')[0],
            lastName: input.fullName.split(' ').slice(1).join(' ') || undefined,
          });
          
          const clerkUser = await clerk.users.createUser({
            emailAddress: [input.email],
            username: username,
            password: generatedPassword,
            firstName: input.fullName.split(' ')[0],
            lastName: input.fullName.split(' ').slice(1).join(' ') || undefined,
            skipPasswordChecks: true, // Skip password strength requirements
            skipPasswordRequirement: false,
          });

          clerkUserId = clerkUser.id;

          // Set legalAcceptedAt via updateUser (required when "Require express consent to legal documents" is enabled in Clerk)
          // Note: TypeScript types may not include this property, but Clerk API accepts it
          try {
            await clerk.users.updateUser(clerkUserId, {
              legalAcceptedAt: new Date().toISOString(),
            } as any);
          } catch (updateError: any) {
            // If updateUser fails, delete the created user to maintain atomicity
            console.error('[Staff Create] Failed to set legalAcceptedAt, cleaning up created user:', updateError);
            try {
              await clerk.users.deleteUser(clerkUserId);
            } catch (deleteError: any) {
              console.error('[Staff Create] Failed to delete orphaned user:', deleteError);
            }
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Failed to initialize user: ${updateError.message || 'Could not set legal acceptance date'}`,
            });
          }

          // ✅ First, look up the organization in our database to get the internal ID
          organization = await ctx.db.organization.findUnique({
            where: { clerkOrgId: input.organizationId },
            select: { id: true, clerkOrgId: true },
          });

          if (!organization) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Organization not found in database. Please sync your organization first.',
            });
          }

          // ✅ Add user to the organization in Clerk (using passed organizationId)
          console.log('[Staff Create] Adding user to Clerk organization:', {
            userId: clerkUserId,
            organizationId: input.organizationId,
            role: input.role,
          });

          try {
            // Map our app roles to Clerk organization roles
            const clerkRole = input.role === 'Admin' ? 'org:admin' : 'org:member';

            await clerk.organizations.createOrganizationMembership({
              organizationId: input.organizationId, // Use the orgId passed from client
              userId: clerkUserId,
              role: clerkRole,
            });

            console.log('[Staff Create] ✅ User successfully added to organization');
          } catch (orgError: any) {
            console.error('[Staff Create] ❌ CRITICAL: Failed to add user to organization:', {
              error: orgError.message,
              details: orgError.errors || orgError,
              userId: clerkUserId,
              organizationId: input.organizationId,
            });
            // This is critical - throw the error so we can see it
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Failed to add user to organization: ${orgError.message}`,
            });
          }

          // ✅ Only create receptionist record for users with "Receptionist" role
          if (input.role === 'Receptionist') {
            await ctx.db.receptionist.upsert({
              where: { clerkUserId: clerkUserId },
              create: {
                clerkUserId: clerkUserId,
                fullName: input.fullName,
                email: input.email,
                organizationId: organization.id, // ✅ Use internal database ID, not Clerk ID
              },
              update: {
                fullName: input.fullName,
                email: input.email,
              },
            });
            console.log('[Staff Create] ✅ Receptionist record created');
          }
        } catch (error: any) {
          console.error('Clerk user creation error:', error);
          
          // Check for specific Clerk errors and provide user-friendly messages
          if (error.errors && Array.isArray(error.errors)) {
            const errorMessages = error.errors.map((e: any) => e.longMessage || e.message).join('. ');
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: errorMessages,
            });
          }
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create Clerk user: ${error.message || 'Unknown error'}`,
          });
        }
      }

      // ✅ Ensure organization context exists and look up internal ID
      if (!input.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No organization context. Please select an organization.',
        });
      }

      // Look up organization to get internal database ID (if not already done above)
      let organizationDbId: string;
      if (input.canLogin && clerkUserId && organization) {
        // We already looked it up above, reuse it
        organizationDbId = organization.id;
        console.log('[Staff Create] Using organization ID from Clerk user creation:', organizationDbId);
      } else {
        // For non-login users, look it up now
        console.log('[Staff Create] Looking up organization for non-login user:', input.organizationId);
        const org = await ctx.db.organization.findUnique({
          where: { clerkOrgId: input.organizationId },
          select: { id: true },
        });
        if (!org) {
          console.error('[Staff Create] ❌ Organization not found in database:', input.organizationId);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Organization not found in database. Please sync your organization first.',
          });
        }
        organizationDbId = org.id;
        console.log('[Staff Create] Found organization ID:', organizationDbId);
      }

      // Create staff record in database
      console.log('[Staff Create] Creating staff record with:', {
        fullName: input.fullName,
        email: input.email,
        role: input.role,
        organizationId: organizationDbId,
        clerkUserId: clerkUserId,
        canLogin: input.canLogin,
      });

      try {
        const staff = await ctx.db.staff.create({
          data: {
            fullName: input.fullName,
            email: input.email,
            department: input.department,
            title: input.title,
            role: input.role,
            isActive: input.isActive,
            canLogin: input.canLogin,
            clerkUserId: clerkUserId,
            username: input.username || (input.email ? input.email.split('@')[0] : null),
            organizationId: organizationDbId, // ✅ Use internal database ID, not Clerk ID
          },
        });

        console.log('[Staff Create] ✅ Staff record created successfully:', {
          id: staff.id,
          fullName: staff.fullName,
          role: staff.role,
          organizationId: staff.organizationId,
        });

        // Return the staff with temporary password if generated
        return {
          staff,
          temporaryPassword: generatedPassword,
        };
      } catch (dbError: any) {
        console.error('[Staff Create] ❌ CRITICAL: Failed to create staff record in database:', {
          error: dbError.message,
          code: dbError.code,
          meta: dbError.meta,
          organizationId: organizationDbId,
          clerkUserId: clerkUserId,
        });
        
        // If Clerk user was created but database insert failed, we should clean up
        // But for now, just throw the error so we can see what's wrong
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create staff record in database: ${dbError.message || 'Unknown error'}. Clerk user may have been created.`,
          cause: dbError,
        });
      }
    }),

  // Protected: Update staff member
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        fullName: z.string(),
        email: z.string().email().optional().nullable(),
        department: z.string().optional().nullable(),
        title: z.string().optional().nullable(),
        role: z.enum(['Employee', 'Receptionist', 'Admin', 'IT Staff']).optional(),
        isActive: z.boolean(),
        canLogin: z.boolean().default(false),
        username: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // ✅ Ensure staff belongs to current organization
      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No organization context',
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
          message: 'Organization not found in database',
        });
      }
      
      const existingStaff = await ctx.db.staff.findUnique({
        where: { 
          id: input.id,
        },
      });

      if (!existingStaff) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Staff member not found',
        });
      }
      
      // ✅ Verify staff belongs to this organization (compare database IDs)
      if (existingStaff.organizationId !== organization.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Staff member not found in your organization',
        });
      }

      let clerkUserId = existingStaff.clerkUserId;
      let generatedPassword: string | null = null;

      // If enabling login for the first time
      if (input.canLogin && !existingStaff.canLogin && !existingStaff.clerkUserId) {
        if (!input.email) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Email is required to create login credentials',
          });
        }

        const username = input.username || input.email.split('@')[0];
        generatedPassword = generateRandomPassword();

        try {
          const clerk = await clerkClient();
          const clerkUser = await clerk.users.createUser({
            emailAddress: [input.email],
            username: username,
            password: generatedPassword,
            firstName: input.fullName.split(' ')[0],
            lastName: input.fullName.split(' ').slice(1).join(' ') || undefined,
            skipPasswordChecks: true, // Skip password strength requirements
            skipPasswordRequirement: false,
          });

          clerkUserId = clerkUser.id;

          // Set legalAcceptedAt via updateUser (required when "Require express consent to legal documents" is enabled in Clerk)
          // Note: TypeScript types may not include this property, but Clerk API accepts it
          try {
            await clerk.users.updateUser(clerkUserId, {
              legalAcceptedAt: new Date().toISOString(),
            } as any);
          } catch (updateError: any) {
            // If updateUser fails, delete the created user to maintain atomicity
            console.error('[Staff Update] Failed to set legalAcceptedAt, cleaning up created user:', updateError);
            try {
              await clerk.users.deleteUser(clerkUserId);
            } catch (deleteError: any) {
              console.error('[Staff Update] Failed to delete orphaned user:', deleteError);
            }
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Failed to initialize user: ${updateError.message || 'Could not set legal acceptance date'}`,
            });
          }

          // ✅ Look up organization to get internal database ID
          if (!ctx.organizationId) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'No organization context',
            });
          }

          const organization = await ctx.db.organization.findUnique({
            where: { clerkOrgId: ctx.organizationId },
            select: { id: true },
          });

          if (!organization) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Organization not found in database. Please sync your organization first.',
            });
          }

          // ✅ Only create receptionist record for users with "Receptionist" role
          if (existingStaff.role === 'Receptionist' || input.role === 'Receptionist') {
            await ctx.db.receptionist.upsert({
              where: { clerkUserId: clerkUserId },
              create: {
                clerkUserId: clerkUserId,
                fullName: input.fullName,
                email: input.email,
                organizationId: organization.id, // ✅ Use internal database ID, not Clerk ID
              },
              update: {
                fullName: input.fullName,
                email: input.email,
              },
            });
            console.log('[Staff Update] ✅ Receptionist record created/updated');
          }
        } catch (error: any) {
          console.error('Clerk user creation error (update):', error);
          
          // Check for specific Clerk errors and provide user-friendly messages
          if (error.errors && Array.isArray(error.errors)) {
            const errorMessages = error.errors.map((e: any) => e.longMessage || e.message).join('. ');
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: errorMessages,
            });
          }
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create Clerk user: ${error.message || 'Unknown error'}`,
          });
        }
      }

      const staff = await ctx.db.staff.update({
        where: { id: input.id },
        data: {
          fullName: input.fullName,
          email: input.email,
          department: input.department,
          title: input.title,
          role: input.role,
          isActive: input.isActive,
          canLogin: input.canLogin,
          clerkUserId: clerkUserId,
          username: input.username || (input.email ? input.email.split('@')[0] : null),
        },
      });

      return {
        staff,
        temporaryPassword: generatedPassword,
      };
    }),

  // Protected: Delete staff member
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const staff = await ctx.db.staff.findUnique({
        where: { id: input.id },
      });

      // If staff has Clerk account, optionally delete it
      // Note: We're keeping the Clerk user for audit purposes
      // You can uncomment below to delete the Clerk user as well
      /*
      if (staff?.clerkUserId) {
        try {
          const clerk = await clerkClient();
          await clerk.users.deleteUser(staff.clerkUserId);
        } catch (error) {
          console.error('Error deleting Clerk user:', error);
        }
      }
      */

      await ctx.db.staff.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Reset password for a staff member
  resetPassword: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const staff = await ctx.db.staff.findUnique({
        where: { id: input.id },
      });

      if (!staff || !staff.clerkUserId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Staff member or Clerk account not found',
        });
      }

      const newPassword = generateRandomPassword();

      try {
        const clerk = await clerkClient();
        await clerk.users.updateUser(staff.clerkUserId, {
          password: newPassword,
        });

        return {
          success: true,
          temporaryPassword: newPassword,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to reset password: ${error.message}`,
        });
      }
    }),
});

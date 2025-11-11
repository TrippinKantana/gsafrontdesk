import { initTRPC, TRPCError } from '@trpc/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from './db';

export const createTRPCContext = async (opts: { req: Request }) => {
  try {
    const { userId, orgId } = await auth();
    
    let finalOrgId = orgId;
    
    // ✅ If no orgId but user is authenticated, try to get their organization
    if (userId && !orgId) {
      try {
        const clerk = await clerkClient();
        const memberships = await clerk.users.getOrganizationMembershipList({ userId });
        
        // If user belongs to exactly one organization, use it automatically
        if (memberships.data.length === 1) {
          const clerkOrgId = memberships.data[0].organization.id;
          
          // Get our internal org ID from the database
          const organization = await db.organization.findUnique({
            where: { clerkOrgId },
            select: { clerkOrgId: true },
          });
          
          if (organization) {
            finalOrgId = organization.clerkOrgId;
            console.log('[tRPC Context] Auto-selected organization:', clerkOrgId);
          }
        }
      } catch (error) {
        console.error('[tRPC Context] Error fetching organization:', error);
      }
    }
    
    return {
      db,
      userId: userId ?? null,
      organizationId: finalOrgId ?? null,
      req: opts.req,
    };
  } catch (error) {
    console.error('Error in createTRPCContext:', error);
    return {
      db,
      userId: null,
      organizationId: null,
      req: opts.req,
    };
  }
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  // Note: organizationId might be null for users not in an organization yet
  // Individual procedures can check for organizationId if needed
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      organizationId: ctx.organizationId,
    },
  });
});

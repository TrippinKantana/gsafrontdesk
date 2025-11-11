import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const companyRouter = createTRPCRouter({
  // Get company suggestions based on query
  getSuggestions: publicProcedure
    .input(
      z.object({
        query: z.string().min(2, 'Query must be at least 2 characters'),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const normalizedQuery = input.query.toLowerCase().trim();

        const suggestions = await ctx.db.companySuggestion.findMany({
          where: {
            normalizedName: {
              contains: normalizedQuery,
            },
          },
          orderBy: [
            { useCount: 'desc' }, // Most used first
            { lastUsed: 'desc' },  // Most recent next
          ],
          take: 10,
        });

        return suggestions;
      } catch (error) {
        console.error('Error fetching company suggestions:', error);
        return []; // Return empty array on error to not break the UI
      }
    }),

  // Record or update company usage
  recordUsage: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Company name is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const normalizedName = input.name.toLowerCase().trim();

        // Capitalize each word for consistent display
        const capitalizedName = input.name
          .trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');

        // Check if company exists
        const existing = await ctx.db.companySuggestion.findUnique({
          where: { name: capitalizedName },
        });

        if (existing) {
          // Update use count and last used date
          await ctx.db.companySuggestion.update({
            where: { id: existing.id },
            data: {
              useCount: { increment: 1 },
              lastUsed: new Date(),
            },
          });
        } else {
          // Create new suggestion
          await ctx.db.companySuggestion.create({
            data: {
              name: capitalizedName,
              normalizedName,
              useCount: 1,
              lastUsed: new Date(),
            },
          });
        }

        return { success: true };
      } catch (error) {
        console.error('Error recording company usage:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to record company usage',
        });
      }
    }),

  // Admin: Get all companies for management
  getAll: publicProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.db.companySuggestion.findMany({
        orderBy: [{ useCount: 'desc' }, { name: 'asc' }],
      });
    } catch (error) {
      console.error('Error fetching all companies:', error);
      return [];
    }
  }),

  // Admin: Delete company suggestion
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.companySuggestion.delete({
        where: { id: input.id },
      });
      return { success: true };
    }),
});


import { auth } from '@clerk/nextjs/server';
import { db } from './db';

export async function createTRPCContext() {
  const { userId, orgId } = await auth();
  
  return {
    db,
    userId,
    organizationId: orgId, // ✅ Organization context for all queries
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;


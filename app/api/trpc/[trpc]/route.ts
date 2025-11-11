// Force dynamic rendering - prevent static analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(req: Request) {
  // Lazy import to prevent build-time evaluation
  const { fetchRequestHandler } = await import('@trpc/server/adapters/fetch');
  const { appRouter } = await import('@/server/routers/_app');
  const { createTRPCContext } = await import('@/server/trpc');
  
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => createTRPCContext({ req }),
    onError: ({ error, path }) => {
      console.error('tRPC Error on path', path, ':', error);
    },
  });
}

export async function POST(req: Request) {
  // Lazy import to prevent build-time evaluation
  const { fetchRequestHandler } = await import('@trpc/server/adapters/fetch');
  const { appRouter } = await import('@/server/routers/_app');
  const { createTRPCContext } = await import('@/server/trpc');
  
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => createTRPCContext({ req }),
    onError: ({ error, path }) => {
      console.error('tRPC Error on path', path, ':', error);
    },
  });
}

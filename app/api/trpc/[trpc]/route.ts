import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';
import { createTRPCContext } from '@/server/trpc';

export async function GET(req: Request) {
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

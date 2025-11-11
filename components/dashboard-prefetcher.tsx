'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trpc } from '@/lib/trpc';

/**
 * Component that prefetches data for both dashboard pages
 * This ensures instant page transitions
 */
export function DashboardPrefetcher() {
  const pathname = usePathname();
  const trpcUtils = trpc.useUtils();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    // Only prefetch once on initial mount to avoid infinite loops
    if (hasPrefetched.current) return;
    
    // Prefetch data for both pages on mount (one time only)
    trpcUtils.visitor.list.prefetch({ filter: 'today' }).catch(() => {});
    trpcUtils.staff.getAll.prefetch().catch(() => {});
    
    hasPrefetched.current = true;
  }, []); // Empty dependency array - only run once

  // Prefetch when pathname changes (but debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pathname === '/dashboard') {
        trpcUtils.staff.getAll.prefetch().catch(() => {});
      } else if (pathname === '/dashboard/staff') {
        trpcUtils.visitor.list.prefetch({ filter: 'today' }).catch(() => {});
      }
    }, 500); // Small delay to avoid excessive prefetching

    return () => clearTimeout(timeoutId);
  }, [pathname]); // Only depend on pathname

  return null;
}


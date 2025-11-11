'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useSidebar } from './sidebar-context';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarNavProps {
  items: NavItem[];
  className?: string;
}

export function SidebarNav({ items, className }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <aside className={cn(
      'hidden md:block border-r bg-white flex-shrink-0 transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-56',
      className
    )}>
      <nav className={cn('flex flex-col gap-1 h-full overflow-y-auto', isCollapsed ? 'p-2' : 'p-4')}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                'flex items-center gap-3 text-sm font-medium transition-colors cursor-pointer rounded-md text-left',
                isCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3',
                isActive
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-l-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
              type="button"
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.title}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}


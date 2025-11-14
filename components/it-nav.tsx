'use client';

import { LayoutDashboard, Ticket, User, FolderKanban } from 'lucide-react';
import { SidebarNav, NavItem } from '@/components/sidebar-nav';
import { trpc } from '@/lib/trpc';

const baseNavItems: NavItem[] = [
  {
    title: 'IT Dashboard',
    href: '/it/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Tickets',
    href: '/it/tickets',
    icon: Ticket,
  },
  {
    title: 'Projects',
    href: '/it/projects',
    icon: FolderKanban,
  },
];

export function ITNav() {
  // Get user profile to check role (IT Staff are also employees)
  const { data: profile } = trpc.employee.getProfile.useQuery(undefined, {
    retry: false,
  });

  // IT Staff can switch to Employee Dashboard
  const navItems: NavItem[] = [
    ...baseNavItems,
    ...(profile?.role === 'IT Staff' ? [{
      title: 'Employee Dashboard',
      href: '/employee/dashboard',
      icon: User,
    }] : []),
  ];

  return <SidebarNav items={navItems} />;
}


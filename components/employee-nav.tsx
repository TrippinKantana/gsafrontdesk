'use client';

import { LayoutDashboard, Ticket as TicketIcon, Calendar, Wrench, User } from 'lucide-react';
import { SidebarNav, NavItem } from '@/components/sidebar-nav';
import { trpc } from '@/lib/trpc';

const baseNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/employee/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Visitors',
    href: '/employee/visitors',
    icon: User,
  },
  {
    title: 'My Tickets',
    href: '/employee/tickets',
    icon: TicketIcon,
  },
  {
    title: 'Meetings',
    href: '/employee/meetings',
    icon: Calendar,
  },
];

export function EmployeeNav() {
  // Get user profile to check if they are IT Staff
  const { data: profile } = trpc.employee.getProfile.useQuery(undefined, {
    retry: false,
  });

  // If user is IT Staff, show link to IT Dashboard
  const navItems: NavItem[] = [
    ...baseNavItems,
    ...(profile?.role === 'IT Staff' ? [{
      title: 'IT Dashboard',
      href: '/it/dashboard',
      icon: Wrench,
    }] : []),
  ];

  return <SidebarNav items={navItems} />;
}



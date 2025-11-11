'use client';

import { LayoutDashboard, Users, BarChart3, Calendar, Settings } from 'lucide-react';
import { SidebarNav, NavItem } from '@/components/sidebar-nav';

const navItems: NavItem[] = [
  {
    title: 'Visitor Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Meetings',
    href: '/dashboard/meetings',
    icon: Calendar,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Staff Management',
    href: '/dashboard/staff',
    icon: Users,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function DashboardNav() {
  return <SidebarNav items={navItems} />;
}


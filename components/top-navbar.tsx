'use client';

import Image from 'next/image';
import { Menu, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import { NotificationsDropdown } from '@/components/notifications-dropdown';
import { useSidebar } from './sidebar-context';
import { usePathname } from 'next/navigation';
import { DashboardSearch } from './dashboard-search';
import { ITSearch } from './it-search';
import { EmployeeSearch } from './employee-search';

export function TopNavbar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const pathname = usePathname();

  // Determine which search component to show based on route
  const getSearchComponent = () => {
    if (pathname?.startsWith('/it/')) {
      return <ITSearch />;
    }
    if (pathname?.startsWith('/employee/')) {
      return <EmployeeSearch />;
    }
    // Default to admin/receptionist dashboard search
    return <DashboardSearch />;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-16 items-center gap-2 md:gap-4 px-3 md:px-6">
        {/* Sidebar Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hidden md:flex flex-shrink-0"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>

        {/* Logo */}
        <div className="flex-shrink-0">
          <Image 
            src="/syncco_logo.svg" 
            alt="Syncco" 
            width={100} 
            height={40}
            priority
            className="h-7 md:h-8 w-auto"
          />
        </div>

        {/* Search Bar - Center (hidden on mobile) */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-auto">
          {getSearchComponent()}
        </div>

        {/* Right Side - Notifications, Organization Switcher, User */}
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 ml-auto">
          <NotificationsDropdown />
          <div className="hidden sm:block">
            <OrganizationSwitcher
              afterSelectOrganizationUrl="/"
              afterCreateOrganizationUrl="/onboarding"
              appearance={{
                elements: {
                  rootBox: 'flex items-center',
                },
              }}
            />
          </div>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
    </header>
  );
}


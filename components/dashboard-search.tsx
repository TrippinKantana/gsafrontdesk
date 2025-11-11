'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import { Search, User, Users, Calendar, Ticket, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  id: string;
  title: string;
  subtitle?: string;
  type: 'staff' | 'visitor' | 'meeting' | 'ticket' | 'action';
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function DashboardSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch data for suggestions
  const { data: staff = [] } = trpc.staff.getAll.useQuery(undefined, {
    enabled: isOpen && query.length > 0,
  });

  const { data: visitors = [] } = trpc.visitor.list.useQuery(
    { filter: 'all' },
    {
      enabled: isOpen && query.length > 0,
    }
  );

  const { data: meetings = [] } = trpc.meeting.getAll.useQuery(
    { status: 'all' },
    {
      enabled: isOpen && query.length > 0,
    }
  );

  // Try to get tickets - may fail if user doesn't have permission
  const { data: tickets = [] } = trpc.ticket.getAll.useQuery(
    { status: 'all' },
    {
      enabled: isOpen && query.length > 0,
      retry: false,
    }
  );

  // Generate suggestions based on query
  const suggestions: SearchSuggestion[] = [];

  if (query.length > 0) {
    const lowerQuery = query.toLowerCase();

    // Staff suggestions
    staff
      .filter((s) => 
        s.fullName.toLowerCase().includes(lowerQuery) ||
        s.email?.toLowerCase().includes(lowerQuery) ||
        s.department?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .forEach((s) => {
        suggestions.push({
          id: `staff-${s.id}`,
          title: s.fullName,
          subtitle: s.department || s.title || s.email,
          type: 'staff',
          href: '/dashboard/staff',
          icon: User,
        });
      });

    // Visitor suggestions
    visitors
      .filter((v) =>
        v.fullName.toLowerCase().includes(lowerQuery) ||
        v.company?.toLowerCase().includes(lowerQuery) ||
        v.email?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .forEach((v) => {
        suggestions.push({
          id: `visitor-${v.id}`,
          title: v.fullName,
          subtitle: v.company || v.email,
          type: 'visitor',
          href: '/dashboard',
          icon: Users,
        });
      });

    // Meeting suggestions
    meetings
      .filter((m) =>
        m.title.toLowerCase().includes(lowerQuery) ||
        m.host.fullName.toLowerCase().includes(lowerQuery) ||
        m.location?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .forEach((m) => {
        suggestions.push({
          id: `meeting-${m.id}`,
          title: m.title,
          subtitle: `Host: ${m.host.fullName}${m.location ? ` • ${m.location}` : ''}`,
          type: 'meeting',
          href: '/dashboard/meetings',
          icon: Calendar,
        });
      });

    // Ticket suggestions
    tickets
      .filter((t) =>
        t.title.toLowerCase().includes(lowerQuery) ||
        t.ticketNumber.toLowerCase().includes(lowerQuery) ||
        t.createdBy.fullName.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .forEach((t) => {
        suggestions.push({
          id: `ticket-${t.id}`,
          title: t.title,
          subtitle: `${t.ticketNumber} • ${t.createdBy.fullName}`,
          type: 'ticket',
          href: '/it/tickets',
          icon: Ticket,
        });
      });

    // Quick actions (if query matches common actions)
    const actionKeywords = [
      { keywords: ['staff', 'employee', 'employee', 'add staff'], href: '/dashboard/staff', title: 'Add Staff Member', icon: User },
      { keywords: ['meeting', 'schedule', 'calendar', 'appointment'], href: '/dashboard/meetings', title: 'View Meetings', icon: Calendar },
      { keywords: ['visitor', 'check-in', 'checkin'], href: '/dashboard', title: 'View Visitors', icon: Users },
      { keywords: ['ticket', 'support', 'it'], href: '/it/tickets', title: 'View Tickets', icon: Ticket },
      { keywords: ['analytics', 'stats', 'report'], href: '/dashboard/analytics', title: 'View Analytics', icon: ArrowRight },
      { keywords: ['settings', 'config'], href: '/dashboard/settings', title: 'Settings', icon: ArrowRight },
    ];

    actionKeywords.forEach((action) => {
      if (action.keywords.some((keyword) => lowerQuery.includes(keyword))) {
        suggestions.push({
          id: `action-${action.href}`,
          title: action.title,
          subtitle: 'Quick navigation',
          type: 'action',
          href: action.href,
          icon: action.icon,
        });
      }
    });
  } else {
    // Show popular/quick actions when no query
    suggestions.push(
      {
        id: 'action-visitors',
        title: 'View Visitors',
        subtitle: 'See all checked-in visitors',
        type: 'action',
        href: '/dashboard',
        icon: Users,
      },
      {
        id: 'action-meetings',
        title: 'View Meetings',
        subtitle: 'See all scheduled meetings',
        type: 'action',
        href: '/dashboard/meetings',
        icon: Calendar,
      },
      {
        id: 'action-staff',
        title: 'Manage Staff',
        subtitle: 'Add or edit staff members',
        type: 'action',
        href: '/dashboard/staff',
        icon: User,
      },
      {
        id: 'action-analytics',
        title: 'View Analytics',
        subtitle: 'See visitor and meeting statistics',
        type: 'action',
        href: '/dashboard/analytics',
        icon: ArrowRight,
      }
    );
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, suggestions]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.href) {
      router.push(suggestion.href);
      setIsOpen(false);
      setQuery('');
      inputRef.current?.blur();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setSelectedIndex(0);
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Highlight matching text in suggestions
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-gray-900 px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search staff, visitors, meetings, tickets..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10 w-full"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No results found
            </div>
          ) : (
            <div className="py-2">
              {suggestions.map((suggestion, index) => {
                const Icon = suggestion.icon;
                const isSelected = index === selectedIndex;
                
                return (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSelect(suggestion)}
                    className={cn(
                      'w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors',
                      isSelected && 'bg-gray-50'
                    )}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                      suggestion.type === 'staff' && 'bg-blue-100 text-blue-600',
                      suggestion.type === 'visitor' && 'bg-purple-100 text-purple-600',
                      suggestion.type === 'meeting' && 'bg-green-100 text-green-600',
                      suggestion.type === 'ticket' && 'bg-orange-100 text-orange-600',
                      suggestion.type === 'action' && 'bg-gray-100 text-gray-600'
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {highlightMatch(suggestion.title, query)}
                      </div>
                      {suggestion.subtitle && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {suggestion.subtitle}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


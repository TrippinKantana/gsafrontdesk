'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import { Search, Ticket, Calendar, User, ArrowRight, X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  id: string;
  title: string;
  subtitle?: string;
  type: 'ticket' | 'meeting' | 'visitor' | 'action';
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function EmployeeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch employee's own data
  const { data: myTickets = [] } = trpc.ticket.getMyTickets.useQuery(
    { status: 'all' },
    {
      enabled: isOpen && query.length > 0,
    }
  );

  const { data: myMeetings = [] } = trpc.meeting.getMyMeetings.useQuery(
    { status: 'all' },
    {
      enabled: isOpen && query.length > 0,
    }
  );

  // Fetch visitors for this employee
  const { data: myVisitors = [] } = trpc.employee.getAllVisitors.useQuery(
    undefined,
    {
      enabled: isOpen && query.length > 0,
    }
  );

  // Generate suggestions based on query
  const suggestions: SearchSuggestion[] = [];

  if (query.length > 0) {
    const lowerQuery = query.toLowerCase();

    // My tickets suggestions
    myTickets
      .filter((t) =>
        t.ticketNumber.toLowerCase().includes(lowerQuery) ||
        t.title.toLowerCase().includes(lowerQuery) ||
        (t.assignedTo && t.assignedTo.fullName.toLowerCase().includes(lowerQuery))
      )
      .slice(0, 5)
      .forEach((t) => {
        suggestions.push({
          id: `ticket-${t.id}`,
          title: t.title,
          subtitle: `${t.ticketNumber} • ${t.status}`,
          type: 'ticket',
          href: `/employee/tickets`,
          icon: Ticket,
        });
      });

    // My meetings suggestions
    myMeetings
      .filter((m) =>
        m.title.toLowerCase().includes(lowerQuery) ||
        (m.visitor && m.visitor.fullName.toLowerCase().includes(lowerQuery)) ||
        m.location?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .forEach((m) => {
        suggestions.push({
          id: `meeting-${m.id}`,
          title: m.title,
          subtitle: m.visitor ? `With ${m.visitor.fullName}` : m.location || 'Meeting',
          type: 'meeting',
          href: '/employee/meetings',
          icon: Calendar,
        });
      });

    // My visitors suggestions
    myVisitors
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
          href: '/employee/visitors',
          icon: Users,
        });
      });

    // Quick actions
    const actionKeywords = [
      { keywords: ['ticket', 'create ticket', 'submit'], href: '/employee/dashboard', title: 'Create Ticket', icon: Ticket },
      { keywords: ['my tickets', 'tickets'], href: '/employee/tickets', title: 'View My Tickets', icon: Ticket },
      { keywords: ['meeting', 'meetings', 'calendar', 'schedule'], href: '/employee/meetings', title: 'View My Meetings', icon: Calendar },
      { keywords: ['visitor', 'visitors'], href: '/employee/visitors', title: 'View My Visitors', icon: Users },
      { keywords: ['dashboard', 'home'], href: '/employee/dashboard', title: 'Employee Dashboard', icon: ArrowRight },
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
        id: 'action-tickets',
        title: 'View My Tickets',
        subtitle: 'See all your support tickets',
        type: 'action',
        href: '/employee/tickets',
        icon: Ticket,
      },
      {
        id: 'action-meetings',
        title: 'View My Meetings',
        subtitle: 'See your scheduled meetings',
        type: 'action',
        href: '/employee/meetings',
        icon: Calendar,
      },
      {
        id: 'action-visitors',
        title: 'View My Visitors',
        subtitle: 'See visitors who came to see you',
        type: 'action',
        href: '/employee/visitors',
        icon: Users,
      },
      {
        id: 'action-dashboard',
        title: 'Employee Dashboard',
        subtitle: 'Go to dashboard',
        type: 'action',
        href: '/employee/dashboard',
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
          placeholder="Search my tickets, meetings, visitors..."
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
                      suggestion.type === 'ticket' && 'bg-orange-100 text-orange-600',
                      suggestion.type === 'meeting' && 'bg-green-100 text-green-600',
                      suggestion.type === 'visitor' && 'bg-purple-100 text-purple-600',
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


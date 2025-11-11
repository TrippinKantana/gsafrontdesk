'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import { Search, Ticket, User, ArrowRight, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  id: string;
  title: string;
  subtitle?: string;
  type: 'ticket' | 'staff' | 'action';
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function ITSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch tickets for IT dashboard
  const { data: tickets = [] } = trpc.ticket.getAll.useQuery(
    { status: 'all' },
    {
      enabled: isOpen && query.length > 0,
      retry: false,
    }
  );

  // Fetch staff for ticket assignment
  const { data: staff = [] } = trpc.staff.getAll.useQuery(undefined, {
    enabled: isOpen && query.length > 0,
  });

  // Generate suggestions based on query
  const suggestions: SearchSuggestion[] = [];

  if (query.length > 0) {
    const lowerQuery = query.toLowerCase();

    // Ticket suggestions
    tickets
      .filter((t) =>
        t.ticketNumber.toLowerCase().includes(lowerQuery) ||
        t.title.toLowerCase().includes(lowerQuery) ||
        t.createdBy.fullName.toLowerCase().includes(lowerQuery) ||
        (t.assignedTo && t.assignedTo.fullName.toLowerCase().includes(lowerQuery))
      )
      .slice(0, 6)
      .forEach((t) => {
        suggestions.push({
          id: `ticket-${t.id}`,
          title: t.title,
          subtitle: `${t.ticketNumber} • ${t.status} • ${t.priority} priority`,
          type: 'ticket',
          href: `/it/tickets`,
          icon: Ticket,
        });
      });

    // Staff suggestions (for assigning tickets)
    staff
      .filter((s) =>
        s.fullName.toLowerCase().includes(lowerQuery) ||
        s.email?.toLowerCase().includes(lowerQuery) ||
        s.department?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 4)
      .forEach((s) => {
        const subtitleValue = s.department ?? s.title ?? s.email;
        suggestions.push({
          id: `staff-${s.id}`,
          title: s.fullName,
          subtitle: subtitleValue ?? undefined,
          type: 'staff',
          href: '/it/tickets',
          icon: User,
        });
      });

    // Quick actions
    const actionKeywords = [
      { keywords: ['open', 'unassigned'], href: '/it/tickets?status=Open', title: 'View Open Tickets', icon: Ticket },
      { keywords: ['my tickets', 'assigned', 'my'], href: '/it/tickets?assignedToMe=true', title: 'My Assigned Tickets', icon: CheckCircle },
      { keywords: ['critical', 'urgent', 'high priority'], href: '/it/tickets?priority=Critical', title: 'Critical Tickets', icon: AlertTriangle },
      { keywords: ['dashboard', 'home'], href: '/it/dashboard', title: 'IT Dashboard', icon: ArrowRight },
      { keywords: ['tickets', 'all tickets'], href: '/it/tickets', title: 'All Tickets', icon: Ticket },
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
        id: 'action-open-tickets',
        title: 'View Open Tickets',
        subtitle: 'Unassigned tickets needing attention',
        type: 'action',
        href: '/it/tickets?status=Open',
        icon: Ticket,
      },
      {
        id: 'action-my-tickets',
        title: 'My Assigned Tickets',
        subtitle: 'Tickets assigned to you',
        type: 'action',
        href: '/it/tickets?assignedToMe=true',
        icon: CheckCircle,
      },
      {
        id: 'action-critical',
        title: 'Critical Tickets',
        subtitle: 'High priority issues',
        type: 'action',
        href: '/it/tickets?priority=Critical',
        icon: AlertTriangle,
      },
      {
        id: 'action-all-tickets',
        title: 'All Tickets',
        subtitle: 'View all support tickets',
        type: 'action',
        href: '/it/tickets',
        icon: Ticket,
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
          placeholder="Search tickets, staff, or quick actions..."
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
                      suggestion.type === 'staff' && 'bg-blue-100 text-blue-600',
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





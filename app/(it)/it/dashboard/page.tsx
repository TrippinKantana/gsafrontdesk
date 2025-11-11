'use client';

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function ITDashboardPage() {
  // Fetch metrics
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = trpc.ticket.getMetrics.useQuery(
    undefined,
    { 
      refetchInterval: 30000,
      retry: 2,
    }
  );

  if (metricsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Clock className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (metricsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-semibold mb-2">Error loading dashboard</p>
          <p className="text-gray-600 text-sm mb-4">{metricsError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">No metrics data available</p>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Open Tickets',
      value: metrics.totalOpen,
      icon: Ticket,
      color: 'bg-blue-100 text-blue-600',
      href: '/it/tickets?status=Open',
    },
    {
      title: 'In Progress',
      value: metrics.totalInProgress,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600',
      href: '/it/tickets?status=In+Progress',
    },
    {
      title: 'Resolved',
      value: metrics.totalResolved,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
      href: '/it/tickets?status=Resolved',
    },
    {
      title: 'Critical Open',
      value: metrics.criticalOpen,
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-600',
      href: '/it/tickets?priority=Critical',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">IT Support Dashboard</h1>
        <p className="text-gray-600 mt-1">Monitor and manage support tickets</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link key={metric.title} href={metric.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">{metric.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${metric.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Response Time */}
        <Card>
          <CardHeader>
            <CardTitle>Average Response Time</CardTitle>
            <CardDescription>Time to resolve tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">
              {metrics.avgResponseTimeHours}
              <span className="text-lg text-gray-600 font-normal ml-2">hours</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Based on resolved tickets
            </p>
          </CardContent>
        </Card>

        {/* Tickets by Department */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Department</CardTitle>
            <CardDescription>Distribution across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.ticketsByDepartment)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{dept}</span>
                    <span className="text-sm text-gray-600">{count} tickets</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump to common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/it/tickets?status=Open">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                <Ticket className="h-5 w-5 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">View Open Tickets</p>
                <p className="text-sm text-gray-600 mt-1">See all unassigned tickets</p>
              </div>
            </Link>

            <Link href="/it/tickets?assignedToMe=true">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer">
                <CheckCircle className="h-5 w-5 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">My Tickets</p>
                <p className="text-sm text-gray-600 mt-1">Tickets assigned to you</p>
              </div>
            </Link>

            <Link href="/it/tickets?priority=Critical">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                <AlertTriangle className="h-5 w-5 text-red-600 mb-2" />
                <p className="font-medium text-gray-900">Critical Tickets</p>
                <p className="text-sm text-gray-600 mt-1">High priority issues</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


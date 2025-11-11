'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, Users, Building2 } from 'lucide-react';

interface OverviewMetricsProps {
  data: {
    totalVisits: number;
    avgVisitDuration: number;
    peakCheckInHour: number;
    peakCheckInCount: number;
    topVisitors: Array<{ name: string; company: string; count: number }>;
    topCompanies: Array<{ company: string; count: number }>;
  } | undefined;
  isLoading: boolean;
}

export function OverviewMetrics({ data, isLoading }: OverviewMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalVisits}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Visit Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avgVisitDuration}</div>
            <p className="text-xs text-muted-foreground">minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Check-In Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(data.peakCheckInHour)}</div>
            <p className="text-xs text-muted-foreground">{data.peakCheckInCount} check-ins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Company</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.topCompanies[0]?.count || 0}</div>
            <p className="text-xs text-muted-foreground truncate">
              {data.topCompanies[0]?.company || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Visitors and Companies */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Frequent Visitors</CardTitle>
            <CardDescription>Most frequent visitors this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topVisitors.map((visitor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{visitor.name}</p>
                    <p className="text-xs text-muted-foreground">{visitor.company}</p>
                  </div>
                  <div className="text-sm font-bold text-blue-600">{visitor.count} visits</div>
                </div>
              ))}
              {data.topVisitors.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Companies</CardTitle>
            <CardDescription>Most visiting organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topCompanies.map((company, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{company.company}</p>
                  </div>
                  <div className="text-sm font-bold text-blue-600">{company.count} visits</div>
                </div>
              ))}
              {data.topCompanies.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


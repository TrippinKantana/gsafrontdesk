'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewMetrics } from '@/components/analytics/overview-metrics';
import { VisitorAnalyticsCharts } from '@/components/analytics/visitor-analytics-charts';
import { TrafficInsightsCharts } from '@/components/analytics/traffic-insights-charts';
import { Download, Calendar } from 'lucide-react';

// Force dynamic rendering - prevent static analysis
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Fetch analytics data with caching
  const { data: overviewData, isLoading: overviewLoading, error: overviewError } = trpc.analytics.getOverviewMetrics.useQuery(
    dateRange,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => {
        console.error('Overview metrics error:', error);
      },
    }
  );

  const { data: visitorData, isLoading: visitorLoading, error: visitorError } = trpc.analytics.getVisitorAnalytics.useQuery(
    dateRange,
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      onError: (error) => {
        console.error('Visitor analytics error:', error);
      },
    }
  );

  const { data: trafficData, isLoading: trafficLoading, error: trafficError } = trpc.analytics.getTrafficInsights.useQuery(
    dateRange,
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      onError: (error) => {
        console.error('Traffic insights error:', error);
      },
    }
  );

  // Debug logging
  console.log('Date Range:', dateRange);
  console.log('Overview Data:', overviewData);
  console.log('Visitor Data:', visitorData);
  console.log('Traffic Data:', trafficData);
  console.log('Errors:', { overviewError, visitorError, trafficError });

  const handleExport = () => {
    // Create CSV content
    const csvData = [
      ['Analytics Report'],
      ['Generated:', new Date().toLocaleString()],
      ['Date Range:', `${dateRange.startDate} to ${dateRange.endDate}`],
      [''],
      ['Overview Metrics'],
      ['Total Visits', overviewData?.totalVisits || 0],
      ['Avg Visit Duration (min)', overviewData?.avgVisitDuration || 0],
      ['Peak Check-In Hour', overviewData?.peakCheckInHour || 0],
      [''],
      ['Top Companies'],
      ['Company', 'Visits'],
      ...(overviewData?.topCompanies.map(c => [c.company, c.count]) || []),
      [''],
      ['Top Visitors'],
      ['Name', 'Company', 'Visits'],
      ...(overviewData?.topVisitors.map(v => [v.name, v.company, v.count]) || []),
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${dateRange.startDate}-${dateRange.endDate}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4 md:py-8 px-3 md:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Comprehensive visitor insights and metrics</p>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm" className="text-xs md:text-sm self-start sm:self-auto">
            <Download className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            Export Report
          </Button>
        </div>

        {/* Date Range Filter */}
        <Card className="mb-4 md:mb-6">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                  Date Range Filter
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">Select a date range to view analytics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div>
                <Label htmlFor="startDate" className="text-xs md:text-sm">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="text-xs md:text-sm"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-xs md:text-sm">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="text-xs md:text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs md:text-sm"
                  onClick={() => {
                    const now = new Date();
                    setDateRange({
                      startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
                      endDate: now.toISOString().split('T')[0],
                    });
                  }}
                >
                  This Month
                </Button>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs md:text-sm"
                  onClick={() => {
                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), 0, 1);
                    setDateRange({
                      startDate: firstDay.toISOString().split('T')[0],
                      endDate: now.toISOString().split('T')[0],
                    });
                  }}
                >
                  This Year
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="overview" className="text-xs md:text-sm py-2">Overview</TabsTrigger>
            <TabsTrigger value="visitors" className="text-xs md:text-sm py-2">Visitor Analytics</TabsTrigger>
            <TabsTrigger value="traffic" className="text-xs md:text-sm py-2">Traffic Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OverviewMetrics data={overviewData} isLoading={overviewLoading} />
          </TabsContent>

          <TabsContent value="visitors" className="space-y-4">
            <VisitorAnalyticsCharts data={visitorData} isLoading={visitorLoading} />
          </TabsContent>

          <TabsContent value="traffic" className="space-y-4">
            <TrafficInsightsCharts data={trafficData} isLoading={trafficLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


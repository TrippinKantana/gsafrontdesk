'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VisitorAnalyticsProps {
  data: {
    visitorTypes: Array<{ type: string; count: number }>;
    totalVisitors: number;
    repeatVisitors: number;
    newVisitors: number;
    mostVisitedEmployees: Array<{ name: string; count: number }>;
    topOrigins: Array<{ company: string; count: number }>;
  } | undefined;
  isLoading: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function VisitorAnalyticsCharts({ data, isLoading }: VisitorAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const repeatVsNewData = [
    { name: 'Repeat Visitors', value: data.repeatVisitors, color: '#3b82f6' },
    { name: 'New Visitors', value: data.newVisitors, color: '#10b981' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Visitor Types Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Visitor Types</CardTitle>
          <CardDescription>Distribution by visitor category</CardDescription>
        </CardHeader>
        <CardContent>
          {data.visitorTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.visitorTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.visitorTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No visitor type data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Repeat vs New Visitors */}
      <Card>
        <CardHeader>
          <CardTitle>Repeat vs New Visitors</CardTitle>
          <CardDescription>Visitor retention analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={repeatVsNewData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {repeatVsNewData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Most Visited Employees */}
      <Card>
        <CardHeader>
          <CardTitle>Most Visited Employees</CardTitle>
          <CardDescription>Top 10 employees by visitor count</CardDescription>
        </CardHeader>
        <CardContent>
          {data.mostVisitedEmployees.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.mostVisitedEmployees} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No employee visit data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Visitor Origins */}
      <Card>
        <CardHeader>
          <CardTitle>Top Visitor Origins</CardTitle>
          <CardDescription>Companies with most visits</CardDescription>
        </CardHeader>
        <CardContent>
          {data.topOrigins.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topOrigins}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="company" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No company data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const analyticsRouter = createTRPCRouter({
  // Overview metrics
  getOverviewMetrics: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        console.log('📊 Overview Metrics - Input:', input);
        const now = new Date();
        
        // Parse dates correctly - add time to end of day for endDate
        const startDate = input.startDate 
          ? new Date(input.startDate + 'T00:00:00.000Z') 
          : new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
        
        const endDate = input.endDate 
          ? new Date(input.endDate + 'T23:59:59.999Z') 
          : new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

        console.log('📊 Date Range:', { 
          startDate: startDate.toISOString(), 
          endDate: endDate.toISOString(),
          input 
        });

        // Get all visitors in date range with checkout times
        const visitors = await ctx.db.visitor.findMany({
          where: {
            checkInTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            id: true,
            checkInTime: true,
            checkOutTime: true,
            company: true,
            fullName: true,
            email: true,
          },
        });

        console.log('📊 Found visitors:', visitors.length);

        // Calculate average visit duration
        const visitorsWithCheckout = visitors.filter((v) => v.checkOutTime);
        const totalDuration = visitorsWithCheckout.reduce((sum, v) => {
          const duration = v.checkOutTime!.getTime() - v.checkInTime.getTime();
          return sum + duration;
        }, 0);
        const avgDurationMs = visitorsWithCheckout.length > 0 ? totalDuration / visitorsWithCheckout.length : 0;
        const avgDurationMinutes = Math.round(avgDurationMs / 1000 / 60);

        // Find peak check-in hour
        const hourCounts: Record<number, number> = {};
        visitors.forEach((v) => {
          const hour = v.checkInTime.getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        const peakHour = Object.entries(hourCounts).reduce(
          (max, [hour, count]) => (count > max.count ? { hour: parseInt(hour), count } : max),
          { hour: 0, count: 0 }
        );

        // Top 5 frequent visitors
        const visitorFrequency: Record<string, { name: string; company: string; count: number }> = {};
        visitors.forEach((v) => {
          const key = v.email.toLowerCase();
          if (!visitorFrequency[key]) {
            visitorFrequency[key] = { name: v.fullName, company: v.company, count: 0 };
          }
          visitorFrequency[key].count++;
        });
        const topVisitors = Object.values(visitorFrequency)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Top 5 companies
        const companyFrequency: Record<string, number> = {};
        visitors.forEach((v) => {
          const company = v.company;
          companyFrequency[company] = (companyFrequency[company] || 0) + 1;
        });
        const topCompanies = Object.entries(companyFrequency)
          .map(([company, count]) => ({ company, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        return {
          totalVisits: visitors.length,
          avgVisitDuration: avgDurationMinutes,
          peakCheckInHour: peakHour.hour,
          peakCheckInCount: peakHour.count,
          topVisitors,
          topCompanies,
        };
      } catch (error) {
        console.error('Error fetching overview metrics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch overview metrics',
        });
      }
    }),

  // Visitor analytics
  getVisitorAnalytics: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        console.log('👥 Visitor Analytics - Input:', input);
        const now = new Date();
        
        // Parse dates correctly - add time to end of day for endDate
        const startDate = input.startDate 
          ? new Date(input.startDate + 'T00:00:00.000Z') 
          : new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
        
        const endDate = input.endDate 
          ? new Date(input.endDate + 'T23:59:59.999Z') 
          : new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

        console.log('👥 Date Range:', { 
          startDate: startDate.toISOString(), 
          endDate: endDate.toISOString() 
        });

        const visitors = await ctx.db.visitor.findMany({
          where: {
            checkInTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            company: true,
            whomToSee: true,
            checkInTime: true,
          },
        });

        console.log('👥 Found visitors for analytics:', visitors.length);

        // Visitor types breakdown - default to "Client" since visitorType field may not exist yet
        const visitorTypes: Record<string, number> = {
          'Client': visitors.length, // Default all to Client for now
        };

        // Repeat vs new visitors
        const uniqueEmails = new Set<string>();
        const repeatVisitors = new Set<string>();
        visitors.forEach((v) => {
          const email = v.email.toLowerCase();
          if (uniqueEmails.has(email)) {
            repeatVisitors.add(email);
          }
          uniqueEmails.add(email);
        });

        // Most visited employees
        const employeeVisits: Record<string, number> = {};
        visitors.forEach((v) => {
          employeeVisits[v.whomToSee] = (employeeVisits[v.whomToSee] || 0) + 1;
        });
        const mostVisitedEmployees = Object.entries(employeeVisits)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Visitor origins (companies)
        const companyVisits: Record<string, number> = {};
        visitors.forEach((v) => {
          companyVisits[v.company] = (companyVisits[v.company] || 0) + 1;
        });
        const topOrigins = Object.entries(companyVisits)
          .map(([company, count]) => ({ company, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        return {
          visitorTypes: Object.entries(visitorTypes).map(([type, count]) => ({ type, count })),
          totalVisitors: uniqueEmails.size,
          repeatVisitors: repeatVisitors.size,
          newVisitors: uniqueEmails.size - repeatVisitors.size,
          mostVisitedEmployees,
          topOrigins,
        };
      } catch (error) {
        console.error('Error fetching visitor analytics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch visitor analytics',
        });
      }
    }),

  // Time and traffic insights
  getTrafficInsights: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        console.log('📈 Traffic Insights - Input:', input);
        const now = new Date();
        
        // Parse dates correctly - add time to end of day for endDate
        const startDate = input.startDate 
          ? new Date(input.startDate + 'T00:00:00.000Z') 
          : new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
        
        const endDate = input.endDate 
          ? new Date(input.endDate + 'T23:59:59.999Z') 
          : new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

        console.log('📈 Date Range:', { 
          startDate: startDate.toISOString(), 
          endDate: endDate.toISOString() 
        });

        const visitors = await ctx.db.visitor.findMany({
          where: {
            checkInTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            checkInTime: true,
          },
        });

        console.log('📈 Found visitors for traffic:', visitors.length);

        // Hourly check-in volume
        const hourlyVolume: Record<number, number> = {};
        for (let i = 0; i < 24; i++) {
          hourlyVolume[i] = 0;
        }
        visitors.forEach((v) => {
          const hour = v.checkInTime.getHours();
          hourlyVolume[hour]++;
        });

        // Day of week trends
        const dayOfWeek: Record<number, number> = {};
        for (let i = 0; i < 7; i++) {
          dayOfWeek[i] = 0;
        }
        visitors.forEach((v) => {
          const day = v.checkInTime.getDay();
          dayOfWeek[day]++;
        });

        // Daily traffic over time
        const dailyTraffic: Record<string, number> = {};
        visitors.forEach((v) => {
          const date = v.checkInTime.toISOString().split('T')[0];
          dailyTraffic[date] = (dailyTraffic[date] || 0) + 1;
        });
        const trafficTrend = Object.entries(dailyTraffic)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        return {
          hourlyVolume: Object.entries(hourlyVolume).map(([hour, count]) => ({
            hour: parseInt(hour),
            label: `${hour}:00`,
            count,
          })),
          dayOfWeekTrends: Object.entries(dayOfWeek).map(([day, count]) => ({
            day: dayNames[parseInt(day)],
            count,
          })),
          trafficTrend,
          totalVisits: visitors.length,
        };
      } catch (error) {
        console.error('Error fetching traffic insights:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch traffic insights',
        });
      }
    }),
});


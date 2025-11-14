import { createTRPCRouter } from '../trpc';
import { visitorRouter } from './visitor';
import { receptionistRouter } from './receptionist';
import { staffRouter } from './staff';
import { analyticsRouter } from './analytics';
import { companyRouter } from './company';
import { notificationRouter } from './notification';
import { employeeRouter } from './employee';
import { meetingRouter } from './meeting';
import { ticketRouter } from './ticket';
import { organizationRouter } from './organization';
import { projectRouter } from './project';

export const appRouter = createTRPCRouter({
  visitor: visitorRouter,
  receptionist: receptionistRouter,
  staff: staffRouter,
  analytics: analyticsRouter,
  company: companyRouter,
  notification: notificationRouter,
  employee: employeeRouter,
  meeting: meetingRouter,
  ticket: ticketRouter,
  organization: organizationRouter,
  project: projectRouter,
});

export type AppRouter = typeof appRouter;

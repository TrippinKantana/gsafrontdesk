import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/landing",
  "/visitor(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/select-organization",
  "/auto-select-org",
  "/no-organization",
  "/onboarding",
  "/employee/respond",
  "/help",
  "/api/trpc/visitor.create",
  "/api/trpc/visitor.search",
  "/api/trpc/visitor.checkoutPublic",
  "/api/trpc/staff.getActiveStaff",
  "/api/trpc/company.getSuggestions",
  "/api/trpc/employee.respondToVisitor",
  "/api/trpc/employee.getProfile",
]);

// Protected routes that require authentication
const protectedRoutes = createRouteMatcher([
  "/dashboard(.*)",
  "/employee(.*)",
  "/it(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId } = await auth();
  const { pathname } = req.nextUrl;
  
  console.log('[Middleware]', { 
    pathname, 
    userId: !!userId, 
    orgId: orgId || 'None',
    isPublic: isPublicRoute(req),
    isProtected: protectedRoutes(req)
  });
  
  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // Require authentication for protected routes
  if (!userId) {
    console.log('[Middleware] No userId, redirecting to /sign-in');
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }
  
  // Allow access to protected routes even without orgId
  // Dashboard will handle organization activation automatically
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};

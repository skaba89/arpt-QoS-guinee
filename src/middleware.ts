import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Middleware: Centralized Route Protection
// Enforces authentication on all routes except whitelisted public ones.
// This is the safety net — even if an API route forgets getServerSession(),
// the middleware will block unauthenticated access.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Routes that DON'T require authentication
const PUBLIC_ROUTES = [
  "/api/auth",        // NextAuth endpoints (signin, signout, session)
  "/api/health",      // Health check endpoint
  "/api/scoring",     // Public scoring data (intentionally public)
  "/login",           // Login page
  "/",                // Home page (has its own auth gate via LoginModal)
];

// Routes accessible to PUBLIC role (unauthenticated users)
// These endpoints handle their own RLS filtering for public data
const PUBLIC_API_ROUTES = [
  "/api/map",         // Map data (public-only scope applied in handler)
  "/api/search",      // Search (public-only scope applied in handler)
  "/api/reports",     // Reports (only isPublic=true returned)
  "/api/dashboard",   // Dashboard (public-only scope applied in handler)
  "/api/scores",      // Scores (public-only scope applied in handler)
];

// Routes requiring SUPER_ADMIN role
const ADMIN_ONLY_ROUTES = [
  "/api/users",       // User management
  "/api/roles",       // Role management
  "/api/admin",       // Admin stats
  "/api/audit-logs",  // Audit logs
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, _next, favicon, etc.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") // Static files (images, etc.)
  ) {
    return NextResponse.next();
  }

  // Allow public routes without any check
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Get JWT token (without DB call — fast)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV !== "production" ? "dev-only-secret-do-not-use-in-production" : undefined),
  });

  // For API routes that allow PUBLIC access (with RLS filtering in handler)
  if (pathname.startsWith("/api/") && isPublicApiRoute(pathname)) {
    if (!token) {
      // Add a header so the handler knows this is an unauthenticated request
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-auth-role", "PUBLIC");
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }
    // Authenticated user — pass role info in header
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-auth-role", (token.role as string) || "PUBLIC");
    requestHeaders.set("x-auth-user-id", (token.id as string) || "");
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // All other routes require authentication
  if (!token) {
    // API routes get 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }
    // Page routes redirect to home (which shows login modal)
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check admin-only routes
  if (isAdminRoute(pathname)) {
    const role = token.role as string;
    if (role !== "SUPER_ADMIN" && role !== "DG") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Accès réservé aux administrateurs" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Add auth info to request headers for downstream handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-auth-role", (token.role as string) || "PUBLIC");
  requestHeaders.set("x-auth-user-id", (token.id as string) || "");

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

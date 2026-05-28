import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ONIT-PNG Production Proxy (Next.js 16 middleware)
// Auth enforcement, rate limiting, security headers, CORS, logging
//
// SECURITY: This is the centralized auth gate.
// Even if an API route forgets getServerSession(), the proxy blocks
// unauthenticated access. Routes must explicitly opt-in to public access.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── Route classification ───

// Routes that DON'T require authentication (NextAuth, health, static pages)
const PUBLIC_ROUTES = [
  '/api/auth',        // NextAuth endpoints (signin, signout, session)
  '/api/health',      // Public health check
  '/api/scoring',     // Public scoring data (intentionally public)
  '/login',           // Login page
];

// API routes accessible to unauthenticated users (handlers apply RLS filtering)
const PUBLIC_API_ROUTES = [
  '/api/map',         // Map data (public-only scope in handler)
  '/api/search',      // Search (public-only scope in handler)
  '/api/reports',     // Reports (only isPublic=true returned)
  '/api/dashboard',   // Dashboard (public-only scope in handler)
  '/api/scores',      // Scores (public-only scope in handler)
];

// Routes requiring SUPER_ADMIN or DG role
const ADMIN_ONLY_ROUTES = [
  '/api/users',
  '/api/roles',
  '/api/admin',
  '/api/audit-logs',
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

// ─── Login rate limiter (strict: 5 attempts / 15 min) ───
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// ─── API rate limiter (100 requests / min per IP+path) ───
const apiRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const API_RATE_LIMIT = 100;
const API_RATE_WINDOW = 60 * 1000;

// ─── Cleanup stale entries every 5 minutes ───
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, data] of loginAttempts.entries()) {
    if (now > data.resetTime) loginAttempts.delete(key);
  }
  for (const [key, data] of apiRateLimitMap.entries()) {
    if (now > data.resetTime) apiRateLimitMap.delete(key);
  }
}

function isLoginRateLimited(ip: string): boolean {
  cleanupExpired();
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + LOGIN_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_LOGIN_ATTEMPTS;
}

function isApiRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = apiRateLimitMap.get(key);
  if (!entry || now > entry.resetTime) {
    apiRateLimitMap.set(key, { count: 1, resetTime: now + API_RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > API_RATE_LIMIT;
}

// ─── Security headers ───
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://unpkg.com; connect-src 'self' https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org;",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow public routes without auth check
  if (isPublicRoute(pathname)) {
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value);
    }
    return response;
  }

  const startTime = Date.now();

  // ─── Authentication check (centralized) ───
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV !== "production" ? "dev-only-secret-do-not-use-in-production" : undefined),
  });

  // For API routes that allow PUBLIC access (with RLS filtering in handler)
  if (pathname.startsWith('/api/') && isPublicApiRoute(pathname)) {
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value);
    }
    // Pass role info to handler via custom headers
    const role = token ? (token.role as string) || 'PUBLIC' : 'PUBLIC';
    const userId = token ? (token.id as string) || '' : '';
    response.headers.set('x-auth-role', role);
    response.headers.set('x-auth-user-id', userId);
    return response;
  }

  // All other routes require authentication
  if (!token) {
    // API routes get 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }
    // Page routes redirect to home (which shows login modal)
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ─── Role-based access: Admin-only routes ───
  if (isAdminRoute(pathname)) {
    const role = token.role as string;
    if (role !== 'SUPER_ADMIN' && role !== 'DG') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Accès réservé aux administrateurs' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ─── Security headers on all authenticated responses ───
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Pass auth info to downstream handlers
  response.headers.set('x-auth-role', (token.role as string) || 'PUBLIC');
  response.headers.set('x-auth-user-id', (token.id as string) || '');

  // ─── Login rate limiting (strict) ───
  if (pathname === '/api/auth/callback/credentials' && request.method === 'POST') {
    const ip =
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      'unknown';
    if (isLoginRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
        { status: 429 }
      );
    }
  }

  // ─── API routes: rate limit + CORS + logging ───
  if (pathname.startsWith('/api/')) {
    const ip =
      (request as unknown as { ip?: string }).ip ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      'unknown';
    const key = `${ip}:${pathname}`;

    if (isApiRateLimited(key)) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // CORS headers — restricted to known origins only
    const ALLOWED_ORIGINS = [
      'http://localhost:3000',
      'https://onit.arpt.gn',
      'https://arpt-guinee.gn',
    ];
    const origin = request.headers.get('origin');
    const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');

    // Preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // API request logging
    const duration = Date.now() - startTime;
    console.log(`[API] ${request.method} ${pathname} - ${duration}ms - IP:${ip}`);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|logo.svg).*)'],
};

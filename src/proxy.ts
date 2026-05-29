import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ONIT-PNG Production Proxy (Next.js 16 middleware)
// Rate limiting, security headers, CORS, logging
//
// NOTE: Auth is handled by each API route via getServerSession().
// The proxy does NOT call getToken() to avoid server crashes.
// Each API route already has its own auth check — the proxy
// just adds security headers, rate limiting, and CORS.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
  'X-Frame-Options': 'ALLOWALL',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://unpkg.com; connect-src 'self' https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org; frame-ancestors 'self' https://*.space.chatglm.site https://*.space-z.ai;",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const startTime = Date.now();
  const response = NextResponse.next();

  // ─── Security headers on all responses ───
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

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
      'https://preview-chat-1c5a029f-d700-4278-8e9f-bc42658bff19.space-z.ai',
    ];
    const origin = request.headers.get('origin');
    // Also allow any space-z.ai or space.chatglm.site subdomain for preview
    const isPreviewOrigin = origin && (
      origin.endsWith('.space-z.ai') ||
      origin.endsWith('.space.chatglm.site')
    );
    const allowedOrigin = (origin && (ALLOWED_ORIGINS.includes(origin) || isPreviewOrigin)) ? origin : ALLOWED_ORIGINS[0];
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

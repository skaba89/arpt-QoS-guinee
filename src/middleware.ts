import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ───────────────────────────────────────────────────────────
// In-memory rate limiter for login attempts
// Stores: IP -> { count, resetTime }
// ───────────────────────────────────────────────────────────
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [ip, data] of loginAttempts.entries()) {
    if (now > data.resetTime) {
      loginAttempts.delete(ip);
    }
  }
}

function isRateLimited(ip: string): boolean {
  cleanupExpired();
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + LOGIN_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > MAX_LOGIN_ATTEMPTS) {
    return true;
  }
  return false;
}

// ───────────────────────────────────────────────────────────
// Security headers to add to all responses
// ───────────────────────────────────────────────────────────
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers to all responses
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Rate limit login attempts
  if (request.nextUrl.pathname === "/api/auth/callback/credentials" && request.method === "POST") {
    const ip =
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Trop de tentatives de connexion. Réessayez dans 15 minutes." },
        { status: 429 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all API routes and pages
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|logo.svg).*)",
  ],
};

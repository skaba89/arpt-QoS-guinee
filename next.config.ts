import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking — only allow same-origin framing
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevent MIME type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Control referrer information sent with requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict browser features (camera, microphone, geolocation)
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  // Force HTTPS for 2 years including subdomains
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Content Security Policy — restrict resource loading
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline and unsafe-eval for SSR hydration
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Tailwind CSS requires unsafe-inline
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://unpkg.com",
      "connect-src 'self' https://*.tile.openstreetmap.org https://unpkg.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  // Cross-origin policies
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // SECURITY: Do NOT ignore TypeScript errors in production builds
  typescript: {
    ignoreBuildErrors: false,
  },
  // Enable React strict mode to catch potential bugs during development
  reactStrictMode: true,
  serverExternalPackages: ["bcryptjs"],
  // Enable standalone output for production - much less memory
  output: "standalone",
  // Remove X-Powered-By header to avoid framework fingerprinting
  poweredByHeader: false,
  // Allow cross-origin requests in dev mode (for preview iframe and external IP access)
  allowedDevOrigins: [
    "http://21.0.12.210:3000",
    "http://localhost:3000",
  ],
  // SECURITY: Add security headers to all responses
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

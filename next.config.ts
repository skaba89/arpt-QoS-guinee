import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SECURITY: Do NOT ignore TypeScript errors in production builds
  // ignoreBuildErrors was previously true which allowed type-unsafe code to deploy
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
};

export default nextConfig;

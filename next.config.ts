import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["bcryptjs"],
  // Enable standalone output for production - much less memory
  output: "standalone",
};

export default nextConfig;

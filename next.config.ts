import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output to frontend/.next so Vercel finds it (root dir set to 'frontend' in dashboard)
  distDir: process.env.VERCEL ? 'frontend/.next' : '.next',

  // Proxy API calls to backend service
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL || "http://localhost:3001"}/api/:path*`,
      },
    ];
  },

  // Exclude backend directory from compilation
  typescript: {
    ignoreBuildErrors: false,
  },

  // Optimize for production
  poweredByHeader: false,
  compress: true,

};

export default nextConfig;

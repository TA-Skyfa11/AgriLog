import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_ONESIGNAL_APP_ID: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || 'ea883b31-5842-47d8-adad-ae1c2da2e037',
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'jspdf', 'jspdf-autotable', 'date-fns'],
  },
  async rewrites() {
    const backendUrl = (
      process.env.BACKEND_INTERNAL_URL ||
      process.env.BACKEND_URL ||
      'http://127.0.0.1:5000/api'
    ).replace(/\/$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;

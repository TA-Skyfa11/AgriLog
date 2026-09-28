import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_ONESIGNAL_APP_ID: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || 'ea883b31-5842-47d8-adad-ae1c2da2e037',
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'jspdf', 'jspdf-autotable', 'date-fns'],
  },
};

export default nextConfig;

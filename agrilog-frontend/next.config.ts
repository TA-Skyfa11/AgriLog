import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'jspdf', 'jspdf-autotable', 'date-fns'],
  },
};

export default nextConfig;

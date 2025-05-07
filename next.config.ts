import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/_localstack/:path*',
        destination: 'http://localhost:4566/_localstack/:path*',
      },
    ];
  },
};

export default nextConfig;

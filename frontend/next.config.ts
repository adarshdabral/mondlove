import type { NextConfig } from 'next'

const API_URL = process.env.API_URL ?? 'http://localhost:4000'

const nextConfig: NextConfig = {
  // The browser talks to /api on the same origin; Next proxies to the Express API.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }]
  },
}

export default nextConfig

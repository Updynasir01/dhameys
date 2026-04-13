/** @type {import('next').NextConfig} */
const nextConfig = {
  // For cPanel deployment — generates static files in /out
  // Switch to 'standalone' if using Node.js on cPanel
  output: process.env.EXPORT_MODE === 'static' ? 'export' : 'standalone',

  trailingSlash: true,

  images: {
    // For static export, use unoptimized
    unoptimized: process.env.EXPORT_MODE === 'static',
    domains: ['dhameys.com', 'cdn.dhameys.com'],
  },

  env: {
    NEXT_PUBLIC_API_URL:           process.env.NEXT_PUBLIC_API_URL           || 'http://localhost:5000',
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
    NEXT_PUBLIC_GOOGLE_MAPS_KEY:   process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY   || '',
    NEXT_PUBLIC_APP_NAME:          'Dhameys Airlines',
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  async rewrites() {
    if (process.env.EXPORT_MODE === 'static') return [];
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

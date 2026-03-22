const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
];

const cspHeader = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://mc.yandex.ru https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com; connect-src 'self' https://mc.yandex.ru; frame-src 'self' https://www.google.com https://www.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests;",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [...securityHeaders, ...cspHeader],
      },
    ];
  },
};

module.exports = nextConfig;

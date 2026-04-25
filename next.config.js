const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  images: {
    domains: ['localhost', '37.143.13.196', 'zabor-i-naves.ru'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.zabor-i-naves.ru',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  compress: true,
  
  poweredByHeader: false,
  
  generateEtags: true,
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.zabor-i-naves.ru',
          },
        ],
        destination: 'https://zabor-i-naves.ru/:path*',
        permanent: true,
      },
      {
        source: '/services/zabory-iz-profnastila',
        destination: '/services/zabor-iz-profnastila',
        permanent: true,
      },
      {
        source: '/services/evroshtaketnik',
        destination: '/services/zabor-iz-evroshtaketnika',
        permanent: true,
      },
      {
        source: '/services/zabory-iz-3d-panelej',
        destination: '/services/zabor-iz-3d-panelej',
        permanent: true,
      },
      {
        source: '/services/zabory-iz-setki-rabitsy',
        destination: '/services/zabor-iz-setki-rabitsy',
        permanent: true,
      },
      {
        source: '/services/navesy-dlya-avto',
        destination: '/services/naves-pod-mashinu',
        permanent: true,
      },
      {
        source: '/services/navesy-iz-polikarbonata',
        destination: '/services/naves-iz-polikarbonata',
        permanent: true,
      },
    ];
  },

  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'docx', 'xlsx', 'jspdf'],
    instrumentationHook: true,
    serverComponentsExternalPackages: ['undici'],
  },
};

module.exports = nextConfig;

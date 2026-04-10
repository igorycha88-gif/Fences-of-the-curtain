import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zabor-i-naves.ru';

  return {
    rules: [
      {
        userAgent: 'Yandex',
        allow: '/',
        disallow: ['/admin', '/api/auth', '/api/admin'],
        crawlDelay: 1,
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/auth', '/api/admin'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

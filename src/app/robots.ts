import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zabor-i-naves.ru';

  return {
    rules: [
      {
        userAgent: 'Yandex',
        allow: '/',
        // /api целиком: API-эндпоинты не должны индексироваться (SEO-фикс по книгам)
        disallow: ['/admin', '/api'],
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
      // AEO (ai-seo): осознанная политика для ИИ-ботов — группы по назначению.
      // Search-discovery: питают ответы ИИ-поиска (ChatGPT Search, Perplexity, Claude)
      { userAgent: ['OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot'], allow: '/', disallow: ['/admin', '/api'] },
      // User-triggered retrieval: заход по действию пользователя (не автоматический обход)
      { userAgent: ['ChatGPT-User', 'Claude-User', 'Perplexity-User'], allow: '/', disallow: ['/admin', '/api'] },
      // Model training: обучение моделей — контент публичный, цитируемость важнее
      { userAgent: ['GPTBot', 'ClaudeBot'], allow: '/', disallow: ['/admin', '/api'] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

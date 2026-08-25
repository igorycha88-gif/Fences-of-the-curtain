import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const findManyMock = jest.fn();
const loggerErrorMock = jest.fn();

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    blogPost: { findMany: (...args: unknown[]) => findManyMock(...args) },
    portfolioItem: { findMany: (...args: unknown[]) => findManyMock(...args) },
    pageContent: { findMany: (...args: unknown[]) => findManyMock(...args) },
  },
}));

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

describe('sitemap error logging', () => {
  beforeEach(() => {
    findManyMock.mockReset();
    loggerErrorMock.mockReset();
    jest.resetModules();
  });

  it('returns geo pages and logs error when database fails', async () => {
    findManyMock.mockRejectedValue(new Error('db unavailable'));

    const sitemapModule = await import('../src/app/sitemap');
    const result = await sitemapModule.default();

    const paths = result.map((item: any) => item.url.replace('https://zabor-i-naves.ru', ''));
    expect(paths).toContain('/zabory-navesy/balashiha');
    expect(paths).toContain('/navesy-pod-klyuch');

    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
    const payload = loggerErrorMock.mock.calls[0] as unknown[];
    expect(String(payload[0])).toContain('database');
    expect(payload[1]).toMatchObject({
      module: 'sitemap',
      operation: 'loadDynamicPages',
    });
  });
});

import type { Browser, Page } from 'playwright-core';
import { prisma } from '@/lib/prisma';
import { parseGoogleSerp, parseYandexSerp, findSiteInResults } from './serpParser';

const DOMAIN = 'zabor-i-naves.ru';

type LaunchFn = (options?: Record<string, unknown>) => Promise<Browser>;

let cachedLaunch: LaunchFn | null | undefined = undefined;

async function getLaunchFn(): Promise<LaunchFn | null> {
  if (cachedLaunch !== undefined) return cachedLaunch;
  try {
    const mod = await import(/* webpackIgnore: true */ 'cloakbrowser');
    cachedLaunch = mod.launch;
    return cachedLaunch;
  } catch {
    console.warn('[PositionCollector] CloakBrowser module not available');
    cachedLaunch = null;
    return null;
  }
}

function getIntEnv(key: string, defaultValue: number): number {
  const val = process.env[key];
  if (!val) return defaultValue;
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

export class PositionCollector {
  private maxResults: number;
  private timeout: number;
  private delayMs: number;
  private headless: boolean;
  private proxy: string | undefined;

  constructor() {
    this.maxResults = getIntEnv('SEO_PARSER_MAX_RESULTS', 100);
    this.timeout = getIntEnv('SEO_PARSER_TIMEOUT', 30000);
    this.delayMs = getIntEnv('SEO_PARSER_DELAY', 3000);
    this.headless = process.env.SEO_PARSER_HEADLESS !== 'false';
    this.proxy = process.env.SEO_PROXY || undefined;
  }

  async collectAll(): Promise<{
    checked: number;
    errors: number;
    skipped: number;
  }> {
    const keywords = await prisma.seoKeyword.findMany({
      where: { active: true },
      orderBy: [{ searchEngine: 'asc' }, { keyword: 'asc' }],
    });

    if (keywords.length === 0) {
      return { checked: 0, errors: 0, skipped: 0 };
    }

    const launch = await getLaunchFn();
    if (!launch) {
      console.warn('[PositionCollector] CloakBrowser unavailable, skipping all keywords');
      return { checked: 0, errors: 0, skipped: keywords.length };
    }

    let browser: Browser | null = null;

    try {
      browser = await this.launchBrowser(launch);
    } catch (error) {
      console.error('[PositionCollector] Failed to launch CloakBrowser:', error);
      return { checked: 0, errors: 0, skipped: keywords.length };
    }

    let checked = 0;
    let errors = 0;
    let skipped = 0;

    try {
      for (let i = 0; i < keywords.length; i++) {
        if (i > 0) {
          await this.delay(this.delayMs);
        }

        const kw = keywords[i];
        let page: Page | null = null;

        try {
          page = await browser.newPage();
          const result = await this.scrapeKeyword(page, kw.keyword, kw.searchEngine);

          await prisma.seoPosition.create({
            data: {
              keywordId: kw.id,
              position: result.position,
              url: result.url || null,
              title: result.title || null,
              snippet: result.snippet || null,
              found: result.found,
            },
          });

          checked++;
          console.log(
            `[PositionCollector] "${kw.keyword}" (${kw.searchEngine}): pos=${result.position}, found=${result.found}`
          );
        } catch (error) {
          errors++;
          console.error(
            `[PositionCollector] Error for "${kw.keyword}" (${kw.searchEngine}):`,
            error
          );
        } finally {
          if (page) {
            await page.close().catch(() => {});
          }
        }
      }
    } finally {
      await browser.close().catch(() => {});
    }

    return { checked, errors, skipped };
  }

  async collectForKeyword(
    keyword: string,
    searchEngine: string
  ): Promise<{
    position: number;
    url?: string;
    title?: string;
    snippet?: string;
    found: boolean;
  }> {
    const launch = await getLaunchFn();
    if (!launch) {
      console.warn('[PositionCollector] CloakBrowser unavailable');
      return { position: 0, found: false };
    }

    let browser: Browser | null = null;
    try {
      browser = await this.launchBrowser(launch);
      const page = await browser.newPage();
      return await this.scrapeKeyword(page, keyword, searchEngine);
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  private async scrapeKeyword(
    page: Page,
    keyword: string,
    searchEngine: string
  ): Promise<{
    position: number;
    url?: string;
    title?: string;
    snippet?: string;
    found: boolean;
  }> {
    const url = this.buildSearchUrl(keyword, searchEngine);

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: this.timeout,
    });

    const waitSelector =
      searchEngine === 'yandex'
        ? 'li.serp-item, [class*="serp-item"], main, #search-result'
        : 'div#rso, div.g, #main';

    try {
      await page.waitForSelector(waitSelector, { timeout: 15000 });
    } catch {
      console.warn(
        `[PositionCollector] Wait selector not found for "${keyword}" (${searchEngine}), proceeding with parse`
      );
    }

    const parsed =
      searchEngine === 'yandex'
        ? await parseYandexSerp(page)
        : await parseGoogleSerp(page);

    if (parsed.captcha) {
      console.warn(
        `[PositionCollector] CAPTCHA detected for "${keyword}" (${searchEngine})`
      );
      return { position: 0, found: false };
    }

    const siteResult = findSiteInResults(parsed.results, DOMAIN);

    if (!siteResult) {
      return { position: 0, found: false };
    }

    return {
      position: siteResult.position,
      url: siteResult.url,
      title: siteResult.title,
      snippet: siteResult.snippet,
      found: true,
    };
  }

  private buildSearchUrl(keyword: string, searchEngine: string): string {
    const encodedQuery = encodeURIComponent(keyword);

    if (searchEngine === 'yandex') {
      return `https://yandex.ru/search/?text=${encodedQuery}&lr=213`;
    }

    return `https://www.google.ru/search?q=${encodedQuery}&hl=ru&gl=ru&num=${this.maxResults}`;
  }

  private async launchBrowser(launch: LaunchFn): Promise<Browser> {
    const options: Record<string, unknown> = {
      headless: this.headless,
      humanize: true,
      locale: 'ru-RU',
      timezone: 'Europe/Moscow',
      args: ['--fingerprint=42'],
    };

    if (this.proxy) {
      options.proxy = this.proxy;
    }

    return await launch(options);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const positionCollector = new PositionCollector();

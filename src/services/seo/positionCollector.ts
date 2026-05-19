import type { Browser, Page } from 'playwright-core';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { parseGoogleSerp, parseYandexSerp, findSiteInResults } from './serpParser';

const DOMAIN = 'zabor-i-naves.ru';

const BATCH_COUNT = 4;
const BATCH_PAUSE_MS = 2.5 * 60 * 60 * 1000;
const SESSION_TTL_S = 12 * 60 * 60;
const SESSION_KEY = 'seo:collection:session';
const DEFAULT_DELAY_MS = 20000;

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

function chunkArray<T>(arr: T[], chunkCount: number): T[][] {
  const result: T[][] = [];
  const size = Math.ceil(arr.length / chunkCount);
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export interface BatchResult {
  batchIndex: number;
  checked: number;
  errors: number;
  skipped: number;
  blocked: number;
  duration: number;
}

export interface CollectionResult {
  checked: number;
  errors: number;
  skipped: number;
  blocked: number;
  totalBatches: number;
  completedBatches: number;
  currentBatch: number;
  totalKeywords: number;
  duration: number;
  batchResults: BatchResult[];
}

interface SessionData {
  totalBatches: number;
  completedBatches: number;
  totalKeywords: number;
  batchResults: BatchResult[];
  startedAt: number;
}

export class PositionCollector {
  private maxResults: number;
  private timeout: number;
  private delayMs: number;
  private headless: boolean;
  private proxy: string | undefined;
  private batchPauseMs: number;

  constructor() {
    this.maxResults = getIntEnv('SEO_PARSER_MAX_RESULTS', 100);
    this.timeout = getIntEnv('SEO_PARSER_TIMEOUT', 30000);
    this.delayMs = getIntEnv('SEO_PARSER_DELAY', DEFAULT_DELAY_MS);
    this.headless = process.env.SEO_PARSER_HEADLESS !== 'false';
    this.proxy = process.env.SEO_PROXY || undefined;
    this.batchPauseMs = getIntEnv('SEO_BATCH_PAUSE_MS', BATCH_PAUSE_MS);
  }

  async collectAll(): Promise<CollectionResult> {
    const keywords = await prisma.seoKeyword.findMany({
      where: { active: true },
      orderBy: [{ searchEngine: 'asc' }, { keyword: 'asc' }],
    });

    if (keywords.length === 0) {
      return {
        checked: 0, errors: 0, skipped: 0, blocked: 0,
        totalBatches: 0, completedBatches: 0, currentBatch: 0,
        totalKeywords: 0, duration: 0, batchResults: [],
      };
    }

    const batches = chunkArray(keywords, BATCH_COUNT);
    const startedAt = Date.now();
    const batchResults: BatchResult[] = [];

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      if (batchIdx > 0) {
        const pauseMin = (this.batchPauseMs / 60000).toFixed(0);
        console.log(
          `[PositionCollector] Pause before batch ${batchIdx + 1}/${batches.length}: ${pauseMin} min`
        );
        await this.delay(this.batchPauseMs);
      }

      console.log(
        `[PositionCollector] Starting batch ${batchIdx + 1}/${batches.length} (${batches[batchIdx].length} keywords)`
      );

      const batchStart = Date.now();
      const result = await this.collectBatch(batches[batchIdx], batchIdx);
      const batchResult: BatchResult = {
        batchIndex: batchIdx,
        checked: result.checked,
        errors: result.errors,
        skipped: result.skipped,
        blocked: result.blocked,
        duration: Date.now() - batchStart,
      };
      batchResults.push(batchResult);

      await this.saveSession({
        totalBatches: batches.length,
        completedBatches: batchIdx + 1,
        totalKeywords: keywords.length,
        batchResults,
        startedAt,
      });

      console.log(
        `[PositionCollector] Batch ${batchIdx + 1}/${batches.length} done: checked=${result.checked}, errors=${result.errors}, skipped=${result.skipped}, blocked=${result.blocked}`
      );
    }

    await redis.del(SESSION_KEY);

    const total = batchResults.reduce(
      (acc, r) => ({
        checked: acc.checked + r.checked,
        errors: acc.errors + r.errors,
        skipped: acc.skipped + r.skipped,
        blocked: acc.blocked + r.blocked,
      }),
      { checked: 0, errors: 0, skipped: 0, blocked: 0 }
    );

    return {
      ...total,
      totalBatches: batches.length,
      completedBatches: batches.length,
      currentBatch: batches.length,
      totalKeywords: keywords.length,
      duration: Date.now() - startedAt,
      batchResults,
    };
  }

  async startBatchSession(): Promise<CollectionResult> {
    const existing = await this.getSession();
    if (existing && existing.completedBatches < existing.totalBatches) {
      console.log('[PositionCollector] Resuming existing session');
      return this.resumeSession();
    }

    const keywords = await prisma.seoKeyword.findMany({
      where: { active: true },
      orderBy: [{ searchEngine: 'asc' }, { keyword: 'asc' }],
    });

    if (keywords.length === 0) {
      return {
        checked: 0, errors: 0, skipped: 0, blocked: 0,
        totalBatches: 0, completedBatches: 0, currentBatch: 0,
        totalKeywords: 0, duration: 0, batchResults: [],
      };
    }

    const batches = chunkArray(keywords, BATCH_COUNT);
    const startedAt = Date.now();

    await this.saveSession({
      totalBatches: batches.length,
      completedBatches: 0,
      totalKeywords: keywords.length,
      batchResults: [],
      startedAt,
    });

    return this.runSessionBatches(batches, 0, startedAt);
  }

  async resumeSession(): Promise<CollectionResult> {
    const session = await this.getSession();
    if (!session) {
      console.log('[PositionCollector] No session to resume, starting new');
      return this.startBatchSession();
    }

    if (session.completedBatches >= session.totalBatches) {
      console.log('[PositionCollector] Session already completed');
      await redis.del(SESSION_KEY);

      const total = session.batchResults.reduce(
        (acc, r) => ({
          checked: acc.checked + r.checked,
          errors: acc.errors + r.errors,
          skipped: acc.skipped + r.skipped,
          blocked: acc.blocked + r.blocked,
        }),
        { checked: 0, errors: 0, skipped: 0, blocked: 0 }
      );

      return {
        ...total,
        totalBatches: session.totalBatches,
        completedBatches: session.completedBatches,
        currentBatch: session.totalBatches,
        totalKeywords: session.totalKeywords,
        duration: Date.now() - session.startedAt,
        batchResults: session.batchResults,
      };
    }

    const keywords = await prisma.seoKeyword.findMany({
      where: { active: true },
      orderBy: [{ searchEngine: 'asc' }, { keyword: 'asc' }],
    });

    const batches = chunkArray(keywords, BATCH_COUNT);
    const resumeFrom = session.completedBatches;

    console.log(
      `[PositionCollector] Resuming from batch ${resumeFrom + 1}/${batches.length}`
    );

    return this.runSessionBatches(batches, resumeFrom, session.startedAt, session.batchResults);
  }

  private async runSessionBatches(
    batches: { keyword: string; searchEngine: string; id: string }[][],
    startFrom: number,
    startedAt: number,
    existingResults: BatchResult[] = []
  ): Promise<CollectionResult> {
    const batchResults = [...existingResults];

    try {
      for (let batchIdx = startFrom; batchIdx < batches.length; batchIdx++) {
        if (batchIdx > 0) {
          const pauseMin = (this.batchPauseMs / 60000).toFixed(0);
          console.log(
            `[PositionCollector] Pause before batch ${batchIdx + 1}/${batches.length}: ${pauseMin} min`
          );
          await this.delay(this.batchPauseMs);
        }

        console.log(
          `[PositionCollector] Starting batch ${batchIdx + 1}/${batches.length} (${batches[batchIdx].length} keywords)`
        );

        const batchStart = Date.now();
        const result = await this.collectBatch(batches[batchIdx], batchIdx);
        const batchResult: BatchResult = {
          batchIndex: batchIdx,
          checked: result.checked,
          errors: result.errors,
          skipped: result.skipped,
          blocked: result.blocked,
          duration: Date.now() - batchStart,
        };
        batchResults.push(batchResult);

        await this.saveSession({
          totalBatches: batches.length,
          completedBatches: batchIdx + 1,
          totalKeywords: batches.reduce((s, b) => s + b.length, 0),
          batchResults,
          startedAt,
        });

        console.log(
          `[PositionCollector] Batch ${batchIdx + 1}/${batches.length} done: checked=${result.checked}, errors=${result.errors}`
        );
      }
    } catch (error) {
      console.error('[PositionCollector] Session error, cleaning up Redis:', error);
      await redis.del(SESSION_KEY).catch(() => {});
      throw error;
    }

    await redis.del(SESSION_KEY);

    const total = batchResults.reduce(
      (acc, r) => ({
        checked: acc.checked + r.checked,
        errors: acc.errors + r.errors,
        skipped: acc.skipped + r.skipped,
        blocked: acc.blocked + r.blocked,
      }),
      { checked: 0, errors: 0, skipped: 0, blocked: 0 }
    );

    return {
      ...total,
      totalBatches: batches.length,
      completedBatches: batches.length,
      currentBatch: batches.length,
      totalKeywords: batches.reduce((s, b) => s + b.length, 0),
      duration: Date.now() - startedAt,
      batchResults,
    };
  }

  async getSessionStatus(): Promise<SessionData | null> {
    return this.getSession();
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
      return await this.scrapeKeyword(page, keyword, searchEngine).then((r) => ({
        position: r.position,
        url: r.url,
        title: r.title,
        snippet: r.snippet,
        found: r.found,
      }));
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  private async collectBatch(
    keywords: { keyword: string; searchEngine: string; id: string }[],
    batchIndex: number
  ): Promise<{ checked: number; errors: number; skipped: number; blocked: number }> {
    const launch = await getLaunchFn();
    if (!launch) {
      console.warn('[PositionCollector] CloakBrowser unavailable, skipping batch');
      return { checked: 0, errors: 0, skipped: keywords.length, blocked: 0 };
    }

    let browser: Browser | null = null;
    try {
      browser = await this.launchBrowser(launch);
    } catch (error) {
      console.error(`[PositionCollector] Failed to launch CloakBrowser for batch ${batchIndex}:`, error);
      return { checked: 0, errors: 0, skipped: keywords.length, blocked: 0 };
    }

    let checked = 0;
    let errors = 0;
    let skipped = 0;
    let blocked = 0;
    let consecutiveBlocks = 0;
    const MAX_CONSECUTIVE_BLOCKS = 3;

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

          if (result.blocked) {
            consecutiveBlocks++;
            blocked++;
            console.warn(
              `[PositionCollector] Blocked (${consecutiveBlocks}/${MAX_CONSECUTIVE_BLOCKS}) for "${kw.keyword}" (${kw.searchEngine})`
            );
            if (consecutiveBlocks >= MAX_CONSECUTIVE_BLOCKS) {
              const remaining = keywords.length - i - 1;
              console.warn(
                `[PositionCollector] Too many blocks in batch ${batchIndex}, stopping. ${remaining} keywords skipped.`
              );
              skipped += remaining;
              break;
            }
          } else {
            consecutiveBlocks = 0;

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
          }
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

    return { checked, errors, skipped, blocked };
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
    blocked: boolean;
  }> {
    const url = this.buildSearchUrl(keyword, searchEngine);

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: this.timeout,
    });

    const waitSelector =
      searchEngine === 'yandex'
        ? 'li.serp-item, [class*="serp-item"], main, #search-result'
        : 'div#rso, div.g, #main, h3';

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
        `[PositionCollector] CAPTCHA/BLOCK detected for "${keyword}" (${searchEngine}), URL: ${page.url().substring(0, 100)}`
      );
      return { position: 0, found: false, blocked: true };
    }

    const siteResult = findSiteInResults(parsed.results, DOMAIN);

    if (!siteResult) {
      return { position: 0, found: false, blocked: false };
    }

    return {
      position: siteResult.position,
      url: siteResult.url,
      title: siteResult.title,
      snippet: siteResult.snippet,
      found: true,
      blocked: false,
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

  private async saveSession(data: SessionData): Promise<void> {
    await redis.set(SESSION_KEY, JSON.stringify(data), 'EX', SESSION_TTL_S);
  }

  private async getSession(): Promise<SessionData | null> {
    const raw = await redis.get(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionData;
    } catch {
      return null;
    }
  }
}

export const positionCollector = new PositionCollector();

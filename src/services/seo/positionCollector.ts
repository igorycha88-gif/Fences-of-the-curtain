import { prisma } from '@/lib/prisma';

const DOMAIN = 'zabor-i-naves.ru';
const API_BASE = 'https://api.valueserp.com/search';
const REQUEST_DELAY_MS = 2000;

interface ValueSerpOrganicResult {
  position: number;
  title?: string;
  link?: string;
  snippet?: string;
}

interface ValueSerpResponse {
  request_info?: {
    success: boolean;
    message?: string;
  };
  organic_results?: ValueSerpOrganicResult[];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class PositionCollector {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.VALUESERP_API_KEY || '';
  }

  async collectAll(): Promise<{
    checked: number;
    errors: number;
    skipped: number;
  }> {
    if (!this.apiKey) {
      console.error('[PositionCollector] VALUESERP_API_KEY not set');
      return { checked: 0, errors: 0, skipped: 0 };
    }

    const keywords = await prisma.seoKeyword.findMany({
      where: { active: true },
      orderBy: [{ searchEngine: 'asc' }, { keyword: 'asc' }],
    });

    let checked = 0;
    let errors = 0;
    let skipped = 0;

    for (let i = 0; i < keywords.length; i++) {
      const kw = keywords[i];

      if (i > 0) {
        await delay(REQUEST_DELAY_MS);
      }

      try {
        const result = await this.collectForKeyword(
          kw.keyword,
          kw.searchEngine
        );

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
      }
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
    const params = new URLSearchParams({
      q: keyword,
      api_key: this.apiKey,
      gl: 'ru',
      hl: 'ru',
      location: 'Moscow,Russia',
      num: '10',
      output: 'json',
    });

    if (searchEngine === 'yandex') {
      params.set('engine', 'yandex');
      params.set('yandex_domain', 'yandex.ru');
    } else {
      params.set('google_domain', 'google.ru');
    }

    const response = await fetch(`${API_BASE}?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `ValueSERP API error: ${response.status} ${text}`
      );
    }

    const data: ValueSerpResponse = await response.json();

    if (data.request_info && !data.request_info.success) {
      const message = data.request_info.message || 'Unknown ValueSERP error';
      throw new Error(`ValueSERP API error: ${message}`);
    }

    if (!data.organic_results || data.organic_results.length === 0) {
      return { position: 0, found: false };
    }

    const siteResult = data.organic_results.find(
      (r) => r.link && r.link.includes(DOMAIN)
    );

    if (!siteResult) {
      return { position: 0, found: false };
    }

    return {
      position: siteResult.position,
      url: siteResult.link,
      title: siteResult.title,
      snippet: siteResult.snippet,
      found: true,
    };
  }
}

export const positionCollector = new PositionCollector();

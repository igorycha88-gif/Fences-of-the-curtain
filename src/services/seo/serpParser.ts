import type { Page } from 'playwright-core';

export interface SerpResult {
  position: number;
  title: string;
  url: string;
  snippet?: string;
}

export interface ParsedSerp {
  results: SerpResult[];
  captcha: boolean;
}

const GOOGLE_CAPTCHA_SELECTORS = [
  '#captcha-form',
  'form[action*="sorry"]',
  'div[data-async-context*="captcha"]',
];

const YANDEX_CAPTCHA_SELECTORS = [
  '.captcha',
  'form[action*="captcha"]',
  'img[src*="captcha"]',
];

export async function detectGoogleCaptcha(page: Page): Promise<boolean> {
  for (const sel of GOOGLE_CAPTCHA_SELECTORS) {
    const count = await page.locator(sel).count();
    if (count > 0) return true;
  }
  return false;
}

export async function detectYandexCaptcha(page: Page): Promise<boolean> {
  for (const sel of YANDEX_CAPTCHA_SELECTORS) {
    const count = await page.locator(sel).count();
    if (count > 0) return true;
  }
  return false;
}

export async function parseGoogleSerp(page: Page): Promise<ParsedSerp> {
  if (await detectGoogleCaptcha(page)) {
    return { results: [], captcha: true };
  }

  const results: SerpResult[] = await page.evaluate(() => {
    const items: Array<{ position: number; title: string; url: string; snippet?: string }> = [];

    const rso = document.getElementById('rso');
    if (!rso) return items;

    const blocks = rso.querySelectorAll<HTMLElement>(':scope > div');

    for (const block of blocks) {
      if (items.length >= 200) break;

      const innerDivs = block.querySelectorAll<HTMLElement>(':scope > div');
      const candidates = innerDivs.length > 0 ? innerDivs : [block];

      for (const candidate of candidates) {
        const h3 = candidate.querySelector('h3');
        if (!h3) continue;

        const link = candidate.querySelector<HTMLAnchorElement>('a[href^="http"]');
        if (!link) continue;

        const href = link.getAttribute('href') || '';
        if (!href || href.includes('google.')) continue;

        const title = h3.textContent?.trim() || '';

        let snippet: string | undefined;
        const snippetCandidates = candidate.querySelectorAll(
          'div.VwiC3b, span.aCOpRe, [data-sncf], div.IsZvec'
        );
        for (const sc of snippetCandidates) {
          const text = sc.textContent?.trim();
          if (text && text.length > 20) {
            snippet = text;
            break;
          }
        }

        items.push({
          position: items.length + 1,
          title,
          url: href,
          snippet,
        });
      }
    }

    return items;
  });

  return { results, captcha: false };
}

export async function parseYandexSerp(page: Page): Promise<ParsedSerp> {
  if (await detectYandexCaptcha(page)) {
    return { results: [], captcha: true };
  }

  const results: SerpResult[] = await page.evaluate(() => {
    const items: Array<{ position: number; title: string; url: string; snippet?: string }> = [];

    const serpItems = document.querySelectorAll<HTMLElement>(
      'li.serp-item, [class*="serp-item"]'
    );

    for (const item of serpItems) {
      if (items.length >= 200) break;

      const link = item.querySelector<HTMLAnchorElement>('a.Link, a.Link_theme_normal');
      const fallbackLink = link || item.querySelector<HTMLAnchorElement>('a[href^="http"]');
      if (!fallbackLink) continue;

      const href = fallbackLink.getAttribute('href') || '';
      if (!href || href.includes('yandex.') || href.includes('ya.ru')) continue;

      const title =
        fallbackLink.textContent?.trim() ||
        item.querySelector('h2')?.textContent?.trim() ||
        '';

      let snippet: string | undefined;
      const snippetEl = item.querySelector(
        '.TextContainer, .OrganicTextContent-Text, [class*="OrganicText"], .Typo'
      );
      if (snippetEl) {
        const text = snippetEl.textContent?.trim();
        if (text && text.length > 20) {
          snippet = text;
        }
      }

      items.push({
        position: items.length + 1,
        title,
        url: href,
        snippet,
      });
    }

    return items;
  });

  return { results, captcha: false };
}

export function findSiteInResults(results: SerpResult[], domain: string): SerpResult | undefined {
  return results.find((r) => {
    try {
      const hostname = new URL(r.url).hostname;
      return hostname === domain || hostname.endsWith(`.${domain}`);
    } catch {
      return r.url.includes(domain);
    }
  });
}

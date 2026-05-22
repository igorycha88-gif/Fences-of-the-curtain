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

export function isGoogleSorryUrl(url: string): boolean {
  return url.includes('google.com/sorry') || url.includes('/sorry/index');
}

export function isYandexCaptchaUrl(url: string): boolean {
  return url.includes('captcha') || url.includes('passport.yandex');
}

export async function parseGoogleSerp(page: Page): Promise<ParsedSerp> {
  const currentUrl = page.url();
  if (isGoogleSorryUrl(currentUrl)) {
    return { results: [], captcha: true };
  }

  for (const sel of ['#captcha-form', 'form[action*="sorry"]']) {
    if ((await page.locator(sel).count()) > 0) {
      return { results: [], captcha: true };
    }
  }

  const results: SerpResult[] = await page.evaluate(() => {
    const items: Array<{ position: number; title: string; url: string; snippet?: string }> = [];

    const collectResult = (el: Element): void => {
      if (items.length >= 200) return;

      const h3 = el.querySelector('h3');
      if (!h3) return;

      const link = el.querySelector<HTMLAnchorElement>('a[href^="http"]');
      if (!link) return;

      const href = link.getAttribute('href') || '';
      if (!href || href.includes('google.')) return;

      const title = h3.textContent?.trim() || '';

      let snippet: string | undefined;
      const sc = el.querySelector('div.VwiC3b, span.aCOpRe, [data-sncf], div.IsZvec');
      if (sc) {
        const text = sc.textContent?.trim();
        if (text && text.length > 20) snippet = text;
      }

      items.push({ position: items.length + 1, title, url: href, snippet });
    };

    const rso = document.getElementById('rso');
    if (rso) {
      for (const topDiv of rso.querySelectorAll<HTMLElement>(':scope > div')) {
        const innerDivs = topDiv.querySelectorAll<HTMLElement>(':scope > div');
        if (innerDivs.length > 0) {
          for (const inner of innerDivs) {
            collectResult(inner);
          }
        } else {
          collectResult(topDiv);
        }
      }
    }

    if (items.length === 0) {
      const fallbackResults = document.querySelectorAll<HTMLElement>(
        'div.g a[href^="http"]'
      );
      for (const anchor of fallbackResults) {
        if (items.length >= 200) break;
        const container = anchor.closest<HTMLElement>('div.g, div[data-hveid]');
        if (!container) continue;
        const h3 = container.querySelector('h3');
        if (!h3) continue;
        const href = anchor.getAttribute('href') || '';
        if (!href || href.includes('google.')) continue;
        items.push({
          position: items.length + 1,
          title: h3.textContent?.trim() || '',
          url: href,
        });
      }
    }

    if (items.length === 0) {
      const allH3s = document.querySelectorAll<HTMLElement>('h3');
      for (const h3 of allH3s) {
        if (items.length >= 200) break;
        const anchor = h3.closest('a[href^="http"]');
        if (!anchor) continue;
        const href = anchor.getAttribute('href') || '';
        if (!href || href.includes('google.')) continue;
        items.push({
          position: items.length + 1,
          title: h3.textContent?.trim() || '',
          url: href,
        });
      }
    }

    return items;
  });

  return { results, captcha: false };
}

export async function parseYandexSerp(page: Page): Promise<ParsedSerp> {
  const currentUrl = page.url();
  if (isYandexCaptchaUrl(currentUrl)) {
    return { results: [], captcha: true };
  }

  for (const sel of ['.captcha', 'form[action*="captcha"]', 'img[src*="captcha"]']) {
    if ((await page.locator(sel).count()) > 0) {
      return { results: [], captcha: true };
    }
  }

  const results: SerpResult[] = await page.evaluate(() => {
    const items: Array<{ position: number; title: string; url: string; snippet?: string }> = [];

    const extractRealUrlFromHref = (href: string): string | null => {
      try {
        if (!href.includes('/clck/') && !href.includes('yandex.')) return null;
        const url = new URL(href);
        const realUrl = url.searchParams.get('url');
        if (realUrl && realUrl.startsWith('http')) return realUrl;
      } catch {}
      return null;
    };

    const resolveHref = (href: string): string | null => {
      if (!href) return null;
      if (href.includes('yandex.') || href.includes('ya.ru')) {
        return extractRealUrlFromHref(href);
      }
      return href.startsWith('http') ? href : null;
    };

    const collectItem = (item: Element): void => {
      if (items.length >= 200) return;

      const link =
        item.querySelector<HTMLAnchorElement>('a.Link, a.Link_theme_normal') ||
        item.querySelector<HTMLAnchorElement>('.OrganicTitle a') ||
        item.querySelector<HTMLAnchorElement>('.OrganicTitle-Link') ||
        item.querySelector<HTMLAnchorElement>('a[href^="http"]') ||
        item.querySelector<HTMLAnchorElement>('a[href*="/clck/"]');
      if (!link) return;

      const rawHref = link.getAttribute('href') || '';
      const href = resolveHref(rawHref);
      if (!href) return;

      const title =
        link.textContent?.trim() ||
        item.querySelector('h2, h3')?.textContent?.trim() ||
        item.querySelector('.OrganicTitle, [class*="OrganicTitle"]')?.textContent?.trim() ||
        item.querySelector('[class*="Title"]')?.textContent?.trim() ||
        '';

      let snippet: string | undefined;
      const snippetEl = item.querySelector(
        '.TextContainer, .OrganicTextContent-Text, [class*="OrganicText"], .Typo, .OrganicText, [class*="TextContent"]'
      );
      if (snippetEl) {
        const text = snippetEl.textContent?.trim();
        if (text && text.length > 20) snippet = text;
      }

      items.push({ position: items.length + 1, title, url: href, snippet });
    };

    const serpItems = document.querySelectorAll<HTMLElement>(
      'li.serp-item, [class*="serp-item"], div.Organic, [class*="Organic-"], [class*="organic"], article, [data-log-node]'
    );

    for (const item of serpItems) {
      collectItem(item);
    }

    if (items.length === 0) {
      const allContainers = document.querySelectorAll<HTMLElement>(
        '[class*="Card"], [class*="card"], [class*="Business"], [class*="business"], [class*="Company"], [class*="company"], [class*="Snippet"], [class*="snippet"]'
      );
      for (const container of allContainers) {
        collectItem(container);
      }
    }

    if (items.length === 0) {
      const allLinks = document.querySelectorAll<HTMLAnchorElement>('a[href]');
      for (const anchor of allLinks) {
        if (items.length >= 200) break;
        const rawHref = anchor.getAttribute('href') || '';
        const href = resolveHref(rawHref);
        if (!href) continue;
        const title = anchor.textContent?.trim() || '';
        if (title.length < 3) continue;
        items.push({ position: items.length + 1, title, url: href });
      }
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

import { redis } from '@/lib/redis';
import logger from '@/lib/logger';

const CACHE_TTL = 86400;
const REQUEST_TIMEOUT_MS = 6000;
const ATTEMPTS_PER_PROVIDER = 2;
const RETRY_DELAY_MS = 500;

interface GeoFields {
  city: string | null;
  region: string | null;
  country: string | null;
}

interface GeoProvider {
  name: string;
  url: (ip: string) => string;
  parse: (data: Record<string, unknown>) => GeoFields | null;
}

/**
 * Провайдеры геолокации: основной (ip-api.com, HTTP, лимит 45 req/min)
 * и фолбэк (ipwho.is, HTTPS, бесплатный без ключа).
 * ЧТЗ_Фикс_Геолокация_Город_Пользователя: устойчивость к таймаутам DNS/провайдера.
 */
const PROVIDERS: GeoProvider[] = [
  {
    name: 'ip-api',
    url: (ip) => `http://ip-api.com/json/${ip}?fields=status,city,regionName,country`,
    parse: (data) => {
      if (data.status !== 'success' || !data.city) return null;
      return {
        city: data.city as string,
        region: (data.regionName as string) || null,
        country: (data.country as string) || null,
      };
    },
  },
  {
    name: 'ipwho',
    url: (ip) => `https://ipwho.is/${ip}?fields=success,city,region,country`,
    parse: (data) => {
      if (data.success !== true || !data.city) return null;
      return {
        city: data.city as string,
        region: (data.region as string) || (data.regionName as string) || null,
        country: (data.country as string) || null,
      };
    },
  },
];

function normalizeIP(ip: string): string | null {
  if (!ip || ip === 'unknown') {
    return null;
  }

  // Handle IPv6-mapped IPv4 addresses (::ffff:x.x.x.x)
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  // Skip localhost
  if (ip.startsWith('127.') || ip === '::1') {
    return null;
  }

  return ip;
}

export function formatLocation(fields: GeoFields): string {
  const parts =
    fields.country === 'Russia'
      ? [fields.city, fields.region]
      : [fields.city, fields.region, fields.country];
  return parts.filter((part): part is string => Boolean(part)).join(', ');
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchFromProvider(provider: GeoProvider, ip: string): Promise<string | null> {
  for (let attempt = 1; attempt <= ATTEMPTS_PER_PROVIDER; attempt++) {
    const startedAt = Date.now();
    try {
      const response = await fetch(provider.url(ip), {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        logger.error('IP lookup provider HTTP error', {
          module: 'ipLookup',
          operation: 'getCityByIP',
          provider: provider.name,
          attempt,
          status: response.status,
          durationMs: Date.now() - startedAt,
        });
        if (attempt < ATTEMPTS_PER_PROVIDER) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        return null;
      }

      const data: Record<string, unknown> = await response.json();
      const fields = provider.parse(data);

      if (!fields) {
        logger.warn('IP lookup provider returned no city', {
          module: 'ipLookup',
          operation: 'getCityByIP',
          provider: provider.name,
          attempt,
          payloadStatus: data.status ?? data.success ?? 'unknown',
          durationMs: Date.now() - startedAt,
        });
        if (attempt < ATTEMPTS_PER_PROVIDER) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        return null;
      }

      logger.info('IP lookup resolved', {
        module: 'ipLookup',
        operation: 'getCityByIP',
        provider: provider.name,
        attempt,
        durationMs: Date.now() - startedAt,
      });

      return formatLocation(fields);
    } catch (error) {
      logger.error('IP lookup provider fetch failed', {
        module: 'ipLookup',
        operation: 'getCityByIP',
        provider: provider.name,
        attempt,
        error,
        durationMs: Date.now() - startedAt,
      });
      if (attempt < ATTEMPTS_PER_PROVIDER) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
    }
  }
  return null;
}

export async function getCityByIP(ip: string): Promise<string | null> {
  const normalizedIP = normalizeIP(ip);
  if (!normalizedIP) {
    return null;
  }
  ip = normalizedIP;

  const cacheKey = `geo:${ip}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug('IP lookup cache hit', {
        module: 'ipLookup',
        operation: 'getCityByIP',
        ip,
        cached: true,
      });
      return cached;
    }
  } catch (error) {
    logger.error('IP lookup Redis read error', {
      module: 'ipLookup',
      operation: 'getCityByIP',
      ip,
      error,
    });
  }

  for (const provider of PROVIDERS) {
    const location = await fetchFromProvider(provider, ip);
    if (location) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, location);
      } catch (error) {
        logger.error('IP lookup Redis cache write error', {
          module: 'ipLookup',
          operation: 'getCityByIP',
          ip,
          error,
        });
      }
      return location;
    }
  }

  logger.error('IP lookup failed after all providers', {
    module: 'ipLookup',
    operation: 'getCityByIP',
    ip,
    providers: PROVIDERS.map((p) => p.name),
    attemptsPerProvider: ATTEMPTS_PER_PROVIDER,
  });

  return null;
}

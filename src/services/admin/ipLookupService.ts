import { redis } from '@/lib/redis';

const CACHE_TTL = 86400;

interface GeoLocationResponse {
  status: string;
  city?: string;
  country?: string;
}

export async function getCityByIP(ip: string): Promise<string | null> {
  if (!ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('::1')) {
    return null;
  }

  const cacheKey = `geo:${ip}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (error) {
    console.error('[ipLookup] Redis error:', error);
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,country`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      console.error('[ipLookup] API error:', response.status);
      return null;
    }

    const data: GeoLocationResponse = await response.json();

    if (data.status === 'success' && data.city) {
      const city = data.country === 'Russia' ? data.city : `${data.city}, ${data.country}`;

      try {
        await redis.setex(cacheKey, CACHE_TTL, city);
      } catch (error) {
        console.error('[ipLookup] Redis cache error:', error);
      }

      return city;
    }

    return null;
  } catch (error) {
    console.error('[ipLookup] Error fetching city:', error);
    return null;
  }
}

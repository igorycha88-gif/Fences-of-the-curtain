import { redis } from '@/lib/redis';

const CACHE_TTL = 86400;

interface GeoLocationResponse {
  status: string;
  city?: string;
  regionName?: string;
  country?: string;
}

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
      return cached;
    }
  } catch (error) {
    console.error('[ipLookup] Redis error:', error);
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      console.error('[ipLookup] API error:', response.status);
      return null;
    }

    const data: GeoLocationResponse = await response.json();

    if (data.status === 'success' && data.city) {
      let location: string;
      if (data.country === 'Russia') {
        location = data.regionName ? `${data.city}, ${data.regionName}` : data.city;
      } else {
        location = data.regionName 
          ? `${data.city}, ${data.regionName}, ${data.country}` 
          : `${data.city}, ${data.country}`;
      }

      try {
        await redis.setex(cacheKey, CACHE_TTL, location);
      } catch (error) {
        console.error('[ipLookup] Redis cache error:', error);
      }

      return location;
    }

    return null;
  } catch (error) {
    console.error('[ipLookup] Error fetching city:', error);
    return null;
  }
}

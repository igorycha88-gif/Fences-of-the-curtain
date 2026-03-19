import { redis } from './redis';
import { prisma } from './prisma';

export type EndpointType = 'auth' | 'orders';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  keyPrefix: string;
}

interface RateLimitResult {
  allowed: boolean;
  attempts: number;
  resetAt: Date;
}

export interface RateLimitResultExtended {
  allowed: boolean;
  attempts: number;
  remaining: number;
  resetAt: Date;
}

const DEFAULT_CONFIGS: Record<EndpointType, RateLimitConfig> = {
  auth: { maxAttempts: 5, windowMs: 900000, keyPrefix: 'rate_limit:auth' },
  orders: { maxAttempts: 5, windowMs: 3600000, keyPrefix: 'rate_limit:orders' },
};

const DEFAULT_CONFIG = DEFAULT_CONFIGS.auth;

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain || localPart.length <= 1) {
    return '***@***';
  }
  const maskedLocal = localPart[0] + '***';
  return `${maskedLocal}@${domain}`;
}

const configCacheMap = new Map<string, { config: RateLimitConfig; time: number }>();
const CACHE_TTL = 60 * 1000;

export function clearConfigCache(): void {
  configCacheMap.clear();
}

export async function getConfig(endpointType: EndpointType = 'auth'): Promise<RateLimitConfig> {
  const now = Date.now();
  const cached = configCacheMap.get(endpointType);

  if (cached && now - cached.time < CACHE_TTL) {
    return cached.config;
  }

  try {
    const dbConfig = await prisma.rateLimitConfig.findUnique({
      where: { id: endpointType },
    });

    if (dbConfig) {
      const config: RateLimitConfig = {
        maxAttempts: dbConfig.maxAttempts,
        windowMs: dbConfig.windowMs,
        keyPrefix: DEFAULT_CONFIGS[endpointType].keyPrefix,
      };
      configCacheMap.set(endpointType, { config, time: now });
      return config;
    }
  } catch (error) {
    console.error('[RATE LIMIT] Error fetching config from database:', error);
  }

  return DEFAULT_CONFIGS[endpointType];
}

export async function checkRateLimit(ip: string, email: string): Promise<boolean> {
  try {
    const config = await getConfig();
    const key = `${config.keyPrefix}:${ip}:${email}`;

    const currentAttempts = await redis.get(key);
    const attempts = currentAttempts ? parseInt(currentAttempts, 10) : 0;

    if (attempts >= config.maxAttempts) {
      console.log(
        `[RATE LIMIT] Blocked: IP=${ip}, Email=${maskEmail(email)}, Attempts=${attempts + 1}`
      );
      return false;
    }

    const multi = redis.multi();
    multi.incr(key);
    multi.expire(key, Math.floor(config.windowMs / 1000));
    await multi.exec();

    return true;
  } catch (error) {
    console.error(
      `[RATE LIMIT] Redis unavailable, skipping rate limit (fail-open policy). ` +
      `This allows authentication to continue but should be monitored. ` +
      `IP=${ip}, Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[RATE LIMIT] ALERT: Redis connection failed in production. ' +
        'Rate limiting is temporarily disabled. Monitor Redis health!'
      );
    }
    
    return true;
  }
}

export async function resetRateLimit(ip: string, email: string): Promise<void> {
  try {
    const config = await getConfig();
    const key = `${config.keyPrefix}:${ip}:${email}`;
    await redis.del(key);
  } catch (error) {
    console.error('[RATE LIMIT] Error resetting rate limit:', error);
  }
}

export async function updateConfig(
  maxAttempts: number,
  windowMs: number
): Promise<void> {
  try {
    await prisma.rateLimitConfig.update({
      where: { id: 'auth' },
      data: { maxAttempts, windowMs },
    });

    configCacheMap.delete('auth');

    console.log(
      `[RATE LIMIT] Config updated: maxAttempts=${maxAttempts}, windowMs=${windowMs}`
    );
  } catch (error) {
    console.error('[RATE LIMIT] Error updating config:', error);
    throw error;
  }
}

export async function getRateLimitStatus(
  ip: string,
  email: string
): Promise<RateLimitResult> {
  const config = await getConfig();
  const key = `${config.keyPrefix}:${ip}:${email}`;

  try {
    const currentAttempts = await redis.get(key);
    const attempts = currentAttempts ? parseInt(currentAttempts, 10) : 0;
    const ttl = await redis.ttl(key);
    const resetAt = new Date(Date.now() + (ttl > 0 ? ttl * 1000 : config.windowMs));

    return {
      allowed: attempts < config.maxAttempts,
      attempts,
      resetAt,
    };
  } catch (error) {
    console.error('[RATE LIMIT] Error getting rate limit status:', error);
    return {
      allowed: true,
      attempts: 0,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }
}

export async function applyRateLimitByEndpoint(
  ip: string,
  endpointType: EndpointType
): Promise<RateLimitResultExtended> {
  const config = await getConfig(endpointType);
  const key = `${config.keyPrefix}:${ip}`;

  try {
    const attempts = await redis.incr(key);

    if (attempts === 1) {
      await redis.expire(key, Math.floor(config.windowMs / 1000));
    }

    const ttl = await redis.ttl(key);
    const resetAt = new Date(Date.now() + (ttl > 0 ? ttl * 1000 : config.windowMs));
    const allowed = attempts <= config.maxAttempts;
    const remaining = Math.max(0, config.maxAttempts - attempts);

    if (!allowed) {
      console.log(
        `[RATE LIMIT] Blocked: IP=${ip}, EndpointType=${endpointType}, Attempts=${attempts}`
      );
    }

    return { allowed, attempts, remaining, resetAt };
  } catch (error) {
    console.error(
      `[RATE LIMIT] Redis unavailable, skipping rate limit (fail-open policy). ` +
      `IP=${ip}, EndpointType=${endpointType}, Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[RATE LIMIT] ALERT: Redis connection failed in production. ' +
        'Rate limiting is temporarily disabled. Monitor Redis health!'
      );
    }

    return {
      allowed: true,
      attempts: 0,
      remaining: config.maxAttempts,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }
}

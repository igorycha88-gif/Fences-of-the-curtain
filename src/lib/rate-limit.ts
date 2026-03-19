import { redis } from './redis';
import { prisma } from './prisma';

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

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  keyPrefix: 'rate_limit:auth',
};

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain || localPart.length <= 1) {
    return '***@***';
  }
  const maskedLocal = localPart[0] + '***';
  return `${maskedLocal}@${domain}`;
}

let configCache: RateLimitConfig | null = null;
let configCacheTime: number = 0;
const CACHE_TTL = 60 * 1000;

export function clearConfigCache(): void {
  configCache = null;
  configCacheTime = 0;
}

export async function getConfig(): Promise<RateLimitConfig> {
  const now = Date.now();

  if (configCache && now - configCacheTime < CACHE_TTL) {
    return configCache;
  }

  try {
    const dbConfig = await prisma.rateLimitConfig.findUnique({
      where: { id: 'auth' },
    });

    if (dbConfig) {
      configCache = {
        maxAttempts: dbConfig.maxAttempts,
        windowMs: dbConfig.windowMs,
        keyPrefix: DEFAULT_CONFIG.keyPrefix,
      };
      configCacheTime = now;
      return configCache;
    }
  } catch (error) {
    console.error('[RATE LIMIT] Error fetching config from database:', error);
  }

  return DEFAULT_CONFIG;
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

    configCache = null;
    configCacheTime = 0;

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

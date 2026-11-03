import { redis } from './redis';
import { prisma } from './prisma';
import logger from './logger';

export type EndpointType = 'auth' | 'orders' | 'login-status';

export function shouldFailOpen(): boolean {
  return process.env.NODE_ENV !== 'production';
}

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
  orders: { maxAttempts: 5, windowMs: 600000, keyPrefix: 'rate_limit:orders' },
  'login-status': { maxAttempts: 30, windowMs: 300000, keyPrefix: 'rate_limit:login-status' },
};

const DEFAULT_CONFIG = DEFAULT_CONFIGS.auth;

export function maskEmail(email: string): string {
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
    logger.error('[RATE LIMIT] Error fetching config from database', {
      module: 'rate-limit',
      operation: 'getConfig',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
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
      logger.warn('[RATE LIMIT] Blocked: too many attempts', {
        module: 'rate-limit',
        operation: 'checkRateLimit',
        ip,
        email: maskEmail(email),
        attempts: attempts + 1,
        maxAttempts: config.maxAttempts,
      });
      return false;
    }

    const multi = redis.multi();
    multi.incr(key);
    if (attempts === 0) {
      multi.expire(key, Math.floor(config.windowMs / 1000));
    }
    await multi.exec();

    return true;
  } catch (error) {
    if (shouldFailOpen()) {
      logger.error(
        '[RATE LIMIT] Redis unavailable, skipping rate limit (fail-open policy)',
        {
          module: 'rate-limit',
          operation: 'checkRateLimit',
          ip,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      return true;
    }

    logger.error(
      '[RATE LIMIT] Redis unavailable, blocking request (fail-close policy)',
      {
        module: 'rate-limit',
        operation: 'checkRateLimit',
        ip,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    );
    throw new Error('Rate limiting unavailable - Redis connection failed');
  }
}

export async function resetRateLimit(ip: string, email: string): Promise<void> {
  try {
    const config = await getConfig();
    const key = `${config.keyPrefix}:${ip}:${email}`;
    await redis.del(key);
  } catch (error) {
    logger.error('[RATE LIMIT] Error resetting rate limit', {
      module: 'rate-limit',
      operation: 'resetRateLimit',
      ip,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
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

    logger.info('[RATE LIMIT] Config updated', {
      module: 'rate-limit',
      operation: 'updateConfig',
      maxAttempts,
      windowMs,
    });
  } catch (error) {
    logger.error('[RATE LIMIT] Error updating config', {
      module: 'rate-limit',
      operation: 'updateConfig',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
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
    if (shouldFailOpen()) {
      logger.error('[RATE LIMIT] Error getting rate limit status (fail-open policy)', {
        module: 'rate-limit',
        operation: 'getRateLimitStatus',
        ip,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        allowed: true,
        attempts: 0,
        resetAt: new Date(Date.now() + config.windowMs),
      };
    }

    logger.error('[RATE LIMIT] Error getting rate limit status (fail-close policy)', {
      module: 'rate-limit',
      operation: 'getRateLimitStatus',
      ip,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Rate limiting unavailable - Redis connection failed');
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
      logger.warn('[RATE LIMIT] Blocked: too many requests', {
        module: 'rate-limit',
        operation: 'applyRateLimitByEndpoint',
        ip,
        endpointType,
        attempts,
      });
    }

    return { allowed, attempts, remaining, resetAt };
  } catch (error) {
    if (shouldFailOpen()) {
      logger.error(
        '[RATE LIMIT] Redis unavailable, skipping rate limit (fail-open policy)',
        {
          module: 'rate-limit',
          operation: 'applyRateLimitByEndpoint',
          ip,
          endpointType,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      return {
        allowed: true,
        attempts: 0,
        remaining: config.maxAttempts,
        resetAt: new Date(Date.now() + config.windowMs),
      };
    }

    logger.error(
      '[RATE LIMIT] Redis unavailable, blocking request (fail-close policy)',
      {
        module: 'rate-limit',
        operation: 'applyRateLimitByEndpoint',
        ip,
        endpointType,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    );
    throw new Error('Rate limiting unavailable - Redis connection failed');
  }
}

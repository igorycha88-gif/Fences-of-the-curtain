import { Redis } from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(parseInt(process.env.REDIS_PORT || '6379'), process.env.REDIS_HOST || 'localhost', {
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true,
    keepAlive: 10000,
    connectTimeout: 5000,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 10) return null;
      return Math.min(times * 100, 3000);
    },
    password: process.env.REDIS_PASSWORD,
  });

redis.on('error', (error) => {
  if (error.message.includes('ECONNREFUSED') || error.message.includes('ECONNRESET')) {
    return;
  }
  console.error('Redis error:', error);
});

globalForRedis.redis = redis;

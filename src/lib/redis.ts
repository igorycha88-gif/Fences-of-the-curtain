import { Redis } from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const client = new Redis(parseInt(process.env.REDIS_PORT || '6379'), process.env.REDIS_HOST || 'localhost', {
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true,
    keepAlive: 10000,
    connectTimeout: 5000,
    lazyConnect: false,
    retryStrategy(times) {
      if (times > 10) return null;
      return Math.min(times * 100, 3000);
    },
    password: process.env.REDIS_PASSWORD,
    family: 4,
    db: 0,
  });

  client.setMaxListeners(20);

  client.on('error', (error) => {
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ECONNRESET')) {
      return;
    }
    console.error('Redis error:', error);
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

globalForRedis.redis = redis;

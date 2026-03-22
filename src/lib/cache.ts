import { redis } from './redis';

interface MemoryCacheEntry<T> {
  value: T;
  expires: number;
}

export class CacheService {
  private memoryCache: Map<string, MemoryCacheEntry<unknown>> = new Map();
  private redisAvailable: boolean = true;

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redisAvailable) {
        const cached = await redis.get(key);
        if (cached) {
          console.log(`[Cache] HIT: ${key}`);
          return JSON.parse(cached) as T;
        }
      }
    } catch (error) {
      console.error(`[Cache] Redis error, falling back to memory: ${key}`, error);
      this.redisAvailable = false;
    }

    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && memoryEntry.expires > Date.now()) {
      console.log(`[Cache] MEMORY HIT: ${key}`);
      return memoryEntry.value as T;
    }

    console.log(`[Cache] MISS: ${key}`);
    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expires = Date.now() + ttlSeconds * 1000;

    this.memoryCache.set(key, { value, expires });

    try {
      if (this.redisAvailable) {
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
        console.log(`[Cache] SET: ${key} (TTL: ${ttlSeconds}s)`);
      }
    } catch (error) {
      console.error(`[Cache] Redis set error: ${key}`, error);
      this.redisAvailable = false;
    }
  }

  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);

    try {
      if (this.redisAvailable) {
        await redis.del(key);
        console.log(`[Cache] DEL: ${key}`);
      }
    } catch (error) {
      console.error(`[Cache] Redis del error: ${key}`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    const keysToDelete: string[] = [];
    for (const [key] of this.memoryCache.entries()) {
      if (this.matchPattern(key, pattern)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.memoryCache.delete(key);
    }

    try {
      if (this.redisAvailable) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          console.log(`[Cache] DEL PATTERN: ${pattern} (${keys.length} keys)`);
        }
      }
    } catch (error) {
      console.error(`[Cache] Redis delPattern error: ${pattern}`, error);
    }
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  private matchPattern(key: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(key);
  }

  async healthCheck(): Promise<{ redis: boolean; memory: boolean }> {
    let redisHealthy = false;
    try {
      await redis.ping();
      redisHealthy = true;
      this.redisAvailable = true;
    } catch {
      this.redisAvailable = false;
    }

    return {
      redis: redisHealthy,
      memory: true,
    };
  }
}

export const cache = new CacheService();

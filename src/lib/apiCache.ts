import { redis } from './redis';

export interface CacheOptions {
  ttl?: number;
}

const DEFAULT_TTL = 60;

export class ApiCache {
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      if (cached) {
        console.log(`[CACHE HIT] Key: ${key}`);
        return JSON.parse(cached) as T;
      }
      console.log(`[CACHE MISS] Key: ${key}`);
      return null;
    } catch (error) {
      console.error(`[CACHE ERROR] Get key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await redis.set(key, serialized, 'EX', ttl);
      console.log(`[CACHE SET] Key: ${key}, TTL: ${ttl}s`);
    } catch (error) {
      console.error(`[CACHE ERROR] Set key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
      console.log(`[CACHE DELETE] Key: ${key}`);
    } catch (error) {
      console.error(`[CACHE ERROR] Delete key ${key}:`, error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`[CACHE DELETE PATTERN] Pattern: ${pattern}, deleted ${keys.length} keys`);
      }
    } catch (error) {
      console.error(`[CACHE ERROR] Delete pattern ${pattern}:`, error);
    }
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, options.ttl || DEFAULT_TTL);
    return data;
  }

  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    return `${prefix}:${sortedParams}`;
  }
}

export const apiCache = new ApiCache();

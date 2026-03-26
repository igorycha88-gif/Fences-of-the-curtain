import { CacheService } from '../../src/lib/cache';

jest.mock('../../src/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    ping: jest.fn(),
  },
}));

import { redis } from '../../src/lib/redis';

const mockRedis = redis as any;

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return parsed value from Redis when cache hit', async () => {
      const testKey = 'test-key';
      const testValue = { id: '1', name: 'Test' };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(testValue));

      const result = await cacheService.get<typeof testValue>(testKey);

      expect(mockRedis.get).toHaveBeenCalledWith(testKey);
      expect(result).toEqual(testValue);
    });

    it('should return null when cache miss', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await cacheService.get('non-existent-key');

      expect(result).toBeNull();
    });

    it('should fallback to memory cache when Redis fails', async () => {
      const testKey = 'fallback-key';
      const testValue = { id: '2', name: 'Fallback' };

      mockRedis.setex.mockResolvedValueOnce('OK');
      await cacheService.set(testKey, testValue, 60);
      
      mockRedis.get.mockRejectedValueOnce(new Error('Redis error'));

      const result = await cacheService.get<typeof testValue>(testKey);

      expect(result).toEqual(testValue);
    });
  });

  describe('set', () => {
    it('should set value in both Redis and memory cache', async () => {
      const testKey = 'set-key';
      const testValue = { id: '3', name: 'Set Test' };
      const ttl = 300;

      mockRedis.setex.mockResolvedValueOnce('OK');

      await cacheService.set(testKey, testValue, ttl);

      expect(mockRedis.setex).toHaveBeenCalledWith(testKey, ttl, JSON.stringify(testValue));
    });

    it('should continue setting memory cache when Redis fails', async () => {
      const testKey = 'set-fallback-key';
      const testValue = { id: '4', name: 'Set Fallback' };
      const ttl = 60;

      mockRedis.setex.mockRejectedValueOnce(new Error('Redis error'));

      await expect(cacheService.set(testKey, testValue, ttl)).resolves.not.toThrow();
    });
  });

  describe('del', () => {
    it('should delete key from both Redis and memory cache', async () => {
      const testKey = 'del-key';

      mockRedis.del.mockResolvedValueOnce(1);

      await cacheService.del(testKey);

      expect(mockRedis.del).toHaveBeenCalledWith(testKey);
    });
  });

  describe('delPattern', () => {
    it('should delete all keys matching pattern', async () => {
      const pattern = 'calculator:*';
      const matchingKeys = ['calculator:posts', 'calculator:lags'];

      mockRedis.keys.mockResolvedValueOnce(matchingKeys);
      mockRedis.del.mockResolvedValueOnce(2);

      await cacheService.delPattern(pattern);

      expect(mockRedis.keys).toHaveBeenCalledWith(pattern);
      expect(mockRedis.del).toHaveBeenCalledWith(...matchingKeys);
    });

    it('should not call del when no keys match', async () => {
      mockRedis.keys.mockResolvedValueOnce([]);

      await cacheService.delPattern('empty:*');

      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value on cache hit', async () => {
      const testKey = 'get-or-set-hit';
      const cachedValue = { id: '5', name: 'Cached' };
      const factory = jest.fn();

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(cachedValue));

      const result = await cacheService.getOrSet(testKey, factory, 60);

      expect(result).toEqual(cachedValue);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result on cache miss', async () => {
      const testKey = 'get-or-set-miss';
      const newValue = { id: '6', name: 'New' };
      const factory = jest.fn().mockResolvedValue(newValue);

      mockRedis.get.mockResolvedValueOnce(null);
      mockRedis.setex.mockResolvedValueOnce('OK');

      const result = await cacheService.getOrSet(testKey, factory, 60);

      expect(result).toEqual(newValue);
      expect(factory).toHaveBeenCalledTimes(1);
      expect(mockRedis.setex).toHaveBeenCalledWith(testKey, 60, JSON.stringify(newValue));
    });
  });

  describe('healthCheck', () => {
    it('should return redis: true when ping succeeds', async () => {
      mockRedis.ping.mockResolvedValueOnce('PONG');

      const result = await cacheService.healthCheck();

      expect(result.redis).toBe(true);
      expect(result.memory).toBe(true);
    });

    it('should return redis: false when ping fails', async () => {
      mockRedis.ping.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await cacheService.healthCheck();

      expect(result.redis).toBe(false);
      expect(result.memory).toBe(true);
    });
  });
});

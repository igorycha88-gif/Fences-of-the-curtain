import { Redis } from 'ioredis';

jest.mock('ioredis', () => {
  const mockRedis = {
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    ping: jest.fn(),
    multi: jest.fn(() => ({
      incr: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    })),
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
  };

  return {
    Redis: jest.fn().mockImplementation(() => mockRedis),
  };
});

describe('Redis Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export redis instance', () => {
    const { redis } = require('../../src/lib/redis');
    expect(redis).toBeDefined();
    expect(redis.get).toBeDefined();
    expect(redis.set).toBeDefined();
    expect(redis.del).toBeDefined();
  });

  it('should use singleton pattern for global Redis instance', () => {
    const { redis: redis1 } = require('../../src/lib/redis');
    const { redis: redis2 } = require('../../src/lib/redis');

    expect(redis1).toBe(redis2);
  });
});

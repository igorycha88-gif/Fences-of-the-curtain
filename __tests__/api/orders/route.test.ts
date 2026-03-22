import { POST } from '@/app/api/orders/route';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { getSessionFromCookie } from '@/lib/session';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    fenceEstimate: {
      findFirst: jest.fn(),
    },
    order: {
      create: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    rateLimitConfig: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'orders',
        maxAttempts: 5,
        windowMs: 3600000,
        updatedAt: new Date(),
      }),
    },
  },
}));

jest.mock('@/lib/redis', () => ({
  redis: {
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
  },
}));

jest.mock('@/lib/session', () => ({
  getSessionFromCookie: jest.fn(),
}));

jest.mock('@/lib/audit', () => ({
  createAuditLogAsync: jest.fn(),
  getSystemUserId: jest.fn().mockResolvedValue('system-user-id'),
}));

describe('POST /api/orders with rate limiting', () => {
  let mockRedis: any;
  let mockPrisma: any;
  let mockSession: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis = require('@/lib/redis').redis;
    mockPrisma = require('@/lib/prisma').prisma;
    mockSession = require('@/lib/session');

    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(3600);

    mockPrisma.fenceEstimate.findFirst.mockResolvedValue({
      id: 'estimate-1',
      fenceTypeId: 'PROFNASTIL',
      length: 50,
      height: 2,
      lagRows: 2,
      coating: 'Оцинковка',
      hasGate: false,
      gateLength: null,
      hasWicket: false,
      wicketWidth: null,
      grandTotal: 50000,
      createdAt: new Date(),
    });

    mockPrisma.order.create.mockResolvedValue({
      id: 'order-1',
      status: 'NEW',
      createdAt: new Date(),
      estimate: { id: 'estimate-1', grandTotal: 50000 },
    });

    mockSession.getSessionFromCookie.mockResolvedValue('session-123');
  });

  const createRequest = (body: any, ip: string = '192.168.1.100') => {
    return new Request('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': ip,
      },
      body: JSON.stringify(body),
    }) as any;
  };

  it('should create order successfully (1st request)', async () => {
    mockRedis.incr.mockResolvedValue(1);

    const request = createRequest({
      clientName: 'Иван Иванов',
      phone: '+7 (999) 123-45-67',
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('4');
    expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
  });

  it('should decrement remaining with each request', async () => {
    for (let i = 1; i <= 5; i++) {
      mockRedis.incr.mockResolvedValue(i);
      mockRedis.ttl.mockResolvedValue(3600 - i * 60);

      const request = createRequest({
        clientName: 'Иван Иванов',
        phone: '+7 (999) 123-45-67',
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(response.headers.get('X-RateLimit-Remaining')).toBe(String(5 - i));
    }
  });

  it('should return 429 on 6th request', async () => {
    mockRedis.incr.mockResolvedValue(6);
    mockRedis.ttl.mockResolvedValue(3000);

    const request = createRequest({
      clientName: 'Иван Иванов',
      phone: '+7 (999) 123-45-67',
    });

    const response = await POST(request);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body).toEqual({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Слишком много запросов. Попробуйте позже.',
    });
  });

  it('should include X-RateLimit headers in 429 response', async () => {
    mockRedis.incr.mockResolvedValue(6);
    mockRedis.ttl.mockResolvedValue(3000);

    const request = createRequest({
      clientName: 'Иван Иванов',
      phone: '+7 (999) 123-45-67',
    });

    const response = await POST(request);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(parseInt(response.headers.get('X-RateLimit-Reset')!)).toBeGreaterThan(Date.now() / 1000);
  });

  it('should rate limit by IP', async () => {
    mockRedis.incr.mockImplementation(async (key: string) => {
      if (key.includes('192.168.1.100')) return 1;
      if (key.includes('10.0.0.1')) return 1;
      return 1;
    });

    const request1 = createRequest({
      clientName: 'Иван Иванов',
      phone: '+7 (999) 123-45-67',
    }, '192.168.1.100');

    const response1 = await POST(request1);
    expect(response1.status).toBe(201);
    expect(mockRedis.incr).toHaveBeenCalledWith('rate_limit:orders:192.168.1.100');

    const request2 = createRequest({
      clientName: 'Петр Петров',
      phone: '+7 (999) 765-43-21',
    }, '10.0.0.1');

    const response2 = await POST(request2);
    expect(response2.status).toBe(201);
    expect(mockRedis.incr).toHaveBeenCalledWith('rate_limit:orders:10.0.0.1');
  });

  it('should use Redis key format rate_limit:orders:{ip}', async () => {
    const request = createRequest({
      clientName: 'Иван Иванов',
      phone: '+7 (999) 123-45-67',
    }, '192.168.1.100');

    await POST(request);

    expect(mockRedis.incr).toHaveBeenCalledWith('rate_limit:orders:192.168.1.100');
  });

  it('should not affect auth rate limit counter (separate Redis keys)', async () => {
    mockRedis.incr.mockImplementation(async (key: string) => {
      return 1;
    });

    const ordersRequest = createRequest({
      clientName: 'Иван Иванов',
      phone: '+7 (999) 123-45-67',
    }, '10.0.0.99');

    const ordersResponse = await POST(ordersRequest);
    expect(ordersResponse.status).toBe(201);
    expect(mockRedis.incr).toHaveBeenCalledWith('rate_limit:orders:10.0.0.99');

    expect(mockRedis.incr).not.toHaveBeenCalledWith(
      expect.stringContaining('rate_limit:auth')
    );
  });
});

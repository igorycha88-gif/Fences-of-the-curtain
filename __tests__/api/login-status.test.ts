jest.mock('../../src/lib/rate-limit', () => ({
  applyRateLimitByEndpoint: jest.fn(),
  getRateLimitStatus: jest.fn(),
}));

jest.mock('../../src/lib/logger', () => {
  const m: any = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  m.withContext = jest.fn(() => m);
  return { __esModule: true, default: m };
});

import { GET } from '../../src/app/api/auth/login-status/route';
import { applyRateLimitByEndpoint, getRateLimitStatus } from '../../src/lib/rate-limit';
import logger from '../../src/lib/logger';

const loggerMock = logger as any;
const mockApply = applyRateLimitByEndpoint as jest.Mock;
const mockGetStatus = getRateLimitStatus as jest.Mock;

function makeRequest(email: string | null, forwardedFor?: string) {
  const url = new URL('https://zabor-i-naves.ru/api/auth/login-status');
  if (email !== null) {
    url.searchParams.set('email', email);
  }
  return {
    headers: new Headers(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
    nextUrl: url,
  } as any;
}

describe('GET /api/auth/login-status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApply.mockResolvedValue({
      allowed: true,
      attempts: 1,
      remaining: 29,
      resetAt: new Date(Date.now() + 300000),
    });
    mockGetStatus.mockResolvedValue({
      allowed: true,
      attempts: 0,
      resetAt: new Date(Date.now() + 900000),
    });
  });

  it('200 {blocked:false} когда вход не заблокирован', async () => {
    const res = await GET(makeRequest('admin@fences.ru'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ blocked: false, resetAt: null });
    expect(mockGetStatus).toHaveBeenCalledWith('unknown', 'admin@fences.ru');
  });

  it('200 {blocked:true, resetAt} когда лимит превышен (K-4)', async () => {
    const resetAt = new Date(Date.now() + 420000);
    mockGetStatus.mockResolvedValue({ allowed: false, attempts: 5, resetAt });

    const res = await GET(makeRequest('admin@fences.ru'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.blocked).toBe(true);
    expect(body.resetAt).toBe(resetAt.toISOString());
  });

  it('400 при отсутствии email', async () => {
    const res = await GET(makeRequest(null));

    expect(res.status).toBe(400);
    expect(loggerMock.warn).toHaveBeenCalledWith(
      '[LOGIN STATUS] Invalid email parameter',
      expect.any(Object)
    );
  });

  it('400 при некорректном формате email', async () => {
    const res = await GET(makeRequest('not-an-email'));

    expect(res.status).toBe(400);
  });

  it('429 при превышении лимита самого эндпоинта (K-4)', async () => {
    mockApply.mockResolvedValue({
      allowed: false,
      attempts: 31,
      remaining: 0,
      resetAt: new Date(Date.now() + 300000),
    });

    const res = await GET(makeRequest('admin@fences.ru'));

    expect(res.status).toBe(429);
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(mockGetStatus).not.toHaveBeenCalled();
  });

  it('защищает сам эндпоинт отдельным лимитом login-status', async () => {
    await GET(makeRequest('admin@fences.ru'));

    expect(mockApply).toHaveBeenCalledWith('unknown', 'login-status');
  });

  it('fail-open: ошибка статуса возвращает {blocked:false}, а не 500 (edge)', async () => {
    mockGetStatus.mockRejectedValue(new Error('Rate limiting unavailable - Redis connection failed'));

    const res = await GET(makeRequest('admin@fences.ru'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ blocked: false, resetAt: null });
    expect(loggerMock.error).toHaveBeenCalledWith(
      '[LOGIN STATUS] Failed to get rate limit status, fail-open',
      expect.objectContaining({ error: 'Rate limiting unavailable - Redis connection failed' })
    );
  });

  it('неожиданная ошибка → 500 + лог', async () => {
    mockApply.mockRejectedValue(new Error('boom'));

    const res = await GET(makeRequest('admin@fences.ru'));

    expect(res.status).toBe(500);
    expect(loggerMock.error).toHaveBeenCalledWith(
      '[LOGIN STATUS] Unexpected error',
      expect.objectContaining({ status: 500, error: 'boom' })
    );
  });

  it('берёт первый IP из x-forwarded-for', async () => {
    await GET(makeRequest('admin@fences.ru', '79.174.33.202, 10.0.0.1'));

    expect(mockGetStatus).toHaveBeenCalledWith('79.174.33.202', 'admin@fences.ru');
  });

  it('логирует успешный ответ (request/response)', async () => {
    await GET(makeRequest('admin@fences.ru'));

    expect(loggerMock.info).toHaveBeenCalledWith(
      '[LOGIN STATUS] Status served',
      expect.objectContaining({ operation: 'GET', status: 200, blocked: false })
    );
  });
});

process.env.NEXTAUTH_SECRET = 'a'.repeat(44);

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../src/lib/password', () => ({
  compare: jest.fn(),
}));

jest.mock('../../src/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(),
  resetRateLimit: jest.fn(),
  maskEmail: jest.fn((email: string) => `masked:${email}`),
}));

jest.mock('../../src/lib/logger', () => {
  const m: any = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  m.withContext = jest.fn(() => m);
  return { __esModule: true, default: m };
});

import { authOptions } from '../../src/lib/auth';
import { prisma } from '../../src/lib/prisma';
import { compare } from '../../src/lib/password';
import { checkRateLimit, resetRateLimit } from '../../src/lib/rate-limit';
import logger from '../../src/lib/logger';

const loggerMock = logger as any;

const mockPrisma = prisma as any;
const mockCompare = compare as jest.Mock;
const mockCheckRateLimit = checkRateLimit as jest.Mock;
const mockResetRateLimit = resetRateLimit as jest.Mock;

const req = {
  headers: {
    get: (h: string) => (h === 'x-forwarded-for' ? '192.168.1.100' : null),
  },
} as any;

function getAuthorize() {
  // next-auth v4: CredentialsProvider прячет реальный authorize в options.authorize,
  // ядро (parseProviders) мержит его обратно при обработке запросов
  const provider = authOptions.providers[0] as any;
  const authorize = provider.options?.authorize ?? provider.authorize;
  return authorize as (credentials: any, req: any) => Promise<any>;
}

const activeUser = {
  id: 'user-1',
  email: 'admin@fences.ru',
  name: 'Администратор',
  password: 'hashed-password',
  active: true,
  role: 'ADMIN',
};

describe('authorize (реальная реализация src/lib/auth.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_SECRET = 'a'.repeat(44);
    mockCheckRateLimit.mockResolvedValue(true);
    mockResetRateLimit.mockResolvedValue(undefined);
    mockCompare.mockResolvedValue(true);
    mockPrisma.user.findUnique.mockResolvedValue(activeUser);
  });

  it('успешный вход возвращает пользователя и сбрасывает счётчик рейт-лимита (K-1)', async () => {
    const result = await getAuthorize()(
      { email: 'admin@fences.ru', password: 'correct' },
      req
    );

    expect(result).toEqual({
      id: 'user-1',
      email: 'admin@fences.ru',
      name: 'Администратор',
      role: 'ADMIN',
    });
    expect(mockResetRateLimit).toHaveBeenCalledWith('192.168.1.100', 'admin@fences.ru');
    expect(loggerMock.info).toHaveBeenCalledWith(
      '[AUTH] User authorized: success',
      expect.objectContaining({ userId: 'user-1' })
    );
  });

  it('сброс счётчика выполняется только после успешной проверки пароля', async () => {
    mockCompare.mockResolvedValue(false);

    await getAuthorize()({ email: 'admin@fences.ru', password: 'wrong' }, req);

    expect(mockResetRateLimit).not.toHaveBeenCalled();
  });

  it('ошибка сброса счётчика не блокирует успешный вход (edge)', async () => {
    mockResetRateLimit.mockRejectedValue(new Error('redis down'));

    const result = await getAuthorize()(
      { email: 'admin@fences.ru', password: 'correct' },
      req
    );

    expect(result).toMatchObject({ id: 'user-1', role: 'ADMIN' });
    expect(loggerMock.error).toHaveBeenCalledWith(
      '[AUTH] Failed to reset rate limit after successful login',
      expect.objectContaining({ error: 'redis down' })
    );
  });

  it('при блокировке рейт-лимита возвращает null без поиска пользователя', async () => {
    mockCheckRateLimit.mockResolvedValue(false);

    const result = await getAuthorize()(
      { email: 'admin@fences.ru', password: 'correct' },
      req
    );

    expect(result).toBeNull();
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockResetRateLimit).not.toHaveBeenCalled();
    expect(loggerMock.warn).toHaveBeenCalledWith(
      '[AUTH] Rate limit exceeded',
      expect.any(Object)
    );
  });

  it('ошибка проверки рейт-лимита не блокирует вход (fail-open)', async () => {
    mockCheckRateLimit.mockRejectedValue(new Error('Rate limiting unavailable'));

    const result = await getAuthorize()(
      { email: 'admin@fences.ru', password: 'correct' },
      req
    );

    expect(result).toMatchObject({ id: 'user-1' });
    expect(loggerMock.error).toHaveBeenCalledWith(
      '[AUTH] Rate limit check failed, allowing login attempt',
      expect.objectContaining({ error: 'Rate limiting unavailable' })
    );
  });

  it('несуществующий пользователь → null', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await getAuthorize()(
      { email: 'ghost@fences.ru', password: 'correct' },
      req
    );

    expect(result).toBeNull();
    expect(loggerMock.warn).toHaveBeenCalledWith(
      '[AUTH] User not found or inactive',
      expect.any(Object)
    );
  });

  it('неактивный пользователь → null', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...activeUser, active: false });

    const result = await getAuthorize()(
      { email: 'admin@fences.ru', password: 'correct' },
      req
    );

    expect(result).toBeNull();
  });

  it('неверный пароль → null', async () => {
    mockCompare.mockResolvedValue(false);

    const result = await getAuthorize()(
      { email: 'admin@fences.ru', password: 'wrong' },
      req
    );

    expect(result).toBeNull();
    expect(loggerMock.warn).toHaveBeenCalledWith('[AUTH] Invalid password', expect.any(Object));
  });

  it('отсутствие креденшелов → null', async () => {
    const result = await getAuthorize()(undefined, req);
    expect(result).toBeNull();
    expect(loggerMock.warn).toHaveBeenCalledWith('[AUTH] Missing credentials');
  });

  it('в логи не попадает пароль (безопасность логирования)', async () => {
    await getAuthorize()({ email: 'admin@fences.ru', password: 'SUPER-SECRET-123' }, req);

    const allCalls = JSON.stringify([
      ...loggerMock.info.mock.calls,
      ...loggerMock.warn.mock.calls,
      ...loggerMock.error.mock.calls,
    ]);

    expect(allCalls).not.toContain('SUPER-SECRET-123');
  });
});

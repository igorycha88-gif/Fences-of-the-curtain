jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { redis } from '@/lib/redis';
import logger from '@/lib/logger';
import { getCityByIP } from '@/services/admin/ipLookupService';

const mockRedis = redis as any;
const mockLogger = logger as any;

const ok = (body: unknown) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);

const httpError = (status: number) =>
  Promise.resolve({ ok: false, status, json: () => Promise.resolve({}) } as Response);

const IP_API_URL = 'http://ip-api.com/json/8.8.8.8';
const IPWHO_URL = 'https://ipwho.is/8.8.8.8';

describe('ipLookupService (ЧТЗ_Фикс_Геолокация_Город_Пользователя)', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = jest.fn();
    global.fetch = fetchMock as any;
    mockRedis.get.mockResolvedValue(null);
    mockRedis.setex.mockResolvedValue('OK');
  });

  describe('валидация IP', () => {
    it('возвращает null для unknown без запросов', async () => {
      await expect(getCityByIP('unknown')).resolves.toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(mockRedis.get).not.toHaveBeenCalled();
    });

    it('возвращает null для localhost', async () => {
      await expect(getCityByIP('127.0.0.1')).resolves.toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('разворачивает IPv6-mapped IPv4 (::ffff:) в обычный IPv4', async () => {
      fetchMock.mockImplementation((url: string) =>
        ok({ status: 'success', city: 'Ashburn', regionName: 'Virginia', country: 'United States' })
      );

      const result = await getCityByIP('::ffff:8.8.8.8');

      expect(result).toBe('Ashburn, Virginia, United States');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://ip-api.com/json/8.8.8.8?fields=status,city,regionName,country',
        expect.anything()
      );
    });
  });

  describe('Redis-кэш', () => {
    it('возвращает закэшированное значение без fetch', async () => {
      mockRedis.get.mockResolvedValueOnce('Москва, Москва');

      await expect(getCityByIP('8.8.8.8')).resolves.toBe('Москва, Москва');

      expect(fetchMock).not.toHaveBeenCalled();
      expect(mockRedis.get).toHaveBeenCalledWith('geo:8.8.8.8');
    });

    it('продолжает к провайдеру при ошибке Redis-чтения', async () => {
      mockRedis.get.mockRejectedValueOnce(new Error('redis down'));
      fetchMock.mockImplementation((url: string) =>
        url.startsWith('https://ipwho.is')
          ? ok({ success: true, city: 'Ashburn', region: 'Virginia', country: 'United States' })
          : Promise.reject(new Error('primary fail'))
      );

      await expect(getCityByIP('8.8.8.8')).resolves.toBe('Ashburn, Virginia, United States');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'IP lookup Redis read error',
        expect.objectContaining({ module: 'ipLookup', operation: 'getCityByIP' })
      );
    });

    it('не ломается при ошибке записи кэша', async () => {
      mockRedis.setex.mockRejectedValueOnce(new Error('redis write fail'));
      fetchMock.mockImplementation((url: string) =>
        url.startsWith(IP_API_URL)
          ? ok({ status: 'success', city: 'Москва', regionName: 'Москва', country: 'Russia' })
          : Promise.reject(new Error('unused'))
      );

      await expect(getCityByIP('8.8.8.8')).resolves.toBe('Москва, Москва');
      expect(mockRedis.setex).toHaveBeenCalledWith('geo:8.8.8.8', 86400, 'Москва, Москва');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'IP lookup Redis cache write error',
        expect.objectContaining({ module: 'ipLookup', operation: 'getCityByIP' })
      );
    });
  });

  describe('основной провайдер ip-api', () => {
    it('happy path: Россия → «Город, Регион»', async () => {
      fetchMock.mockImplementation((url: string) =>
        ok({ status: 'success', city: 'Балашиха', regionName: 'Moscow Oblast', country: 'Russia' })
      );

      await expect(getCityByIP('8.8.8.8')).resolves.toBe('Балашиха, Moscow Oblast');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'IP lookup resolved',
        expect.objectContaining({ provider: 'ip-api', module: 'ipLookup', operation: 'getCityByIP' })
      );
    });

    it('не-Россия → «Город, Регион, Страна»', async () => {
      fetchMock.mockImplementation((url: string) =>
        ok({ status: 'success', city: 'Ashburn', regionName: 'Virginia', country: 'United States' })
      );

      await expect(getCityByIP('8.8.8.8')).resolves.toBe('Ashburn, Virginia, United States');
    });

    it('не-Россия без региона → «Город, Страна»', async () => {
      fetchMock.mockImplementation((url: string) =>
        ok({ status: 'success', city: 'Ashburn', regionName: '', country: 'United States' })
      );

      await expect(getCityByIP('8.8.8.8')).resolves.toBe('Ashburn, United States');
    });

    it('BUG-001: не-Россия без страны → только «Город, Регион», без null в строке', async () => {
      fetchMock.mockImplementation((url: string) =>
        ok({ status: 'success', city: 'Ashburn', regionName: 'Virginia', country: '' })
      );

      await expect(getCityByIP('8.8.8.8')).resolves.toBe('Ashburn, Virginia');
    });

    it('status=failed → ретрай и переход к фолбэку', async () => {
      fetchMock.mockImplementation((url: string) =>
        url.startsWith(IP_API_URL)
          ? ok({ status: 'failed' })
          : ok({ success: true, city: 'Ashburn', region: 'Virginia', country: 'United States' })
      );

      await expect(getCityByIP('8.8.8.8')).resolves.toBe('Ashburn, Virginia, United States');

      const primaryCalls = fetchMock.mock.calls.filter(([u]: string[]) => u.startsWith(IP_API_URL));
      expect(primaryCalls).toHaveLength(2);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'IP lookup provider returned no city',
        expect.objectContaining({ provider: 'ip-api' })
      );
    });
  });

  describe('ретраи и фолбэк ipwho.is', () => {
    it('таймауты основного (DNS-деградация) → 2 попытки, затем успешный фолбэк', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (url.startsWith(IP_API_URL)) {
          return Promise.reject(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
        }
        return ok({ success: true, city: 'Ashburn', region: 'Virginia', country: 'United States' });
      });

      await expect(getCityByIP('8.8.8.8')).resolves.toBe('Ashburn, Virginia, United States');

      expect(fetchMock.mock.calls.filter(([u]: string[]) => u.startsWith(IP_API_URL))).toHaveLength(2);
      expect(fetchMock.mock.calls.filter(([u]: string[]) => u.startsWith(IPWHO_URL))).toHaveLength(1);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'IP lookup provider fetch failed',
        expect.objectContaining({ provider: 'ip-api', attempt: 1 })
      );
    });

    it('HTTP 429 у основного → 2 попытки, затем фолбэк', async () => {
      fetchMock.mockImplementation((url: string) =>
        url.startsWith(IP_API_URL)
          ? httpError(429)
          : ok({ success: true, city: 'Москва', region: 'Москва', country: 'Russia' })
      );

      await expect(getCityByIP('8.8.8.8')).resolves.toBe('Москва, Москва');

      expect(fetchMock.mock.calls.filter(([u]: string[]) => u.startsWith(IP_API_URL))).toHaveLength(2);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'IP lookup provider HTTP error',
        expect.objectContaining({ provider: 'ip-api', status: 429 })
      );
    });

    it('использует таймаут 6000ms (было 3000ms — не переживает медленный DNS)', async () => {
      const timeoutSpy = jest.spyOn(AbortSignal, 'timeout');
      fetchMock.mockImplementation(() =>
        ok({ status: 'success', city: 'Москва', regionName: 'Москва', country: 'Russia' })
      );

      await getCityByIP('8.8.8.8');

      expect(timeoutSpy).toHaveBeenCalledWith(6000);
      timeoutSpy.mockRestore();
    });
  });

  describe('полный отказ провайдеров', () => {
    it('оба провайдера падают → null + итоговый error-лог', async () => {
      fetchMock.mockRejectedValue(new Error('network down'));

      await expect(getCityByIP('8.8.8.8')).resolves.toBeNull();

      expect(fetchMock).toHaveBeenCalledTimes(4);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'IP lookup failed after all providers',
        expect.objectContaining({
          module: 'ipLookup',
          operation: 'getCityByIP',
          providers: ['ip-api', 'ipwho'],
          attemptsPerProvider: 2,
        })
      );
    });

    it('обе проверки success отрицательные → null без записи кэша', async () => {
      fetchMock.mockImplementation((url: string) =>
        url.startsWith(IP_API_URL) ? ok({ status: 'failed' }) : ok({ success: false })
      );

      await expect(getCityByIP('8.8.8.8')).resolves.toBeNull();
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });
  });
});

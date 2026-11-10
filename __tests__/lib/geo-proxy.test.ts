jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import logger from '@/lib/logger';
import {
  getGeoDispatcher,
  __resetGeoDispatcherForTests,
} from '@/lib/geo-proxy';

const mockLogger = logger as any;

describe('geo-proxy (ЧТЗ_Фикс_Геолокация_DNS_контейнера_2026-11-10)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetGeoDispatcherForTests();
    delete process.env.IPAPI_DIRECT_IP;
    delete process.env.IPWHO_DIRECT_IP;
  });

  afterAll(() => {
    __resetGeoDispatcherForTests();
    delete process.env.IPAPI_DIRECT_IP;
    delete process.env.IPWHO_DIRECT_IP;
  });

  it('без env — dispatcher не создаётся (обычный DNS-резолв)', () => {
    expect(getGeoDispatcher()).toBeUndefined();
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it('IPAPI_DIRECT_IP задан — создаётся dispatcher и логируется включение Direct-IP', () => {
    process.env.IPAPI_DIRECT_IP = '208.95.112.1';

    const dispatcher = getGeoDispatcher();

    expect(dispatcher).toBeDefined();
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Geo direct-IP dispatcher enabled',
      expect.objectContaining({
        module: 'ipLookup',
        operation: 'getGeoDispatcher',
        hosts: { 'ip-api.com': '208.95.112.1' },
      })
    );
  });

  it('оба провайдера заданы — оба хоста в логе', () => {
    process.env.IPAPI_DIRECT_IP = '208.95.112.1';
    process.env.IPWHO_DIRECT_IP = '8.6.112.0';

    getGeoDispatcher();

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Geo direct-IP dispatcher enabled',
      expect.objectContaining({
        hosts: { 'ip-api.com': '208.95.112.1', 'ipwho.is': '8.6.112.0' },
      })
    );
  });

  it('dispatcher кэшируется после первой инициализации', () => {
    process.env.IPAPI_DIRECT_IP = '208.95.112.1';

    const first = getGeoDispatcher();
    const second = getGeoDispatcher();

    expect(first).toBe(second);
    expect(mockLogger.info).toHaveBeenCalledTimes(1);
  });

  it('пробельные/пустые значения env игнорируются', () => {
    process.env.IPAPI_DIRECT_IP = '   ';
    process.env.IPWHO_DIRECT_IP = '';

    expect(getGeoDispatcher()).toBeUndefined();
  });

  it('сброс для тестов переинициализирует по новым env', () => {
    process.env.IPAPI_DIRECT_IP = '208.95.112.1';
    getGeoDispatcher();

    __resetGeoDispatcherForTests();
    delete process.env.IPAPI_DIRECT_IP;

    expect(getGeoDispatcher()).toBeUndefined();
  });
});

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('telegram-proxy getTelegramDispatcher', () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.TELEGRAM_PROXY_URL;
    delete process.env.TELEGRAM_API_IP;
  });

  it('returns undefined when no TELEGRAM_API_IP and no TELEGRAM_PROXY_URL (default fetch)', async () => {
    const { getTelegramDispatcher, __resetTelegramDispatcherForTests } = await import('@/lib/telegram-proxy');
    __resetTelegramDispatcherForTests();
    expect(getTelegramDispatcher()).toBeUndefined();
  });

  it('returns a dispatcher when TELEGRAM_API_IP is set (direct-IP mode)', async () => {
    process.env.TELEGRAM_API_IP = '149.154.167.220';
    const { getTelegramDispatcher, __resetTelegramDispatcherForTests } = await import('@/lib/telegram-proxy');
    __resetTelegramDispatcherForTests();

    const dispatcher = getTelegramDispatcher();
    expect(dispatcher).toBeDefined();
    expect(typeof (dispatcher as any).dispatch).toBe('function');
  });

  it('supports a comma-separated IP list', async () => {
    process.env.TELEGRAM_API_IP = '149.154.167.220, 149.154.167.99 ';
    const { getTelegramDispatcher, __resetTelegramDispatcherForTests } = await import('@/lib/telegram-proxy');
    __resetTelegramDispatcherForTests();

    const dispatcher = getTelegramDispatcher();
    expect(dispatcher).toBeDefined();
  });

  it('returns a dispatcher when only TELEGRAM_PROXY_URL is set (proxy mode, back-compat)', async () => {
    process.env.TELEGRAM_PROXY_URL = 'http://127.0.0.1:1080';
    const { getTelegramDispatcher, __resetTelegramDispatcherForTests } = await import('@/lib/telegram-proxy');
    __resetTelegramDispatcherForTests();

    const dispatcher = getTelegramDispatcher();
    expect(dispatcher).toBeDefined();
    expect(typeof (dispatcher as any).dispatch).toBe('function');
  });

  it('TELEGRAM_API_IP takes precedence over TELEGRAM_PROXY_URL', async () => {
    process.env.TELEGRAM_PROXY_URL = 'http://127.0.0.1:1080';
    process.env.TELEGRAM_API_IP = '149.154.167.220';
    const { getTelegramDispatcher, __resetTelegramDispatcherForTests } = await import('@/lib/telegram-proxy');
    __resetTelegramDispatcherForTests();

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    getTelegramDispatcher();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Direct-IP mode'));
    spy.mockRestore();
  });

  it('caches the dispatcher across calls', async () => {
    process.env.TELEGRAM_API_IP = '149.154.167.220';
    const { getTelegramDispatcher, __resetTelegramDispatcherForTests } = await import('@/lib/telegram-proxy');
    __resetTelegramDispatcherForTests();

    const first = getTelegramDispatcher();
    const second = getTelegramDispatcher();
    expect(first).toBe(second);
  });
});

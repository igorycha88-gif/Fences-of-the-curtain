let _proxyDispatcher: unknown = undefined;

export function getTelegramDispatcher(): undefined | { dispatch: unknown } {
  const proxyUrl = process.env.TELEGRAM_PROXY_URL;
  if (!proxyUrl) return undefined;

  if (_proxyDispatcher === undefined) {
    try {
      const undici = require('undici') as typeof import('undici');
      _proxyDispatcher = new undici.ProxyAgent(proxyUrl);
      console.log('[telegram-proxy] ProxyAgent initialized:', proxyUrl);
    } catch (error) {
      console.error('[telegram-proxy] Failed to create ProxyAgent:', error);
      _proxyDispatcher = null;
    }
  }

  return _proxyDispatcher as undefined | { dispatch: unknown };
}

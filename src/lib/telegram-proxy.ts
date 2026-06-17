import { lookup as dnsLookup } from 'dns';

type Dispatcher = { dispatch: unknown };

let _dispatcher: Dispatcher | null | undefined;
let _initialized = false;

function parseApiIpList(): string[] {
  const raw = process.env.TELEGRAM_API_IP;
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function createProxyDispatcher(proxyUrl: string): Dispatcher {
  const undici = require('undici') as typeof import('undici');
  return new undici.ProxyAgent(proxyUrl);
}

function createDirectIpDispatcher(ips: string[]): Dispatcher {
  const undici = require('undici') as typeof import('undici');
  let cursor = 0;

  return new undici.Agent({
    connect: {
      lookup: (hostname: string, options: any, callback: any) => {
        let cb = callback;
        let opts = options;
        if (typeof opts === 'function') {
          cb = opts;
          opts = {};
        }
        if (hostname === 'api.telegram.org') {
          const ip = ips[cursor % ips.length];
          cursor += 1;
          return cb(null, ip, 4);
        }
        return dnsLookup(hostname, opts, cb);
      },
    },
  });
}

export function getTelegramDispatcher(): Dispatcher | undefined {
  if (!_initialized) {
    _initialized = true;
    try {
      const ips = parseApiIpList();
      const proxyUrl = process.env.TELEGRAM_PROXY_URL;

      if (ips.length > 0) {
        _dispatcher = createDirectIpDispatcher(ips);
        console.log(`[telegram-proxy] Direct-IP mode: api.telegram.org -> ${ips.join(', ')}`);
      } else if (proxyUrl) {
        _dispatcher = createProxyDispatcher(proxyUrl);
        console.log(`[telegram-proxy] ProxyAgent mode: ${proxyUrl}`);
      } else {
        _dispatcher = null;
      }
    } catch (error) {
      console.error('[telegram-proxy] Failed to init dispatcher:', error);
      _dispatcher = null;
    }
  }

  return _dispatcher === null ? undefined : _dispatcher;
}

export function __resetTelegramDispatcherForTests(): void {
  _dispatcher = undefined;
  _initialized = false;
}

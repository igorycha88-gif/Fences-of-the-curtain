import { lookup as dnsLookup } from 'dns';
import logger from '@/lib/logger';

type Dispatcher = { dispatch: unknown };

let _dispatcher: Dispatcher | null | undefined;
let _initialized = false;

/**
 * Direct-IP режим для гео-провайдеров (по образцу TELEGRAM_API_IP).
 * ЧТЗ_Фикс_Геолокация_DNS_контейнера_2026-11-10: при блокировке внешних
 * DNS-резолверов (инциденты 23.10 и 04.11) запросы к ip-api.com / ipwho.is
 * уходят напрямую на IP из env, минуя DNS. Hostname сохраняется —
 * корректный SNI для HTTPS и виртуалхостинг.
 *
 * Env:
 *   IPAPI_DIRECT_IP  — IP для ip-api.com (например 208.95.112.1)
 *   IPWHO_DIRECT_IP  — IP для ipwho.is (узнать: getent ahosts ipwho.is)
 */
function parseDirectIps(): Map<string, string> {
  const mapping = new Map<string, string>();
  const ipApi = process.env.IPAPI_DIRECT_IP?.trim();
  const ipWho = process.env.IPWHO_DIRECT_IP?.trim();
  if (ipApi) mapping.set('ip-api.com', ipApi);
  if (ipWho) mapping.set('ipwho.is', ipWho);
  return mapping;
}

function createDirectIpDispatcher(ips: Map<string, string>): Dispatcher {
  const undici = require('undici') as typeof import('undici');
  return new undici.Agent({
    connect: {
      lookup: (hostname: string, options: any, callback: any) => {
        let cb = callback;
        let opts = options;
        if (typeof opts === 'function') {
          cb = opts;
          opts = {};
        }
        const directIp = ips.get(hostname);
        if (directIp) {
          return cb(null, [{ address: directIp, family: 4 }]);
        }
        return dnsLookup(hostname, opts, cb);
      },
    },
  });
}

export function getGeoDispatcher(): Dispatcher | undefined {
  if (!_initialized) {
    _initialized = true;
    try {
      const ips = parseDirectIps();
      if (ips.size > 0) {
        _dispatcher = createDirectIpDispatcher(ips);
        logger.info('Geo direct-IP dispatcher enabled', {
          module: 'ipLookup',
          operation: 'getGeoDispatcher',
          hosts: Object.fromEntries(ips),
        });
      } else {
        _dispatcher = null;
      }
    } catch (error) {
      logger.error('Geo direct-IP dispatcher init failed', {
        module: 'ipLookup',
        operation: 'getGeoDispatcher',
        error,
      });
      _dispatcher = null;
    }
  }

  return _dispatcher === null ? undefined : _dispatcher;
}

export function __resetGeoDispatcherForTests(): void {
  _dispatcher = undefined;
  _initialized = false;
}

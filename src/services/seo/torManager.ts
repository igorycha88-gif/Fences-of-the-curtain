import net from 'net';

interface TorConfig {
  enabled: boolean;
  socksHost: string;
  socksPort: number;
  controlPort: number;
  controlPassword: string;
  maxRotations: number;
  cooldownMs: number;
}

interface TorStats {
  rotations: number;
  captchaHits: number;
  currentIp: string | null;
  active: boolean;
}

function getBoolEnv(key: string, defaultValue: boolean): boolean {
  const val = process.env[key];
  if (!val) return defaultValue;
  return val === 'true' || val === '1';
}

function getIntEnv(key: string, defaultValue: number): number {
  const val = process.env[key];
  if (!val) return defaultValue;
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

export class TorManager {
  private config: TorConfig;
  private stats: TorStats;
  private rotationCooldownUntil: number = 0;

  constructor() {
    this.config = {
      enabled: getBoolEnv('SEO_TOR_ENABLED', false),
      socksHost: process.env.SEO_TOR_SOCKS_HOST || '127.0.0.1',
      socksPort: getIntEnv('SEO_TOR_SOCKS_PORT', 9050),
      controlPort: getIntEnv('SEO_TOR_CONTROL_PORT', 9051),
      controlPassword: process.env.SEO_TOR_CONTROL_PASSWORD || '',
      maxRotations: getIntEnv('SEO_TOR_MAX_ROTATIONS', 5),
      cooldownMs: getIntEnv('SEO_TOR_COOLDOWN_MS', 30 * 60 * 1000),
    };

    this.stats = {
      rotations: 0,
      captchaHits: 0,
      currentIp: null,
      active: false,
    };
  }

  get isEnabled(): boolean {
    return this.config.enabled;
  }

  getStats(): TorStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      rotations: 0,
      captchaHits: 0,
      currentIp: null,
      active: false,
    };
    this.rotationCooldownUntil = 0;
  }

  getProxyString(): string | null {
    if (!this.config.enabled) return null;
    return `socks5://${this.config.socksHost}:${this.config.socksPort}`;
  }

  async activate(): Promise<boolean> {
    if (!this.config.enabled) return false;

    const reachable = await this.checkReachable();
    if (!reachable) {
      console.warn('[TorManager] Tor proxy is not reachable');
      return false;
    }

    this.stats.active = true;
    await this.detectCurrentIp();
    console.log(`[TorManager] Activated. Current IP: ${this.stats.currentIp || 'unknown'}`);
    return true;
  }

  async onCaptcha(): Promise<{ rotated: boolean; reason?: string }> {
    if (!this.config.enabled || !this.stats.active) {
      return { rotated: false, reason: 'Tor not active' };
    }

    this.stats.captchaHits++;

    if (this.stats.rotations >= this.config.maxRotations) {
      const now = Date.now();
      if (now < this.rotationCooldownUntil) {
        const remainingMin = Math.ceil((this.rotationCooldownUntil - now) / 60000);
        console.warn(
          `[TorManager] Max rotations reached (${this.stats.rotations}/${this.config.maxRotations}). Cooldown: ${remainingMin} min remaining.`
        );
        return { rotated: false, reason: `max_rotations_cooldown_${remainingMin}min` };
      }

      this.stats.rotations = 0;
      console.log('[TorManager] Cooldown expired, resetting rotation counter');
    }

    const rotated = await this.rotateIp();
    if (rotated) {
      this.stats.rotations++;
      console.log(
        `[TorManager] IP rotated (${this.stats.rotations}/${this.config.maxRotations}). New IP: ${this.stats.currentIp || 'unknown'}`
      );

      if (this.stats.rotations >= this.config.maxRotations) {
        this.rotationCooldownUntil = Date.now() + this.config.cooldownMs;
        console.warn(
          `[TorManager] Max rotations reached. Cooldown started for ${Math.round(this.config.cooldownMs / 60000)} min`
        );
      }

      return { rotated: true };
    }

    return { rotated: false, reason: 'rotation_failed' };
  }

  async rotateIp(): Promise<boolean> {
    const password = this.config.controlPassword
      ? ` "${this.config.controlPassword}"`
      : '';

    return new Promise((resolve) => {
      const socket = new net.Socket();
      const host = this.config.socksHost;
      const port = this.config.controlPort;

      socket.setTimeout(10000);

      socket.on('error', (err) => {
        console.error('[TorManager] Control connection error:', err.message);
        socket.destroy();
        resolve(false);
      });

      socket.on('timeout', () => {
        console.error('[TorManager] Control connection timeout');
        socket.destroy();
        resolve(false);
      });

      socket.connect(port, host, () => {
        socket.write(`AUTHENTICATE${password}\r\n`);
      });

      let authenticated = false;

      socket.on('data', (data: Buffer) => {
        const response = data.toString().trim();

        if (!authenticated) {
          if (response.startsWith('250')) {
            authenticated = true;
            socket.write('SIGNAL NEWNYM\r\n');
          } else {
            console.error('[TorManager] Authentication failed:', response);
            socket.destroy();
            resolve(false);
          }
        } else {
          if (response.startsWith('250')) {
            socket.write('QUIT\r\n');

            setTimeout(async () => {
              await this.detectCurrentIp();
              resolve(true);
            }, 2000);
          } else {
            console.error('[TorManager] NEWNYM failed:', response);
            socket.destroy();
            resolve(false);
          }
        }
      });
    });
  }

  private async checkReachable(): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(5000);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(this.config.socksPort, this.config.socksHost);
    });
  }

  private async detectCurrentIp(): Promise<void> {
    try {
      const { execSync } = await import('child_process');
      const result = execSync(
        `curl -s --max-time 10 --proxy socks5://${this.config.socksHost}:${this.config.socksPort} https://check.tor-project.org/api/ip 2>/dev/null || echo '{}'`,
        { encoding: 'utf-8', timeout: 15000 }
      );
      const parsed = JSON.parse(result);
      this.stats.currentIp = parsed.IP || null;
    } catch {
      this.stats.currentIp = null;
    }
  }
}

export const torManager = new TorManager();

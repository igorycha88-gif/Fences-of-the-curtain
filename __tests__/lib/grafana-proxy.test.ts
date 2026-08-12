import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../');
const read = (rel: string): string => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
const exists = (rel: string): boolean => fs.existsSync(path.join(REPO_ROOT, rel));

// Извлечь блок environment сервиса grafana из docker-compose YAML.
function extractGrafanaEnv(yaml: string): string[] {
  const start = yaml.indexOf('  grafana:');
  if (start === -1) return [];
  // блок от grafana: до следующего сервиса (2-пробельного отступа) или volumes:
  const after = yaml.slice(start);
  const next = after.slice(1).search(/\n  [a-z_-]+:/);
  const block = next === -1 ? after : after.slice(0, next + 1);
  const envMatch = block.match(/environment:\n((?:\s+-[^\n]*\n?)+)/);
  if (!envMatch) return [];
  return envMatch[1]
    .split('\n')
    .map((l) => l.replace(/^\s+-\s?/, '').trim())
    .filter((l) => l.length > 0);
}

function hasGrafanaNetworkModeHost(yaml: string): boolean {
  const start = yaml.indexOf('  grafana:');
  if (start === -1) return false;
  const after = yaml.slice(start);
  const next = after.slice(1).search(/\n  [a-z_-]+:/);
  const block = next === -1 ? after : after.slice(0, next + 1);
  return /network_mode:\s*host/.test(block);
}

describe('TASK-GRP-BCK-001: docker-compose.monitoring.yml env Grafana', () => {
  const compose = read('docker-compose.monitoring.yml');
  const env = extractGrafanaEnv(compose);

  it('сервис grafana присутствует', () => {
    expect(compose).toContain('  grafana:');
  });

  it('GF_SERVER_ROOT_URL указывает на https://zabor-i-naves.ru/grafana (без trailing slash)', () => {
    const value = env.find((e) => e.startsWith('GF_SERVER_ROOT_URL='));
    expect(value).toBe('GF_SERVER_ROOT_URL=https://zabor-i-naves.ru/grafana');
  });

  it('GF_SERVER_SERVE_FROM_SUB_PATH=true', () => {
    const value = env.find((e) => e.startsWith('GF_SERVER_SERVE_FROM_SUB_PATH='));
    expect(value).toBe('GF_SERVER_SERVE_FROM_SUB_PATH=true');
  });

  it('GF_SERVER_HTTP_PORT остался 3002 (слушает локально)', () => {
    const value = env.find((e) => e.startsWith('GF_SERVER_HTTP_PORT='));
    expect(value).toBe('GF_SERVER_HTTP_PORT=3002');
  });

  it('GF_SERVER_HTTP_ADDR=127.0.0.1 (порт 3002 закрыт на уровне приложения, без ufw)', () => {
    const value = env.find((e) => e.startsWith('GF_SERVER_HTTP_ADDR='));
    expect(value).toBe('GF_SERVER_HTTP_ADDR=127.0.0.1');
  });

  it('network_mode host (Prometheus/Grafana общаются через localhost)', () => {
    expect(hasGrafanaNetworkModeHost(compose)).toBe(true);
  });
});

describe('TASK-GRP-BCK-001b: все monitoring-сервисы слушают только 127.0.0.1 (БЕЗ ufw)', () => {
  const compose = read('docker-compose.monitoring.yml');

  it('НИ ОДИН web.listen-address не содержит 0.0.0.0', () => {
    const matches = compose.match(/--web\.listen-address=0\.0\.0\.0:\d+/g);
    expect(matches).toBeNull();
  });

  it('Prometheus слушает на 127.0.0.1:9090', () => {
    expect(compose).toContain('--web.listen-address=127.0.0.1:9090');
  });

  it('node_exporter слушает на 127.0.0.1:9100', () => {
    expect(compose).toContain('--web.listen-address=127.0.0.1:9100');
  });

  it('postgres_exporter слушает на 127.0.0.1:9187', () => {
    expect(compose).toContain('--web.listen-address=127.0.0.1:9187');
  });

  it('redis_exporter слушает на 127.0.0.1:9121', () => {
    expect(compose).toContain('--web.listen-address=127.0.0.1:9121');
  });

  it('nginx_exporter слушает на 127.0.0.1:9113', () => {
    expect(compose).toContain('--web.listen-address=127.0.0.1:9113');
  });
});

describe('TASK-GRP-BCK-002: docker/nginx.conf содержит location /grafana/ в обоих server-блоках', () => {
  const conf = read('docker/nginx.conf');

  it('listen 80 server имеет location /grafana/ с auth_basic', () => {
    expect(conf).toMatch(/listen\s+80[^]*location\s+\/grafana\/\s*\{[^]*auth_basic/);
  });

  it('listen 443 server имеет location /grafana/ с auth_basic', () => {
    expect(conf).toMatch(/listen\s+443[^]*location\s+\/grafana\/\s*\{[^]*auth_basic/);
  });

  it('proxy_pass указывает на http://127.0.0.1:3002/grafana/', () => {
    expect(conf).toContain('proxy_pass http://127.0.0.1:3002/grafana/');
  });

  it('auth_basic_user_file указывает на /etc/nginx/.htpasswd', () => {
    expect(conf).toContain('auth_basic_user_file /etc/nginx/.htpasswd;');
  });

  it('WebSocket-заголовки для Grafana Live', () => {
    const grafanaBlock = conf.match(/location\s+\/grafana\/\s*\{[\s\S]*?\}/);
    expect(grafanaBlock).not.toBeNull();
    expect(grafanaBlock![0]).toContain('proxy_set_header Upgrade $http_upgrade');
    expect(grafanaBlock![0]).toContain('proxy_set_header Connection "upgrade"');
  });

  it('x-forwarded-proto передаётся (Grafana должна знать что за HTTPS)', () => {
    expect(conf).toContain('proxy_set_header X-Forwarded-Proto $scheme');
  });
});

describe('TASK-GRP-BCK-003: docker/nginx.optimized.conf upstream grafana → 127.0.0.1:3002', () => {
  const conf = read('docker/nginx.optimized.conf');

  it('upstream grafana указывает на host-network 127.0.0.1:3002 (не fences-grafana:3000)', () => {
    expect(conf).not.toContain('server fences-grafana:3000');
    expect(conf).toMatch(/upstream\s+grafana\s*\{[^}]*127\.0\.0\.1:3002[^}]*\}/);
  });

  it('location /grafana/ в optimized-конфиге также валиден', () => {
    expect(conf).toMatch(/location\s+\/grafana\/\s*\{[\s\S]*?proxy_pass\s+http:\/\/grafana/);
  });
});

describe('TASK-GRP-BCK-002 (snippet): docker/nginx/snippets/grafana.conf', () => {
  const snippetPath = 'docker/nginx/snippets/grafana.conf';

  it('файл существует', () => {
    expect(exists(snippetPath)).toBe(true);
  });

  const snippet = exists(snippetPath) ? read(snippetPath) : '';

  it('содержит location /grafana/', () => {
    expect(snippet).toContain('location /grafana/ {');
  });

  it('proxy_pass на 127.0.0.1:3002/grafana/', () => {
    expect(snippet).toContain('proxy_pass http://127.0.0.1:3002/grafana/');
  });

  it('auth_basic + auth_basic_user_file', () => {
    expect(snippet).toContain('auth_basic "Grafana - Admin Only";');
    expect(snippet).toContain('auth_basic_user_file /etc/nginx/.htpasswd;');
  });

  it('WebSocket-заголовки', () => {
    expect(snippet).toContain('proxy_set_header Upgrade $http_upgrade');
    expect(snippet).toContain('proxy_set_header Connection "upgrade"');
  });
});

describe('Безопасность: docker/.htpasswd содержит только хэш (не plaintext)', () => {
  it('файл существует и содержит хэш admin', () => {
    expect(exists('docker/.htpasswd')).toBe(true);
    const content = read('docker/.htpasswd').trim();
    // apr1 или bcrypt или $2y$ хэш
    expect(content).toMatch(/^admin:\$(apr1|2y\$|\$2y\$)/);
  });

  it('нет пробелов между admin и хэшем (валидный формат htpasswd)', () => {
    const line = read('docker/.htpasswd').trim().split('\n')[0];
    expect(line).toMatch(/^admin:\S+$/);
  });
});

describe('TASK-GRP-INF-001: scripts/setup-grafana-proxy.sh', () => {
  const scriptPath = 'scripts/setup-grafana-proxy.sh';
  const script = read(scriptPath);

  it('файл существует', () => {
    expect(exists(scriptPath)).toBe(true);
  });

  it('поддерживает --rollback', () => {
    expect(script).toMatch(/--rollback\)\s+MODE="rollback"/);
  });

  it('НЕ вызывает ufw/iptables как команды (безопасность через listen-address)', () => {
    // Упоминания в комментариях OK — запрещаем именно вызовы в начале строки (с optional отступом).
    const commandLines = script.split('\n').filter((l) => !l.trim().startsWith('#'));
    const nonComment = commandLines.join('\n');
    expect(nonComment).not.toMatch(/(^|\s)ufw\s+\w/);
    expect(nonComment).not.toMatch(/(^|\s)iptables\s+-/);
    expect(script).toContain('listen-address=127.0.0.1');
  });

  it('nginx -t с автооткатом при ошибке', () => {
    expect(script).toContain('nginx -t');
    expect(script).toMatch(/nginx -t FAILED.*автооткат/);
  });

  it('healthcheck Grafana И Prometheus (после recreate monitoring)', () => {
    expect(script).toContain('wait_health "http://127.0.0.1:3002/api/health" "Grafana"');
    expect(script).toContain('wait_health "http://127.0.0.1:9090/-/healthy" "Prometheus"');
  });

  it('порядок: nginx apply → recreate monitoring → healthcheck (fail-fast)', () => {
    const nginxIdx = script.lastIndexOf('nginx_apply_or_revert apply');
    const recreateIdx = script.lastIndexOf('recreate_monitoring');
    const healthIdx = script.lastIndexOf('wait_health "http://127.0.0.1:3002');
    expect(nginxIdx).toBeGreaterThan(-1);
    expect(recreateIdx).toBeGreaterThan(nginxIdx);
    expect(healthIdx).toBeGreaterThan(recreateIdx);
  });

  it('проверяет что порты НЕ слушают на 0.0.0.0 после recreate', () => {
    expect(script).toContain('ss -tlnp');
    expect(script).toContain('3002 9090 9100 9113 9121 9187');
  });

  it('копирует snippet и .htpasswd из репо в /etc/nginx', () => {
    expect(script).toContain('docker/nginx/snippets/grafana.conf');
    expect(script).toContain('docker/.htpasswd');
    expect(script).toContain('/etc/nginx/snippets/grafana.conf');
    expect(script).toContain('/etc/nginx/.htpasswd');
  });

  it('упоминает SSH-туннель для доступа к Prometheus UI', () => {
    expect(script).toMatch(/ssh -L 9090:127\.0\.0\.1:9090/);
  });
});

describe('TASK-GRP-INF-002: scripts/validate-nginx.sh', () => {
  const script = read('scripts/validate-nginx.sh');

  it('файл существует', () => {
    expect(exists('scripts/validate-nginx.sh')).toBe(true);
  });

  it('проверяет оба полных конфига', () => {
    expect(script).toContain('docker/nginx.conf');
    expect(script).toContain('docker/nginx.optimized.conf');
  });

  it('использует nginx:stable-alpine (воспроизводимо)', () => {
    expect(script).toContain('nginx:stable-alpine');
  });

  it('валидирует snippets в http/server context', () => {
    expect(script).toContain('check_snippet');
  });
});

describe('TASK-GRP-INF-003: apply-picket-migration.sh предупреждает о туннеле', () => {
  const script = read('scripts/apply-picket-migration.sh');

  it('содержит предупреждение про SSH-туннель', () => {
    expect(script).toContain('SSH-туннель');
    expect(script).toMatch(/ssh\s+-L\s+3001:127\.0\.0\.1:3001/);
  });

  it('ссылается на ЧТЗ Grafana Reverse Proxy', () => {
    expect(script).toContain('ЧТЗ_Grafana_Reverse_Proxy');
  });
});

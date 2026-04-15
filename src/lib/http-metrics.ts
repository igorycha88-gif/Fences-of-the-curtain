const DURATION_BUCKETS = [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10];

interface TimingEntry {
  count: number;
  sum: number;
  buckets: Record<string, number>;
}

const timingData = new Map<string, TimingEntry>();
const MAX_PATHS = 50;

const PATH_PATTERNS: [RegExp, string][] = [
  [/^\/_next\/.*/, '/_next'],
  [/^\/api\/analytics\/.*/, '/api/analytics'],
  [/^\/api\/metrics$/, '/api/metrics'],
  [/^\/api\/health/, '/api/health'],
  [/^\/api\/leads\/.*/, '/api/leads/:id'],
  [/^\/api\/estimates\/.*/, '/api/estimates/:id'],
  [/^\/api\/contact/, '/api/contact'],
  [/^\/api\/auth\/.*/, '/api/auth/:action'],
  [/^\/uploads\/.*/, '/uploads'],
  [/^\/go\/.*/, '/go/:source'],
  [/^\/calculator\/.*/, '/calculator/:type'],
  [/^\/portfolio\/.*/, '/portfolio/:id'],
  [/^\/services\/.*/, '/services/:slug'],
  [/^\/blog\/.*/, '/blog/:slug'],
];

function sanitizePath(path: string): string {
  return path.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

export function normalizePath(path: string): string {
  for (const [pattern, replacement] of PATH_PATTERNS) {
    if (pattern.test(path)) return replacement;
  }

  let normalized = path.replace(/\/\d+/g, '/:id');
  normalized = normalized.replace(/[^a-zA-Z0-9_\-\/:]/g, '_');

  if (timingData.size >= MAX_PATHS && !timingData.has(normalized)) {
    return ':other';
  }

  return normalized || '/';
}

export function recordTiming(path: string, durationMs: number): void {
  const normalized = normalizePath(path);
  const durationSec = durationMs / 1000;

  let entry = timingData.get(normalized);
  if (!entry) {
    entry = { count: 0, sum: 0, buckets: {} };
    timingData.set(normalized, entry);
  }

  entry.count++;
  entry.sum += durationSec;

  for (const bucket of DURATION_BUCKETS) {
    if (durationSec <= bucket) {
      const key = String(bucket);
      entry.buckets[key] = (entry.buckets[key] || 0) + 1;
    }
  }
  entry.buckets['+Inf'] = (entry.buckets['+Inf'] || 0) + 1;
}

export function getTimingData(): Map<string, TimingEntry> {
  return timingData;
}

export function formatHistogramOutput(): string {
  const data = getTimingData();
  if (data.size === 0) return '';

  let output = '# HELP http_request_duration_seconds HTTP request duration in seconds\n';
  output += '# TYPE http_request_duration_seconds histogram\n';

  for (const [path, entry] of data) {
    if (entry.count === 0) continue;

    const safePath = sanitizePath(path);
    for (const bucket of DURATION_BUCKETS) {
      const count = entry.buckets[String(bucket)] || 0;
      output += `http_request_duration_seconds_bucket{path="${safePath}",le="${bucket}"} ${count}\n`;
    }
    output += `http_request_duration_seconds_bucket{path="${safePath}",le="+Inf"} ${entry.buckets['+Inf'] || 0}\n`;
    output += `http_request_duration_seconds_sum{path="${safePath}"} ${entry.sum}\n`;
    output += `http_request_duration_seconds_count{path="${safePath}"} ${entry.count}\n`;
  }

  return output;
}

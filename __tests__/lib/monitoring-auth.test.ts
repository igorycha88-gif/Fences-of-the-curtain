import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

import { getClientIp, isLoopbackRequest, isAuthorizedMonitoringRequest } from '@/lib/monitoring-auth';

const KEY = 'd'.repeat(64);

function makeRequest(headers: Record<string, string>): any {
  return new Request('http://localhost:3000/', { method: 'GET', headers });
}

describe('monitoring-auth', () => {
  beforeEach(() => {
    process.env.MONITORING_KEY = KEY;
  });

  afterEach(() => {
    delete process.env.MONITORING_KEY;
  });

  it('extracts and normalizes client IP from x-forwarded-for', () => {
    expect(getClientIp(makeRequest({ 'x-forwarded-for': '::ffff:203.0.113.5, 10.0.0.1' }))).toBe('203.0.113.5');
    expect(getClientIp(makeRequest({ 'x-real-ip': '198.51.100.7' }))).toBe('198.51.100.7');
    expect(getClientIp(makeRequest({}))).toBe('unknown');
  });

  it('recognizes loopback in IPv4, IPv6 and IPv6-mapped forms', () => {
    expect(isLoopbackRequest(makeRequest({ 'x-real-ip': '127.0.0.1' }))).toBe(true);
    expect(isLoopbackRequest(makeRequest({ 'x-real-ip': '::1' }))).toBe(true);
    expect(isLoopbackRequest(makeRequest({ 'x-forwarded-for': '::ffff:127.0.0.1' }))).toBe(true);
    expect(isLoopbackRequest(makeRequest({}))).toBe(true);
    expect(isLoopbackRequest(makeRequest({ 'x-real-ip': '203.0.113.5' }))).toBe(false);
    expect(isLoopbackRequest(makeRequest({ 'x-forwarded-for': '::ffff:172.217.20.163' }))).toBe(false);
  });

  it('authorizes with a matching key regardless of IP', () => {
    expect(
      isAuthorizedMonitoringRequest(makeRequest({ 'x-monitoring-key': KEY, 'x-real-ip': '203.0.113.5' }))
    ).toBe(true);
  });

  it('rejects wrong or malformed keys from public IPs', () => {
    expect(
      isAuthorizedMonitoringRequest(makeRequest({ 'x-monitoring-key': 'e'.repeat(64), 'x-real-ip': '203.0.113.5' }))
    ).toBe(false);
    expect(
      isAuthorizedMonitoringRequest(makeRequest({ 'x-monitoring-key': KEY.slice(0, 63), 'x-real-ip': '203.0.113.5' }))
    ).toBe(false);
    expect(isAuthorizedMonitoringRequest(makeRequest({ 'x-real-ip': '203.0.113.5' }))).toBe(false);
  });

  it('authorizes loopback without key', () => {
    expect(isAuthorizedMonitoringRequest(makeRequest({ 'x-real-ip': '::ffff:127.0.0.1' }))).toBe(true);
  });
});

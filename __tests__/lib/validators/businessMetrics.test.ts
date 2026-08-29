import { parseMetricsQuery } from '@/lib/validators/businessMetrics';

describe('parseMetricsQuery', () => {
  it('returns default month period when no params', () => {
    const result = parseMetricsQuery(new URLSearchParams());

    expect('error' in result).toBe(false);
    if ('filters' in result) {
      expect(result.filters.period).toBe('month');
      expect(result.filters.dateFrom).toBeUndefined();
      expect(result.filters.serviceType).toBeUndefined();
    }
  });

  it('parses valid period, dates and filters', () => {
    const params = new URLSearchParams('period=week&dateFrom=2026-08-01&dateTo=2026-08-15&serviceType=fence&managerId=u1');
    const result = parseMetricsQuery(params);

    expect('error' in result).toBe(false);
    if ('filters' in result) {
      expect(result.filters.period).toBe('week');
      expect(result.filters.dateFrom).toEqual(new Date('2026-08-01'));
      expect(result.filters.dateTo).toEqual(new Date('2026-08-15'));
      expect(result.filters.serviceType).toBe('fence');
      expect(result.filters.managerId).toBe('u1');
    }
  });

  it('rejects invalid period', () => {
    const result = parseMetricsQuery(new URLSearchParams('period=decade'));

    expect('error' in result).toBe(true);
    if ('error' in result) expect(result.error).toContain('period');
  });

  it('rejects invalid dateFrom', () => {
    const result = parseMetricsQuery(new URLSearchParams('dateFrom=not-a-date'));

    expect('error' in result).toBe(true);
  });

  it('rejects future dateFrom beyond tomorrow', () => {
    const future = new Date(Date.now() + 30 * 86400000).toISOString();
    const result = parseMetricsQuery(new URLSearchParams(`dateFrom=${future}`));

    expect('error' in result).toBe(true);
  });

  it('rejects invalid dateTo', () => {
    const result = parseMetricsQuery(new URLSearchParams('dateTo=oops'));

    expect('error' in result).toBe(true);
  });
});

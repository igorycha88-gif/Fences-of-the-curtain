import nextConfig from '../../next.config';

describe('Security Headers Configuration', () => {
  describe('next.config.js headers', () => {
    it('should have headers function defined', () => {
      expect(nextConfig.headers).toBeDefined();
      expect(typeof nextConfig.headers).toBe('function');
    });

    it('should return headers for all routes', async () => {
      const result = await nextConfig.headers!();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].source).toBe('/:path*');
    });

    it('should include all required security headers', async () => {
      const result = await nextConfig.headers!();
      const headers = result[0].headers;
      const headerKeys = headers.map((h: { key: string; value: string }) => h.key);

      expect(headerKeys).toContain('X-DNS-Prefetch-Control');
      expect(headerKeys).toContain('X-Frame-Options');
      expect(headerKeys).toContain('X-Content-Type-Options');
      expect(headerKeys).toContain('X-XSS-Protection');
      expect(headerKeys).toContain('Referrer-Policy');
      expect(headerKeys).toContain('Permissions-Policy');
      expect(headerKeys).toContain('Strict-Transport-Security');
    });
  });

  describe('X-Frame-Options', () => {
    it('should be set to SAMEORIGIN', async () => {
      const result = await nextConfig.headers!();
      const header = result[0].headers.find(
        (h: { key: string; value: string }) => h.key === 'X-Frame-Options'
      );
      expect(header?.value).toBe('SAMEORIGIN');
    });
  });

  describe('X-Content-Type-Options', () => {
    it('should be set to nosniff', async () => {
      const result = await nextConfig.headers!();
      const header = result[0].headers.find(
        (h: { key: string; value: string }) => h.key === 'X-Content-Type-Options'
      );
      expect(header?.value).toBe('nosniff');
    });
  });

  describe('X-XSS-Protection', () => {
    it('should be set to 1; mode=block', async () => {
      const result = await nextConfig.headers!();
      const header = result[0].headers.find(
        (h: { key: string; value: string }) => h.key === 'X-XSS-Protection'
      );
      expect(header?.value).toBe('1; mode=block');
    });
  });

  describe('Referrer-Policy', () => {
    it('should be set to strict-origin-when-cross-origin', async () => {
      const result = await nextConfig.headers!();
      const header = result[0].headers.find(
        (h: { key: string; value: string }) => h.key === 'Referrer-Policy'
      );
      expect(header?.value).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Permissions-Policy', () => {
    it('should disable camera, microphone, and geolocation', async () => {
      const result = await nextConfig.headers!();
      const header = result[0].headers.find(
        (h: { key: string; value: string }) => h.key === 'Permissions-Policy'
      );
      expect(header?.value).toBe('camera=(), microphone=(), geolocation=()');
    });
  });

  describe('Strict-Transport-Security (HSTS)', () => {
    it('should have max-age of 1 year', async () => {
      const result = await nextConfig.headers!();
      const header = result[0].headers.find(
        (h: { key: string; value: string }) => h.key === 'Strict-Transport-Security'
      );
      expect(header?.value).toContain('max-age=31536000');
    });

    it('should include includeSubDomains', async () => {
      const result = await nextConfig.headers!();
      const header = result[0].headers.find(
        (h: { key: string; value: string }) => h.key === 'Strict-Transport-Security'
      );
      expect(header?.value).toContain('includeSubDomains');
    });

    it('should include preload', async () => {
      const result = await nextConfig.headers!();
      const header = result[0].headers.find(
        (h: { key: string; value: string }) => h.key === 'Strict-Transport-Security'
      );
      expect(header?.value).toContain('preload');
    });
  });

  describe('X-DNS-Prefetch-Control', () => {
    it('should be set to off', async () => {
      const result = await nextConfig.headers!();
      const header = result[0].headers.find(
        (h: { key: string; value: string }) => h.key === 'X-DNS-Prefetch-Control'
      );
      expect(header?.value).toBe('off');
    });
  });
});

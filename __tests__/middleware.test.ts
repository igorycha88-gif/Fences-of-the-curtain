import { middleware, config } from '../src/middleware';
import { NextResponse } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(),
  },
}));

jest.mock('@/lib/redis', () => ({
  redis: {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    incrby: jest.fn().mockResolvedValue(1),
  },
}));

const mockGetRandomValues = jest.fn();
const originalCrypto = global.crypto;

beforeAll(() => {
  global.crypto = {
    getRandomValues: mockGetRandomValues,
    subtle: {} as SubtleCrypto,
    randomUUID: () => '12345678-1234-1234-1234-123456789012' as ReturnType<Crypto['randomUUID']>,
  } as Crypto;
});

afterAll(() => {
  global.crypto = originalCrypto;
});

describe('middleware', () => {
  let mockResponse: { headers: { set: jest.Mock }; cookies: { set: jest.Mock } };

  beforeEach(() => {
    mockResponse = {
      headers: {
        set: jest.fn(),
      },
      cookies: {
        set: jest.fn(),
      },
    };
    (NextResponse.next as any).mockReturnValue(mockResponse);
    mockGetRandomValues.mockImplementation((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('nonce generation', () => {
    it('should generate nonce and set headers', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/', searchParams: new URLSearchParams() },
        headers: { get: jest.fn().mockReturnValue('') } as any,
        cookies: { get: jest.fn() },
      } as any;

      await middleware(mockRequest);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(mockResponse.headers.set).toHaveBeenCalled();
    });

    it('should not set x-nonce header (nonce removed)', async () => {
      const mockRequest1 = {
        nextUrl: { pathname: '/', searchParams: new URLSearchParams() },
        headers: { get: jest.fn().mockReturnValue('') } as any,
        cookies: { get: jest.fn() },
      } as any;

      const mockRequest2 = {
        nextUrl: { pathname: '/about', searchParams: new URLSearchParams() },
        headers: { get: jest.fn().mockReturnValue('') } as any,
        cookies: { get: jest.fn() },
      } as any;

      await middleware(mockRequest1);
      const calls1 = [...mockResponse.headers.set.mock.calls];
      const nonce1Call = calls1.find((call: string[]) => call[0] === 'x-nonce');

      mockResponse.headers.set.mockClear();
      await middleware(mockRequest2);
      const calls2 = [...mockResponse.headers.set.mock.calls];
      const nonce2Call = calls2.find((call: string[]) => call[0] === 'x-nonce');

      expect(nonce1Call).toBeUndefined();
      expect(nonce2Call).toBeUndefined();
    });

    it('should not generate nonce', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/', searchParams: new URLSearchParams() },
        headers: { get: jest.fn().mockReturnValue('') } as any,
        cookies: { get: jest.fn() },
      } as any;

      await middleware(mockRequest);

      const nonceCall = mockResponse.headers.set.mock.calls.find(
        (call: string[]) => call[0] === 'x-nonce'
      );

      expect(nonceCall).toBeUndefined();
    });
  });

  describe('Content-Security-Policy header', () => {
    it('should set CSP header without nonce', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/', searchParams: new URLSearchParams() },
        headers: { get: jest.fn().mockReturnValue('') } as any,
        cookies: { get: jest.fn() },
      } as any;

      await middleware(mockRequest);

      const cspCall = mockResponse.headers.set.mock.calls.find(
        (call: string[]) => call[0] === 'Content-Security-Policy'
      );

      expect(cspCall).toBeDefined();
      expect(cspCall?.[1]).toContain("default-src 'self'");
      expect(cspCall?.[1]).toContain("'unsafe-inline'");
      expect(cspCall?.[1]).not.toContain("'nonce-");
      expect(cspCall?.[1]).toContain('https://mc.yandex.ru');
    });

    it('should include all required CSP directives', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/', searchParams: new URLSearchParams() },
        headers: { get: jest.fn().mockReturnValue('') } as any,
        cookies: { get: jest.fn() },
      } as any;

      await middleware(mockRequest);

      const cspCall = mockResponse.headers.set.mock.calls.find(
        (call: string[]) => call[0] === 'Content-Security-Policy'
      );
      const csp = cspCall?.[1];

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("style-src 'self'");
      expect(csp).toContain("img-src 'self' data: https:");
      expect(csp).toContain("font-src 'self'");
      expect(csp).toContain("connect-src 'self'");
      expect(csp).toContain("frame-src");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'self'");
      expect(csp).toContain("frame-ancestors 'self'");
    });

    it('should allow Yandex Metrika domains', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/', searchParams: new URLSearchParams() },
        headers: { get: jest.fn().mockReturnValue('') } as any,
        cookies: { get: jest.fn() },
      } as any;

      await middleware(mockRequest);

      const cspCall = mockResponse.headers.set.mock.calls.find(
        (call: string[]) => call[0] === 'Content-Security-Policy'
      );
      const csp = cspCall?.[1];

      expect(csp).toContain('https://mc.yandex.ru');
    });

    it('should allow Google reCAPTCHA domains', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/', searchParams: new URLSearchParams() },
        headers: { get: jest.fn().mockReturnValue('') } as any,
        cookies: { get: jest.fn() },
      } as any;

      await middleware(mockRequest);

      const cspCall = mockResponse.headers.set.mock.calls.find(
        (call: string[]) => call[0] === 'Content-Security-Policy'
      );
      const csp = cspCall?.[1];

      expect(csp).toContain('https://www.google.com');
      expect(csp).toContain('https://www.gstatic.com');
    });

    it('should not set x-nonce header', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/', searchParams: new URLSearchParams() },
        headers: { get: jest.fn().mockReturnValue('') } as any,
        cookies: { get: jest.fn() },
      } as any;

      await middleware(mockRequest);

      const nonceCall = mockResponse.headers.set.mock.calls.find(
        (call: string[]) => call[0] === 'x-nonce'
      );

      expect(nonceCall).toBeUndefined();
    });
  });

  describe('matcher config', () => {
    it('should have correct matcher pattern for exclusions', () => {
      const matcher = config.matcher[0];
      
      expect(matcher).toBe('/((?!api|_next/static|_next/image|favicon.ico).*)');
    });

    it('should be an array with one pattern', () => {
      expect(config.matcher).toBeInstanceOf(Array);
      expect(config.matcher.length).toBe(1);
    });

    it('should use negative lookahead for exclusions', () => {
      const matcher = config.matcher[0];
      
      expect(matcher).toContain('(?!api');
      expect(matcher).toContain('_next/static');
      expect(matcher).toContain('_next/image');
      expect(matcher).toContain('favicon.ico');
    });
  });
});

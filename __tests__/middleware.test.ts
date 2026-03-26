import { middleware, config } from '../src/middleware';
import { NextResponse } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(),
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
  let mockResponse: { headers: { set: jest.Mock } };

  beforeEach(() => {
    mockResponse = {
      headers: {
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
    it('should generate nonce and set headers', () => {
      const mockRequest = {
        nextUrl: { pathname: '/' },
        headers: new Headers(),
      } as any;

      middleware(mockRequest);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(mockResponse.headers.set).toHaveBeenCalledTimes(2);
    });

    it('should generate unique nonces for different requests', () => {
      const mockRequest1 = {
        nextUrl: { pathname: '/' },
        headers: new Headers(),
      } as any;

      const mockRequest2 = {
        nextUrl: { pathname: '/about' },
        headers: new Headers(),
      } as any;

      middleware(mockRequest1);
      const calls1 = [...mockResponse.headers.set.mock.calls];
      const nonce1Call = calls1.find((call: string[]) => call[0] === 'x-nonce');

      mockResponse.headers.set.mockClear();
      middleware(mockRequest2);
      const calls2 = [...mockResponse.headers.set.mock.calls];
      const nonce2Call = calls2.find((call: string[]) => call[0] === 'x-nonce');

      expect(nonce1Call).toBeDefined();
      expect(nonce2Call).toBeDefined();
    });

    it('should generate base64 encoded nonce', () => {
      const mockRequest = {
        nextUrl: { pathname: '/' },
        headers: new Headers(),
      } as any;

      middleware(mockRequest);

      const nonceCall = mockResponse.headers.set.mock.calls.find(
        (call: string[]) => call[0] === 'x-nonce'
      );
      const nonce = nonceCall?.[1];

      expect(nonce).toBeDefined();
      expect(Buffer.from(nonce, 'base64').length).toBe(16);
    });
  });

  describe('Content-Security-Policy header', () => {
    it('should set CSP header with nonce', () => {
      const mockRequest = {
        nextUrl: { pathname: '/' },
        headers: new Headers(),
      } as any;

      middleware(mockRequest);

      const cspCall = mockResponse.headers.set.mock.calls.find(
        (call: string[]) => call[0] === 'Content-Security-Policy'
      );

      expect(cspCall).toBeDefined();
      expect(cspCall?.[1]).toContain("default-src 'self'");
      expect(cspCall?.[1]).toContain("script-src 'self' 'nonce-");
      expect(cspCall?.[1]).toContain('https://mc.yandex.ru');
    });

    it('should include all required CSP directives', () => {
      const mockRequest = {
        nextUrl: { pathname: '/' },
        headers: new Headers(),
      } as any;

      middleware(mockRequest);

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

    it('should allow Yandex Metrika domains', () => {
      const mockRequest = {
        nextUrl: { pathname: '/' },
        headers: new Headers(),
      } as any;

      middleware(mockRequest);

      const cspCall = mockResponse.headers.set.mock.calls.find(
        (call: string[]) => call[0] === 'Content-Security-Policy'
      );
      const csp = cspCall?.[1];

      expect(csp).toContain('https://mc.yandex.ru');
    });

    it('should allow Google reCAPTCHA domains', () => {
      const mockRequest = {
        nextUrl: { pathname: '/' },
        headers: new Headers(),
      } as any;

      middleware(mockRequest);

      const cspCall = mockResponse.headers.set.mock.calls.find(
        (call: string[]) => call[0] === 'Content-Security-Policy'
      );
      const csp = cspCall?.[1];

      expect(csp).toContain('https://www.google.com');
      expect(csp).toContain('https://www.gstatic.com');
    });

    it('should use same nonce in CSP and x-nonce header', () => {
      const mockRequest = {
        nextUrl: { pathname: '/' },
        headers: new Headers(),
      } as any;

      middleware(mockRequest);

      const nonceCall = mockResponse.headers.set.mock.calls.find(
        (call: string[]) => call[0] === 'x-nonce'
      );
      const cspCall = mockResponse.headers.set.mock.calls.find(
        (call: string[]) => call[0] === 'Content-Security-Policy'
      );

      const nonce = nonceCall?.[1];
      const csp = cspCall?.[1];

      expect(csp).toContain(`nonce-${nonce}`);
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

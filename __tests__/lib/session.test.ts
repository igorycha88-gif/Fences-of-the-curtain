import { cookies } from 'next/headers';
import {
  getSessionId,
  setSessionCookie,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  generateSessionId,
} from '../../src/lib/session';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

const mockCrypto = {
  randomUUID: jest.fn(),
};

const originalCrypto = global.crypto;

beforeAll(() => {
  global.crypto = mockCrypto as any;
});

afterAll(() => {
  global.crypto = originalCrypto;
});

describe('Session Cookie Security', () => {
  let mockCookieStore: {
    get: jest.Mock;
    set: jest.Mock;
  };

  beforeEach(() => {
    mockCookieStore = {
      get: jest.fn(),
      set: jest.fn(),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);
    mockCrypto.randomUUID.mockReturnValue('12345678-1234-1234-1234-123456789012');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TC-001: getSessionId() - secure flag in production', () => {
    const originalEnv = process.env;

    beforeAll(() => {
      process.env = { ...originalEnv, NODE_ENV: 'production' };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should set secure flag to true in production', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await getSessionId();

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        SESSION_COOKIE_NAME,
        '12345678-1234-1234-1234-123456789012',
        expect.objectContaining({
          secure: true,
        })
      );
    });
  });

  describe('TC-002: getSessionId() - secure flag in development', () => {
    const originalEnv = process.env;

    beforeAll(() => {
      process.env = { ...originalEnv, NODE_ENV: 'development' };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should set secure flag to false in development', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await getSessionId();

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        SESSION_COOKIE_NAME,
        '12345678-1234-1234-1234-123456789012',
        expect.objectContaining({
          secure: false,
        })
      );
    });
  });

  describe('TC-004: getSessionId() - secure flag in test environment', () => {
    const originalEnv = process.env;

    beforeAll(() => {
      process.env = { ...originalEnv, NODE_ENV: 'test' };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should set secure flag to false when NODE_ENV is test', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await getSessionId();

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        SESSION_COOKIE_NAME,
        '12345678-1234-1234-1234-123456789012',
        expect.objectContaining({
          secure: false,
        })
      );
    });
  });

  describe('TC-003-A: setSessionCookie() - secure flag in production', () => {
    const originalEnv = process.env;

    beforeAll(() => {
      process.env = { ...originalEnv, NODE_ENV: 'production' };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should set secure flag to true in production', async () => {
      await setSessionCookie('test-session-id');

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        SESSION_COOKIE_NAME,
        'test-session-id',
        expect.objectContaining({
          secure: true,
        })
      );
    });
  });

  describe('TC-003-B: setSessionCookie() - secure flag in development', () => {
    const originalEnv = process.env;

    beforeAll(() => {
      process.env = { ...originalEnv, NODE_ENV: 'development' };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should set secure flag to false in development', async () => {
      await setSessionCookie('test-session-id');

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        SESSION_COOKIE_NAME,
        'test-session-id',
        expect.objectContaining({
          secure: false,
        })
      );
    });
  });

  describe('TC-003: Other cookie parameters preservation', () => {
    it('should preserve all other cookie parameters in getSessionId()', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await getSessionId();

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        SESSION_COOKIE_NAME,
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          maxAge: SESSION_MAX_AGE,
          path: '/',
        })
      );
    });

    it('should preserve all other cookie parameters in setSessionCookie()', async () => {
      await setSessionCookie('test-session-id');

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        SESSION_COOKIE_NAME,
        'test-session-id',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          maxAge: SESSION_MAX_AGE,
          path: '/',
        })
      );
    });
  });

  describe('Existing session handling', () => {
    it('should return existing session ID without setting new cookie', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'existing-session-id' });

      const result = await getSessionId();

      expect(result).toBe('existing-session-id');
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should generate new session ID when no existing session', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await getSessionId();

      expect(result).toBe('12345678-1234-1234-1234-123456789012');
      expect(mockCookieStore.set).toHaveBeenCalled();
    });
  });

  describe('generateSessionId', () => {
    it('should generate UUID using crypto.randomUUID', () => {
      const sessionId = generateSessionId();

      expect(mockCrypto.randomUUID).toHaveBeenCalled();
      expect(sessionId).toBe('12345678-1234-1234-1234-123456789012');
    });
  });
});

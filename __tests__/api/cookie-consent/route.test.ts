import { POST } from '@/app/api/cookie-consent/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    cookieConsent: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      get: jest.fn(() => undefined),
      set: jest.fn(),
    })
  ),
}));

const mockUpsert = prisma.cookieConsent.upsert as jest.MockedFunction<
  typeof prisma.cookieConsent.upsert
>;

function createRequest(body: unknown) {
  return new Request('http://localhost/api/cookie-consent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'TestAgent/1.0',
    },
    body: JSON.stringify(body),
  }) as any;
}

describe('POST /api/cookie-consent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save consent with analytics accepted', async () => {
    const mockConsent = {
      id: 'test-id',
      sessionId: 'session-123',
      consentGiven: true,
      analytics: true,
      createdAt: new Date(),
    };
    mockUpsert.mockResolvedValue(mockConsent as any);

    const req = createRequest({ consentGiven: true, analytics: true });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.consentGiven).toBe(true);
    expect(data.analytics).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          consentGiven: true,
          analytics: true,
        }),
        update: expect.objectContaining({
          consentGiven: true,
          analytics: true,
        }),
      })
    );
  });

  it('should save consent with analytics declined', async () => {
    const mockConsent = {
      id: 'test-id-2',
      sessionId: 'session-456',
      consentGiven: false,
      analytics: false,
      createdAt: new Date(),
    };
    mockUpsert.mockResolvedValue(mockConsent as any);

    const req = createRequest({ consentGiven: false, analytics: false });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.consentGiven).toBe(false);
    expect(data.analytics).toBe(false);
  });

  it('should return 400 for invalid input', async () => {
    const req = createRequest({ consentGiven: 'yes', analytics: true });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Ошибка валидации');
  });

  it('should return 400 for missing fields', async () => {
    const req = createRequest({});
    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  it('should return 500 on database error', async () => {
    mockUpsert.mockRejectedValue(new Error('DB Error'));

    const req = createRequest({ consentGiven: true, analytics: true });
    const response = await POST(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Ошибка сохранения согласия');
  });
});

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockRedisIncr = jest.fn() as any;
mockRedisIncr.mockResolvedValue(1);
const mockRedisExpire = jest.fn() as any;
mockRedisExpire.mockResolvedValue(1);

jest.mock('@/lib/redis', () => ({
  redis: {
    incr: mockRedisIncr,
    expire: mockRedisExpire,
  },
}));

const mockHandleCommand = jest.fn() as any;
mockHandleCommand.mockResolvedValue(undefined);

jest.mock('@/services/telegram/bot-commands', () => ({
  handleCommand: mockHandleCommand,
}));

function mockNextRequest(body: any, secret?: string) {
  const url = new URL(`http://localhost:3000/api/telegram/webhook${secret ? `?secret=${secret}` : ''}`);
  return {
    nextUrl: url,
    headers: {
      get: () => null,
    },
    json: () => Promise.resolve(body),
  } as any;
}

describe('POST /api/telegram/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should return 403 when secret is missing', async () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = 'my-secret';
    const { POST } = await import('@/app/api/telegram/webhook/route');

    const req = mockNextRequest({ message: { text: '/stats', chat: { id: 123 } } });
    const res = await POST(req);

    expect(res.status).toBe(403);
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
  });

  it('should return 403 when secret is wrong', async () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = 'my-secret';
    const { POST } = await import('@/app/api/telegram/webhook/route');

    const req = mockNextRequest({ message: { text: '/stats', chat: { id: 123 } } }, 'wrong-secret');
    const res = await POST(req);

    expect(res.status).toBe(403);
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
  });

  it('should return 200 and handle valid command', async () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = 'my-secret';
    const { POST } = await import('@/app/api/telegram/webhook/route');

    const req = mockNextRequest(
      { message: { text: '/stats', chat: { id: 123 } } },
      'my-secret'
    );
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockHandleCommand).toHaveBeenCalledWith('/stats', 123);
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
  });

  it('should return 200 when message is missing', async () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = 'my-secret';
    const { POST } = await import('@/app/api/telegram/webhook/route');

    const req = mockNextRequest({ update_id: 1 }, 'my-secret');
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockHandleCommand).not.toHaveBeenCalled();
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
  });

  it('should return 200 when message.text is missing', async () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = 'my-secret';
    const { POST } = await import('@/app/api/telegram/webhook/route');

    const req = mockNextRequest(
      { message: { chat: { id: 123 } } },
      'my-secret'
    );
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockHandleCommand).not.toHaveBeenCalled();
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
  });

  it('should return 200 when chat.id is missing', async () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = 'my-secret';
    const { POST } = await import('@/app/api/telegram/webhook/route');

    const req = mockNextRequest(
      { message: { text: '/stats' } },
      'my-secret'
    );
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockHandleCommand).not.toHaveBeenCalled();
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
  });

  it('should handle /help command', async () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = 'my-secret';
    const { POST } = await import('@/app/api/telegram/webhook/route');

    const req = mockNextRequest(
      { message: { text: '/help', chat: { id: 456 } } },
      'my-secret'
    );
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockHandleCommand).toHaveBeenCalledWith('/help', 456);
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
  });
});

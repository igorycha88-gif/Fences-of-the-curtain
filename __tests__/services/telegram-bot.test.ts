jest.mock('@/lib/telegram-proxy', () => ({
  getTelegramDispatcher: jest.fn().mockReturnValue(undefined),
}));

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import logger from '@/lib/logger';
import { sendTelegramMessage, sendOrderNotification } from '@/services/telegram/bot';

const mockLogger = logger as any;

const ok = () => Promise.resolve({ ok: true, text: () => Promise.resolve('{}') } as Response);
const httpError = (status: number) =>
  Promise.resolve({ ok: false, status, text: () => Promise.resolve(`{"error":"${status}"}`) } as Response);

describe('telegram/bot sendTelegramMessage (ЧТЗ_Телеграм_Ретраи_Отправки)', () => {
  const OLD_ENV = process.env;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = jest.fn();
    global.fetch = fetchMock as any;
    process.env = { ...OLD_ENV, TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: '12345' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('без креденшелов → false без запросов', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    await expect(sendTelegramMessage('msg')).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Telegram credentials not configured',
      expect.objectContaining({ module: 'telegram/bot', operation: 'sendTelegramMessage' })
    );
  });

  it('happy path: успех с 1-й попытки', async () => {
    fetchMock.mockImplementation(ok);
    await expect(sendTelegramMessage('msg')).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Telegram message sent',
      expect.objectContaining({ module: 'telegram/bot', operation: 'sendTelegramMessage', attempt: 1 })
    );
  });

  it('сетевая ошибка (волна RST) → ретраи → успех на 2-й попытке', async () => {
    fetchMock
      .mockImplementationOnce(() => Promise.reject(new Error('read tcp connection reset by peer')))
      .mockImplementationOnce(ok);

    await expect(sendTelegramMessage('msg')).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Telegram send attempt failed',
      expect.objectContaining({ module: 'telegram/bot', attempt: 1, error: expect.anything() })
    );
  });

  it('все попытки падают → false + итоговый error-лог', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    await expect(sendTelegramMessage('msg')).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Telegram send failed after all attempts',
      expect.objectContaining({ module: 'telegram/bot', attempts: 3 })
    );
  });

  it('HTTP 400 (не-ретраебельный) → false без ретраев', async () => {
    fetchMock.mockImplementation(() => httpError(400));
    await expect(sendTelegramMessage('msg')).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Telegram API error',
      expect.objectContaining({ module: 'telegram/bot', status: 400 })
    );
  });

  it('HTTP 429 → ретраится', async () => {
    fetchMock.mockImplementationOnce(() => httpError(429)).mockImplementationOnce(ok);
    await expect(sendTelegramMessage('msg')).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('HTTP 502 → ретраится', async () => {
    fetchMock.mockImplementationOnce(() => httpError(502)).mockImplementationOnce(ok);
    await expect(sendTelegramMessage('msg')).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('sendOrderNotification: формат сообщения не изменился', async () => {
    fetchMock.mockImplementation(ok);
    await expect(
      sendOrderNotification({
        id: 'abcdef123456',
        clientName: 'Иван <b>',
        phone: '+7999',
        serviceType: 'fence',
        calculatedCost: 150000,
        createdAt: '2026-11-02T10:00:00Z',
      })
    ).resolves.toBe(true);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.parse_mode).toBe('HTML');
    expect(body.text).toContain('Новая заявка #123456');
    expect(body.text).toContain('Иван &lt;b&gt;');
    expect(body.text).not.toContain('Иван <b>');
  });
});

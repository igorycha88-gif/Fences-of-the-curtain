import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/services/contact/contactInfoService', () => ({
  getContactInfo: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { GET } from '@/app/api/contact-info/route';
import { getContactInfo } from '@/services/contact/contactInfoService';
import logger from '@/lib/logger';

const SERVICE_DATA = {
  address: 'г. Москва, ул. Строителей, д. 5',
  phone: '+74993901595',
  email: 'zabori-naves@yandex.ru',
  workHours: { monFri: 'Пн–Пт: 9:00–20:00', sat: 'Сб: 10:00–18:00', sun: 'Вс: выходной' },
  hasData: true,
};

describe('GET /api/contact-info (ЧТЗ: Контакты SSR)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('делегирует сервису и возвращает 200 с данными + логирует завершение', async () => {
    (getContactInfo as jest.Mock).mockResolvedValue(SERVICE_DATA);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(SERVICE_DATA);
    expect(getContactInfo).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      'Contact info request completed',
      expect.objectContaining({
        operation: 'GET /api/contact-info',
        status: 200,
        hasData: true,
      })
    );
  });

  it('ошибка сервиса → 200 + hasData:false + logger.error с контекстом', async () => {
    (getContactInfo as jest.Mock).mockRejectedValue(new Error('unexpected'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.hasData).toBe(false);
    expect(body.message).toBe('База данных недоступна');
    expect(logger.error).toHaveBeenCalledWith(
      'Contact info request failed',
      expect.objectContaining({
        operation: 'GET /api/contact-info',
        error: expect.any(Error),
      })
    );
  });
});

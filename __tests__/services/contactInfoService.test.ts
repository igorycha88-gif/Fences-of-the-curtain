import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    contactInfo: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const redisGet = jest.fn();
const redisSetex = jest.fn();
const redisMock = {
  get: redisGet,
  setex: redisSetex,
  status: 'ready',
};

jest.mock('@/lib/redis', () => ({
  redis: redisMock,
}));

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import logger from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getContactInfo } from '@/services/contact/contactInfoService';

const DB_RECORD = {
  id: 1,
  address: 'г. Москва, ул. Строителей, д. 5',
  phone: '+74993901595',
  email: 'zabori-naves@yandex.ru',
  workHoursMonFri: 'Пн–Пт: 9:00–20:00',
  workHoursSat: 'Сб: 10:00–18:00',
  workHoursSun: 'Вс: выходной',
};

describe('contactInfoService (ЧТЗ: Контакты SSR)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisMock.status = 'ready';
    delete process.env.NEXT_PHASE;
  });

  it('возвращает данные из Redis-кэша без обращения к БД', async () => {
    const cached = { ...DB_RECORD, hasData: true, workHours: {} };
    redisGet.mockResolvedValue(JSON.stringify(cached));

    const result = await getContactInfo();

    expect(result).toEqual(cached);
    expect(redisGet).toHaveBeenCalledWith('contact_info');
    expect(prisma.contactInfo.findFirst).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith(
      'Contact info served from cache',
      expect.objectContaining({ operation: 'getContactInfo' })
    );
  });

  it('при промахе кэша читает БД и маппит поля (hasData=true) + пишет кэш', async () => {
    redisGet.mockResolvedValue(null);
    (prisma.contactInfo.findFirst as jest.Mock).mockResolvedValue(DB_RECORD);

    const result = await getContactInfo();

    expect(result).toEqual({
      address: DB_RECORD.address,
      phone: DB_RECORD.phone,
      email: DB_RECORD.email,
      workHours: {
        monFri: DB_RECORD.workHoursMonFri,
        sat: DB_RECORD.workHoursSat,
        sun: DB_RECORD.workHoursSun,
      },
      hasData: true,
    });
    expect(redisSetex).toHaveBeenCalledWith(
      'contact_info',
      300,
      expect.stringContaining('"hasData":true')
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Contact info loaded',
      expect.objectContaining({ operation: 'getContactInfo', hasData: true })
    );
  });

  it('пустая запись в БД → hasData=false + сообщение «Данные не указаны»', async () => {
    redisGet.mockResolvedValue(null);
    (prisma.contactInfo.findFirst as jest.Mock).mockResolvedValue({
      ...DB_RECORD,
      address: '',
      phone: '',
      email: '',
      workHoursMonFri: '',
      workHoursSat: '',
      workHoursSun: '',
    });

    const result = await getContactInfo();

    expect(result.hasData).toBe(false);
    expect(result.message).toBe('Данные не указаны');
    expect(result.phone).toBe('');
  });

  it('отсутствует запись → создаёт пустую и возвращает hasData=false', async () => {
    redisGet.mockResolvedValue(null);
    (prisma.contactInfo.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.contactInfo.create as jest.Mock).mockResolvedValue({
      id: 2,
      address: '',
      phone: '',
      email: '',
      workHoursMonFri: '',
      workHoursSat: '',
      workHoursSun: '',
    });

    const result = await getContactInfo();

    expect(prisma.contactInfo.create).toHaveBeenCalledWith({
      data: {
        address: '',
        phone: '',
        email: '',
        workHoursMonFri: '',
        workHoursSat: '',
        workHoursSun: '',
      },
    });
    expect(result.hasData).toBe(false);
    expect(logger.info).toHaveBeenCalledWith(
      'Empty contact info record created',
      expect.objectContaining({ operation: 'getContactInfo' })
    );
  });

  it('ошибка БД → fallback «База данных недоступна» + logger.error с контекстом', async () => {
    redisGet.mockResolvedValue(null);
    (prisma.contactInfo.findFirst as jest.Mock).mockRejectedValue(new Error('P1001'));

    const result = await getContactInfo();

    expect(result.hasData).toBe(false);
    expect(result.message).toBe('База данных недоступна');
    expect(result.workHours).toEqual({ monFri: '', sat: '', sun: '' });
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to load contact info',
      expect.objectContaining({
        operation: 'getContactInfo',
        error: expect.any(Error),
      })
    );
  });

  it('Redis не готов (status != ready) → кэш пропускается, данные из БД', async () => {
    redisMock.status = 'connecting';
    (prisma.contactInfo.findFirst as jest.Mock).mockResolvedValue(DB_RECORD);

    const result = await getContactInfo();

    expect(redisGet).not.toHaveBeenCalled();
    expect(redisSetex).not.toHaveBeenCalled();
    expect(result.hasData).toBe(true);
    expect(result.address).toBe(DB_RECORD.address);
  });

  it('ошибка чтения кэша → warn и fallback к БД', async () => {
    redisGet.mockRejectedValue(new Error('cache down'));
    (prisma.contactInfo.findFirst as jest.Mock).mockResolvedValue(DB_RECORD);

    const result = await getContactInfo();

    expect(logger.warn).toHaveBeenCalledWith(
      'Contact info cache read failed, fallback to DB',
      expect.objectContaining({ operation: 'readCache' })
    );
    expect(result.hasData).toBe(true);
  });
});

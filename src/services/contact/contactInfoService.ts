import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import logger from '@/lib/logger';

const CACHE_KEY = 'contact_info';
const CACHE_TTL = 300;

export interface ContactInfoWorkHours {
  monFri: string;
  sat: string;
  sun: string;
}

export interface ContactInfoResponse {
  address: string;
  phone: string;
  email: string;
  workHours: ContactInfoWorkHours;
  hasData: boolean;
  message?: string;
}

const DB_UNAVAILABLE_MESSAGE = 'База данных недоступна';
const NO_DATA_MESSAGE = 'Данные не указаны';

const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build';

async function readCache(): Promise<ContactInfoResponse | null> {
  if (isProductionBuild || !redis || redis.status !== 'ready') {
    return null;
  }
  try {
    const cached = await redis.get(CACHE_KEY);
    return cached ? (JSON.parse(cached) as ContactInfoResponse) : null;
  } catch (error) {
    logger.warn('Contact info cache read failed, fallback to DB', {
      module: 'contactInfoService',
      operation: 'readCache',
      error,
    });
    return null;
  }
}

async function writeCache(data: ContactInfoResponse): Promise<void> {
  if (isProductionBuild || !redis || redis.status !== 'ready') {
    return;
  }
  try {
    await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(data));
  } catch (error) {
    logger.warn('Contact info cache write failed', {
      module: 'contactInfoService',
      operation: 'writeCache',
      error,
    });
  }
}

export async function getContactInfo(): Promise<ContactInfoResponse> {
  const operation = 'getContactInfo';
  try {
    const cached = await readCache();
    if (cached) {
      logger.debug('Contact info served from cache', { module: 'contactInfoService', operation });
      return cached;
    }

    let contactInfo = await prisma.contactInfo.findFirst();

    if (!contactInfo) {
      contactInfo = await prisma.contactInfo.create({
        data: {
          address: '',
          phone: '',
          email: '',
          workHoursMonFri: '',
          workHoursSat: '',
          workHoursSun: '',
        },
      });
      logger.info('Empty contact info record created', { module: 'contactInfoService', operation });
    }

    const hasData = Boolean(
      contactInfo.address ||
        contactInfo.phone ||
        contactInfo.email ||
        contactInfo.workHoursMonFri ||
        contactInfo.workHoursSat ||
        contactInfo.workHoursSun
    );

    const responseData: ContactInfoResponse = hasData
      ? {
          address: contactInfo.address,
          phone: contactInfo.phone,
          email: contactInfo.email,
          workHours: {
            monFri: contactInfo.workHoursMonFri,
            sat: contactInfo.workHoursSat,
            sun: contactInfo.workHoursSun,
          },
          hasData: true,
        }
      : {
          address: '',
          phone: '',
          email: '',
          workHours: { monFri: '', sat: '', sun: '' },
          hasData: false,
          message: NO_DATA_MESSAGE,
        };

    await writeCache(responseData);

    logger.info('Contact info loaded', {
      module: 'contactInfoService',
      operation,
      hasData,
      source: 'db',
    });
    return responseData;
  } catch (error) {
    logger.error('Failed to load contact info', {
      module: 'contactInfoService',
      operation,
      error,
    });
    return {
      address: '',
      phone: '',
      email: '',
      workHours: { monFri: '', sat: '', sun: '' },
      hasData: false,
      message: DB_UNAVAILABLE_MESSAGE,
    };
  }
}

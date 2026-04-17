import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'contact_info';
const CACHE_TTL = 300;

export async function GET() {
  try {
    const cached = await redis?.get(CACHE_KEY);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
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
    }

    const hasData =
      contactInfo.address ||
      contactInfo.phone ||
      contactInfo.email ||
      contactInfo.workHoursMonFri ||
      contactInfo.workHoursSat ||
      contactInfo.workHoursSun;

    const responseData = hasData
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
          hasData: false,
          message: 'Данные не указаны',
        };

    await redis?.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(responseData));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching contact info:', error);
    return NextResponse.json(
      {
        hasData: false,
        phone: '',
        email: '',
        message: 'База данных недоступна',
      },
      { status: 200 }
    );
  }
}

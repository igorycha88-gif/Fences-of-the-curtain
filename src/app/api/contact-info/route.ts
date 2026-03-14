import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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

    if (!hasData) {
      return NextResponse.json({
        hasData: false,
        message: 'Данные не указаны',
      });
    }

    return NextResponse.json({
      address: contactInfo.address,
      phone: contactInfo.phone,
      email: contactInfo.email,
      workHours: {
        monFri: contactInfo.workHoursMonFri,
        sat: contactInfo.workHoursSat,
        sun: contactInfo.workHoursSun,
      },
      hasData: true,
    });
  } catch (error) {
    console.error('Error fetching contact info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

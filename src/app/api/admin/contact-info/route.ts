// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { z, ZodError } from 'zod';
import { validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

const contactInfoSchema = z.object({
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Некорректный формат email').optional().or(z.literal('')),
  workHoursMonFri: z.string().optional(),
  workHoursSat: z.string().optional(),
  workHoursSun: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

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
      } as any);
    }

    return NextResponse.json(contactInfo);
  } catch (error) {
    console.error('Error fetching contact info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const validatedData = contactInfoSchema.parse(body);

    let contactInfo = await prisma.contactInfo.findFirst();

    if (!contactInfo) {
      contactInfo = await prisma.contactInfo.create({
        data: {
          address: validatedData.address || '',
          phone: validatedData.phone || '',
          email: validatedData.email || '',
          workHoursMonFri: validatedData.workHoursMonFri || '',
          workHoursSat: validatedData.workHoursSat || '',
          workHoursSun: validatedData.workHoursSun || '',
        },
      });
    } else {
      contactInfo = await prisma.contactInfo.update({
        where: { id: contactInfo.id },
        data: {
          address: validatedData.address || '',
          phone: validatedData.phone || '',
          email: validatedData.email || '',
          workHoursMonFri: validatedData.workHoursMonFri || '',
          workHoursSat: validatedData.workHoursSat || '',
          workHoursSun: validatedData.workHoursSun || '',
        },
      });
    }

    return NextResponse.json(contactInfo);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }
    console.error('Error updating contact info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

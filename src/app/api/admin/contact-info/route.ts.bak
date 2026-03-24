// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions/rbac';
import { z, ZodError } from 'zod';
import { validationError } from '@/lib/api-error';

const contactInfoSchema = z.object({
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Некорректный формат email').optional().or(z.literal('')),
  workHoursMonFri: z.string().optional(),
  workHoursSat: z.string().optional(),
  workHoursSun: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

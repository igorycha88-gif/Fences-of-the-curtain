import { NextRequest, NextResponse } from 'next/server';
import { orderSchema } from '@/lib/validators';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = orderSchema.parse(body);

    const order = await prisma.order.create({
      data: {
        clientName: validatedData.clientName,
        phone: validatedData.phone,
        email: validatedData.email || null,
        serviceType: validatedData.serviceType,
        parameters: validatedData.parameters as any,
        calculatedCost: validatedData.calculatedCost,
        status: 'NEW',
        statusHistory: JSON.stringify([
          {
            status: 'NEW',
            timestamp: new Date().toISOString(),
          },
        ]),
      },
    });

    console.log('Order created:', order.id);

    return NextResponse.json(
      { id: order.id, status: order.status, createdAt: order.createdAt },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error('Order creation error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Ошибка создания заявки' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const serviceType = searchParams.get('serviceType');

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (serviceType) {
    where.serviceType = serviceType;
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      assignedUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ orders });
}

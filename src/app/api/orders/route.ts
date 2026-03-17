import { NextRequest, NextResponse } from 'next/server';
import { createOrderSchema, STATUS_LABELS } from '@/lib/validators/order';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/session';
import { headers } from 'next/headers';

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 3600000;
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'RATE_LIMIT_EXCEEDED', message: 'Слишком много запросов. Попробуйте позже.' },
        { status: 429 }
      );
    }

    const sessionId = await getSessionFromCookie();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'SESSION_EXPIRED', message: 'Время сессии истекло. Пожалуйста, выполните расчет заново.' },
        { status: 400 }
      );
    }

    const estimate = await prisma.fenceEstimate.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    if (!estimate) {
      return NextResponse.json(
        { error: 'SESSION_EXPIRED', message: 'Время сессии истекло. Пожалуйста, выполните расчет заново.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = createOrderSchema.parse(body);

    const order = await prisma.order.create({
      data: {
        clientName: validatedData.clientName,
        phone: validatedData.phone,
        email: validatedData.email || null,
        serviceType: 'fence',
        parameters: {
          message: validatedData.message || null,
          fenceType: estimate.fenceTypeId,
          length: estimate.length,
          height: estimate.height,
          lagRows: estimate.lagRows,
          coating: estimate.coating,
          hasGate: estimate.hasGate,
          gateLength: estimate.gateLength,
          hasWicket: estimate.hasWicket,
          wicketWidth: estimate.wicketWidth,
        },
        calculatedCost: estimate.grandTotal,
        status: 'NEW',
        estimateId: estimate.id,
        statusHistory: [
          {
            status: 'NEW',
            changedAt: new Date().toISOString(),
            changedBy: 'system',
            changedByName: 'Система',
            data: {},
          },
        ],
      },
      include: {
        estimate: {
          select: {
            id: true,
            grandTotal: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: order.id,
        status: order.status,
        statusLabel: STATUS_LABELS[order.status],
        estimateId: estimate.id,
        calculatedCost: estimate.grandTotal,
        createdAt: order.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error('Order creation error:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: error.message },
          { status: 400 }
        );
      }
      
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

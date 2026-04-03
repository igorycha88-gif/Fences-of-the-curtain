import { NextRequest, NextResponse } from 'next/server';
import { createOrderSchema, individualOrderSchema, STATUS_LABELS } from '@/lib/validators/order';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/session';
import { createAuditLogAsync, getSystemUserId } from '@/lib/audit';
import { applyRateLimitByEndpoint } from '@/lib/rate-limit';
import { sendOrderNotification, sendClientConfirmation } from '@/services/email/sender';
import { sendOrderNotification as sendTelegramNotification } from '@/services/telegram';

function getClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateLimitResult = await applyRateLimitByEndpoint(clientIp, 'orders');

    const rlHeaders = {
      'X-RateLimit-Limit': '5',
      'X-RateLimit-Remaining': String(rateLimitResult.remaining),
      'X-RateLimit-Reset': String(Math.floor(rateLimitResult.resetAt.getTime() / 1000)),
    };

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'RATE_LIMIT_EXCEEDED', message: 'Слишком много запросов. Попробуйте позже.' },
        { status: 429, headers: rlHeaders }
      );
    }

    const body = await req.json();

    if (body.isIndividualRequest) {
      return await createIndividualOrder(body, rlHeaders);
    }

    return await createStandardOrder(body, rlHeaders);
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

async function createStandardOrder(body: unknown, rlHeaders: Record<string, string>) {
  const sessionId = await getSessionFromCookie();

  if (!sessionId) {
    return NextResponse.json(
      { error: 'SESSION_EXPIRED', message: 'Время сессии истекло. Пожалуйста, выполните расчет заново.' },
      { status: 400, headers: rlHeaders }
    );
  }

  const estimate = await prisma.fenceEstimate.findFirst({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
  });

  if (!estimate) {
    return NextResponse.json(
      { error: 'SESSION_EXPIRED', message: 'Время сессии истекло. Пожалуйста, выполните расчет заново.' },
      { status: 400, headers: rlHeaders }
    );
  }

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

  getSystemUserId().then((systemUserId) => {
    createAuditLogAsync({
      userId: systemUserId,
      action: 'CREATE_ORDER',
      entityType: 'Order',
      entityId: order.id,
      oldValues: null,
      newValues: {
        clientName: validatedData.clientName,
        phone: validatedData.phone,
        email: validatedData.email,
        serviceType: 'fence',
        parameters: order.parameters,
        calculatedCost: estimate.grandTotal,
      },
    });
  });

  sendOrderNotification(order).catch((err) =>
    console.error('Failed to send order notification emails:', err)
  );
  sendTelegramNotification(order).catch((err) =>
    console.error('Failed to send Telegram notification:', err)
  );
  if (validatedData.email) {
    sendClientConfirmation(order).catch((err) =>
      console.error('Failed to send client confirmation email:', err)
    );
  }

  return NextResponse.json(
    {
      id: order.id,
      status: order.status,
      statusLabel: STATUS_LABELS[order.status],
      estimateId: estimate.id,
      calculatedCost: estimate.grandTotal,
      createdAt: order.createdAt,
    },
    { status: 201, headers: rlHeaders }
  );
}

async function createIndividualOrder(body: unknown, rlHeaders: Record<string, string>) {
  const validatedData = individualOrderSchema.parse(body);

  const order = await prisma.order.create({
    data: {
      clientName: validatedData.clientName,
      phone: validatedData.phone,
      email: validatedData.email || null,
      serviceType: 'INDIVIDUAL_CALCULATION',
      parameters: {
        ...validatedData.fenceParameters,
        message: validatedData.message || null,
      },
      calculatedCost: 0,
      status: 'NEW',
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
  });

  getSystemUserId().then((systemUserId) => {
    createAuditLogAsync({
      userId: systemUserId,
      action: 'CREATE_INDIVIDUAL_ORDER',
      entityType: 'Order',
      entityId: order.id,
      oldValues: null,
      newValues: {
        clientName: validatedData.clientName,
        phone: validatedData.phone,
        email: validatedData.email,
        serviceType: 'INDIVIDUAL_CALCULATION',
        parameters: order.parameters,
        calculatedCost: 0,
      },
    });
  });

  sendOrderNotification(order).catch((err) =>
    console.error('Failed to send order notification emails:', err)
  );
  sendTelegramNotification(order).catch((err) =>
    console.error('Failed to send Telegram notification:', err)
  );
  if (validatedData.email) {
    sendClientConfirmation(order).catch((err) =>
      console.error('Failed to send client confirmation email:', err)
    );
  }

  return NextResponse.json(
    {
      id: order.id,
      status: order.status,
      statusLabel: STATUS_LABELS[order.status],
      estimateId: null,
      calculatedCost: 0,
      isIndividualRequest: true,
      createdAt: order.createdAt,
    },
    { status: 201, headers: rlHeaders }
  );
}

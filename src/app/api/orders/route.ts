import { NextRequest, NextResponse } from 'next/server';
import { createOrderSchema, individualOrderSchema, multiEstimateOrderSchema, gateEstimateOrderSchema, STATUS_LABELS } from '@/lib/validators/order';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getSessionFromCookie } from '@/lib/session';
import { createAuditLogAsync, getSystemUserId } from '@/lib/audit';
import { applyRateLimitByEndpoint } from '@/lib/rate-limit';
import { sendOrderNotification, sendClientConfirmation } from '@/services/email/sender';
import { sendOrderNotification as sendTelegramNotification } from '@/services/telegram';
import { safeErrorResponse } from '@/lib/api-error';
import logger from '@/lib/logger';

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

    if (body.isMultiEstimate) {
      return await createMultiEstimateOrder(body, rlHeaders);
    }

    if (body.isGateEstimate) {
      return await createGateEstimateOrder(body, rlHeaders);
    }

    return await createStandardOrder(body, rlHeaders);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Order creation error:', error);

      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Проверьте введённые данные' },
          { status: 400 }
        );
      }

      return safeErrorResponse(error, 400);
    }

    return NextResponse.json(
      { error: 'Ошибка создания заявки' },
      { status: 500 }
    );
  }
}

async function createMultiEstimateOrder(body: unknown, rlHeaders: Record<string, string>) {
  const validatedData = multiEstimateOrderSchema.parse(body);

  const multiEstimate = await prisma.multiFenceEstimate.findUnique({
    where: { id: validatedData.multiEstimateId },
    include: {
      estimates: {
        include: { fenceType: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!multiEstimate) {
    return NextResponse.json(
      { error: 'ESTIMATE_NOT_FOUND', message: 'Расчет не найден. Пожалуйста, выполните расчет заново.' },
      { status: 400, headers: rlHeaders }
    );
  }

  const fenceParameters = multiEstimate.estimates.map((est) => ({
    fenceTypeId: est.fenceTypeId,
    fenceTypeName: est.fenceType.name,
    length: est.length,
    height: est.height,
    lagRows: est.lagRows,
    coating: est.coating,
    hasGate: est.hasGate,
    gateLength: est.gateLength,
    hasWicket: est.hasWicket,
    wicketWidth: est.wicketWidth,
    grandTotal: est.grandTotal,
  }));

  const order = await prisma.order.create({
    data: {
      clientName: validatedData.clientName,
      phone: validatedData.phone,
      email: validatedData.email || null,
      serviceType: 'fence',
      parameters: {
        message: validatedData.message || null,
        isMultiEstimate: true,
        estimatesCount: multiEstimate.estimatesCount,
        totalMaterials: multiEstimate.totalMaterials,
        totalInstallation: multiEstimate.totalInstallation,
        fences: fenceParameters,
      },
      calculatedCost: multiEstimate.grandTotal,
      status: 'NEW',
      multiEstimateId: multiEstimate.id,
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
      action: 'CREATE_MULTI_ESTIMATE_ORDER',
      entityType: 'Order',
      entityId: order.id,
      oldValues: null,
      newValues: {
        clientName: validatedData.clientName,
        phone: validatedData.phone,
        email: validatedData.email,
        serviceType: 'fence',
        parameters: order.parameters,
        calculatedCost: multiEstimate.grandTotal,
        estimatesCount: multiEstimate.estimatesCount,
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
      multiEstimateId: multiEstimate.id,
      calculatedCost: multiEstimate.grandTotal,
      estimatesCount: multiEstimate.estimatesCount,
      isMultiEstimate: true,
      createdAt: order.createdAt,
    },
    { status: 201, headers: rlHeaders }
  );
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

async function createGateEstimateOrder(body: unknown, rlHeaders: Record<string, string>) {
  const validatedData = gateEstimateOrderSchema.parse(body);

  const gateEstimate = await prisma.gateEstimate.findUnique({
    where: { id: validatedData.gateEstimateId },
  });

  if (!gateEstimate) {
    return NextResponse.json(
      { error: 'ESTIMATE_NOT_FOUND', message: 'Расчёт не найден. Пожалуйста, выполните расчёт заново.' },
      { status: 400, headers: rlHeaders }
    );
  }

  const order = await prisma.order.create({
    data: {
      clientName: validatedData.clientName,
      phone: validatedData.phone,
      email: validatedData.email || null,
      serviceType: 'gates',
      parameters: {
        message: validatedData.message || null,
        height: gateEstimate.height,
        needsInstallation: gateEstimate.needsInstallation,
        materialsTotal: gateEstimate.materialsTotal,
        installationTotal: gateEstimate.installationTotal,
      },
      calculatedCost: gateEstimate.grandTotal,
      status: 'NEW',
      gateEstimateId: gateEstimate.id,
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
      action: 'CREATE_GATE_ESTIMATE_ORDER',
      entityType: 'Order',
      entityId: order.id,
      oldValues: null,
      newValues: {
        clientName: validatedData.clientName,
        phone: validatedData.phone,
        email: validatedData.email,
        serviceType: 'gates',
        parameters: order.parameters,
        calculatedCost: gateEstimate.grandTotal,
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
      gateEstimateId: gateEstimate.id,
      calculatedCost: gateEstimate.grandTotal,
      isGateEstimate: true,
      createdAt: order.createdAt,
    },
    { status: 201, headers: rlHeaders }
  );
}

async function createIndividualOrder(body: unknown, rlHeaders: Record<string, string>) {
  const validatedData = individualOrderSchema.parse(body);

  const calculatedCost = validatedData.totalCost ?? 0;
  const isCanopyOrder = !!validatedData.canopyParameters;

  const parameters: Record<string, unknown> = {
    message: validatedData.message || null,
  };

  if (validatedData.fenceParameters) {
    Object.assign(parameters, validatedData.fenceParameters);
  }

  if (validatedData.canopyParameters) {
    Object.assign(parameters, validatedData.canopyParameters);
  }

  if (validatedData.garageParameters) {
    Object.assign(parameters, validatedData.garageParameters);
  }

  if (validatedData.gateParameters) {
    Object.assign(parameters, validatedData.gateParameters);
  }

  if (validatedData.pricePerSqm !== undefined) {
    parameters.pricePerSqm = validatedData.pricePerSqm;
  }

  logger.info('Creating individual order', {
    operation: 'createIndividualOrder',
    serviceType: 'INDIVIDUAL_CALCULATION',
    isCanopyOrder,
    calculatedCost,
    hasPricePerSqm: validatedData.pricePerSqm !== undefined,
  });

  const order = await prisma.order.create({
    data: {
      clientName: validatedData.clientName,
      phone: validatedData.phone,
      email: validatedData.email || null,
      serviceType: 'INDIVIDUAL_CALCULATION',
      parameters: parameters as Prisma.InputJsonValue,
      calculatedCost,
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

  logger.info('Individual order created', {
    operation: 'createIndividualOrder',
    orderId: order.id,
    calculatedCost,
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
        calculatedCost,
      },
    });
  });

  sendOrderNotification(order).catch((err) => {
    logger.error('Failed to send order notification emails', { error: err, operation: 'createIndividualOrder', orderId: order.id });
  });
  sendTelegramNotification(order).catch((err) => {
    logger.error('Failed to send Telegram notification', { error: err, operation: 'createIndividualOrder', orderId: order.id });
  });
  if (validatedData.email) {
    sendClientConfirmation(order).catch((err) => {
      logger.error('Failed to send client confirmation email', { error: err, operation: 'createIndividualOrder', orderId: order.id });
    });
  }

  return NextResponse.json(
    {
      id: order.id,
      status: order.status,
      statusLabel: STATUS_LABELS[order.status],
      estimateId: null,
      calculatedCost,
      isIndividualRequest: true,
      createdAt: order.createdAt,
    },
    { status: 201, headers: rlHeaders }
  );
}

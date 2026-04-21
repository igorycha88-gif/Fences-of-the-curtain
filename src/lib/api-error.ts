import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

const KNOWN_BUSINESS_PATTERNS = [
  'ESTIMATE_NOT_FOUND',
  'ESTIMATE_ALREADY_HAS_ORDER',
  'MULTI_ESTIMATE_NOT_FOUND',
  'NOT_ADMIN_ESTIMATE',
  'ITEM_NOT_FOUND',
  'Order not found',
  'Source estimate not found',
  'Admin estimate not found',
  'Specified estimate is not an admin estimate',
  'Source estimate not found for admin estimate',
];

export function safeErrorResponse(
  error: unknown,
  fallbackStatus: number = 500
): NextResponse {
  const isProd = process.env.NODE_ENV === 'production';
  const message = error instanceof Error ? error.message : 'Internal server error';

  if (isKnownBusinessError(message)) {
    const status = message.includes('не найден') || message.includes('not found') || message.includes('не найдена')
      ? 404
      : message.includes('уже существует') || message.includes('already')
        ? 409
        : fallbackStatus;
    return NextResponse.json({ error: message }, { status });
  }

  if (isProd) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: fallbackStatus }
    );
  }

  return NextResponse.json({ error: message }, { status: fallbackStatus });
}

function isKnownBusinessError(message: string): boolean {
  if (KNOWN_BUSINESS_PATTERNS.some(p => message === p)) return true;
  if (/не найден[а]?/.test(message)) return true;
  if (/уже существует/.test(message)) return true;
  if (/должна отличаться/.test(message)) return true;
  if (/Приоритет/.test(message)) return true;
  if (/Invalid value/.test(message)) return true;
  if (/Unique constraint/.test(message)) return true;
  if (/Смета не найдена/.test(message)) return true;
  return false;
}

export function validationError(error: ZodError): NextResponse {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 400 }
    );
  }
  return NextResponse.json(
    { error: error.errors },
    { status: 400 }
  );
}

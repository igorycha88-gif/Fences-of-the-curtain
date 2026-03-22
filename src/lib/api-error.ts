import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

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

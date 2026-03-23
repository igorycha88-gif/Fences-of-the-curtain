import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
  const isDevelopment = process.env.NODE_ENV === 'development';

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' ${isDevelopment ? "'unsafe-inline' 'unsafe-eval'" : ''} https://mc.yandex.ru https://www.google.com https://www.gstatic.com;
    style-src 'self' 'nonce-${nonce}' ${isDevelopment ? "'unsafe-inline'" : "'unsafe-hashes'"};
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self' https://mc.yandex.ru;
    frame-src https://www.google.com https://www.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
  `.replace(/\s{2,}/g, ' ').trim();

  const response = NextResponse.next();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('x-nonce', nonce);

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

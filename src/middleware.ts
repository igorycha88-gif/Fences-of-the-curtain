import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
  const isDevelopment = process.env.NODE_ENV === 'development';

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'strict-dynamic' 'nonce-${nonce}' ${isDevelopment ? "'unsafe-eval'" : ''} https://mc.yandex.ru https://www.google.com https://www.gstatic.com;
    style-src 'self' 'nonce-${nonce}' 'unsafe-inline' ${isDevelopment ? '' : "'unsafe-hashes'"};
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

  let sessionId = request.cookies.get('analytics_session_id')?.value;
  let sessionStartTime = request.cookies.get('analytics_session_start')?.value ?? null;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStartTime = new Date().toISOString();

    response.cookies.set('analytics_session_id', sessionId, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set('analytics_session_start', sessionStartTime, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  response.headers.set('x-analytics-session-id', sessionId);
  response.headers.set('x-request-path', request.nextUrl.pathname);
  response.headers.set('x-request-referrer', request.headers.get('referer') || '');

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

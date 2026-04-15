import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mc.yandex.ru https://www.google.com https://www.gstatic.com;
    style-src 'self' 'unsafe-inline';
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
  response.headers.set('x-request-start', String(Date.now()));

  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const utmFromUrl: Record<string, string> = {};
  for (const param of utmParams) {
    const value = request.nextUrl.searchParams.get(param);
    if (value) {
      utmFromUrl[param] = value;
    }
  }

  if (Object.keys(utmFromUrl).length > 0) {
    response.cookies.set('utm_data', JSON.stringify(utmFromUrl), {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    response.headers.set('x-utm-source', utmFromUrl['utm_source'] || '');
  } else {
    const existingUtm = request.cookies.get('utm_data')?.value;
    if (existingUtm) {
      try {
        const parsed = JSON.parse(existingUtm);
        response.headers.set('x-utm-source', parsed['utm_source'] || '');
      } catch {
        // ignore invalid JSON
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

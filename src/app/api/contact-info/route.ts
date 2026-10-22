import { NextResponse } from 'next/server';
import { getContactInfo } from '@/services/contact/contactInfoService';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const operation = 'GET /api/contact-info';
  const start = Date.now();
  try {
    const responseData = await getContactInfo();
    logger.info('Contact info request completed', {
      module: 'api/contact-info',
      operation,
      status: 200,
      hasData: responseData.hasData,
      duration: Date.now() - start,
    });
    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('Contact info request failed', {
      module: 'api/contact-info',
      operation,
      status: 200,
      error,
    });
    return NextResponse.json(
      {
        hasData: false,
        phone: '',
        email: '',
        message: 'База данных недоступна',
      },
      { status: 200 }
    );
  }
}

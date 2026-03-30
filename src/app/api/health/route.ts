import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function GET() {
  try {
    logger.info('Health check endpoint called', { module: 'health' });
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }, { status: 200 });
  } catch (error) {
    logger.error('Health check failed', { error, module: 'health' });
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { handleCommand } from '@/services/telegram/bot-commands';
import { redis } from '@/lib/redis';

const WEBHOOK_RATE_LIMIT = { max: 30, windowSec: 60 };

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rlKey = `rate_limit:telegram_webhook:${ip}`;
    const attempts = await redis.incr(rlKey);
    if (attempts === 1) {
      await redis.expire(rlKey, WEBHOOK_RATE_LIMIT.windowSec);
    }
    if (attempts > WEBHOOK_RATE_LIMIT.max) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const secret = req.nextUrl.searchParams.get('secret');
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!webhookSecret || secret !== webhookSecret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const update = await req.json();

    if (!update.message || !update.message.text) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const text: string = update.message.text;
    const chatId: number = update.message.chat?.id;

    if (!chatId) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    handleCommand(text, chatId).catch(err => {
      console.error('Telegram webhook command error:', err);
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

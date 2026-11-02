/**
 * ЧТЗ_Фикс_Геолокация_Город_Пользователя: бэкфилл города у расчётов,
 * созданных в период сбоя геолокации (city IS NULL при заполненном ipAddress).
 *
 * Запуск: npx tsx prisma/scripts/backfill-estimate-city.ts [--since 2026-10-23] [--limit 500]
 * Идемпотентен: повторный запуск не меняет записи с заполненным city.
 */
import { PrismaClient } from '@prisma/client';
import { getCityByIP } from '../../src/services/admin/ipLookupService';
import logger from '../../src/lib/logger';

const prisma = new PrismaClient();

const logContext = { module: 'backfill-estimate-city' } as const;
const DELAY_MS = 300;

interface Args {
  since: Date;
  limit: number;
}

function parseArgs(): Args {
  const raw = process.argv.slice(2);
  const sinceIdx = raw.indexOf('--since');
  const limitIdx = raw.indexOf('--limit');
  const sinceValue = sinceIdx !== -1 ? raw[sinceIdx + 1] : '2026-10-23';
  const limitValue = limitIdx !== -1 ? Number(raw[limitIdx + 1]) : 500;
  const since = new Date(`${sinceValue}T00:00:00.000Z`);
  if (Number.isNaN(since.getTime())) {
    throw new Error(`Некорректная дата --since: ${sinceValue}`);
  }
  if (!Number.isFinite(limitValue) || limitValue <= 0) {
    throw new Error(`Некорректный --limit: ${raw[limitIdx + 1]}`);
  }
  return { since, limit: limitValue };
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function collectIds(since: Date, limit: number): Promise<{ model: string; id: string; ip: string }[]> {
  const records: { model: string; id: string; ip: string }[] = [];

  const fence = await prisma.fenceEstimate.findMany({
    where: { createdAt: { gte: since }, city: null, ipAddress: { not: null } },
    select: { id: true, ipAddress: true },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
  fence.forEach((r) => records.push({ model: 'fenceEstimate', id: r.id, ip: r.ipAddress as string }));

  const multi = await prisma.multiFenceEstimate.findMany({
    where: { createdAt: { gte: since }, city: null, ipAddress: { not: null } },
    select: { id: true, ipAddress: true },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
  multi.forEach((r) => records.push({ model: 'multiFenceEstimate', id: r.id, ip: r.ipAddress as string }));

  const gate = await prisma.gateEstimate.findMany({
    where: { createdAt: { gte: since }, city: null, ipAddress: { not: null } },
    select: { id: true, ipAddress: true },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
  gate.forEach((r) => records.push({ model: 'gateEstimate', id: r.id, ip: r.ipAddress as string }));

  return records;
}

async function updateCity(model: string, id: string, city: string): Promise<void> {
  if (model === 'fenceEstimate') {
    await prisma.fenceEstimate.update({ where: { id }, data: { city } });
  } else if (model === 'multiFenceEstimate') {
    await prisma.multiFenceEstimate.update({ where: { id }, data: { city } });
  } else {
    await prisma.gateEstimate.update({ where: { id }, data: { city } });
  }
}

async function main() {
  const { since, limit } = parseArgs();
  logger.info('Backfill started', { ...logContext, operation: 'main', since: since.toISOString(), limit });

  const records = await collectIds(since, limit);
  logger.info('Records without city collected', {
    ...logContext,
    operation: 'main',
    total: records.length,
  });

  let updated = 0;
  let unresolved = 0;

  for (const record of records) {
    const city = await getCityByIP(record.ip);
    if (city) {
      await updateCity(record.model, record.id, city);
      updated += 1;
      logger.info('City restored', {
        ...logContext,
        operation: 'main',
        model: record.model,
        id: record.id,
        city,
      });
    } else {
      unresolved += 1;
      logger.warn('City not resolved for record', {
        ...logContext,
        operation: 'main',
        model: record.model,
        id: record.id,
      });
    }
    await sleep(DELAY_MS);
  }

  logger.info('Backfill finished', {
    ...logContext,
    operation: 'main',
    processed: records.length,
    updated,
    unresolved,
  });
}

main()
  .catch((error) => {
    logger.error('Backfill failed', { ...logContext, operation: 'main', error });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    // ioredis (внутри ipLookupService) держит event loop — выходим явно
    process.exit(process.exitCode ?? 0);
  });

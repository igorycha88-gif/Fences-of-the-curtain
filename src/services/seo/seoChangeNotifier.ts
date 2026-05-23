import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/services/telegram/bot';
import { getMoscowDateTime } from '@/lib/timezone';
import type { CollectionResult } from './positionCollector';

interface PositionChange {
  keyword: string;
  searchEngine: string;
  currentPosition: number;
  previousPosition: number;
  change: number;
}

interface FirstFound {
  keyword: string;
  searchEngine: string;
  position: number;
}

interface DroppedOut {
  keyword: string;
  searchEngine: string;
  previousPosition: number;
}

interface CurrentPosition {
  keyword: string;
  searchEngine: string;
  position: number;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours > 0) return `${hours}ч ${minutes}м`;
  return `${minutes}м`;
}

function formatChange(change: number): string {
  if (change > 0) return `+${change}`;
  return String(change);
}

function changeEmoji(change: number): string {
  return change > 0 ? '📈' : '📉';
}

export class SeoChangeNotifier {
  async buildReport(result: CollectionResult): Promise<string> {
    const keywords = await prisma.seoKeyword.findMany({
      where: { active: true },
      orderBy: [{ searchEngine: 'asc' }, { keyword: 'asc' }],
    });

    const keywordMap = new Map(keywords.map((k) => [k.id, k]));

    const positions = await prisma.seoPosition.findMany({
      where: {
        keywordId: { in: keywords.map((k) => k.id) },
      },
      orderBy: { checkedAt: 'desc' },
    });

    const latestByKeyword = new Map<string, typeof positions>();
    for (const pos of positions) {
      const list = latestByKeyword.get(pos.keywordId) || [];
      if (list.length < 2) {
        list.push(pos);
        latestByKeyword.set(pos.keywordId, list);
      }
    }

    const notFound: { keyword: string; searchEngine: string }[] = [];
    const firstFound: FirstFound[] = [];
    const improvements: PositionChange[] = [];
    const declines: PositionChange[] = [];
    const droppedOut: DroppedOut[] = [];
    const currentPositions: CurrentPosition[] = [];

    for (const [keywordId, posList] of latestByKeyword) {
      const kw = keywordMap.get(keywordId);
      if (!kw) continue;

      const latest = posList[0];
      const previous = posList[1];

      if (!latest) {
        notFound.push({ keyword: kw.keyword, searchEngine: kw.searchEngine });
        continue;
      }

      if (!latest.found || latest.position === 0) {
        if (previous && previous.found && previous.position > 0) {
          droppedOut.push({
            keyword: kw.keyword,
            searchEngine: kw.searchEngine,
            previousPosition: previous.position,
          });
        } else {
          notFound.push({ keyword: kw.keyword, searchEngine: kw.searchEngine });
        }
        continue;
      }

      if (!previous || !previous.found || previous.position === 0) {
        firstFound.push({
          keyword: kw.keyword,
          searchEngine: kw.searchEngine,
          position: latest.position,
        });
        continue;
      }

      const change = previous.position - latest.position;
      const entry: PositionChange = {
        keyword: kw.keyword,
        searchEngine: kw.searchEngine,
        currentPosition: latest.position,
        previousPosition: previous.position,
        change,
      };

      if (change > 0) {
        improvements.push(entry);
      } else if (change < 0) {
        declines.push(entry);
      } else {
        currentPositions.push({
          keyword: kw.keyword,
          searchEngine: kw.searchEngine,
          position: latest.position,
        });
      }
    }

    improvements.sort((a, b) => b.change - a.change);
    declines.sort((a, b) => a.change - b.change);

    return this.formatMessage(result, notFound, firstFound, improvements, declines, droppedOut, currentPositions);
  }

  private formatMessage(
    result: CollectionResult,
    notFound: { keyword: string; searchEngine: string }[],
    firstFound: FirstFound[],
    improvements: PositionChange[],
    declines: PositionChange[],
    droppedOut: DroppedOut[],
    currentPositions: CurrentPosition[]
  ): string {
    const now = getMoscowDateTime();
    const lines: string[] = [];

    lines.push(`🔍 <b>SEO Мониторинг — ${now}</b>`);
    lines.push('');
    lines.push(`📊 <b>Общая статистика:</b>`);
    lines.push(`✅ Проверено: ${result.checked} ключевых слов`);
    lines.push(`❌ Не найдено: ${notFound.length}`);
    if (firstFound.length > 0) {
      lines.push(`🆕 Первые найденные: ${firstFound.length}`);
    }
    if (droppedOut.length > 0) {
      lines.push(`🔴 Выпали из выдачи: ${droppedOut.length}`);
    }
    lines.push(`⚠️ Ошибки: ${result.errors}`);
    lines.push(`🚫 Блокировки: ${result.blocked}`);
    if (result.torStats?.enabled) {
      lines.push(`🔄 Tor-ротации: ${result.torStats.rotations}`);
      lines.push(`🛡️ CAPTCHA срабатывания: ${result.torStats.captchaHits}`);
    }
    lines.push(`📦 Батчи: ${result.completedBatches}/${result.totalBatches}`);
    lines.push(`⏱ Длительность: ${formatDuration(result.duration)}`);
    if (result.skipped > 0) {
      lines.push(`⚠️ Пропущено (блокировки): ${result.skipped} — требуется ручная проверка`);
    }

    if (firstFound.length > 0) {
      lines.push('');
      lines.push(`🆕 <b>Первые найденные запросы:</b>`);
      for (const item of firstFound.slice(0, 20)) {
        const engine = item.searchEngine === 'yandex' ? 'Яндекс' : 'Google';
        lines.push(`• «${escapeHtml(item.keyword)}» → позиция ${item.position} (${engine})`);
      }
    }

    if (droppedOut.length > 0) {
      lines.push('');
      lines.push(`🔴 <b>Выпали из выдачи:</b>`);
      for (const item of droppedOut.slice(0, 20)) {
        const engine = item.searchEngine === 'yandex' ? 'Яндекс' : 'Google';
        lines.push(
          `• «${escapeHtml(item.keyword)}» была позиция ${item.previousPosition} (${engine})`
        );
      }
    }

    if (improvements.length > 0) {
      lines.push('');
      lines.push(`📈 <b>Улучшения позиции:</b>`);
      for (const item of improvements.slice(0, 20)) {
        const engine = item.searchEngine === 'yandex' ? 'Яндекс' : 'Google';
        lines.push(
          `• «${escapeHtml(item.keyword)}» ${item.previousPosition}→${item.currentPosition} (${formatChange(item.change)}) ${engine}`
        );
      }
    }

    if (declines.length > 0) {
      lines.push('');
      lines.push(`📉 <b>Ухудшения позиции:</b>`);
      for (const item of declines.slice(0, 20)) {
        const engine = item.searchEngine === 'yandex' ? 'Яндекс' : 'Google';
        lines.push(
          `• «${escapeHtml(item.keyword)}» ${item.previousPosition}→${item.currentPosition} (${formatChange(item.change)}) ${engine}`
        );
      }
    }

    if (improvements.length === 0 && declines.length === 0 && firstFound.length === 0 && droppedOut.length === 0 && currentPositions.length === 0) {
      lines.push('');
      lines.push(`ℹ️ Изменений позиций не обнаружено.`);
    }

    if (currentPositions.length > 0) {
      lines.push('');
      lines.push(`📍 <b>Текущие позиции (без изменений):</b>`);
      for (const item of currentPositions.slice(0, 20)) {
        const engine = item.searchEngine === 'yandex' ? 'Яндекс' : 'Google';
        lines.push(`• «${escapeHtml(item.keyword)}» → позиция ${item.position} (${engine})`);
      }
    }

    return lines.join('\n');
  }

  async sendReport(result: CollectionResult): Promise<boolean> {
    try {
      const message = await this.buildReport(result);

      const MAX_TG_LENGTH = 4096;
      if (message.length <= MAX_TG_LENGTH) {
        return sendTelegramMessage(message);
      }

      let cutPoint = -1;
      for (const marker of [
        '🆕 <b>Первые найденные',
        '📍 <b>Текущие позиции',
        '📈 <b>Улучшения',
        '📉 <b>Ухудшения',
        '🔴 <b>Выпали из выдачи',
      ]) {
        cutPoint = message.indexOf(marker);
        if (cutPoint > 0) break;
      }

      if (cutPoint <= 0) {
        cutPoint = Math.floor(MAX_TG_LENGTH * 0.8);
      }
      const part1 = message.substring(0, cutPoint);
      const part2 = message.substring(cutPoint);

      const sent1 = await sendTelegramMessage(part1);
      const sent2 = await sendTelegramMessage(part2);
      return sent1 && sent2;
    } catch (error) {
      console.error('[SeoChangeNotifier] Error sending report:', error);
      return false;
    }
  }
}

export const seoChangeNotifier = new SeoChangeNotifier();

'use client';

import { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';

interface SeasonCountdownProps {
  targetIso: string;
  label?: string;
  expiredText?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
}

function diffTo(target: Date): TimeLeft | null {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return null;
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
  };
}

/**
 * Честный сезонный таймер: считает дни до фиксированной даты,
 * после её наступления показывает неизменный текст без «перезапусков».
 * Дата и текст задаются страницей — манипулятивных подмен здесь нет.
 */
export default function SeasonCountdown({
  targetIso,
  label = 'До конца сезонного окна монтажа осталось',
  expiredText = 'Сезонное окно закрывается — сроки монтажа уточняйте по телефону',
}: SeasonCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(diffTo(new Date(targetIso)));
    const timer = setInterval(() => setTimeLeft(diffTo(new Date(targetIso))), 60_000);
    return () => clearInterval(timer);
  }, [targetIso]);

  const expired = mounted && timeLeft === null;

  return (
    <div
      data-testid="season-countdown"
      className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl border ${
        expired
          ? 'border-primary/30 bg-secondary/60'
          : 'border-primary/40 bg-primary/5'
      }`}
    >
      <CalendarClock className="w-5 h-5 text-primary shrink-0" />
      {!mounted ? (
        <span className="text-sm text-muted-foreground">{label}&nbsp;…</span>
      ) : expired ? (
        <span className="text-sm font-medium">{expiredText}</span>
      ) : (
        <span className="text-sm">
          {label}&nbsp;
          <span className="font-bold text-primary" data-testid="season-countdown-value">
            {timeLeft!.days} дн {timeLeft!.hours} ч
          </span>
        </span>
      )}
    </div>
  );
}

'use client';

import type { TimelineData } from '@/services/admin/businessMetricsService';

const SERIES = [
  { key: 'new' as const, color: '#3B82F6', label: 'Новые' },
  { key: 'completed' as const, color: '#10B981', label: 'Завершенные' },
  { key: 'cancelled' as const, color: '#EF4444', label: 'Отмененные' },
];

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { top: 16, right: 12, bottom: 28, left: 34 };

function formatKeyLabel(key: string, granularity: string): string {
  const [y, m, d] = key.split('-');
  if (granularity === 'month') return `${m}.${y}`;
  if (granularity === 'week') return `нед. ${d}.${m}`;
  return `${d}.${m}`;
}

export default function TimelineChart({ timeline }: { timeline: TimelineData }) {
  const pointsCount = timeline.keys.length;
  const maxValue = Math.max(1, ...timeline.new, ...timeline.completed, ...timeline.cancelled);
  const hasData = timeline.new.some((v) => v > 0) || timeline.completed.some((v) => v > 0) || timeline.cancelled.some((v) => v > 0);

  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const x = (i: number) => PADDING.left + (pointsCount <= 1 ? innerWidth / 2 : (i / (pointsCount - 1)) * innerWidth);
  const y = (v: number) => PADDING.top + innerHeight - (v / maxValue) * innerHeight;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const labelStep = Math.max(1, Math.ceil(pointsCount / 8));

  return (
    <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-md border" data-testid="timeline-chart">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-base md:text-lg font-semibold text-gray-900">Динамика заявок</h2>
        <div className="flex gap-3 flex-wrap">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      {!hasData ? (
        <p className="text-gray-500 text-sm py-6 text-center" data-testid="timeline-empty">Нет данных за период</p>
      ) : (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label="График динамики заявок">
          {gridLines.map((g) => {
            const gy = PADDING.top + innerHeight - g * innerHeight;
            const value = Math.round(g * maxValue);
            return (
              <g key={g}>
                <line x1={PADDING.left} y1={gy} x2={WIDTH - PADDING.right} y2={gy} stroke="#E5E7EB" strokeWidth="1" />
                <text x={PADDING.left - 6} y={gy + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">{value}</text>
              </g>
            );
          })}
          {timeline.keys.map((key, i) =>
            i % labelStep === 0 || i === pointsCount - 1 ? (
              <text key={key} x={x(i)} y={HEIGHT - 8} textAnchor="middle" fontSize="10" fill="#9CA3AF">
                {formatKeyLabel(key, timeline.granularity)}
              </text>
            ) : null
          )}
          {SERIES.map((s) => (
            <polyline
              key={s.key}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={timeline.keys.map((_, i) => `${x(i)},${y(timeline[s.key][i])}`).join(' ')}
            />
          ))}
        </svg>
      )}
    </div>
  );
}

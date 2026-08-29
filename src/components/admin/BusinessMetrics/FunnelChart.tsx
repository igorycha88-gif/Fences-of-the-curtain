'use client';

import type { FunnelStage } from '@/services/admin/businessMetricsService';
import { formatNumber } from './KPICard';

const STAGE_COLORS = [
  'bg-blue-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-green-500',
];

export default function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-md border" data-testid="funnel-chart">
      <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Воронка конверсии</h2>
      {stages.length === 0 || stages.every((s) => s.count === 0) ? (
        <p className="text-gray-500 text-sm py-6 text-center" data-testid="funnel-empty">Нет данных за период</p>
      ) : (
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div key={stage.status} data-testid={`funnel-stage-${stage.status}`}>
              <div className="flex items-center justify-between text-xs md:text-sm mb-1">
                <span className="font-medium text-gray-700">{stage.label}</span>
                <span className="text-gray-500">
                  {formatNumber(stage.count)} ({stage.percentage}%)
                  {stage.stepConversion !== null && (
                    <span className="ml-2 text-gray-400">шаг: {stage.stepConversion}%</span>
                  )}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 md:h-6">
                <div
                  className={`${STAGE_COLORS[index % STAGE_COLORS.length]} h-4 md:h-6 rounded-full transition-all duration-500 min-w-[2px]`}
                  style={{ width: `${Math.max((stage.count / maxCount) * 100, 0.5)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

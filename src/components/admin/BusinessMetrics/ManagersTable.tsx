'use client';

import type { ManagerStat } from '@/services/admin/businessMetricsService';
import { formatCurrency, formatNumber } from './KPICard';

export default function ManagersTable({ managers }: { managers: ManagerStat[] }) {
  return (
    <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-md border overflow-x-auto" data-testid="managers-table">
      <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Эффективность менеджеров</h2>
      {managers.length === 0 ? (
        <p className="text-gray-500 text-sm py-6 text-center" data-testid="managers-empty">Нет данных за период</p>
      ) : (
        <table className="w-full text-xs md:text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2 pr-2 font-medium">Менеджер</th>
              <th className="py-2 pr-2 font-medium text-right">Заявок</th>
              <th className="py-2 pr-2 font-medium text-right">В работе</th>
              <th className="py-2 pr-2 font-medium text-right">Завершено</th>
              <th className="py-2 pr-2 font-medium text-right">Отменено</th>
              <th className="py-2 pr-2 font-medium text-right">Конверсия</th>
              <th className="py-2 pr-2 font-medium text-right">Ср. чек</th>
              <th className="py-2 font-medium text-right">Выручка</th>
            </tr>
          </thead>
          <tbody>
            {managers.map((manager) => (
              <tr key={manager.id || 'unassigned'} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="py-2 pr-2 text-gray-900 font-medium">{manager.name}</td>
                <td className="py-2 pr-2 text-right">{formatNumber(manager.total)}</td>
                <td className="py-2 pr-2 text-right">{formatNumber(manager.inProgress)}</td>
                <td className="py-2 pr-2 text-right">{formatNumber(manager.completed)}</td>
                <td className="py-2 pr-2 text-right">{formatNumber(manager.cancelled)}</td>
                <td className="py-2 pr-2 text-right">
                  <span
                    className={
                      manager.conversion >= 60
                        ? 'text-green-600 font-medium'
                        : manager.conversion >= 40
                          ? 'text-yellow-600 font-medium'
                          : 'text-red-600 font-medium'
                    }
                  >
                    {manager.conversion}%
                  </span>
                </td>
                <td className="py-2 pr-2 text-right">{formatCurrency(manager.avgCheck)}</td>
                <td className="py-2 text-right font-medium">{formatCurrency(manager.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

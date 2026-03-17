'use client';

import { STATUS_LABELS, StatusHistoryEntry } from '@/lib/validators/order';

interface StatusHistoryProps {
  history: StatusHistoryEntry[];
  isAdmin: boolean;
  onEdit?: (index: number) => void;
}

export function StatusHistory({ history }: Omit<StatusHistoryProps, 'isAdmin' | 'onEdit'>) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border p-6">
        <p className="text-gray-500 text-center">История пуста</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-blue-500',
    ESTIMATE_APPROVAL: 'bg-yellow-500',
    MEASUREMENT: 'bg-purple-500',
    PRODUCTION: 'bg-orange-500',
    INSTALLATION: 'bg-cyan-500',
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-red-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-md border">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold">История изменений</h2>
      </div>
      <div className="divide-y">
        {history.map((entry, index) => (
          <div key={index} className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-1.5 ${STATUS_COLORS[entry.status] || 'bg-gray-400'}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{STATUS_LABELS[entry.status] || entry.status}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(entry.changedAt)} • {entry.changedByName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

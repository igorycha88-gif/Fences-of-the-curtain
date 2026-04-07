'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  User,
  FileText,
  ArrowRight,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AuditChange =
  | { type: 'PARAMETER_CHANGED'; field: string; oldValue: unknown; newValue: unknown }
  | { type: 'QUANTITY_OVERRIDDEN'; nomenclatureId: string; nomenclatureName: string; autoQuantity: number; manualQuantity: number }
  | { type: 'ITEM_ADDED'; item: { category: string; nomenclatureId: string; nomenclatureName: string; quantity: number; unit: string; pricePerUnit: number; totalPrice: number } }
  | { type: 'ITEM_DELETED'; item: { nomenclatureId: string; nomenclatureName: string; quantity: number; unit: string; pricePerUnit: number; totalPrice: number } };

interface EditHistoryEntry {
  id: string;
  action: string;
  user: { id: string; name: string; email: string } | null;
  createdAt: string;
  details: {
    changes: AuditChange[];
    originalEstimateId: string | null;
    adminEstimateId: string | null;
    editComment: string | null;
  } | null;
}

interface EstimateEditHistoryProps {
  orderId: string;
}

const FIELD_LABELS: Record<string, string> = {
  length: 'Длина',
  height: 'Высота',
  coating: 'Покрытие',
  lagRows: 'Лаги (рядов)',
  hasGate: 'Ворота',
  gateType: 'Тип ворот',
  gateWidth: 'Ширина ворот',
  hasWicket: 'Калитка',
  wicketWidth: 'Ширина калитки',
};

const COATING_LABELS: Record<string, string> = {
  GALVANIZED: 'Оцинковка',
  POLYMER_SINGLE: 'Полимер (односторонний)',
  POLYMER_DOUBLE: 'Полимер (двусторонний)',
};

const GATE_TYPE_LABELS: Record<string, string> = {
  SWING: 'Распашные',
  SLIDING: 'Откатные',
};

function formatFieldValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (field === 'coating') return COATING_LABELS[String(value)] || String(value);
  if (field === 'gateType') return GATE_TYPE_LABELS[String(value)] || String(value);
  if (field === 'hasGate' || field === 'hasWicket') return value ? 'Да' : 'Нет';
  if (field === 'length' || field === 'height' || field === 'gateWidth' || field === 'wicketWidth') return `${value} м`;
  if (field === 'lagRows') return `${value} рядов`;
  return String(value);
}

function formatPrice(price: number) {
  return price.toLocaleString('ru-RU') + ' \u20BD';
}

const ACTION_LABELS: Record<string, string> = {
  CREATE_ADMIN_ESTIMATE: 'Создание корректировки',
  UPDATE_ADMIN_ESTIMATE: 'Обновление корректировки',
};

const ACTION_COLORS: Record<string, string> = {
  CREATE_ADMIN_ESTIMATE: 'bg-blue-100 text-blue-800 border-blue-200',
  UPDATE_ADMIN_ESTIMATE: 'bg-amber-100 text-amber-800 border-amber-200',
};

function ChangeBadge({ change }: { change: AuditChange }) {
  switch (change.type) {
    case 'PARAMETER_CHANGED':
      return (
        <div className="flex items-center gap-2 text-sm py-1">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
            Параметр
          </span>
          <span className="text-gray-600">{FIELD_LABELS[change.field] || change.field}:</span>
          <span className="text-gray-400 line-through">{formatFieldValue(change.field, change.oldValue)}</span>
          <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="font-medium text-purple-700">{formatFieldValue(change.field, change.newValue)}</span>
        </div>
      );
    case 'QUANTITY_OVERRIDDEN':
      return (
        <div className="flex items-center gap-2 text-sm py-1">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
            Кол-во
          </span>
          <span className="text-gray-600">{change.nomenclatureName}:</span>
          <span className="text-gray-400 line-through">{change.autoQuantity}</span>
          <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="font-medium text-amber-700">{change.manualQuantity}</span>
        </div>
      );
    case 'ITEM_ADDED':
      return (
        <div className="flex items-center gap-2 text-sm py-1">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            <Plus className="w-3 h-3 mr-0.5" />
            Добавлено
          </span>
          <span className="text-gray-600">{change.item.nomenclatureName}</span>
          <span className="text-green-700 font-medium">
            &times;{change.item.quantity} {change.item.unit}
          </span>
          <span className="text-green-600 ml-auto">{formatPrice(change.item.totalPrice)}</span>
        </div>
      );
    case 'ITEM_DELETED':
      return (
        <div className="flex items-center gap-2 text-sm py-1">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            <Trash2 className="w-3 h-3 mr-0.5" />
            Удалено
          </span>
          <span className="text-gray-500 line-through">{change.item.nomenclatureName}</span>
          <span className="text-gray-400">
            &times;{change.item.quantity} {change.item.unit}
          </span>
          <span className="text-red-500 ml-auto">{formatPrice(change.item.totalPrice)}</span>
        </div>
      );
    default:
      return null;
  }
}

export function EstimateEditHistory({ orderId }: EstimateEditHistoryProps) {
  const [logs, setLogs] = useState<EditHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHistory();
  }, [orderId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/orders/${orderId}/estimate-edit-history`,
        { credentials: 'include' }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Ошибка загрузки истории');
      }
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-500" />
          <h3 className="text-base font-semibold">История корректировок</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-500" />
          <h3 className="text-base font-semibold">История корректировок</h3>
        </div>
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-500" />
          <h3 className="text-base font-semibold">История корректировок</h3>
        </div>
        <p className="text-sm text-gray-400 text-center py-4">
          Корректировки еще не производились
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-500" />
        <h3 className="text-base font-semibold">История корректировок</h3>
        <span className="text-xs text-gray-400 ml-auto">{logs.length} {logs.length === 1 ? 'запись' : 'записей'}</span>
      </div>

      <div className="space-y-3">
        {logs.map((log) => {
          const isExpanded = expandedIds.has(log.id);
          const changes = log.details?.changes || [];
          const hasChanges = changes.length > 0;

          return (
            <div
              key={log.id}
              className="border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => hasChanges && toggleExpand(log.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                  hasChanges && 'cursor-pointer'
                )}
              >
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium border',
                  ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800 border-gray-200'
                )}>
                  {ACTION_LABELS[log.action] || log.action}
                </span>

                {log.user && (
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <User className="w-3.5 h-3.5" />
                    {log.user.name}
                  </span>
                )}

                <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(log.createdAt).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>

                {hasChanges && (
                  <span className="text-xs text-gray-400">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                )}
              </button>

              {isExpanded && hasChanges && (
                <div className="border-t bg-gray-50 px-4 py-3 space-y-1">
                  {changes.map((change, i) => (
                    <ChangeBadge key={i} change={change} />
                  ))}

                  {log.details?.editComment && (
                    <div className="mt-2 pt-2 border-t flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Комментарий:</p>
                        <p className="text-sm text-gray-700">{log.details.editComment}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isExpanded && hasChanges && (
                <div className="border-t bg-gray-50/50 px-4 py-2 flex flex-wrap gap-2">
                  {changes.slice(0, 3).map((change, i) => (
                    <span key={i} className="text-xs text-gray-500">
                      {change.type === 'PARAMETER_CHANGED' && `${FIELD_LABELS[change.field] || change.field}`}
                      {change.type === 'QUANTITY_OVERRIDDEN' && change.nomenclatureName}
                      {change.type === 'ITEM_ADDED' && `+${change.item.nomenclatureName}`}
                      {change.type === 'ITEM_DELETED' && `-${change.item.nomenclatureName}`}
                    </span>
                  ))}
                  {changes.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +ещё {changes.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

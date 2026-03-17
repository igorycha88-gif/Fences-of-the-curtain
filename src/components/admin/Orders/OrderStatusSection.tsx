'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Calendar, User, XCircle, CheckCircle, CheckSquare, FileText, DollarSign } from 'lucide-react';
import { StatusHistory } from './StatusHistory';
import { STATUS_LABELS, StatusHistoryEntry as StatusHistoryEntryType, OrderStatus } from '@/lib/validators/order';

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800 border-blue-200',
  ESTIMATE_APPROVAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  MEASUREMENT: 'bg-purple-100 text-purple-800 border-purple-200',
  PRODUCTION: 'bg-orange-100 text-orange-800 border-orange-200',
  INSTALLATION: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

interface StatusHistoryEntry {
  status: OrderStatus;
  statusLabel: string;
  changedAt: string;
  changedBy: string;
  changedByName: string;
  data: Record<string, any>;
}

interface OrderStatusSectionProps {
  status: string;
  statusLabel: string;
  measurementAddress: string | null;
  measurementDate: string | null;
  cancellationReason: string | null;
  completionDate: string | null;
  assignedUser: {
    id: string;
    name: string;
    role: string;
  } | null;
  statusHistory: StatusHistoryEntry[];
  isAdmin: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
};

export function OrderStatusSection({
  status,
  statusLabel,
  measurementAddress,
  measurementDate,
  cancellationReason,
  completionDate,
  assignedUser,
  statusHistory,
  isAdmin,
}: OrderStatusSectionProps) {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const currentStatusData = statusHistory
    .slice()
    .reverse()
    .find((entry) => entry.status === status)?.data || {};

  const renderCurrentStatusFields = () => {
    const fields: JSX.Element[] = [];

    if (status === 'PRODUCTION') {
      if (currentStatusData.measurementConfirmed !== undefined) {
        fields.push(
          <div key="measurementConfirmed" className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckSquare className="w-4 h-4 text-green-500 mt-0.5" />
            <div>
              <label className="text-sm text-green-600 block">Смета подтверждена</label>
              <p className="font-medium text-green-800">
                {currentStatusData.measurementConfirmed ? 'Да' : 'Нет'}
              </p>
            </div>
          </div>
        );
      }
      if (currentStatusData.measurementResult) {
        fields.push(
          <div key="measurementResult" className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <label className="text-sm text-gray-500 block">Результат замера</label>
              <p className="font-medium text-gray-900 whitespace-pre-wrap">{currentStatusData.measurementResult}</p>
            </div>
          </div>
        );
      }
      if (currentStatusData.adjustedCost !== undefined && currentStatusData.adjustedCost !== null) {
        fields.push(
          <div key="adjustedCost" className="flex items-start gap-3">
            <DollarSign className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <label className="text-sm text-gray-500 block">Скорректированная стоимость</label>
              <p className="font-medium text-gray-900">{formatCurrency(currentStatusData.adjustedCost)}</p>
            </div>
          </div>
        );
      }
    }

    if (status === 'INSTALLATION') {
      if (currentStatusData.productionReadyDate) {
        fields.push(
          <div key="productionReadyDate" className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <label className="text-sm text-gray-500 block">Дата готовности</label>
              <p className="font-medium text-gray-900">
                {new Date(currentStatusData.productionReadyDate).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
        );
      }
      if (currentStatusData.productionNotes) {
        fields.push(
          <div key="productionNotes" className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <label className="text-sm text-gray-500 block">Примечания к производству</label>
              <p className="font-medium text-gray-900 whitespace-pre-wrap">{currentStatusData.productionNotes}</p>
            </div>
          </div>
        );
      }
    }

    if (status === 'COMPLETED') {
      if (currentStatusData.clientSatisfied !== undefined) {
        fields.push(
          <div key="clientSatisfied" className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <div>
              <label className="text-sm text-green-600 block">Клиент доволен</label>
              <p className="font-medium text-green-800">
                {currentStatusData.clientSatisfied ? 'Да' : 'Нет'}
              </p>
            </div>
          </div>
        );
      }
    }

    if (status === 'CANCELLED' && currentStatusData.cancellationComment) {
      fields.push(
        <div key="cancellationComment" className="flex items-start gap-3">
          <FileText className="w-4 h-4 text-red-400 mt-0.5" />
          <div>
            <label className="text-sm text-red-600 block">Комментарий к отмене</label>
            <p className="font-medium text-red-800 whitespace-pre-wrap">{currentStatusData.cancellationComment}</p>
          </div>
        </div>
      );
    }

    return fields;
  };

  return (
    <div className="bg-white rounded-xl shadow-md border p-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-xl">📊</span>
        Статусы и история
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-500 block">Текущий статус</label>
          <span
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
              STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {statusLabel}
          </span>
        </div>

        {measurementAddress && (
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <label className="text-sm text-gray-500 block">Адрес замера</label>
              <p className="font-medium text-gray-900">{measurementAddress}</p>
            </div>
          </div>
        )}

        {measurementDate && (
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <label className="text-sm text-gray-500 block">Дата замера</label>
              <p className="font-medium text-gray-900">
                {new Date(measurementDate).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
        )}

        {assignedUser && (
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <label className="text-sm text-gray-500 block">Назначен</label>
              <p className="font-medium text-gray-900">
                {assignedUser.name} ({assignedUser.role === 'ADMIN' ? 'Администратор' : 'Менеджер'})
              </p>
            </div>
          </div>
        )}

        {status === 'CANCELLED' && cancellationReason && (
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
            <div>
              <label className="text-sm text-red-600 block">Причина отмены</label>
              <p className="font-medium text-red-800">{cancellationReason}</p>
            </div>
          </div>
        )}

        {status === 'COMPLETED' && completionDate && (
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <div>
              <label className="text-sm text-green-600 block">Дата завершения</label>
              <p className="font-medium text-green-800">
                {new Date(completionDate).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
        )}

        {renderCurrentStatusFields()}

        <div className="pt-4 border-t">
          <button
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-900"
          >
            <span className="font-medium">История изменений ({statusHistory.length})</span>
            {isHistoryExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {isHistoryExpanded && statusHistory.length > 0 && (
            <div className="mt-4">
              <StatusHistory history={statusHistory as any} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

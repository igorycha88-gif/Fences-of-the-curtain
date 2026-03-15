'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import { STATUS_LABELS, VALID_STATUS_TRANSITIONS } from '@/lib/validators/order';

interface Order {
  id: string;
  clientName: string;
  phone: string;
  email: string | null;
  serviceType: string;
  parameters: {
    message?: string;
    fenceType?: string;
    length?: number;
    height?: number;
    lagRows?: number;
    coating?: string;
    hasGate?: boolean;
    gateLength?: number;
    hasWicket?: boolean;
    wicketWidth?: number;
  };
  calculatedCost: number;
  status: string;
  statusLabel: string;
  estimateId: string | null;
  managerComment: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory: Array<{
    status: string;
    changedAt: string;
    comment?: string;
  }>;
  estimate?: {
    id: string;
    grandTotal: number;
    items: any[];
  };
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800 border-blue-200',
  ESTIMATE_APPROVAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  MEASUREMENT: 'bg-purple-100 text-purple-800 border-purple-200',
  PRODUCTION: 'bg-orange-100 text-orange-800 border-orange-200',
  INSTALLATION: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [resolvedParams.id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${resolvedParams.id}`);
      if (!res.ok) {
        throw new Error('Заявка не найдена');
      }
      const data = await res.json();
      setOrder(data);
      setSelectedStatus(data.status);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order || selectedStatus === order.status) return;
    
    setUpdating(true);
    setError(null);
    setSuccess(false);
    
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          comment: comment || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка обновления статуса');
      }

      const updated = await res.json();
      setOrder(updated);
      setComment('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления статуса');
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getAvailableTransitions = (currentStatus: string): string[] => {
    return VALID_STATUS_TRANSITIONS[currentStatus] || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Заявка не найдена</p>
        <Link href="/admin/orders" className="text-primary hover:underline mt-4 inline-block">
          Вернуться к списку
        </Link>
      </div>
    );
  }

  const availableTransitions = getAvailableTransitions(order.status);

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/orders"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Заявка #{order.id.slice(0, 8)}
          </h1>
          <p className="text-gray-500">
            от {new Date(order.createdAt).toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-md border p-6">
            <h2 className="text-lg font-bold mb-4">Данные клиента</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Имя</label>
                <p className="font-medium">{order.clientName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Телефон</label>
                <p className="font-medium">
                  <a href={`tel:${order.phone}`} className="text-primary hover:underline">
                    {order.phone}
                  </a>
                </p>
              </div>
              {order.email && (
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">
                    <a href={`mailto:${order.email}`} className="text-primary hover:underline">
                      {order.email}
                    </a>
                  </p>
                </div>
              )}
            </div>
            {order.parameters.message && (
              <div className="mt-4 pt-4 border-t">
                <label className="text-sm text-gray-500">Сообщение</label>
                <p className="mt-1">{order.parameters.message}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md border p-6">
            <h2 className="text-lg font-bold mb-4">Параметры заказа</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {order.parameters.length && (
                <div>
                  <label className="text-sm text-gray-500">Длина</label>
                  <p className="font-medium">{order.parameters.length} м</p>
                </div>
              )}
              {order.parameters.height && (
                <div>
                  <label className="text-sm text-gray-500">Высота</label>
                  <p className="font-medium">{order.parameters.height} м</p>
                </div>
              )}
              {order.parameters.lagRows && (
                <div>
                  <label className="text-sm text-gray-500">Лаги</label>
                  <p className="font-medium">{order.parameters.lagRows} ряда</p>
                </div>
              )}
              {order.parameters.coating && (
                <div>
                  <label className="text-sm text-gray-500">Покрытие</label>
                  <p className="font-medium">{order.parameters.coating}</p>
                </div>
              )}
              {order.parameters.hasGate && (
                <div>
                  <label className="text-sm text-gray-500">Ворота</label>
                  <p className="font-medium">{order.parameters.gateLength} м</p>
                </div>
              )}
              {order.parameters.hasWicket && (
                <div>
                  <label className="text-sm text-gray-500">Калитка</label>
                  <p className="font-medium">{order.parameters.wicketWidth} м</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border p-6">
            <h2 className="text-lg font-bold mb-4">История статусов</h2>
            <div className="space-y-3">
              {order.statusHistory?.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-1.5 ${
                    STATUS_COLORS[item.status]?.split(' ')[0] || 'bg-gray-200'
                  }`} />
                  <div>
                    <p className="font-medium">{STATUS_LABELS[item.status] || item.status}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(item.changedAt).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {item.comment && (
                      <p className="text-sm text-gray-600 mt-1">{item.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md border p-6">
            <h2 className="text-lg font-bold mb-4">Стоимость</h2>
            <div className="text-center py-4 bg-primary/5 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Итого</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(order.calculatedCost)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border p-6">
            <h2 className="text-lg font-bold mb-4">Изменить статус</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 mb-4 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Статус обновлен
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 block mb-2">Текущий статус</label>
                <span className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                  STATUS_COLORS[order.status]
                }`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>

              {availableTransitions.length > 0 && (
                <div>
                  <label className="text-sm text-gray-500 block mb-2">Новый статус</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value={order.status}>{STATUS_LABELS[order.status]} (текущий)</option>
                    {availableTransitions.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-500 block mb-2">Комментарий</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Добавьте комментарий к смене статуса..."
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <button
                onClick={handleStatusUpdate}
                disabled={updating || selectedStatus === order.status}
                className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                Сохранить
              </button>
            </div>
          </div>

          {order.estimateId && (
            <Link
              href={`/admin/estimates?open=${order.estimateId}`}
              className="block bg-white rounded-xl shadow-md border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Смета</h2>
                  <p className="text-sm text-gray-500">Посмотреть детали расчета</p>
                </div>
                <ExternalLink className="w-5 h-5 text-primary" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

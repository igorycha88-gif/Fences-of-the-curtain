'use client';

import { useState, useEffect } from 'react';
import { isApiError } from '@/lib/utils/apiResponse';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard', { credentials: 'include' });
      const data = await res.json();

      if (isApiError(data)) {
        console.error('[Dashboard] API Error:', data.error);
        setStats({});
        setRecentOrders([]);
        return;
      }

      setStats(data.stats || {});
      setRecentOrders(Array.isArray(data.recentOrders) ? data.recentOrders : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({});
      setRecentOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      NEW: { color: 'bg-green-100 text-green-800', label: 'Новая' },
      IN_PROGRESS: { color: 'bg-yellow-100 text-yellow-800', label: 'В работе' },
      COMPLETED: { color: 'bg-gray-100 text-gray-800', label: 'Завершена' },
      CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Отменена' },
    };

    const { color, label } = statusMap[status] || { color: 'bg-gray-100', label: status };
    return <span className={`px-2 py-1 rounded text-sm ${color}`}>{label}</span>;
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-8">Дашборд</h1>
        <div className="text-center py-8 text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-8">Дашборд</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8">
        <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 shadow-md border">
          <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1 md:mb-2">Новые заявки</h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats?.newOrders || 0}</p>
        </div>
        <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 shadow-md border">
          <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1 md:mb-2">В работе</h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats?.ordersInProgress || 0}</p>
        </div>
        <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 shadow-md border">
          <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1 md:mb-2">Завершено</h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats?.completedOrders || 0}</p>
        </div>
        <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 shadow-md border">
          <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1 md:mb-2">Конверсия</h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats?.conversionRate || 0}%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-md border">
        <h2 className="text-base md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">Последние заявки</h2>
        <div className="space-y-3 md:hidden">
          {recentOrders.map((order) => (
            <a
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="block bg-gray-50 rounded-lg p-3 border hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">#{order.id.slice(0, 8)}</span>
                {getStatusBadge(order.status)}
              </div>
              <div className="text-sm text-gray-700 mb-1">{order.clientName}</div>
              <div className="text-xs text-gray-500">{order.phone}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {order.serviceType === 'fence' ? 'Забор' : 'Навес'}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {order.calculatedCost.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </a>
          ))}
          {recentOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">Нет заявок</div>
          )}
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-600">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Клиент</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Телефон</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Услуга</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Стоимость</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Статус</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Дата</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600">#{order.id.slice(0, 8)}</td>
                  <td className="py-3 px-4">{order.clientName}</td>
                  <td className="py-3 px-4">{order.phone}</td>
                  <td className="py-3 px-4">{order.serviceType === 'fence' ? 'Забор' : 'Навес'}</td>
                  <td className="py-3 px-4 font-medium">
                    {order.calculatedCost.toLocaleString('ru-RU')} ₽
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Нет заявок
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

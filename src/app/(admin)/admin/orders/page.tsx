'use client';

import { useState, useEffect } from 'react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    serviceType: '',
    search: '',
  });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.serviceType) params.append('serviceType', filters.serviceType);
      if (filters.search) params.append('search', filters.search);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
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

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Заявки</h1>

      <div className="bg-white rounded-xl shadow-md border">
        <div className="p-6 space-y-4 border-b">
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder="Поиск по имени, телефону или email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && fetchOrders()}
              className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Все статусы</option>
              <option value="NEW">Новые</option>
              <option value="IN_PROGRESS">В работе</option>
              <option value="COMPLETED">Завершенные</option>
              <option value="CANCELLED">Отмененные</option>
            </select>

            <select
              value={filters.serviceType}
              onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Все услуги</option>
              <option value="fence">Заборы</option>
              <option value="canopy">Навесы</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
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
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
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
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="NEW">Новая</option>
                        <option value="IN_PROGRESS">В работе</option>
                        <option value="COMPLETED">Завершена</option>
                        <option value="CANCELLED">Отменена</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

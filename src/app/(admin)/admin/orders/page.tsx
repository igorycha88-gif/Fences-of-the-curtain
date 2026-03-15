'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { STATUS_LABELS } from '@/lib/validators/order';

interface Order {
  id: string;
  clientName: string;
  phone: string;
  email: string | null;
  serviceType: string;
  calculatedCost: number;
  status: string;
  statusLabel: string;
  estimateId: string | null;
  createdAt: string;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  ESTIMATE_APPROVAL: 'bg-yellow-100 text-yellow-800',
  MEASUREMENT: 'bg-purple-100 text-purple-800',
  PRODUCTION: 'bg-orange-100 text-orange-800',
  INSTALLATION: 'bg-cyan-100 text-cyan-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    fetchOrders();
  }, [filters, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('pageSize', String(pageSize));
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
    const label = STATUS_LABELS[status] || status;
    return <span className={`px-2 py-1 rounded text-sm font-medium ${color}`}>{label}</span>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Заявки</h1>

      <div className="bg-white rounded-xl shadow-md border">
        <div className="p-6 space-y-4 border-b">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по имени, телефону или email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Все статусы</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="С"
            />

            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="По"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Загрузка...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Дата</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Клиент</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Телефон</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Сумма</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Статус</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Смета</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          #{order.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium">{order.clientName}</td>
                      <td className="py-3 px-4">{order.phone}</td>
                      <td className="py-3 px-4 font-semibold">
                        {formatCurrency(order.calculatedCost)}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                      <td className="py-3 px-4">
                        {order.estimateId ? (
                          <Link
                            href={`/admin/estimates?open=${order.estimateId}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Смета
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {data?.orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        Заявки не найдены
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-gray-600">
                  Показано {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, data.total)} из {data.total}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm">
                    Страница {page} из {data.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, ExternalLink, ChevronDown, Filter } from 'lucide-react';
import { STATUS_LABELS, VALID_STATUS_TRANSITIONS } from '@/lib/validators/order';
import { StatusChangeModal } from '@/components/admin/Orders/StatusChangeModal';

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
  isIndividualRequest?: boolean;
  isMultiEstimate?: boolean;
  estimateIds?: string[];
  hasAdminEstimate?: boolean;
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
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 20;
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<string>('');

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

      const res = await fetch(`/api/admin/orders?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) {
        setData({ orders: [], total: 0, page: 1, pageSize, totalPages: 0 });
        return;
      }
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setData({ orders: [], total: 0, page: 1, pageSize, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
    const label = STATUS_LABELS[status] || status;
    return <span className={`px-2 py-1 rounded text-sm font-medium ${color}`}>{label}</span>;
  };

  const renderStatusCell = (order: Order) => {
    const availableTransitions = VALID_STATUS_TRANSITIONS[order.status] || [];
    const color = STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800';
    const label = STATUS_LABELS[order.status] || order.status;

    if (availableTransitions.length === 0) {
      return <span className={`px-2 py-1 rounded text-sm font-medium ${color}`}>{label}</span>;
    }

    return (
      <div className="relative group">
        <button className={`px-2 py-1 rounded text-sm font-medium ${color} flex items-center gap-1 hover:opacity-80`}>
          {label}
          <ChevronDown className="w-3 h-3" />
        </button>
        <div className="absolute left-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 hidden group-hover:block min-w-[160px]">
          {availableTransitions.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusClick(order, status)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${STATUS_COLORS[status]}`}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>
    );
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

  const handleStatusClick = (order: Order, newStatus: string) => {
    setSelectedOrder(order);
    setSelectedNewStatus(newStatus);
    setModalOpen(true);
  };

  const handleStatusUpdateSuccess = () => {
    fetchOrders();
  };

  return (
    <div>
      <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-8">Заявки</h1>

      <div className="bg-white rounded-lg md:rounded-xl shadow-md border">
        <div className="p-3 md:p-6 border-b">
          <div className="flex items-center gap-2 md:hidden mb-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm"
            >
              <Filter className="w-4 h-4" />
              Фильтры
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>

          {showFilters && (
            <div className="md:hidden space-y-3 mb-3 p-3 bg-gray-50 rounded-lg">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="">Все статусы</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
          )}

          <div className="hidden md:flex gap-4 flex-wrap">
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
            <div className="hidden md:block overflow-x-auto">
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
                  {data?.orders?.map((order) => (
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
                        {order.calculatedCost === 0 && !order.estimateId
                          ? 'Индивидуальный расчёт (0 ₽)'
                          : formatCurrency(order.calculatedCost)
                        }
                      </td>
                      <td className="py-3 px-4">{renderStatusCell(order)}</td>
                      <td className="py-3 px-4">
                        {order.estimateIds && order.estimateIds.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {order.hasAdminEstimate && order.estimateIds[0] ? (
                              <>
                                <Link
                                  href={`/admin/estimates?open=${order.estimateIds[0]}`}
                                  className="inline-flex items-center gap-1 text-orange-700 bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded text-sm font-medium"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Скорректированная
                                </Link>
                                {order.estimateIds[1] && (
                                  <Link
                                    href={`/admin/estimates?open=${order.estimateIds[1]}`}
                                    className="inline-flex items-center gap-1 text-blue-700 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded text-sm font-medium"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Исходная
                                  </Link>
                                )}
                              </>
                            ) : (
                              order.isMultiEstimate && order.estimateIds.length === 1 && order.estimateIds[0]?.startsWith('multi-') ? (
                                <Link
                                  href={`/admin/orders/${order.id}`}
                                  className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Мульти-смета
                                </Link>
                              ) : (
                                order.estimateIds.map((estimateId: string, idx: number) => (
                                  <Link
                                    key={estimateId}
                                    href={`/admin/estimates?open=${estimateId}`}
                                    className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    {order.estimateIds && order.estimateIds.length > 1 ? `Смета ${idx + 1}` : 'Смета'}
                                  </Link>
                                ))
                              )
                            )}
                          </div>
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

            <div className="md:hidden space-y-3 p-3">
              {data?.orders?.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="block bg-gray-50 rounded-lg p-3 border hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">#{order.id.slice(0, 8)}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-sm text-gray-700 mb-1">{order.clientName}</div>
                  <div className="text-xs text-gray-500 mb-2">{order.phone}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {order.calculatedCost === 0 && !order.estimateId
                        ? '0 ₽'
                        : formatCurrency(order.calculatedCost)
                      }
                    </span>
                  </div>
                  {order.estimateIds && order.estimateIds.length > 0 && (
                    <div className="mt-2 pt-2 border-t flex flex-col gap-1">
                      {order.hasAdminEstimate && order.estimateIds[0] ? (
                        <>
                          <div className="flex items-center gap-1 text-orange-700 bg-orange-100 px-2 py-1 rounded text-xs font-medium">
                            <ExternalLink className="w-3 h-3" />
                            Скорректированная
                          </div>
                          {order.estimateIds[1] && (
                            <div className="flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-1 rounded text-xs font-medium">
                              <ExternalLink className="w-3 h-3" />
                              Исходная
                            </div>
                          )}
                        </>
                      ) : (
                        order.isMultiEstimate && order.estimateIds.length === 1 && order.estimateIds[0]?.startsWith('multi-') ? (
                          <div className="flex items-center gap-1 text-blue-600 text-xs">
                            <ExternalLink className="w-3 h-3" />
                            Мульти-смета
                          </div>
                        ) : (
                          order.estimateIds.map((estimateId: string, idx: number) => (
                            <div key={estimateId} className="flex items-center gap-1 text-blue-600 text-xs">
                              <ExternalLink className="w-3 h-3" />
                              {order.estimateIds && order.estimateIds.length > 1 ? `Смета ${idx + 1}` : 'Смета доступна'}
                            </div>
                          ))
                        )
                      )}
                    </div>
                  )}
                </Link>
              ))}
              {data?.orders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Заявки не найдены
                </div>
              )}
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-t">
                <div className="text-xs md:text-sm text-gray-600">
                  <span className="hidden md:inline">
                    Показано {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, data.total)} из {data.total}
                  </span>
                  <span className="md:hidden">
                    {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, data.total)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs md:text-sm">
                    {page}/{data.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modalOpen && selectedOrder && (
        <StatusChangeModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          orderId={selectedOrder.id}
          currentStatus={selectedOrder.status}
          newStatus={selectedNewStatus}
          onSuccess={handleStatusUpdateSuccess}
        />
      )}
    </div>
  );
}

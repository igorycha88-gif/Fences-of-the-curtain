'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  ChevronDown,
  RefreshCw,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ClientInfo } from './ClientInfo';
import { OrderStatusSection } from './OrderStatusSection';
import { FenceParameters } from './FenceParameters';
import { EstimateSection } from './EstimateSection';
import { TechnicalInfo } from './TechnicalInfo';
import { StatusChangeModal } from './StatusChangeModal';
import { STATUS_LABELS, VALID_STATUS_TRANSITIONS } from '@/lib/validators/order';

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800 border-blue-200',
  ESTIMATE_APPROVAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  MEASUREMENT: 'bg-purple-100 text-purple-800 border-purple-200',
  PRODUCTION: 'bg-orange-100 text-orange-800 border-orange-200',
  INSTALLATION: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

interface OrderDetailPageProps {
  orderId: string;
}

export function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    console.log('[OrderDetailPage] orderId:', orderId);
    fetchOrderFull();
  }, [orderId]);

  const fetchOrderFull = async () => {
    console.log('[OrderDetailPage] Fetching order full data for:', orderId);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/full`);
      console.log('[OrderDetailPage] Response status:', res.status);
      if (!res.ok) {
        if (res.status === 404) {
          console.log('[OrderDetailPage] Order not found, redirecting to /admin/orders');
          router.push('/admin/orders');
          return;
        }
        const errorData = await res.json().catch(() => ({}));
        console.log('[OrderDetailPage] Error response:', errorData);
        throw new Error(errorData.message || 'Ошибка загрузки данных');
      }
      const result = await res.json();
      console.log('[OrderDetailPage] Data loaded successfully');
      setData(result);
    } catch (err: any) {
      console.error('[OrderDetailPage] Error:', err);
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusSelect = (status: string) => {
    if (status === data?.order?.status) return;
    setSelectedStatus(status);
    setIsModalOpen(true);
  };

  const handleStatusUpdateSuccess = () => {
    fetchOrderFull();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchOrderFull}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
        >
          Повторить
        </button>
      </div>
    );
  }

  if (!data || !data.order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Заявка не найдена</p>
        <Link href="/admin/orders" className="text-primary hover:underline mt-4 inline-block">
          Вернуться к списку
        </Link>
      </div>
    );
  }

  const { order, estimate, showPurchasePrices } = data;
  const availableTransitions = VALID_STATUS_TRANSITIONS[order.status] || [];
  const isAdmin = showPurchasePrices;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/orders"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Заявка #{order.id.slice(0, 8)}</h1>
            {availableTransitions.length > 0 ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-1 outline-none focus:ring-2 focus:ring-primary/50 ${
                      STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {STATUS_LABELS[order.status]}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="bg-white border rounded-lg shadow-lg min-w-[180px] p-1 z-50 animate-in fade-in-0 zoom-in-95"
                    sideOffset={4}
                    collisionPadding={8}
                    side="bottom"
                    align="start"
                  >
                    {availableTransitions.map((status) => (
                      <DropdownMenu.Item
                        key={status}
                        onClick={() => handleStatusSelect(status)}
                        className={`px-3 py-2 text-sm rounded-md cursor-pointer outline-none select-none focus:bg-gray-50 ${
                          STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {STATUS_LABELS[status]}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <span
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                  STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {STATUS_LABELS[order.status]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Создана: {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span>Обновлена: {new Date(order.updatedAt).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Стоимость</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(order.calculatedCost)}</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Статус обновлен
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ClientInfo
            clientName={order.clientName}
            phone={order.phone}
            email={order.email}
            message={order.message}
          />

          <OrderStatusSection
            status={order.status}
            statusLabel={order.statusLabel}
            measurementAddress={order.measurementAddress}
            measurementDate={order.measurementDate}
            cancellationReason={order.cancellationReason}
            completionDate={order.completionDate}
            assignedUser={order.assignedUser}
            statusHistory={order.statusHistory}
            isAdmin={isAdmin}
          />
        </div>

        <div className="space-y-6">
          {estimate ? (
            <>
              <FenceParameters
                fenceType={estimate.fenceType}
                length={estimate.length}
                height={estimate.height}
                lagRows={estimate.lagRows}
                coating={estimate.coating}
                coatingLabel={estimate.coatingLabel}
                hasGate={estimate.hasGate}
                gateType={estimate.gateType}
                gateTypeLabel={estimate.gateTypeLabel}
                gateLength={estimate.gateLength}
                gateNomenclatureName={estimate.gateNomenclatureName}
                hasWicket={estimate.hasWicket}
                wicketWidth={estimate.wicketWidth}
                wicketNomenclatureName={estimate.wicketNomenclatureName}
                city={estimate.city}
              />

              <EstimateSection
                estimateId={estimate.id}
                items={estimate.items}
                materialsTotal={estimate.materialsTotal}
                installationTotal={estimate.installationTotal}
                grandTotal={estimate.grandTotal}
              />
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-md border p-6">
              <p className="text-gray-500 text-center">Расчет не найден</p>
            </div>
          )}

          {showPurchasePrices && estimate && (
            <TechnicalInfo
              estimateId={estimate.id}
              userId={estimate.userId}
              user={estimate.user}
              sessionId={estimate.sessionId}
              ipAddress={estimate.ipAddress}
              userAgent={estimate.userAgent}
            />
          )}
        </div>
      </div>

      {isModalOpen && (
        <StatusChangeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          orderId={order.id}
          currentStatus={order.status}
          newStatus={selectedStatus}
          onSuccess={handleStatusUpdateSuccess}
        />
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  ChevronDown,
  RefreshCw,
  Calendar,
  CheckCircle,
  Pencil,
  FileText,
  FilePenLine,
  ArrowLeftRight,
  User,
  Clock,
  Download,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ClientInfo } from './ClientInfo';
import { OrderStatusSection } from './OrderStatusSection';
import { FenceParameters } from './FenceParameters';
import { EstimateSection, DiffInfo } from './EstimateSection';
import { MultiEstimateSection } from './MultiEstimateSection';
import { EstimateEditor } from './EstimateEditor';
import { EstimateComparisonView } from './EstimateComparisonView';

import { EstimateEditHistory } from './EstimateEditHistory';
import { TechnicalInfo } from './TechnicalInfo';
import { StatusChangeModal } from './StatusChangeModal';
import { STATUS_LABELS, VALID_STATUS_TRANSITIONS } from '@/lib/validators/order';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800 border-blue-200',
  ESTIMATE_APPROVAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  MEASUREMENT: 'bg-purple-100 text-purple-800 border-purple-200',
  PRODUCTION: 'bg-orange-100 text-orange-800 border-orange-200',
  INSTALLATION: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

interface EstimateItem {
  category: string;
  nomenclatureId: string | null;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

interface OrderDetailPageProps {
  orderId: string;
}

function computeDiff(
  sourceItems: EstimateItem[],
  adminItems: EstimateItem[],
  manualOverrides: Record<string, { auto: number; manual: number }> | null
): DiffInfo {
  const sourceMap = new Map(
    sourceItems.filter((i) => i.nomenclatureId).map((i) => [i.nomenclatureId!, i])
  );
  const adminMap = new Map(
    adminItems.filter((i) => i.nomenclatureId).map((i) => [i.nomenclatureId!, i])
  );

  const added = new Set<string>();
  const deleted = new Set<string>();
  const modifiedQty = new Map<string, { auto: number; manual: number }>();

  for (const [id] of adminMap) {
    if (!sourceMap.has(id)) {
      added.add(id);
    }
  }

  for (const [id, sourceItem] of sourceMap) {
    if (!adminMap.has(id)) {
      deleted.add(id);
    } else {
      const adminItem = adminMap.get(id)!;
      if (sourceItem.quantity !== adminItem.quantity) {
        modifiedQty.set(id, { auto: sourceItem.quantity, manual: adminItem.quantity });
      }
    }
  }

  if (manualOverrides) {
    for (const [id, override] of Object.entries(manualOverrides)) {
      if (!modifiedQty.has(id) && override.auto !== override.manual) {
        modifiedQty.set(id, { auto: override.auto, manual: override.manual });
      }
    }
  }

  return { added, deleted, modifiedQty };
}

export function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isEstimateEditorOpen, setIsEstimateEditorOpen] = useState(false);
  const [editingEstimateId, setEditingEstimateId] = useState<string | null>(null);
  const [activeEstimateTab, setActiveEstimateTab] = useState<'client' | 'admin'>('client');
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const adminDiff: DiffInfo | undefined = useMemo(() => {
    if (!data?.adminEstimate || !data?.estimate) return undefined;
    return computeDiff(
      data.estimate.items || [],
      data.adminEstimate.items || [],
      data.adminEstimate.manualQuantityOverrides
    );
  }, [data]);

  const effectiveGrandTotalCalc = useMemo(() => {
    if (!data) return 0;
    const { order, estimate, adminEstimate, multiEstimates } = data;
    const isMulti = !!multiEstimates && multiEstimates.length > 0;
    if (isMulti && multiEstimates) {
      return multiEstimates.reduce((sum: number, est: any) => {
        const effective = est.adminCorrection ?? est;
        return sum + effective.grandTotal;
      }, 0);
    }
    if (adminEstimate) return adminEstimate.grandTotal;
    if (estimate) return estimate.grandTotal;
    return order?.calculatedCost ?? 0;
  }, [data]);

  useEffect(() => {
    fetchOrderFull();
  }, [orderId]);

  const fetchOrderFull = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/full`, {
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/admin/orders');
          return;
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Ошибка загрузки данных');
      }
      const result = await res.json();
      setData(result);
      if (result.adminEstimate) {
        setActiveEstimateTab('admin');
      }
    } catch (err: any) {
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

  const handleEditEstimate = (estimateId: string) => {
    setEditingEstimateId(estimateId);
    setIsEstimateEditorOpen(true);
  };

  const handleEditAdminEstimate = () => {
    const { adminEstimate, estimate } = data;
    if (adminEstimate) {
      setEditingEstimateId(adminEstimate.id);
    } else {
      setEditingEstimateId(estimate.id);
    }
    setIsEstimateEditorOpen(true);
  };

  const handleEditMultiAdminEstimate = (sourceEstimateId: string, correctionId: string) => {
    setEditingEstimateId(correctionId);
    setIsEstimateEditorOpen(true);
  };

  const handleEstimateEditorClose = () => {
    setIsEstimateEditorOpen(false);
    setEditingEstimateId(null);
  };

  const handleEstimateEditorSave = () => {
    setIsEstimateEditorOpen(false);
    setEditingEstimateId(null);
    fetchOrderFull();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleExportWord = async () => {
    setIsExportingWord(true);
    try {
      const res = await fetch(
        `/api/admin/orders/${orderId}/export-estimate-word`,
        { credentials: 'include' }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Ошибка экспорта');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `смета_заявка_${orderId.slice(0, 8)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Ошибка экспорта в Word');
    } finally {
      setIsExportingWord(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleDeleteOrder = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Ошибка удаления');
      }
      toast.success('Заявка удалена');
      router.push('/admin/orders');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
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

  const { order, estimate, adminEstimate, multiEstimates, showPurchasePrices } = data;
  const isIndividualRequest = order.serviceType === 'INDIVIDUAL_CALCULATION' || (!estimate && !multiEstimates);
  const isMultiEstimate = !!multiEstimates && multiEstimates.length > 0;
  const availableTransitions = VALID_STATUS_TRANSITIONS[order.status] || [];
  const isAdmin = showPurchasePrices;
  const hasAdminEstimate = !!adminEstimate;

  const effectiveGrandTotal = effectiveGrandTotalCalc;

  const editingEstimate = editingEstimateId
    ? (isMultiEstimate && multiEstimates
        ? (() => {
            const found = multiEstimates.find((e: any) => e.id === editingEstimateId);
            if (found) return found;
            for (const est of multiEstimates) {
              if ((est as any).adminCorrection?.id === editingEstimateId) {
                return (est as any).adminCorrection;
              }
            }
            return null;
          })()
        : editingEstimateId === adminEstimate?.id
          ? adminEstimate
          : estimate)
    : null;

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            href="/admin/orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-3xl font-bold text-gray-900 truncate">Заявка #{order.id.slice(0, 8)}</h1>
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
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 mt-1">
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
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto md:ml-auto">
          <div className="text-left md:text-right flex-1">
            <p className="text-xs md:text-sm text-gray-500">Стоимость</p>
            {isIndividualRequest ? (
              <p className="text-base md:text-lg font-bold text-amber-600">Индивидуальный расчёт</p>
            ) : (
              <p className="text-lg md:text-2xl font-bold text-primary">{formatCurrency(effectiveGrandTotal)}</p>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden md:inline">Удалить</span>
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="mb-4 md:mb-6 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Статус обновлен
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
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
          {!isIndividualRequest && (
            <div className="flex justify-end">
              <button
                onClick={handleExportWord}
                disabled={isExportingWord}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:opacity-90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExportingWord ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Сохранить в Word
              </button>
            </div>
          )}
          {isMultiEstimate ? (
            <>
              {hasAdminEstimate && adminEstimate && (
                <div className="bg-white rounded-xl shadow-md border border-orange-200">
                  <div className="p-4 border-b bg-gradient-to-r from-orange-50 to-amber-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FilePenLine className="w-5 h-5 text-orange-600" />
                          <span className="font-bold text-orange-900 text-base">Расчет отредактирован администратором</span>
                        </div>
                        {adminEstimate.editedAt && (
                          <div className="text-sm text-gray-700 space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-orange-600" />
                              <span className="font-medium">
                                {new Date(adminEstimate.editedAt).toLocaleDateString('ru-RU', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            {adminEstimate.editedByAdmin && (
                              <div className="flex items-center gap-1.5">
                                <User className="w-4 h-4 text-orange-600" />
                                <span className="font-medium">{adminEstimate.editedByAdmin.name || adminEstimate.editedByAdmin.email || 'Неизвестный'}</span>
                              </div>
                            )}
                            {adminEstimate.editComment && (
                              <div className="mt-2 p-3 bg-white rounded-lg border border-orange-300 text-gray-800">
                                <span className="text-xs text-gray-500 block mb-1 font-medium">Комментарий:</span>
                                <p className="text-sm leading-relaxed">{adminEstimate.editComment}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Link
                        href={`/admin/estimates?open=${adminEstimate.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-md transition-all duration-200 border border-orange-300 shadow-sm hover:shadow"
                        title="Посмотреть скорректированный расчет"
                      >
                        <FilePenLine className="w-3.5 h-3.5" />
                        Скорректированный расчет
                      </Link>
                    </div>
                  </div>

                  <div className="p-6">
                    <EstimateSection
                      estimateId={adminEstimate.id}
                      items={adminEstimate.items}
                      materialsTotal={adminEstimate.materialsTotal}
                      installationTotal={adminEstimate.installationTotal}
                      grandTotal={adminEstimate.grandTotal}
                      diff={adminDiff}
                    />
                  </div>

                  <div className="px-6 pb-4 flex items-center gap-2">
                    <button
                      onClick={handleEditAdminEstimate}
                      className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                      title="Редактировать корректировку"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              <MultiEstimateSection
                estimates={multiEstimates}
                showPurchasePrices={showPurchasePrices}
                onEditEstimate={handleEditEstimate}
                onEditAdminEstimate={handleEditMultiAdminEstimate}
              />
            </>
          ) : estimate ? (
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

              {hasAdminEstimate && (
                <div className="bg-white rounded-xl shadow-md border border-orange-200">
                  <div className="p-4 border-b bg-gradient-to-r from-orange-50 to-amber-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FilePenLine className="w-5 h-5 text-orange-600" />
                          <span className="font-bold text-orange-900 text-base">Расчет отредактирован администратором</span>
                        </div>
                        {adminEstimate.editedAt && (
                          <div className="text-sm text-gray-700 space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-orange-600" />
                              <span className="font-medium">
                                {new Date(adminEstimate.editedAt).toLocaleDateString('ru-RU', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            {adminEstimate.editedByAdmin && (
                              <div className="flex items-center gap-1.5">
                                <User className="w-4 h-4 text-orange-600" />
                                <span className="font-medium">{adminEstimate.editedByAdmin.name || adminEstimate.editedByAdmin.email || 'Неизвестный'}</span>
                              </div>
                            )}
                            {adminEstimate.editComment && (
                              <div className="mt-2 p-3 bg-white rounded-lg border border-orange-300 text-gray-800">
                                <span className="text-xs text-gray-500 block mb-1 font-medium">Комментарий:</span>
                                <p className="text-sm leading-relaxed">{adminEstimate.editComment}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Link
                        href={`/admin/estimates?open=${estimate.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-all duration-200 border border-blue-300 shadow-sm hover:shadow"
                        title="Посмотреть исходный расчет от клиента"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Исходный расчет (от клиента)
                      </Link>
                      <Link
                        href={`/admin/estimates?open=${adminEstimate.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-md transition-all duration-200 border border-orange-300 shadow-sm hover:shadow"
                        title="Посмотреть скорректированный расчет"
                      >
                        <FilePenLine className="w-3.5 h-3.5" />
                        Скорректированный расчет
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center border-b">
                    <button
                      onClick={() => setActiveEstimateTab('admin')}
                      className={cn(
                        'flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 text-center',
                        activeEstimateTab === 'admin'
                          ? 'text-orange-700 border-b-2 border-orange-500 bg-gradient-to-b from-orange-50 to-orange-100'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <FilePenLine className="w-4 h-4" />
                        Смета с изменениями
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveEstimateTab('client')}
                      className={cn(
                        'flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 text-center',
                        activeEstimateTab === 'client'
                          ? 'text-blue-700 border-b-2 border-blue-500 bg-gradient-to-b from-blue-50 to-blue-100'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4" />
                        Исходная смета
                      </span>
                    </button>
                    <button
                      onClick={() => setIsComparisonOpen(true)}
                      className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-purple-700 hover:bg-purple-50 transition-all duration-200 border-l"
                      title="Сравнить сметы"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6">
                    {activeEstimateTab === 'admin' ? (
                      <EstimateSection
                        estimateId={adminEstimate.id}
                        items={adminEstimate.items}
                        materialsTotal={adminEstimate.materialsTotal}
                        installationTotal={adminEstimate.installationTotal}
                        grandTotal={adminEstimate.grandTotal}
                        diff={adminDiff}
                      />
                    ) : (
                      <EstimateSection
                        estimateId={estimate.id}
                        items={estimate.items}
                        materialsTotal={estimate.materialsTotal}
                        installationTotal={estimate.installationTotal}
                        grandTotal={estimate.grandTotal}
                      />
                    )}
                  </div>

                  <div className="px-6 pb-4 flex items-center gap-2">
                    <button
                      onClick={handleEditAdminEstimate}
                      className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                      title="Редактировать корректировку"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {!hasAdminEstimate && (
                <EstimateSection
                  estimateId={estimate.id}
                  items={estimate.items}
                  materialsTotal={estimate.materialsTotal}
                  installationTotal={estimate.installationTotal}
                  grandTotal={estimate.grandTotal}
                  onEdit={() => handleEditEstimate(estimate.id)}
                />
              )}
            </>
          ) : (
            <>
              {isIndividualRequest && order.parameters && (
                <div className="bg-white rounded-xl shadow-md border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                      Индивидуальный расчёт
                    </span>
                  </div>
                  {(order.parameters as any).canopyTypeLabel ? (
                    <>
                      <h2 className="text-lg font-bold mb-4">Параметры навеса</h2>
                      <div className="space-y-3">
                        {(order.parameters as any).canopyTypeLabel && (
                          <div>
                            <label className="text-sm text-gray-500 block">Тип навеса</label>
                            <p className="font-medium">{(order.parameters as any).canopyTypeLabel}</p>
                          </div>
                        )}
                        {(order.parameters as any).purposeLabel && (
                          <div>
                            <label className="text-sm text-gray-500 block">Назначение</label>
                            <p className="font-medium">{(order.parameters as any).purposeLabel}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-4">
                          {(order.parameters as any).length && (
                            <div>
                              <label className="text-sm text-gray-500 block">Длина</label>
                              <p className="font-medium">{(order.parameters as any).length} м</p>
                            </div>
                          )}
                          {(order.parameters as any).width && (
                            <div>
                              <label className="text-sm text-gray-500 block">Ширина</label>
                              <p className="font-medium">{(order.parameters as any).width} м</p>
                            </div>
                          )}
                          {(order.parameters as any).height && (
                            <div>
                              <label className="text-sm text-gray-500 block">Высота</label>
                              <p className="font-medium">{(order.parameters as any).height} м</p>
                            </div>
                          )}
                        </div>
                        {(order.parameters as any).installationTypeLabel && (
                          <div>
                            <label className="text-sm text-gray-500 block">Установка</label>
                            <p className="font-medium">{(order.parameters as any).installationTypeLabel}</p>
                          </div>
                        )}
                        {(order.parameters as any).roofMaterialLabel && (
                          <div>
                            <label className="text-sm text-gray-500 block">Кровля</label>
                            <p className="font-medium">{(order.parameters as any).roofMaterialLabel}</p>
                          </div>
                        )}
                        {(order.parameters as any).hasWaterSystem && (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <label className="text-sm text-blue-600 block">Водосточная система</label>
                            <p className="font-medium text-blue-800">Да</p>
                          </div>
                        )}
                        {(order.parameters as any).message && (
                          <div>
                            <label className="text-sm text-gray-500 block">Комментарий клиента</label>
                            <p className="font-medium text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {(order.parameters as any).message}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-bold mb-4">Параметры забора</h2>
                      <div className="space-y-3">
                        {(order.parameters as any).fenceTypeName && (
                          <div>
                            <label className="text-sm text-gray-500 block">Тип забора</label>
                            <p className="font-medium">{(order.parameters as any).fenceTypeName}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          {(order.parameters as any).length && (
                            <div>
                              <label className="text-sm text-gray-500 block">Длина</label>
                              <p className="font-medium">{(order.parameters as any).length} м</p>
                            </div>
                          )}
                          {(order.parameters as any).height && (
                            <div>
                              <label className="text-sm text-gray-500 block">Высота</label>
                              <p className="font-medium">{(order.parameters as any).height} м</p>
                            </div>
                          )}
                        </div>
                        {(order.parameters as any).coating && (
                          <div>
                            <label className="text-sm text-gray-500 block">Покрытие</label>
                            <p className="font-medium">{(order.parameters as any).coating}</p>
                          </div>
                        )}
                        {(order.parameters as any).hasGate && (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <label className="text-sm text-blue-600 block">Ворота</label>
                            <p className="font-medium text-blue-800">
                              {(order.parameters as any).gateType === 'SLIDING' ? 'Откатные' : 'Распашные'}
                              {(order.parameters as any).gateWidth && `, ${(order.parameters as any).gateWidth} м`}
                            </p>
                          </div>
                        )}
                        {(order.parameters as any).hasWicket && (
                          <div className="p-3 bg-green-50 rounded-lg">
                            <label className="text-sm text-green-600 block">Калитка</label>
                            <p className="font-medium text-green-800">
                              {(order.parameters as any).wicketWidth && `${(order.parameters as any).wicketWidth} м`}
                            </p>
                          </div>
                        )}
                        {(order.parameters as any).message && (
                          <div>
                            <label className="text-sm text-gray-500 block">Комментарий клиента</label>
                            <p className="font-medium text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {(order.parameters as any).message}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
              {!isIndividualRequest && (
                <div className="bg-white rounded-xl shadow-md border p-6">
                  <p className="text-gray-500 text-center">Расчет не найден</p>
                </div>
              )}
            </>
          )}

          {showPurchasePrices && estimate && (
            <EstimateEditHistory orderId={order.id} />
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

      {isEstimateEditorOpen && editingEstimate && (
        <EstimateEditor
          isOpen={isEstimateEditorOpen}
          onClose={handleEstimateEditorClose}
          orderId={order.id}
          estimateId={(() => {
            if (isMultiEstimate && multiEstimates) {
              const sourceEst = multiEstimates.find((e: any) =>
                (e as any).adminCorrection?.id === editingEstimateId
              );
              if (sourceEst) return sourceEst.id;
            }
            return editingEstimateId === adminEstimate?.id ? estimate?.id || editingEstimateId : editingEstimateId;
          })()}
          initialParams={{
            length: editingEstimate.length,
            height: editingEstimate.height,
            coating: editingEstimate.coating,
            lagRows: editingEstimate.lagRows,
            hasGate: editingEstimate.hasGate,
            gateType: editingEstimate.gateType,
            gateWidth: editingEstimate.gateLength ? editingEstimate.gateLength / 1000 : null,
            hasWicket: editingEstimate.hasWicket,
            wicketWidth: editingEstimate.wicketWidth ? editingEstimate.wicketWidth / 1000 : null,
          }}
          initialItems={editingEstimate.items}
          initialMaterialsTotal={editingEstimate.materialsTotal}
          initialInstallationTotal={editingEstimate.installationTotal}
          initialGrandTotal={editingEstimate.grandTotal}
          onSaveSuccess={handleEstimateEditorSave}
          existingAdminEstimateId={(() => {
            if (isMultiEstimate && multiEstimates) {
              const sourceEst = multiEstimates.find((e: any) =>
                (e as any).adminCorrection?.id === editingEstimateId
              );
              if (sourceEst) return editingEstimateId;
              const estWithCorrection = multiEstimates.find((e: any) =>
                e.id === editingEstimateId && (e as any).adminCorrection
              );
              if (estWithCorrection) return (estWithCorrection as any).adminCorrection.id;
              return null;
            }
            return adminEstimate?.id;
          })()}
        />
      )}

      {isComparisonOpen && hasAdminEstimate && estimate && (
        <EstimateComparisonView
          sourceEstimate={{
            length: estimate.length,
            height: estimate.height,
            lagRows: estimate.lagRows,
            coating: estimate.coating,
            coatingLabel: estimate.coatingLabel,
            hasGate: estimate.hasGate,
            gateType: estimate.gateType,
            gateTypeLabel: estimate.gateTypeLabel,
            gateLength: estimate.gateLength,
            hasWicket: estimate.hasWicket,
            wicketWidth: estimate.wicketWidth,
            items: estimate.items,
            materialsTotal: estimate.materialsTotal,
            installationTotal: estimate.installationTotal,
            grandTotal: estimate.grandTotal,
          }}
          adminEstimate={{
            length: adminEstimate.length,
            height: adminEstimate.height,
            lagRows: adminEstimate.lagRows,
            coating: adminEstimate.coating,
            coatingLabel: adminEstimate.coatingLabel,
            hasGate: adminEstimate.hasGate,
            gateType: adminEstimate.gateType,
            gateTypeLabel: adminEstimate.gateTypeLabel,
            gateLength: adminEstimate.gateLength,
            hasWicket: adminEstimate.hasWicket,
            wicketWidth: adminEstimate.wicketWidth,
            items: adminEstimate.items,
            materialsTotal: adminEstimate.materialsTotal,
            installationTotal: adminEstimate.installationTotal,
            grandTotal: adminEstimate.grandTotal,
            editedAt: adminEstimate.editedAt,
            editComment: adminEstimate.editComment,
            user: adminEstimate.user,
          }}
          onClose={() => setIsComparisonOpen(false)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Удалить заявку?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Заявка <span className="font-medium">#{order.id.slice(0, 8)}</span> от {order.clientName} будет помечена как удалённая и перестанет отображаться в списке.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium"
                disabled={deleting}
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteOrder}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

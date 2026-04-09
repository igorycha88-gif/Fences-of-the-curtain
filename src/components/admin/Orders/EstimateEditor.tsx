'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Plus, Trash2, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { NomenclaturePickerModal, SelectedNomenclatureItem } from './NomenclaturePickerModal';
import { formatCurrency, cn } from '@/lib/utils';
import type { RecalculateParams } from '@/lib/validators/adminEstimate';

interface EstimateItem {
  category: string;
  nomenclatureId: string | null;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

type EditorParams = {
  length: number;
  height: number;
  coating: string;
  lagRows: number;
  hasGate: boolean;
  gateType?: string | null;
  gateWidth?: number | null;
  hasWicket: boolean;
  wicketWidth?: number | null;
  picketProfileType?: string | null;
  picketCoating?: string | null;
  picketStep?: number | null;
  picketMountingType?: string | null;
};

interface EstimateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  estimateId: string;
  initialParams: EditorParams;
  initialItems: EstimateItem[];
  initialMaterialsTotal: number;
  initialInstallationTotal: number;
  initialGrandTotal: number;
  onSaveSuccess: () => void;
  existingAdminEstimateId?: string | null;
}

const COATING_LABELS: Record<string, string> = {
  GALVANIZED: 'Оцинковка',
  POLYMER_SINGLE: 'Полимер (односторонний)',
  POLYMER_DOUBLE: 'Полимер (двусторонний)',
};

const GATE_TYPE_LABELS: Record<string, string> = {
  SWING: 'Распашные',
  SLIDING: 'Откатные',
};

const PICKET_MOUNTING_LABELS: Record<string, string> = {
  SINGLE: 'Односторонний',
  CHESS: 'Шахматный',
};

function computeParamDiff(
  current: EditorParams,
  original: EditorParams
): RecalculateParams | undefined {
  const diff: RecalculateParams = {};
  if (current.length !== original.length) diff.length = current.length;
  if (current.height !== original.height) diff.height = current.height;
  if (current.coating !== original.coating)
    diff.coating = current.coating as RecalculateParams['coating'];
  if (current.lagRows !== original.lagRows)
    diff.lagRows = current.lagRows as 2 | 3;
  if (current.hasGate !== original.hasGate) diff.hasGate = current.hasGate;
  if (current.gateType !== original.gateType)
    diff.gateType = current.gateType as RecalculateParams['gateType'];
  if (current.gateWidth !== original.gateWidth)
    diff.gateWidth = current.gateWidth || undefined;
  if (current.hasWicket !== original.hasWicket)
    diff.hasWicket = current.hasWicket;
  if (current.wicketWidth !== original.wicketWidth)
    diff.wicketWidth = current.wicketWidth || undefined;
  if (current.picketProfileType !== original.picketProfileType)
    diff.picketProfileType = current.picketProfileType || undefined;
  if (current.picketCoating !== original.picketCoating)
    diff.picketCoating = current.picketCoating || undefined;
  if (current.picketStep !== original.picketStep)
    diff.picketStep = current.picketStep || undefined;
  if (current.picketMountingType !== original.picketMountingType)
    diff.picketMountingType =
      current.picketMountingType as RecalculateParams['picketMountingType'];
  return Object.keys(diff).length > 0 ? diff : undefined;
}

function hasAnyParamChange(current: EditorParams, original: EditorParams): boolean {
  return (
    current.length !== original.length ||
    current.height !== original.height ||
    current.coating !== original.coating ||
    current.lagRows !== original.lagRows ||
    current.hasGate !== original.hasGate ||
    current.gateType !== original.gateType ||
    current.gateWidth !== original.gateWidth ||
    current.hasWicket !== original.hasWicket ||
    current.wicketWidth !== original.wicketWidth ||
    current.picketProfileType !== original.picketProfileType ||
    current.picketCoating !== original.picketCoating ||
    current.picketStep !== original.picketStep ||
    current.picketMountingType !== original.picketMountingType
  );
}

export function EstimateEditor({
  isOpen,
  onClose,
  orderId,
  estimateId,
  initialParams,
  initialItems,
  initialMaterialsTotal,
  initialInstallationTotal,
  initialGrandTotal,
  onSaveSuccess,
  existingAdminEstimateId,
}: EstimateEditorProps) {
  const [params, setParams] = useState<EditorParams>(initialParams);
  const [items, setItems] = useState<EstimateItem[]>(initialItems);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [quantityOverrides, setQuantityOverrides] = useState<Map<string, number>>(
    new Map()
  );
  const [addedItems, setAddedItems] = useState<EstimateItem[]>([]);
  const [editComment, setEditComment] = useState('');
  const [isNomenclaturePickerOpen, setIsNomenclaturePickerOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRecalcParams, setLastRecalcParams] = useState<EditorParams | null>(
    null
  );

  const prevIsOpenRef = useRef(false);
  const initialParamsRef = useRef(initialParams);
  const initialItemsRef = useRef(initialItems);
  const recalcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentParamsRef = useRef<EditorParams>(initialParams);
  initialParamsRef.current = initialParams;
  initialItemsRef.current = initialItems;

  const needsRecalculation = lastRecalcParams
    ? hasAnyParamChange(params, lastRecalcParams)
    : hasAnyParamChange(params, initialParams);

  const hasPicketParams =
    initialParams.picketProfileType != null ||
    initialParams.picketCoating != null ||
    initialParams.picketStep != null ||
    initialParams.picketMountingType != null;

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setParams(initialParamsRef.current);
      setItems(initialItemsRef.current);
      setDeletedIds(new Set());
      setQuantityOverrides(new Map());
      setAddedItems([]);
      setEditComment('');
      setError(null);
      setLastRecalcParams(null);
      currentParamsRef.current = initialParamsRef.current;
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  const handleRecalculate = useCallback(async (paramsToUse: EditorParams) => {
    setIsRecalculating(true);
    setError(null);

    try {
      const recalculateParams = computeParamDiff(paramsToUse, initialParamsRef.current);

      const response = await fetch(
        `/api/admin/orders/${orderId}/recalculate-estimate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            estimateId,
            parameters: recalculateParams,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Ошибка пересчета');
      }

      const data = await response.json();
      setItems(data.items || []);
      setDeletedIds(new Set());
      setQuantityOverrides(new Map());
      setAddedItems([]);
      setLastRecalcParams({ ...paramsToUse });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка пересчета';
      console.error('Recalculate error:', err);
      setError(message);
    } finally {
      setIsRecalculating(false);
    }
  }, [orderId, estimateId, initialParams]);

  useEffect(() => {
    if (!isOpen) return;

    const baseParams = lastRecalcParams || initialParamsRef.current;
    const hasChange = hasAnyParamChange(params, baseParams);

    if (recalcTimerRef.current) {
      clearTimeout(recalcTimerRef.current);
      recalcTimerRef.current = null;
    }

    if (hasChange && !isRecalculating) {
      recalcTimerRef.current = setTimeout(() => {
        handleRecalculate(currentParamsRef.current);
      }, 800);
    }

    return () => {
      if (recalcTimerRef.current) {
        clearTimeout(recalcTimerRef.current);
      }
    };
  }, [params, isOpen, isRecalculating, lastRecalcParams, handleRecalculate]);

  const handleParamChange = (
    key: keyof EditorParams,
    value: string | number | boolean | null
  ) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      currentParamsRef.current = next;
      return next;
    });
  };

  const handleDeleteItem = (nomenclatureId: string) => {
    setDeletedIds((prev) => new Set(prev).add(nomenclatureId));
  };

  const handleRestoreItem = (nomenclatureId: string) => {
    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.delete(nomenclatureId);
      return next;
    });
  };

  const handleQuantityChange = (nomenclatureId: string, newQuantity: number) => {
    setQuantityOverrides((prev) => {
      const next = new Map(prev);
      if (newQuantity > 0) {
        next.set(nomenclatureId, newQuantity);
      } else {
        next.delete(nomenclatureId);
      }
      return next;
    });
  };

  const handleAddNomenclature = (selected: SelectedNomenclatureItem) => {
    const newItem: EstimateItem = {
      category: selected.category,
      nomenclatureId: selected.nomenclatureId,
      nomenclatureName: selected.nomenclatureName,
      quantity: selected.quantity,
      unit: selected.unit,
      pricePerUnit: selected.pricePerUnit,
      totalPrice: selected.quantity * selected.pricePerUnit,
    };

    setAddedItems((prev) => [...prev, newItem]);
    setIsNomenclaturePickerOpen(false);
  };

  const handleRemoveAddedItem = (index: number) => {
    setAddedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const paramDiff = computeParamDiff(params, initialParams);

      const payload = {
        sourceEstimateId: estimateId,
        editComment: editComment || undefined,
        parameters: paramDiff,
        items: {
          deleted: Array.from(deletedIds),
          added: addedItems.map((item) => ({
            category: item.category,
            nomenclatureId: item.nomenclatureId!,
            nomenclatureName: item.nomenclatureName,
            quantity: item.quantity,
            unit: item.unit,
            pricePerUnit: item.pricePerUnit,
          })),
          quantityOverrides: Array.from(
            quantityOverrides.entries()
          ).map(([nomenclatureId, quantity]) => ({
            nomenclatureId,
            quantity,
          })),
        },
      };

      const url = `/api/admin/orders/${orderId}/admin-estimate`;

      const response = await fetch(url, {
        method: existingAdminEstimateId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Ошибка сохранения');
      }

      onSaveSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка сохранения';
      console.error('Save error:', err);
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const totals = useMemo(() => {
    let materials = 0;
    let installation = 0;

    items.forEach((item) => {
      if (deletedIds.has(item.nomenclatureId || '')) return;

      const quantity =
        quantityOverrides.get(item.nomenclatureId || '') ?? item.quantity;
      const total = quantity * item.pricePerUnit;

      if (item.category === 'installation') {
        installation += total;
      } else {
        materials += total;
      }
    });

    addedItems.forEach((item) => {
      if (item.category === 'installation') {
        installation += item.totalPrice;
      } else {
        materials += item.totalPrice;
      }
    });

    return {
      materialsTotal: materials,
      installationTotal: installation,
      grandTotal: materials + installation,
    };
  }, [items, addedItems, deletedIds, quantityOverrides]);
  const allItems = useMemo(() => [...items, ...addedItems], [items, addedItems]);
  const materialItems = useMemo(() => allItems.filter((item) => item.category !== 'installation'), [allItems]);
  const workItems = useMemo(() => allItems.filter((item) => item.category === 'installation'), [allItems]);
  const excludeIds = useMemo(
    () => items.map((i) => i.nomenclatureId).filter(Boolean) as string[],
    [items]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center px-4 pt-8 pb-8">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        <div className="relative w-full max-w-6xl transform rounded-lg bg-white shadow-xl transition-all">
          <div className="flex items-center justify-between border-b p-4 sticky top-0 bg-white z-10">
            <h3 className="text-lg font-semibold">
              Редактирование расчета
              {isRecalculating && (
                <span className="ml-3 inline-flex items-center gap-1 text-sm font-normal text-blue-600">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Пересчет...
                </span>
              )}
            </h3>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm flex-1">{error}</span>
                {needsRecalculation && (
                  <button
                    onClick={() => handleRecalculate(currentParamsRef.current)}
                    className="text-xs font-medium text-red-700 hover:text-red-800 underline"
                  >
                    Повторить
                  </button>
                )}
              </div>
            )}

            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">
                Параметры забора
                {needsRecalculation && !isRecalculating && (
                  <span className="ml-2 text-xs font-normal text-blue-500">
                    (параметры изменены — пересчет автоматически)
                  </span>
                )}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Длина (м)
                  </label>
                  <input
                    type="number"
                    value={params.length}
                    onChange={(e) =>
                      handleParamChange(
                        'length',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Высота (м)
                  </label>
                  <input
                    type="number"
                    value={params.height}
                    onChange={(e) =>
                      handleParamChange(
                        'height',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1.5"
                    max="3.5"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Покрытие
                  </label>
                  <select
                    value={params.coating}
                    onChange={(e) =>
                      handleParamChange('coating', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(COATING_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Лаги (рядов)
                  </label>
                  <select
                    value={params.lagRows}
                    onChange={(e) =>
                      handleParamChange('lagRows', parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={2}>2 ряда</option>
                    <option value={3}>3 ряда</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={params.hasGate}
                    onChange={(e) =>
                      handleParamChange('hasGate', e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">Ворота</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={params.hasWicket}
                    onChange={(e) =>
                      handleParamChange('hasWicket', e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">Калитка</span>
                </label>
              </div>

              {params.hasGate && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Тип ворот
                    </label>
                    <select
                      value={params.gateType || 'SWING'}
                      onChange={(e) =>
                        handleParamChange('gateType', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(GATE_TYPE_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Ширина ворот (м)
                    </label>
                    <input
                      type="number"
                      value={params.gateWidth || ''}
                      onChange={(e) =>
                        handleParamChange(
                          'gateWidth',
                          parseFloat(e.target.value) || null
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="2"
                      max="6"
                      step="0.5"
                    />
                  </div>
                </div>
              )}

              {params.hasWicket && (
                <div className="mt-4">
                  <label className="block text-sm text-gray-600 mb-1">
                    Ширина калитки (м)
                  </label>
                  <input
                    type="number"
                    value={params.wicketWidth || ''}
                    onChange={(e) =>
                      handleParamChange(
                        'wicketWidth',
                        parseFloat(e.target.value) || null
                      )
                    }
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0.8"
                    max="1.5"
                    step="0.1"
                  />
                </div>
              )}

              {hasPicketParams && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <h5 className="text-sm font-medium text-purple-800 mb-2">
                    Параметры евроштакетника
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Профиль
                      </label>
                      <input
                        type="text"
                        value={params.picketProfileType || ''}
                        onChange={(e) =>
                          handleParamChange(
                            'picketProfileType',
                            e.target.value || null
                          )
                        }
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="—"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Покрытие
                      </label>
                      <input
                        type="text"
                        value={params.picketCoating || ''}
                        onChange={(e) =>
                          handleParamChange(
                            'picketCoating',
                            e.target.value || null
                          )
                        }
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="—"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Шаг (см)
                      </label>
                      <input
                        type="number"
                        value={params.picketStep ?? ''}
                        onChange={(e) =>
                          handleParamChange(
                            'picketStep',
                            parseFloat(e.target.value) || null
                          )
                        }
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Монтаж
                      </label>
                      <select
                        value={params.picketMountingType || ''}
                        onChange={(e) =>
                          handleParamChange(
                            'picketMountingType',
                            e.target.value || null
                          )
                        }
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">—</option>
                        {Object.entries(PICKET_MOUNTING_LABELS).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-700">Номенклатуры</h4>
                <button
                  onClick={() => setIsNomenclaturePickerOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Добавить номенклатуру
                </button>
              </div>

              {materialItems.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-600 mb-2">
                    Материалы
                  </h5>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left p-2 font-medium text-gray-600 w-12">
                            №
                          </th>
                          <th className="text-left p-2 font-medium text-gray-600">
                            Наименование
                          </th>
                          <th className="text-left p-2 font-medium text-gray-600 w-16">
                            Ед.
                          </th>
                          <th className="text-right p-2 font-medium text-gray-600 w-20">
                            Авто
                          </th>
                          <th className="text-right p-2 font-medium text-gray-600 w-28">
                            Кол-во
                          </th>
                          <th className="text-right p-2 font-medium text-gray-600 w-28">
                            Цена
                          </th>
                          <th className="text-right p-2 font-medium text-gray-600 w-32">
                            Сумма
                          </th>
                          <th className="w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {materialItems.map((item, index) => (
                          <ItemRow
                            key={item.nomenclatureId || `mat-${index}`}
                            item={item}
                            index={index}
                            isDeleted={deletedIds.has(
                              item.nomenclatureId || ''
                            )}
                            isAdded={addedItems.some(
                              (a) => a.nomenclatureId === item.nomenclatureId
                            )}
                            currentQuantity={
                              quantityOverrides.get(
                                item.nomenclatureId || ''
                              ) ?? item.quantity
                            }
                            isOverridden={quantityOverrides.has(
                              item.nomenclatureId || ''
                            )}
                            onQuantityChange={(qty) =>
                              handleQuantityChange(
                                item.nomenclatureId || '',
                                qty
                              )
                            }
                            onDelete={() => {
                              if (
                                addedItems.some(
                                  (a) =>
                                    a.nomenclatureId === item.nomenclatureId
                                )
                              ) {
                                handleRemoveAddedItem(
                                  addedItems.findIndex(
                                    (a) =>
                                      a.nomenclatureId === item.nomenclatureId
                                  )
                                );
                              } else {
                                handleDeleteItem(item.nomenclatureId || '');
                              }
                            }}
                            onRestore={() =>
                              handleRestoreItem(item.nomenclatureId || '')
                            }
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {workItems.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-600 mb-2">
                    Работы
                  </h5>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left p-2 font-medium text-gray-600 w-12">
                            №
                          </th>
                          <th className="text-left p-2 font-medium text-gray-600">
                            Наименование
                          </th>
                          <th className="text-left p-2 font-medium text-gray-600 w-16">
                            Ед.
                          </th>
                          <th className="text-right p-2 font-medium text-gray-600 w-20">
                            Авто
                          </th>
                          <th className="text-right p-2 font-medium text-gray-600 w-28">
                            Кол-во
                          </th>
                          <th className="text-right p-2 font-medium text-gray-600 w-28">
                            Цена
                          </th>
                          <th className="text-right p-2 font-medium text-gray-600 w-32">
                            Сумма
                          </th>
                          <th className="w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {workItems.map((item, index) => (
                          <ItemRow
                            key={item.nomenclatureId || `work-${index}`}
                            item={item}
                            index={index}
                            isDeleted={deletedIds.has(
                              item.nomenclatureId || ''
                            )}
                            isAdded={addedItems.some(
                              (a) => a.nomenclatureId === item.nomenclatureId
                            )}
                            currentQuantity={
                              quantityOverrides.get(
                                item.nomenclatureId || ''
                              ) ?? item.quantity
                            }
                            isOverridden={quantityOverrides.has(
                              item.nomenclatureId || ''
                            )}
                            onQuantityChange={(qty) =>
                              handleQuantityChange(
                                item.nomenclatureId || '',
                                qty
                              )
                            }
                            onDelete={() => {
                              if (
                                addedItems.some(
                                  (a) =>
                                    a.nomenclatureId === item.nomenclatureId
                                )
                              ) {
                                handleRemoveAddedItem(
                                  addedItems.findIndex(
                                    (a) =>
                                      a.nomenclatureId === item.nomenclatureId
                                  )
                                );
                              } else {
                                handleDeleteItem(item.nomenclatureId || '');
                              }
                            }}
                            onRestore={() =>
                              handleRestoreItem(item.nomenclatureId || '')
                            }
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Итого материалы:</span>
                    <span className="font-semibold">
                      {formatCurrency(totals.materialsTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Итого работы:</span>
                    <span className="font-semibold">
                      {formatCurrency(totals.installationTotal)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="font-bold text-base">ИТОГО:</span>
                    <span className="font-bold text-lg text-blue-600">
                      {formatCurrency(totals.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Комментарий к корректировке
              </label>
              <textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Укажите причину корректировки..."
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1">
                {editComment.length}/500 символов
              </p>
            </div>
          </div>

          <div className="border-t p-4 flex justify-end gap-3 sticky bottom-0 bg-white">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Сохранить расчет'
              )}
            </button>
          </div>
        </div>
      </div>

      <NomenclaturePickerModal
        isOpen={isNomenclaturePickerOpen}
        onClose={() => setIsNomenclaturePickerOpen(false)}
        onSelect={handleAddNomenclature}
        excludeIds={excludeIds}
      />
    </div>
  );
}

interface ItemRowProps {
  item: EstimateItem;
  index: number;
  isDeleted: boolean;
  isAdded: boolean;
  currentQuantity: number;
  isOverridden: boolean;
  onQuantityChange: (qty: number) => void;
  onDelete: () => void;
  onRestore: () => void;
}

function ItemRow({
  item,
  index,
  isDeleted,
  isAdded,
  currentQuantity,
  isOverridden,
  onQuantityChange,
  onDelete,
  onRestore,
}: ItemRowProps) {
  return (
    <tr
      className={cn(
        'border-b transition-colors',
        isDeleted && 'bg-red-50 opacity-50',
        isAdded && 'bg-green-50'
      )}
    >
      <td className="p-2 text-gray-500">{index + 1}</td>
      <td className={cn('p-2', isDeleted && 'line-through')}>
        {item.nomenclatureName}
        {isAdded && (
          <span className="ml-2 text-xs text-green-600 font-medium">
            [добавлено]
          </span>
        )}
      </td>
      <td className="p-2 text-gray-500">{item.unit}</td>
      <td className="p-2 text-right text-gray-400 text-xs">
        {!isAdded ? item.quantity : '\u2014'}
      </td>
      <td className="p-2 text-right">
        {!isDeleted && (
          <div className="flex items-center justify-end gap-1">
            <input
              type="number"
              value={currentQuantity}
              onChange={(e) =>
                onQuantityChange(parseFloat(e.target.value) || 0)
              }
              className={cn(
                'w-20 text-right px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                isOverridden
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-gray-300'
              )}
              min="0"
              step="0.1"
            />
            {isOverridden && (
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {'авто: '}
                {item.quantity}
              </span>
            )}
          </div>
        )}
      </td>
      <td className="p-2 text-right">
        {formatCurrency(item.pricePerUnit)}
      </td>
      <td className="p-2 text-right font-medium">
        {formatCurrency(currentQuantity * item.pricePerUnit)}
      </td>
      <td className="p-2 text-center">
        {isDeleted ? (
          <button
            onClick={onRestore}
            className="text-green-600 hover:text-green-700 p-1"
            title="Восстановить"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 p-1"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </td>
    </tr>
  );
}

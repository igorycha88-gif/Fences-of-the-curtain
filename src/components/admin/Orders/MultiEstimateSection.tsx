'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ExternalLink, Pencil, FileText, FilePenLine, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EstimateItem {
  category: string;
  nomenclatureId: string | null;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  purchasePricePerUnit?: number | null;
  purchaseTotal?: number | null;
  marginRub?: number | null;
  marginPercent?: number | null;
}

interface FenceType {
  id: string;
  name: string;
}

interface AdminCorrection {
  id: string;
  fenceType: FenceType;
  length: number;
  height: number;
  lagRows: number;
  coating: string;
  coatingLabel: string;
  hasGate: boolean;
  gateType: string | null;
  gateTypeLabel: string | null;
  gateLength: number | null;
  gateNomenclatureName: string | null;
  hasWicket: boolean;
  wicketWidth: number | null;
  wicketNomenclatureName: string | null;
  items: EstimateItem[];
  materialsTotal: number;
  installationTotal: number;
  grandTotal: number;
  purchaseTotal?: number | null;
  materialMarginRub?: number | null;
  materialMarginPercent?: number | null;
  editedAt: string | null;
  editComment: string | null;
  editedByAdmin: { id: string; name: string; role: string } | null;
  manualQuantityOverrides: Record<string, { auto: number; manual: number }> | null;
}

interface Estimate {
  id: string;
  fenceType: FenceType;
  length: number;
  height: number;
  lagRows: number;
  coating: string;
  coatingLabel: string;
  hasGate: boolean;
  gateType: string | null;
  gateTypeLabel: string | null;
  gateLength: number | null;
  gateNomenclatureName: string | null;
  hasWicket: boolean;
  wicketWidth: number | null;
  wicketNomenclatureName: string | null;
  city: string | null;
  items: EstimateItem[];
  materialsTotal: number;
  installationTotal: number;
  grandTotal: number;
  purchaseTotal?: number | null;
  materialMarginRub?: number | null;
  materialMarginPercent?: number | null;
  adminCorrection: AdminCorrection | null;
}

interface MultiEstimateSectionProps {
  estimates: Estimate[];
  showPurchasePrices?: boolean;
  onEditEstimate?: (estimateId: string) => void;
  onEditAdminEstimate?: (estimateId: string, correctionId: string) => void;
}

const formatPrice = (price: number) => {
  return price.toLocaleString('ru-RU') + ' ₽';
};

interface DiffInfo {
  added: Set<string>;
  deleted: Set<string>;
  modifiedQty: Map<string, { auto: number; manual: number }>;
}

function computeDiff(sourceItems: EstimateItem[], adminItems: EstimateItem[], manualOverrides: Record<string, { auto: number; manual: number }> | null): DiffInfo {
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

function DiffBadge({ type, autoQty, manualQty }: { type: 'added' | 'deleted' | 'modified'; autoQty?: number; manualQty?: number }) {
  if (type === 'added') {
    return (
      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-200 text-green-800 whitespace-nowrap">
        Добавлено
      </span>
    );
  }
  if (type === 'deleted') {
    return (
      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-200 text-red-800 whitespace-nowrap">
        Удалено
      </span>
    );
  }
  return (
    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-200 text-amber-800 whitespace-nowrap">
      Кол-во: {autoQty} &rarr; {manualQty}
    </span>
  );
}

function DiffItemRow({ item, index, diff }: { item: EstimateItem; index: number; diff?: DiffInfo }) {
  const id = item.nomenclatureId || '';
  const isAdded = diff?.added.has(id);
  const isDeleted = diff?.deleted.has(id);
  const qtyChange = diff?.modifiedQty.get(id);

  if (!isAdded && !isDeleted && !qtyChange) {
    return (
      <tr className="border-b hover:bg-gray-50">
        <td className="p-2 text-gray-500">{index + 1}</td>
        <td className="p-2">{item.nomenclatureName}</td>
        <td className="p-2 text-gray-500 whitespace-nowrap">{item.unit}</td>
        <td className="p-2 text-right whitespace-nowrap">{item.quantity}</td>
        <td className="p-2 text-right whitespace-nowrap">{formatPrice(item.pricePerUnit)}</td>
        <td className="p-2 text-right font-medium whitespace-nowrap">{formatPrice(item.totalPrice)}</td>
      </tr>
    );
  }

  return (
    <tr
      className={cn(
        'border-b',
        isAdded && 'bg-green-50',
        isDeleted && 'bg-red-50',
        qtyChange && 'bg-amber-50'
      )}
    >
      <td className="p-2 text-gray-500">{index + 1}</td>
      <td className={cn('p-2', isDeleted && 'line-through text-red-500')}>
        {item.nomenclatureName}
        {isAdded && <DiffBadge type="added" />}
        {isDeleted && <DiffBadge type="deleted" />}
        {qtyChange && <DiffBadge type="modified" autoQty={qtyChange.auto} manualQty={qtyChange.manual} />}
      </td>
      <td className="p-2 text-gray-500 whitespace-nowrap">{item.unit}</td>
      <td className="p-2 text-right whitespace-nowrap">
        {qtyChange ? (
          <span>
            <span className="line-through text-gray-400">{qtyChange.auto}</span>
            {' → '}
            <span className="font-medium text-amber-700">{qtyChange.manual}</span>
          </span>
        ) : (
          item.quantity
        )}
      </td>
      <td className="p-2 text-right whitespace-nowrap">{formatPrice(item.pricePerUnit)}</td>
      <td className="p-2 text-right font-medium whitespace-nowrap">{formatPrice(item.totalPrice)}</td>
    </tr>
  );
}

function EstimateCard({
  estimate,
  index,
  onEditEstimate,
  onEditAdminEstimate,
}: {
  estimate: Estimate;
  index: number;
  onEditEstimate?: (estimateId: string) => void;
  onEditAdminEstimate?: (estimateId: string, correctionId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'original' | 'corrected'>(estimate.adminCorrection ? 'corrected' : 'original');
  const isFallback = estimate.id.startsWith('fallback-');
  const correction = estimate.adminCorrection;

  const diff = useMemo(() => {
    if (!correction) return undefined;
    return computeDiff(
      estimate.items,
      correction.items,
      correction.manualQuantityOverrides
    );
  }, [estimate.items, correction]);

  const showingCorrection = correction && activeTab === 'corrected';

  const displayItems = showingCorrection ? correction.items : estimate.items;
  const displayMaterialsTotal = showingCorrection ? correction.materialsTotal : estimate.materialsTotal;
  const displayInstallationTotal = showingCorrection ? correction.installationTotal : estimate.installationTotal;
  const displayGrandTotal = showingCorrection ? correction.grandTotal : estimate.grandTotal;

  const materialItems = displayItems.filter((item) => item.category !== 'installation');
  const workItems = displayItems.filter((item) => item.category === 'installation');

  const sortedMaterialItems = diff && showingCorrection
    ? [
        ...materialItems.filter((item) => {
          const id = item.nomenclatureId || '';
          return !diff.deleted.has(id);
        }),
        ...materialItems.filter((item) => {
          const id = item.nomenclatureId || '';
          return diff.deleted.has(id);
        }),
      ]
    : materialItems;

  const sortedWorkItems = diff && showingCorrection
    ? [
        ...workItems.filter((item) => {
          const id = item.nomenclatureId || '';
          return !diff.deleted.has(id);
        }),
        ...workItems.filter((item) => {
          const id = item.nomenclatureId || '';
          return diff.deleted.has(id);
        }),
      ]
    : workItems;

  return (
    <div className={cn(
      'bg-white rounded-xl shadow-md border p-6',
      correction && 'border-orange-200'
    )}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">
            {index + 1}. {estimate.fenceType.name}
            {correction && activeTab === 'corrected' && (
              <span className="ml-2 text-sm font-medium text-orange-600">(скорректировано)</span>
            )}
          </h3>
          <p className="text-sm text-gray-500">
            {estimate.length} м × {estimate.height} м, {estimate.lagRows} лаг{estimate.lagRows === 1 ? 'а' : estimate.lagRows < 5 ? 'и' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isFallback && (
            <Link
              href={`/admin/estimates?open=${showingCorrection ? correction!.id : estimate.id}`}
              className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              {showingCorrection ? 'Скорректированная' : 'Открыть смету'}
            </Link>
          )}
          {onEditEstimate && !isFallback && !showingCorrection && (
            <button
              onClick={() => onEditEstimate(estimate.id)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Редактировать"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {onEditAdminEstimate && correction && showingCorrection && (
            <button
              onClick={() => onEditAdminEstimate(estimate.id, correction.id)}
              className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors"
              title="Редактировать корректировку"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {isFallback && (
            <span className="text-xs text-gray-400 italic">Детали сметы недоступны</span>
          )}
        </div>
      </div>

      {correction && (
        <div className="flex items-center border-b mb-0 -mt-2 mb-4">
          <button
            onClick={() => setActiveTab('corrected')}
            className={cn(
              'flex-1 px-4 py-2.5 text-sm font-semibold transition-all duration-200 text-center',
              activeTab === 'corrected'
                ? 'text-orange-700 border-b-2 border-orange-500 bg-gradient-to-b from-orange-50 to-orange-100'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <FilePenLine className="w-4 h-4" />
              Скорректированная смета
            </span>
          </button>
          <button
            onClick={() => setActiveTab('original')}
            className={cn(
              'flex-1 px-4 py-2.5 text-sm font-semibold transition-all duration-200 text-center',
              activeTab === 'original'
                ? 'text-blue-700 border-b-2 border-blue-500 bg-gradient-to-b from-blue-50 to-blue-100'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              Исходная смета
            </span>
          </button>
        </div>
      )}

      {correction && showingCorrection && correction.editedAt && (
        <div className="text-sm text-gray-700 space-y-1.5 mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="font-medium">
              {new Date(correction.editedAt).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          {correction.editedByAdmin && (
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-orange-600" />
              <span className="font-medium">{correction.editedByAdmin.name || 'Неизвестный'}</span>
            </div>
          )}
          {correction.editComment && (
            <div className="mt-2 p-2 bg-white rounded border border-orange-200 text-gray-800">
              <span className="text-xs text-gray-500 block mb-1 font-medium">Комментарий:</span>
              <p className="text-sm leading-relaxed">{correction.editComment}</p>
            </div>
          )}
        </div>
      )}

      {correction && !showingCorrection && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/estimates?open=${estimate.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-all border border-blue-300"
            >
              <FileText className="w-3.5 h-3.5" />
              Исходный расчет
            </Link>
            <Link
              href={`/admin/estimates?open=${correction.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-md transition-all border border-orange-300"
            >
              <FilePenLine className="w-3.5 h-3.5" />
              Скорректированный расчет
            </Link>
          </div>
        </div>
      )}

      {sortedMaterialItems.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2 pb-2 border-b text-sm">Материалы</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-2 font-medium text-gray-600">№</th>
                  <th className="text-left p-2 font-medium text-gray-600">Наименование</th>
                  <th className="text-left p-2 font-medium text-gray-600 whitespace-nowrap">Ед.</th>
                  <th className="text-right p-2 font-medium text-gray-600 whitespace-nowrap">Кол-во</th>
                  <th className="text-right p-2 font-medium text-gray-600 whitespace-nowrap">Цена</th>
                  <th className="text-right p-2 font-medium text-gray-600 whitespace-nowrap">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {sortedMaterialItems.map((item, itemIndex) => (
                  <DiffItemRow
                    key={item.nomenclatureId || `m-${itemIndex}`}
                    item={item}
                    index={itemIndex}
                    diff={showingCorrection ? diff : undefined}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={5} className="p-2 text-right">Итого материалы:</td>
                  <td className="p-2 text-right whitespace-nowrap">{formatPrice(displayMaterialsTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {sortedWorkItems.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2 pb-2 border-b text-sm">Работы</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-2 font-medium text-gray-600">№</th>
                  <th className="text-left p-2 font-medium text-gray-600">Наименование</th>
                  <th className="text-left p-2 font-medium text-gray-600 whitespace-nowrap">Ед.</th>
                  <th className="text-right p-2 font-medium text-gray-600 whitespace-nowrap">Кол-во</th>
                  <th className="text-right p-2 font-medium text-gray-600 whitespace-nowrap">Цена</th>
                  <th className="text-right p-2 font-medium text-gray-600 whitespace-nowrap">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {sortedWorkItems.map((item, itemIndex) => (
                  <DiffItemRow
                    key={item.nomenclatureId || `w-${itemIndex}`}
                    item={item}
                    index={itemIndex}
                    diff={showingCorrection ? diff : undefined}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={5} className="p-2 text-right">Итого работы:</td>
                  <td className="p-2 text-right whitespace-nowrap">{formatPrice(displayInstallationTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {isFallback && materialItems.length === 0 && workItems.length === 0 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Детализация сметы недоступна. Показаны только параметры забора и общая сумма.
          </p>
        </div>
      )}

      <div className="border-t pt-3">
        <div className="flex justify-between items-center font-bold">
          <span>ИТОГО ({estimate.fenceType.name}):</span>
          <span className="text-primary">{formatPrice(displayGrandTotal)}</span>
        </div>
      </div>
    </div>
  );
}

export function MultiEstimateSection({
  estimates,
  showPurchasePrices = false,
  onEditEstimate,
  onEditAdminEstimate,
}: MultiEstimateSectionProps) {
  const { totalMaterials, totalInstallation, grandTotal, totalMaterialMarginRub, totalMaterialMarginPercent } = useMemo(() => {
    if (!estimates || estimates.length === 0) {
      return { totalMaterials: 0, totalInstallation: 0, grandTotal: 0, totalMaterialMarginRub: 0, totalMaterialMarginPercent: 0 };
    }
    let materials = 0;
    let installation = 0;
    let total = 0;
    let marginRub = 0;

    for (const est of estimates) {
      const effective = est.adminCorrection ?? est;
      materials += effective.materialsTotal;
      installation += effective.installationTotal;
      total += effective.grandTotal;
      if (showPurchasePrices && effective.materialMarginRub != null) {
        marginRub += effective.materialMarginRub;
      }
    }

    const marginPercent = total > 0 ? (marginRub / total) * 100 : 0;

    return {
      totalMaterials: materials,
      totalInstallation: installation,
      grandTotal: total,
      totalMaterialMarginRub: marginRub,
      totalMaterialMarginPercent: marginPercent,
    };
  }, [estimates, showPurchasePrices]);

  if (!estimates || estimates.length === 0) return null;

  return (
    <div className="space-y-6">
      {estimates.map((estimate, index) => (
        <EstimateCard
          key={estimate.id}
          estimate={estimate}
          index={index}
          onEditEstimate={onEditEstimate}
          onEditAdminEstimate={onEditAdminEstimate}
        />
      ))}

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md border-2 border-blue-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Итого по всем типам заборов</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-sm text-gray-500 mb-1">Материалы</p>
            <p className="text-lg font-bold text-gray-900">{formatPrice(totalMaterials)}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-sm text-gray-500 mb-1">Работы</p>
            <p className="text-lg font-bold text-gray-900">{formatPrice(totalInstallation)}</p>
          </div>
          {showPurchasePrices && (
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-gray-500 mb-1">Маржа (материалы)</p>
              <p className="text-lg font-bold text-green-600">
                {formatPrice(totalMaterialMarginRub)}
                {totalMaterialMarginPercent > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    ({totalMaterialMarginPercent.toFixed(1)}%)
                  </span>
                )}
              </p>
            </div>
          )}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-600 mb-1">Общая сумма</p>
            <p className="text-xl font-bold text-primary">{formatPrice(grandTotal)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ExternalLink, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EstimateItem {
  category: string;
  nomenclatureId: string | null;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

export interface DiffInfo {
  added: Set<string>;
  deleted: Set<string>;
  modifiedQty: Map<string, { auto: number; manual: number }>;
}

interface EstimateSectionProps {
  estimateId: string;
  items: EstimateItem[];
  materialsTotal: number;
  installationTotal: number;
  grandTotal: number;
  diff?: DiffInfo;
  onEdit?: () => void;
}

const formatPrice = (price: number) => {
  return price.toLocaleString('ru-RU') + ' ₽';
};

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

function ItemRow({
  item,
  index,
  diff,
}: {
  item: EstimateItem;
  index: number;
  diff?: DiffInfo;
}) {
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
      <td className={cn('p-2', isDeleted && 'line-through text-gray-500')}>
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

export function EstimateSection({
  estimateId,
  items,
  materialsTotal,
  installationTotal,
  grandTotal,
  diff,
  onEdit,
}: EstimateSectionProps) {
  const materialItems = items.filter((item) => item.category !== 'installation');
  const workItems = items.filter((item) => item.category === 'installation');

  const sortedMaterialItems = diff
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

  const sortedWorkItems = diff
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
    <div className="bg-white rounded-xl shadow-md border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="text-xl">💰</span>
          Смета
        </h2>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/estimates?open=${estimateId}`}
            className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Открыть в Расчетах
          </Link>
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Редактировать"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {sortedMaterialItems.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Материалы</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                {sortedMaterialItems.map((item, index) => (
                  <ItemRow key={item.nomenclatureId || `m-${index}`} item={item} index={index} diff={diff} />
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={5} className="p-2 text-right">Итого материалы:</td>
                  <td className="p-2 text-right whitespace-nowrap">{formatPrice(materialsTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {sortedWorkItems.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Работы</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                {sortedWorkItems.map((item, index) => (
                  <ItemRow key={item.nomenclatureId || `w-${index}`} item={item} index={index} diff={diff} />
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={5} className="p-2 text-right">Итого работы:</td>
                  <td className="p-2 text-right whitespace-nowrap">{formatPrice(installationTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <div className="border-t-2 border-gray-300 pt-4">
        <div className="flex justify-between items-center text-lg font-bold">
          <span>ИТОГО:</span>
          <span className="text-primary">{formatPrice(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}

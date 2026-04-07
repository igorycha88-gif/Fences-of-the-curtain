'use client';

import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparisonItem {
  nomenclatureId: string | null;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

interface ComparisonEstimate {
  length: number;
  height: number;
  lagRows: number;
  coating: string;
  coatingLabel: string;
  hasGate: boolean;
  gateType: string | null;
  gateTypeLabel: string | null;
  gateLength: number | null;
  hasWicket: boolean;
  wicketWidth: number | null;
  items: ComparisonItem[];
  materialsTotal: number;
  installationTotal: number;
  grandTotal: number;
}

interface EstimateComparisonViewProps {
  sourceEstimate: ComparisonEstimate;
  adminEstimate: ComparisonEstimate & {
    editedAt?: string | null;
    editComment?: string | null;
    user?: { name: string } | null;
  };
  onClose: () => void;
}

function diffItems(source: ComparisonItem[], admin: ComparisonItem[]) {
  const sourceMap = new Map(
    source.filter((i) => i.nomenclatureId).map((i) => [i.nomenclatureId!, i])
  );
  const adminMap = new Map(
    admin.filter((i) => i.nomenclatureId).map((i) => [i.nomenclatureId!, i])
  );

  const modified: Array<{ source: ComparisonItem; admin: ComparisonItem }> = [];
  const unchanged: Array<{ source: ComparisonItem; admin: ComparisonItem }> = [];
  const added: ComparisonItem[] = [];
  const deleted: ComparisonItem[] = [];

  for (const [id, item] of adminMap) {
    const sourceItem = sourceMap.get(id);
    if (!sourceItem) {
      added.push(item);
    } else if (
      sourceItem.quantity !== item.quantity ||
      sourceItem.pricePerUnit !== item.pricePerUnit
    ) {
      modified.push({ source: sourceItem, admin: item });
    } else {
      unchanged.push({ source: sourceItem, admin: item });
    }
  }

  for (const [id, item] of sourceMap) {
    if (!adminMap.has(id)) {
      deleted.push(item);
    }
  }

  return { unchanged, modified, added, deleted };
}

const formatPrice = (price: number) =>
  price.toLocaleString('ru-RU') + ' \u20BD';

export function EstimateComparisonView({
  sourceEstimate,
  adminEstimate,
  onClose,
}: EstimateComparisonViewProps) {
  const diff = diffItems(sourceEstimate.items, adminEstimate.items);

  const paramChanges: Array<{ label: string; old: string; new: string }> = [];
  if (sourceEstimate.length !== adminEstimate.length)
    paramChanges.push({
      label: '\u0414\u043B\u0438\u043D\u0430',
      old: `${sourceEstimate.length} \u043C`,
      new: `${adminEstimate.length} \u043C`,
    });
  if (sourceEstimate.height !== adminEstimate.height)
    paramChanges.push({
      label: '\u0412\u044B\u0441\u043E\u0442\u0430',
      old: `${sourceEstimate.height} \u043C`,
      new: `${adminEstimate.height} \u043C`,
    });
  if (sourceEstimate.lagRows !== adminEstimate.lagRows)
    paramChanges.push({
      label: '\u041B\u0430\u0433\u0438',
      old: `${sourceEstimate.lagRows} \u0440\u044F\u0434\u043E\u0432`,
      new: `${adminEstimate.lagRows} \u0440\u044F\u0434\u043E\u0432`,
    });
  if (sourceEstimate.coating !== adminEstimate.coating)
    paramChanges.push({
      label: '\u041F\u043E\u043A\u0440\u044B\u0442\u0438\u0435',
      old: sourceEstimate.coatingLabel,
      new: adminEstimate.coatingLabel,
    });

  const totalDiff = adminEstimate.grandTotal - sourceEstimate.grandTotal;
  const totalDiffPercent =
    sourceEstimate.grandTotal > 0
      ? ((totalDiff / sourceEstimate.grandTotal) * 100).toFixed(1)
      : '0';

  const hasChanges =
    paramChanges.length > 0 ||
    diff.added.length > 0 ||
    diff.deleted.length > 0 ||
    diff.modified.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center px-4 pt-8 pb-8">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        <div className="relative w-full max-w-5xl bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between border-b p-4 sticky top-0 bg-white z-10 rounded-t-lg">
            <h3 className="text-lg font-semibold">
              \u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 \u0440\u0430\u0441\u0447\u0435\u0442\u043E\u0432
            </h3>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800">
                  \u0420\u0430\u0441\u0447\u0435\u0442 \u043A\u043B\u0438\u0435\u043D\u0442\u0430
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm font-medium text-orange-800">
                  \u041A\u043E\u0440\u0440\u0435\u043A\u0442\u0438\u0440\u043E\u0432\u043A\u0430 \u0430\u0434\u043C\u0438\u043D\u0430
                </p>
                {adminEstimate.editedAt && (
                  <p className="text-xs text-orange-600 mt-1">
                    {adminEstimate.user?.name &&
                      `${adminEstimate.user.name} \u00B7 `}
                    {new Date(adminEstimate.editedAt).toLocaleDateString(
                      'ru-RU',
                      {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      }
                    )}
                  </p>
                )}
              </div>
            </div>

            {!hasChanges && (
              <div className="text-center py-8 text-gray-500">
                <p>
                  \u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439
                  \u043D\u0435 \u043E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D\u043E
                </p>
              </div>
            )}

            {paramChanges.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">
                  \u0418\u0437\u043C\u0435\u043D\u0435\u043D\u043D\u044B\u0435
                  \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left p-2 font-medium text-gray-600">
                          \u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440
                        </th>
                        <th className="text-left p-2 font-medium text-gray-600">
                          \u041A\u043B\u0438\u0435\u043D\u0442
                        </th>
                        <th className="text-left p-2 font-medium text-gray-600">
                          \u0410\u0434\u043C\u0438\u043D
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paramChanges.map((change, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2 font-medium">{change.label}</td>
                          <td className="p-2 text-gray-600">{change.old}</td>
                          <td className="p-2 text-orange-700 font-medium">
                            {change.new}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {diff.deleted.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-red-600 mb-2">
                  \u0423\u0434\u0430\u043B\u0435\u043D\u043E (
                  {diff.deleted.length})
                </h5>
                <div className="space-y-1">
                  {diff.deleted.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-sm p-2 bg-red-50 rounded"
                    >
                      <span className="line-through text-gray-500">
                        {item.nomenclatureName}
                      </span>
                      <span className="text-gray-400">
                        &times;{item.quantity} {item.unit}
                      </span>
                      <span className="text-gray-400 ml-auto">
                        {formatPrice(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diff.added.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-green-600 mb-2">
                  \u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043E (
                  {diff.added.length})
                </h5>
                <div className="space-y-1">
                  {diff.added.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-sm p-2 bg-green-50 rounded"
                    >
                      <span className="text-green-800">
                        {item.nomenclatureName}
                      </span>
                      <span className="text-green-600">
                        &times;{item.quantity} {item.unit}
                      </span>
                      <span className="text-green-700 font-medium ml-auto">
                        {formatPrice(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diff.modified.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-amber-600 mb-2">
                  \u0418\u0437\u043C\u0435\u043D\u0435\u043D\u043E (
                  {diff.modified.length})
                </h5>
                <div className="space-y-1">
                  {diff.modified.map(({ source, admin }, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-sm p-2 bg-amber-50 rounded flex-wrap"
                    >
                      <span>{admin.nomenclatureName}</span>
                      <span className="text-gray-400 line-through">
                        &times;{source.quantity}
                      </span>
                      <ArrowRight className="w-3 h-3 text-amber-500 flex-shrink-0" />
                      <span className="text-amber-700 font-medium">
                        &times;{admin.quantity} {admin.unit}
                      </span>
                      <span className="text-amber-600 ml-auto whitespace-nowrap">
                        {formatPrice(source.totalPrice)} &rarr;{' '}
                        {formatPrice(admin.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t-2 pt-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    \u0420\u0430\u0441\u0447\u0435\u0442 \u043A\u043B\u0438\u0435\u043D\u0442\u0430
                  </p>
                  <p className="text-xl font-bold">
                    {formatPrice(sourceEstimate.grandTotal)}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    \u041A\u043E\u0440\u0440\u0435\u043A\u0442\u0438\u0440\u043E\u0432\u043A\u0430
                  </p>
                  <p className="text-xl font-bold">
                    {formatPrice(adminEstimate.grandTotal)}
                  </p>
                  {totalDiff !== 0 && (
                    <p
                      className={cn(
                        'text-sm font-medium',
                        totalDiff > 0 ? 'text-red-600' : 'text-green-600'
                      )}
                    >
                      {totalDiff > 0 ? '+' : ''}
                      {formatPrice(totalDiff)} ({totalDiffPercent}%)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {adminEstimate.editComment && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">
                  \u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439
                  \u0430\u0434\u043C\u0438\u043D\u0430:
                </p>
                <p className="text-sm text-gray-700">
                  {adminEstimate.editComment}
                </p>
              </div>
            )}
          </div>

          <div className="border-t p-4 flex justify-end sticky bottom-0 bg-white rounded-b-lg">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              \u0417\u0430\u043A\u0440\u044B\u0442\u044C
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

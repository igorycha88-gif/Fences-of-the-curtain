'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Download } from 'lucide-react';

interface ExtendedEstimateItem {
  category: string;
  nomenclatureId: string;
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

interface EstimateSummary {
  retailTotal: number;
  purchaseTotal: number;
  marginTotalRub: number;
  marginTotalPercent: number;
  retailMaterialsTotal: number;
  purchaseMaterialsTotal: number;
  materialMarginRub: number;
  materialMarginPercent: number;
  worksTotal: number;
  grandTotal: number;
}

interface EstimateDetail {
  id: string;
  createdAt: string;
  fenceType: { id: string; name: string };
  fenceTypeId: string;
  length: number;
  height: number;
  lagRows: number;
  coating: string;
  hasGate: boolean;
  gateType: string | null;
  gateLength: number | null;
  gateNomenclatureName: string | null;
  gateTotal: number;
  gateInstallationTotal: number;
  hasWicket: boolean;
  wicketWidth: number | null;
  wicketNomenclatureName: string | null;
  wicketTotal: number;
  wicketInstallationTotal: number;
  postsTotal: number;
  lagsTotal: number;
  profnastilTotal: number;
  mountingHardwareTotal: number;
  installationTotal: number;
  materialsTotal: number;
  grandTotal: number;
  items: ExtendedEstimateItem[];
  ipAddress: string | null;
  userAgent: string | null;
  city: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  showPurchasePrices?: boolean;
  summary?: EstimateSummary;
}

const coatingLabels: Record<string, string> = {
  GALVANIZED: 'Оцинкованный',
  POLYMER_SINGLE: 'Односторонний полимер',
  POLYMER_DOUBLE: 'Двусторонний полимер',
};

const categoryLabels: Record<string, string> = {
  posts: 'Столбы',
  lags: 'Лаги',
  profnastil: 'Профнастил',
  picket: 'Евроштакетник',
  gates: 'Ворота',
  wickets: 'Калитки',
  mountingHardware: 'Монтажная фурнитура',
  mounting_hardware: 'Монтажная фурнитура',
  installation: 'Работы',
};

export default function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [estimate, setEstimate] = useState<EstimateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEstimate();
  }, [resolvedParams.id]);

  const fetchEstimate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/estimates/${resolvedParams.id}`);
      if (!res.ok) {
        throw new Error('Смета не найдена');
      }
      const data = await res.json();
      setEstimate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return '—';
    return price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';
  };

  const formatPercent = (percent: number | null | undefined) => {
    if (percent === null || percent === undefined) return '—';
    return percent.toFixed(2) + '%';
  };

  const handleExport = async () => {
    if (!estimate) return;
    
    try {
      const res = await fetch(`/api/admin/estimates/${resolvedParams.id}/export`);
      if (!res.ok) throw new Error('Ошибка экспорта');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estimate_${estimate.id.slice(0, 8)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Смета не найдена'}</p>
        <Link href="/admin/estimates" className="text-primary hover:underline">
          Вернуться к списку
        </Link>
      </div>
    );
  }

  const showPurchasePrices = estimate.showPurchasePrices && estimate.summary;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/estimates"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Смета #{estimate.id.slice(0, 8)}
            </h1>
            <p className="text-gray-500">
              от {new Date(estimate.createdAt).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        {showPurchasePrices && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Экспорт сметы
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md border p-6">
            <h2 className="text-lg font-bold mb-4">Параметры забора</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Тип забора</label>
                <p className="font-medium">{estimate.fenceType?.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Размер</label>
                <p className="font-medium">{estimate.length}м × {estimate.height}м</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Лаги</label>
                <p className="font-medium">{estimate.lagRows} ряда</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Покрытие</label>
                <p className="font-medium">{coatingLabels[estimate.coating] || estimate.coating}</p>
              </div>
            </div>
          </div>

        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md border p-6">
            <h2 className="text-lg font-bold mb-4">Информация</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Город</span>
                <span>{estimate.city || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">IP-адрес</span>
                <span>{estimate.ipAddress || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">User Agent</span>
                <span className="text-xs truncate max-w-[200px]" title={estimate.userAgent || '-'}>
                  {estimate.userAgent || '-'}
                </span>
              </div>
            </div>
          </div>

          {showPurchasePrices && estimate.summary && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md border border-green-200 p-6">
              <h2 className="text-lg font-bold mb-4 text-green-800">Финансовые показатели сметы</h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-green-200">
                  <span className="text-green-700">Розничная стоимость материалов:</span>
                  <span className="font-medium text-green-900">{formatPrice(estimate.summary.retailMaterialsTotal)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-green-200">
                  <span className="text-green-700">Маржа за материал:</span>
                  <span className="font-medium text-green-900">
                    {formatPrice(estimate.summary.materialMarginRub)} ({estimate.summary.materialMarginPercent.toFixed(2)}%)
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-green-200">
                  <span className="text-green-700">Стоимость работ:</span>
                  <span className="font-medium text-green-900">{formatPrice(estimate.summary.worksTotal)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-green-900 bg-green-100 rounded px-2 -mx-2">
                  <span>Общая стоимость сметы:</span>
                  <span>{formatPrice(estimate.summary.grandTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {estimate.user && (
            <div className="bg-white rounded-xl shadow-md border p-6">
              <h2 className="text-lg font-bold mb-4">Пользователь</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Имя</span>
                  <span>{estimate.user.name || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Email</span>
                  <span>{estimate.user.email || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Телефон</span>
                  <span>{estimate.user.phone || '-'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {Array.isArray(estimate.items) && estimate.items.length > 0 && (() => {
        const materialItems = estimate.items.filter(item => item.category !== 'installation');
        const workItems = estimate.items.filter(item => item.category === 'installation');
        const materialsTotal = materialItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const worksTotal = workItems.reduce((sum, item) => sum + item.totalPrice, 0);
        
        return (
          <>
            {materialItems.length > 0 && (
              <div className="mt-6 bg-white rounded-xl shadow-md border p-6">
                <h2 className="text-lg font-bold mb-4">Смета материалов</h2>
                <div className="overflow-x-auto">
                  {showPurchasePrices ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-medium">№</th>
                          <th className="text-left p-3 font-medium">Категория</th>
                          <th className="text-left p-3 font-medium">Наименование</th>
                          <th className="text-left p-3 font-medium">Ед.</th>
                          <th className="text-right p-3 font-medium">Кол-во</th>
                          <th className="text-right p-3 font-medium">Стоимость за ед.</th>
                          <th className="text-right p-3 font-medium">Стоимость итого</th>
                          <th className="text-right p-3 font-medium">Цена закуп.</th>
                          <th className="text-right p-3 font-medium">Сумма закуп.</th>
                          <th className="text-right p-3 font-medium">Маржа (₽)</th>
                          <th className="text-right p-3 font-medium">Маржа (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materialItems.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-gray-500">{index + 1}</td>
                            <td className="p-3">{categoryLabels[item.category] || item.category}</td>
                            <td className="p-3">{item.nomenclatureName}</td>
                            <td className="p-3 text-gray-500">{item.unit}</td>
                            <td className="p-3 text-right">{item.quantity}</td>
                            <td className="p-3 text-right">{formatPrice(item.pricePerUnit)}</td>
                            <td className="p-3 text-right font-medium">{formatPrice(item.totalPrice)}</td>
                            <td className="p-3 text-right">{formatPrice(item.purchasePricePerUnit)}</td>
                            <td className="p-3 text-right">{formatPrice(item.purchaseTotal)}</td>
                            <td className={`p-3 text-right font-medium ${item.marginRub && item.marginRub > 0 ? 'text-green-600' : ''}`}>
                              {formatPrice(item.marginRub)}
                            </td>
                            <td className={`p-3 text-right font-medium ${item.marginPercent && item.marginPercent > 0 ? 'text-green-600' : ''}`}>
                              {formatPercent(item.marginPercent)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {estimate.summary && (
                        <tfoot>
                          <tr className="bg-gray-100 font-bold">
                            <td colSpan={6} className="p-3 text-right">ИТОГО:</td>
                            <td className="p-3 text-right">{formatPrice(materialsTotal)}</td>
                            <td></td>
                            <td className="p-3 text-right">{formatPrice(estimate.summary.purchaseTotal)}</td>
                            <td className="p-3 text-right text-green-600">{formatPrice(estimate.summary.marginTotalRub)}</td>
                            <td className="p-3 text-right text-green-600">{formatPercent(estimate.summary.marginTotalPercent)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-medium">№</th>
                          <th className="text-left p-3 font-medium">Категория</th>
                          <th className="text-left p-3 font-medium">Наименование</th>
                          <th className="text-left p-3 font-medium">Ед.</th>
                          <th className="text-right p-3 font-medium">Кол-во</th>
                          <th className="text-right p-3 font-medium">Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materialItems.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-gray-500">{index + 1}</td>
                            <td className="p-3">{categoryLabels[item.category] || item.category}</td>
                            <td className="p-3">{item.nomenclatureName}</td>
                            <td className="p-3 text-gray-500">{item.unit}</td>
                            <td className="p-3 text-right">{item.quantity}</td>
                            <td className="p-3 text-right font-medium">{formatPrice(item.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 font-bold">
                          <td colSpan={5} className="p-3 text-right">ИТОГО:</td>
                          <td className="p-3 text-right">{formatPrice(materialsTotal)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </div>
            )}
            
            {workItems.length > 0 && (
              <div className="mt-6 bg-white rounded-xl shadow-md border p-6">
                <h2 className="text-lg font-bold mb-4">Смета работ</h2>
                <div className="overflow-x-auto">
                  {showPurchasePrices ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-medium">№</th>
                          <th className="text-left p-3 font-medium">Категория</th>
                          <th className="text-left p-3 font-medium">Наименование</th>
                          <th className="text-left p-3 font-medium">Ед.</th>
                          <th className="text-right p-3 font-medium">Кол-во</th>
                          <th className="text-right p-3 font-medium">Стоимость за ед.</th>
                          <th className="text-right p-3 font-medium">Стоимость итого</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workItems.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-gray-500">{index + 1}</td>
                            <td className="p-3">{categoryLabels[item.category] || item.category}</td>
                            <td className="p-3">{item.nomenclatureName}</td>
                            <td className="p-3 text-gray-500">{item.unit}</td>
                            <td className="p-3 text-right">{item.quantity}</td>
                            <td className="p-3 text-right">{formatPrice(item.pricePerUnit)}</td>
                            <td className="p-3 text-right font-medium">{formatPrice(item.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 font-bold">
                          <td colSpan={6} className="p-3 text-right">ИТОГО:</td>
                          <td className="p-3 text-right">{formatPrice(worksTotal)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-medium">№</th>
                          <th className="text-left p-3 font-medium">Категория</th>
                          <th className="text-left p-3 font-medium">Наименование</th>
                          <th className="text-left p-3 font-medium">Ед.</th>
                          <th className="text-right p-3 font-medium">Кол-во</th>
                          <th className="text-right p-3 font-medium">Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workItems.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-gray-500">{index + 1}</td>
                            <td className="p-3">{categoryLabels[item.category] || item.category}</td>
                            <td className="p-3">{item.nomenclatureName}</td>
                            <td className="p-3 text-gray-500">{item.unit}</td>
                            <td className="p-3 text-right">{item.quantity}</td>
                            <td className="p-3 text-right font-medium">{formatPrice(item.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 font-bold">
                          <td colSpan={5} className="p-3 text-right">ИТОГО:</td>
                          <td className="p-3 text-right">{formatPrice(worksTotal)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}

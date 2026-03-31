'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { isApiError } from '@/lib/utils/apiResponse';

interface Estimate {
  id: string;
  createdAt: string;
  fenceType: { id: string; name: string };
  length: number;
  height: number;
  grandTotal: number;
  hasGate: boolean;
  hasWicket: boolean;
  city: string | null;
  deviceType: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

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
  retailMaterialsTotal?: number;
  purchaseMaterialsTotal?: number;
  materialMarginRub?: number;
  materialMarginPercent?: number;
  worksTotal?: number;
  grandTotal?: number;
}

interface EstimateDetail extends Estimate {
  lagRows: number;
  coating: string;
  gateType: string | null;
  gateLength: number | null;
  gateNomenclatureName: string | null;
  gateTotal: number;
  gateInstallationTotal: number;
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
  items: ExtendedEstimateItem[];
  ipAddress: string | null;
  userAgent: string | null;
  showPurchasePrices?: boolean;
  summary?: EstimateSummary;
}

interface FenceType {
  id: string;
  name: string;
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

export default function EstimatesPage() {
  const searchParams = useSearchParams();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [fenceTypes, setFenceTypes] = useState<FenceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEstimate, setSelectedEstimate] = useState<EstimateDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    fenceTypeId: '',
    minCost: '',
    maxCost: '',
    hasGate: '',
    hasWicket: '',
    deviceType: '',
    search: '',
  });

  const fetchEstimateDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/estimates/${id}`, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Смета не найдена');
          return;
        }
        throw new Error('Ошибка загрузки');
      }
      const data = await res.json();

      if (isApiError(data)) {
        console.error('[Estimates] API Error fetching estimate detail:', data.error);
        toast.error('Ошибка загрузки сметы');
        return;
      }

      setSelectedEstimate(data);
    } catch (error) {
      console.error('Error fetching estimate detail:', error);
      toast.error('Ошибка загрузки сметы');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFenceTypes();
    const openEstimateId = searchParams.get('open');
    if (openEstimateId) {
      fetchEstimateDetail(openEstimateId);
    }
  }, [searchParams, fetchEstimateDetail]);

  useEffect(() => {
    fetchEstimates();
  }, [page, filters]);

  const fetchFenceTypes = async () => {
    try {
      const res = await fetch('/api/admin/materials/fence-types', { credentials: 'include' });
      const data = await res.json();

      if (isApiError(data)) {
        console.error('[Estimates] API Error fetching fence types:', data.error);
        setFenceTypes([]);
        return;
      }

      setFenceTypes(Array.isArray(data.fenceTypes) ? data.fenceTypes : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching fence types:', error);
      setFenceTypes([]);
    }
  };

  const fetchEstimates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await fetch(`/api/admin/estimates?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();

      if (isApiError(data)) {
        console.error('[Estimates] API Error:', data.error);
        setEstimates([]);
        setTotal(0);
        return;
      }
      setEstimates(data.estimates || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching estimates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    window.open(`/api/admin/estimates/export?${params.toString()}`, '_blank');
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      fenceTypeId: '',
      minCost: '',
      maxCost: '',
      hasGate: '',
      hasWicket: '',
      deviceType: '',
      search: '',
    });
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' ₽';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Расчеты калькулятора</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Экспорт в Excel
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md border mb-6">
        <div className="p-6 space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Дата с</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Дата по</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Тип забора</label>
              <select
                value={filters.fenceTypeId}
                onChange={(e) => setFilters({ ...filters, fenceTypeId: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Все</option>
                {fenceTypes.map((ft) => (
                  <option key={ft.id} value={ft.id}>{ft.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Стоимость от</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minCost}
                onChange={(e) => setFilters({ ...filters, minCost: e.target.value })}
                className="w-28 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Стоимость до</label>
              <input
                type="number"
                placeholder="999999"
                value={filters.maxCost}
                onChange={(e) => setFilters({ ...filters, maxCost: e.target.value })}
                className="w-28 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Ворота</label>
              <select
                value={filters.hasGate}
                onChange={(e) => setFilters({ ...filters, hasGate: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Все</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Калитка</label>
              <select
                value={filters.hasWicket}
                onChange={(e) => setFilters({ ...filters, hasWicket: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Все</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Устройство</label>
              <select
                value={filters.deviceType}
                onChange={(e) => setFilters({ ...filters, deviceType: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Все</option>
                <option value="desktop">Десктоп</option>
                <option value="mobile">Мобильный</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-gray-600 mb-1">Поиск</label>
              <input
                type="text"
                placeholder="Город, email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Загрузка...</div>
        ) : estimates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Нет расчетов</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Дата</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Тип забора</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Размер</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Стоимость</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Ворота</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Калитка</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Город</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Устройство</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Пользователь</th>
                </tr>
              </thead>
              <tbody>
                {estimates.map((estimate) => (
                  <tr
                    key={estimate.id}
                    onClick={() => fetchEstimateDetail(estimate.id)}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="py-3 px-4 text-sm text-gray-600">#{estimate.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(estimate.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="py-3 px-4">{estimate.fenceType?.name || '-'}</td>
                    <td className="py-3 px-4">{estimate.length}м × {estimate.height}м</td>
                    <td className="py-3 px-4 font-medium">{formatPrice(estimate.grandTotal)}</td>
                    <td className="py-3 px-4">
                      {estimate.hasGate ? (
                        <span className="text-green-600">Да</span>
                      ) : (
                        <span className="text-gray-400">Нет</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {estimate.hasWicket ? (
                        <span className="text-green-600">Да</span>
                      ) : (
                        <span className="text-gray-400">Нет</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{estimate.city || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        estimate.deviceType === 'mobile'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {estimate.deviceType === 'mobile' ? 'Мобильный' : 'Десктоп'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {estimate.user ? (
                        <div>
                          <div className="font-medium">{estimate.user.name || 'Без имени'}</div>
                          <div className="text-sm text-gray-500">{estimate.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Гость</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-500">
              Показано {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, total)} из {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ←
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 border rounded ${
                      page === pageNum
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedEstimate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Расчет #{selectedEstimate.id.slice(0, 8)}</h2>
              <button
                onClick={() => setSelectedEstimate(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-8 text-center text-gray-500">Загрузка...</div>
            ) : (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Основные параметры</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Тип забора:</span>
                      <span className="font-medium">{selectedEstimate.fenceType?.name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Размер:</span>
                      <span className="font-medium">{selectedEstimate.length}м × {selectedEstimate.height}м</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Покрытие:</span>
                      <span className="font-medium">{coatingLabels[selectedEstimate.coating] || selectedEstimate.coating}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Лаги:</span>
                      <span className="font-medium">{selectedEstimate.lagRows} ряда</span>
                    </div>
                  </div>
                </div>

                {selectedEstimate.items && selectedEstimate.items.length > 0 && (() => {
                  const materialItems = selectedEstimate.items.filter(item => item.category !== 'installation');
                  const workItems = selectedEstimate.items.filter(item => item.category === 'installation');
                  const materialsTotal = materialItems.reduce((sum, item) => sum + item.totalPrice, 0);
                  const worksTotal = workItems.reduce((sum, item) => sum + item.totalPrice, 0);
                  
                  return (
                    <>
                      {materialItems.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Смета материалов</h3>
                          <div className="overflow-x-auto">
                            {selectedEstimate.showPurchasePrices && selectedEstimate.summary ? (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b bg-gray-50">
                                    <th className="text-left p-2 font-medium">№</th>
                                    <th className="text-left p-2 font-medium">Категория</th>
                                    <th className="text-left p-2 font-medium">Наименование</th>
                                    <th className="text-left p-2 font-medium whitespace-nowrap">Ед.</th>
                                    <th className="text-right p-2 font-medium whitespace-nowrap">Кол-во</th>
                                    <th className="text-right p-2 font-medium whitespace-nowrap">Стоимость за ед.</th>
                                    <th className="text-right p-2 font-medium whitespace-nowrap">Стоимость итого</th>
                                    <th className="text-right p-2 font-medium whitespace-nowrap">Цена закуп.</th>
                                    <th className="text-right p-2 font-medium whitespace-nowrap">Сумма закуп.</th>
                                    <th className="text-right p-2 font-medium whitespace-nowrap">Маржа (₽)</th>
                                    <th className="text-right p-2 font-medium whitespace-nowrap">Маржа (%)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {materialItems.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                      <td className="p-2 text-gray-500">{index + 1}</td>
                                      <td className="p-2">{categoryLabels[item.category] || item.category}</td>
                                      <td className="p-2">{item.nomenclatureName}</td>
                                      <td className="p-2 text-gray-500 whitespace-nowrap">{item.unit}</td>
                                      <td className="p-2 text-right whitespace-nowrap">{item.quantity}</td>
                                      <td className="p-2 text-right whitespace-nowrap">{item.pricePerUnit.toLocaleString('ru-RU')} ₽</td>
                                      <td className="p-2 text-right font-medium whitespace-nowrap">{item.totalPrice.toLocaleString('ru-RU')} ₽</td>
                                      <td className="p-2 text-right whitespace-nowrap">{item.purchasePricePerUnit ? item.purchasePricePerUnit.toLocaleString('ru-RU') + ' ₽' : '—'}</td>
                                      <td className="p-2 text-right whitespace-nowrap">{item.purchaseTotal ? item.purchaseTotal.toLocaleString('ru-RU') + ' ₽' : '—'}</td>
                                      <td className={`p-2 text-right font-medium whitespace-nowrap ${item.marginRub && item.marginRub > 0 ? 'text-green-600' : ''}`}>
                                        {item.marginRub ? item.marginRub.toLocaleString('ru-RU') + ' ₽' : '—'}
                                      </td>
                                      <td className={`p-2 text-right font-medium whitespace-nowrap ${item.marginPercent && item.marginPercent > 0 ? 'text-green-600' : ''}`}>
                                        {item.marginPercent ? item.marginPercent.toFixed(2) + '%' : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-gray-100 font-bold">
                                    <td colSpan={6} className="p-2 text-right">ИТОГО:</td>
                                    <td className="p-2 text-right whitespace-nowrap">{materialsTotal.toLocaleString('ru-RU')} ₽</td>
                                    <td></td>
                                    <td className="p-2 text-right whitespace-nowrap">{selectedEstimate.summary.purchaseTotal.toLocaleString('ru-RU')} ₽</td>
                                    <td className="p-2 text-right text-green-600 whitespace-nowrap">{selectedEstimate.summary.marginTotalRub.toLocaleString('ru-RU')} ₽</td>
                                    <td className="p-2 text-right text-green-600 whitespace-nowrap">{selectedEstimate.summary.marginTotalPercent.toFixed(2)}%</td>
                                  </tr>
                                </tfoot>
                              </table>
                            ) : (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b bg-gray-50">
                                    <th className="text-left p-2 font-medium">№</th>
                                    <th className="text-left p-2 font-medium">Категория</th>
                                    <th className="text-left p-2 font-medium">Наименование</th>
                                    <th className="text-left p-2 font-medium whitespace-nowrap">Ед.</th>
                                    <th className="text-right p-2 font-medium whitespace-nowrap">Кол-во</th>
                                    <th className="text-right p-2 font-medium whitespace-nowrap">Сумма</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {materialItems.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                      <td className="p-2 text-gray-500">{index + 1}</td>
                                      <td className="p-2">{categoryLabels[item.category] || item.category}</td>
                                      <td className="p-2">{item.nomenclatureName}</td>
                                      <td className="p-2 text-gray-500 whitespace-nowrap">{item.unit}</td>
                                      <td className="p-2 text-right whitespace-nowrap">{item.quantity}</td>
                                      <td className="p-2 text-right font-medium whitespace-nowrap">{item.totalPrice.toLocaleString('ru-RU')} ₽</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-gray-100 font-bold">
                                    <td colSpan={5} className="p-2 text-right">ИТОГО:</td>
                                    <td className="p-2 text-right whitespace-nowrap">{materialsTotal.toLocaleString('ru-RU')} ₽</td>
                                  </tr>
                                </tfoot>
                              </table>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {workItems.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Смета работ</h3>
                          <div className="overflow-x-auto">
                            {selectedEstimate.showPurchasePrices && selectedEstimate.summary ? (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b bg-gray-50">
                                    <th className="text-left p-2 font-medium">№</th>
                                    <th className="text-left p-2 font-medium">Категория</th>
                                    <th className="text-left p-2 font-medium">Наименование</th>
                                    <th className="text-left p-2 font-medium whitespace-nowrap">Ед.</th>
                                    <th className="text-right p-2 font-medium">Кол-во</th>
                                    <th className="text-right p-2 font-medium whitespace-nowrap">Стоимость за ед.</th>
                                    <th className="text-right p-2 font-medium whitespace-nowrap">Стоимость итого</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {workItems.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                      <td className="p-2 text-gray-500">{index + 1}</td>
                                      <td className="p-2">{categoryLabels[item.category] || item.category}</td>
                                      <td className="p-2">{item.nomenclatureName}</td>
                                      <td className="p-2 text-gray-500 whitespace-nowrap">{item.unit}</td>
                                      <td className="p-2 text-right">{item.quantity}</td>
                                      <td className="p-2 text-right whitespace-nowrap">{item.pricePerUnit.toLocaleString('ru-RU')} ₽</td>
                                      <td className="p-2 text-right font-medium whitespace-nowrap">{item.totalPrice.toLocaleString('ru-RU')} ₽</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-gray-100 font-bold">
                                    <td colSpan={6} className="p-2 text-right">ИТОГО:</td>
                                    <td className="p-2 text-right whitespace-nowrap">{worksTotal.toLocaleString('ru-RU')} ₽</td>
                                  </tr>
                                </tfoot>
                              </table>
                            ) : (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b bg-gray-50">
                                    <th className="text-left p-2 font-medium">№</th>
                                    <th className="text-left p-2 font-medium">Категория</th>
                                    <th className="text-left p-2 font-medium">Наименование</th>
                                    <th className="text-left p-2 font-medium whitespace-nowrap">Ед.</th>
                                    <th className="text-right p-2 font-medium whitespace-nowrap">Кол-во</th>
                                    <th className="text-right p-2 font-medium whitespace-nowrap">Сумма</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {workItems.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                      <td className="p-2 text-gray-500">{index + 1}</td>
                                      <td className="p-2">{categoryLabels[item.category] || item.category}</td>
                                      <td className="p-2">{item.nomenclatureName}</td>
                                      <td className="p-2 text-gray-500 whitespace-nowrap">{item.unit}</td>
                                      <td className="p-2 text-right whitespace-nowrap">{item.quantity}</td>
                                      <td className="p-2 text-right font-medium whitespace-nowrap">{item.totalPrice.toLocaleString('ru-RU')} ₽</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-gray-100 font-bold">
                                    <td colSpan={5} className="p-2 text-right">ИТОГО:</td>
                                    <td className="p-2 text-right whitespace-nowrap">{worksTotal.toLocaleString('ru-RU')} ₽</td>
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

                {selectedEstimate.showPurchasePrices && selectedEstimate.summary && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4">
                    <h3 className="font-semibold text-green-800 mb-3">Финансовые показатели сметы</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-green-200">
                        <span className="text-green-700">Розничная стоимость материалов:</span>
                        <span className="font-medium text-green-900">{formatPrice(selectedEstimate.summary.retailMaterialsTotal || selectedEstimate.summary.retailTotal)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-green-200">
                        <span className="text-green-700">Маржа за материал:</span>
                        <span className="font-medium text-green-900">
                          {formatPrice(selectedEstimate.summary.materialMarginRub || selectedEstimate.summary.marginTotalRub)} ({(selectedEstimate.summary.materialMarginPercent || selectedEstimate.summary.marginTotalPercent).toFixed(2)}%)
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-green-200">
                        <span className="text-green-700">Стоимость работ:</span>
                        <span className="font-medium text-green-900">{formatPrice(selectedEstimate.summary.worksTotal || 0)}</span>
                      </div>
                      <div className="flex justify-between py-2 font-bold text-green-900 bg-green-100 rounded px-2 -mx-2">
                        <span>Общая стоимость сметы:</span>
                        <span>{formatPrice(selectedEstimate.summary.grandTotal || selectedEstimate.summary.retailTotal)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Пользователь</h3>
                  {selectedEstimate.user ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Имя:</span>
                        <span>{selectedEstimate.user.name || '-'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Email:</span>
                        <span>{selectedEstimate.user.email || '-'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Телефон:</span>
                        <span>{selectedEstimate.user.phone || '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400">Гость</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Метаданные</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Город:</span>
                      <span>{selectedEstimate.city || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Устройство:</span>
                      <span>{selectedEstimate.deviceType === 'mobile' ? 'Мобильный' : 'Десктоп'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">IP:</span>
                      <span>{selectedEstimate.ipAddress || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Дата:</span>
                      <span>{new Date(selectedEstimate.createdAt).toLocaleString('ru-RU')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

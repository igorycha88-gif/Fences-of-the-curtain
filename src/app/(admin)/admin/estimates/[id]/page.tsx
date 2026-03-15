'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

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
  items: any[];
  ipAddress: string | null;
  userAgent: string | null;
  city: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

const coatingLabels: Record<string, string> = {
  GALVANIZED: 'Оцинкованный',
  POLYMER_SINGLE: 'Односторонний полимер',
  POLYMER_DOUBLE: 'Двусторонний полимер',
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

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' ₽';
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

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
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

          {(estimate.hasGate || estimate.hasWicket) && (
            <div className="bg-white rounded-xl shadow-md border p-6">
              <h2 className="text-lg font-bold mb-4">Дополнительно</h2>
              <div className="space-y-3">
                {estimate.hasGate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ворота:</span>
                    <span className="font-medium">
                      {estimate.gateNomenclatureName || estimate.gateType || 'Ворота'}
                      {estimate.gateLength && ` ${(estimate.gateLength / 1000).toFixed(1)}м`}
                    </span>
                  </div>
                )}
                {estimate.hasWicket && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Калитка:</span>
                    <span className="font-medium">
                      {estimate.wicketNomenclatureName || 'Калитка'}
                      {estimate.wicketWidth && ` ${(estimate.wicketWidth / 1000).toFixed(1)}м`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md border p-6">
            <h2 className="text-lg font-bold mb-4">Детализация</h2>
            <div className="space-y-2">
              {Array.isArray(estimate.items) && estimate.items.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b text-sm">
                  <div>
                    <span className="text-gray-700">{item.nomenclatureName || item.category}</span>
                    <span className="text-gray-400 ml-2">
                      ({item.quantity} {item.unit})
                    </span>
                  </div>
                  <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md border p-6">
            <h2 className="text-lg font-bold mb-4">Стоимость</h2>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Столбы</span>
                <span>{formatPrice(estimate.postsTotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Лаги</span>
                <span>{formatPrice(estimate.lagsTotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Профнастил</span>
                <span>{formatPrice(estimate.profnastilTotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Монтажная фурнитура</span>
                <span>{formatPrice(estimate.mountingHardwareTotal)}</span>
              </div>
              {estimate.hasGate && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Ворота</span>
                  <span>{formatPrice(estimate.gateTotal)}</span>
                </div>
              )}
              {estimate.hasWicket && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Калитка</span>
                  <span>{formatPrice(estimate.wicketTotal)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b font-medium">
                <span>Материалы</span>
                <span>{formatPrice(estimate.materialsTotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Работы</span>
                <span>{formatPrice(estimate.installationTotal)}</span>
              </div>
              <div className="flex justify-between py-3 text-lg font-bold bg-primary/5 -mx-2 px-2 rounded">
                <span>ИТОГО</span>
                <span className="text-primary">{formatPrice(estimate.grandTotal)}</span>
              </div>
            </div>
          </div>

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
    </div>
  );
}

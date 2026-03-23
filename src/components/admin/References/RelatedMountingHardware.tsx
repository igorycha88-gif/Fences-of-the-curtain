'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateMargin, getMarginEmoji } from '@/lib/utils/marginCalculator';
import { formatPrice } from '@/lib/utils/formatters';

type ReferenceType = 'LAG' | 'POST' | 'PROFNASTIL' | 'PICKET' | 'GATE' | 'WICKET' | 'PANEL_3D';

interface MountingHardwareItem {
  id: string;
  name: string;
  description: string | null;
  purchasePrice: number;
  retailPrice: number;
  active: boolean;
}

interface RelatedMountingHardwareProps {
  referenceType: ReferenceType;
  referenceId: string;
}

export function RelatedMountingHardware({ referenceType, referenceId }: RelatedMountingHardwareProps) {
  const router = useRouter();
  const [items, setItems] = useState<MountingHardwareItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelatedHardware = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          referenceType,
          referenceId,
        });

        const response = await fetch(`/api/admin/mounting-hardware/by-reference?${params}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 403) {
            setItems([]);
            setIsLoading(false);
            return;
          }
          throw new Error('Ошибка загрузки данных');
        }

        const data = await response.json();
        setItems(data.items || []);
      } catch (err) {
        console.error('Error fetching related mounting hardware:', err);
        setError('Не удалось загрузить связанную фурнитуру');
      } finally {
        setIsLoading(false);
      }
    };

    if (referenceType && referenceId) {
      fetchRelatedHardware();
    }
  }, [referenceType, referenceId]);

  if (isLoading) {
    return (
      <div className="mt-6 border-t pt-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <span>Связанная монтажная фурнитура</span>
          <span className="text-xs text-gray-400">(ADMIN)</span>
        </h4>
        <div className="text-gray-500 text-sm">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 border-t pt-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <span>Связанная монтажная фурнитура</span>
          <span className="text-xs text-gray-400">(ADMIN)</span>
        </h4>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t pt-4">
      <h4 className="font-medium mb-3 flex items-center gap-2">
        <span>Связанная монтажная фурнитура</span>
        <span className="text-xs text-gray-400">(ADMIN)</span>
      </h4>

      {items.length === 0 ? (
        <div className="bg-gray-50 rounded p-4 text-sm text-gray-600">
          <p>Нет привязанной фурнитуры</p>
          <p className="mt-1 text-xs text-gray-400">
            Управление связями доступно в справочнике Монтажная фурнитура
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const margin = calculateMargin(item.retailPrice, item.purchasePrice);
            const marginEmoji = getMarginEmoji(margin?.marginPercent ?? null);

            return (
              <div
                key={item.id}
                className="border rounded p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push('/admin/references/mounting-hardware')}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-sm text-gray-500">{item.description}</div>
                    )}
                  </div>
                  {!item.active && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                      Неактивен
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-gray-600">
                    Закупка: {formatPrice(item.purchasePrice)} ₽
                  </span>
                  <span className="mx-2">|</span>
                  <span className="text-gray-600">
                    Розница: {formatPrice(item.retailPrice)} ₽
                  </span>
                  {margin && (
                    <>
                      <span className="mx-2">|</span>
                      <span className="text-gray-600">
                        Маржа: {margin.marginPercent.toFixed(1)}% {marginEmoji}
                      </span>
                    </>
                  )}
                </div>
                <div className="mt-2 text-xs text-blue-600 hover:text-blue-800">
                  Перейти к фурнитуре →
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

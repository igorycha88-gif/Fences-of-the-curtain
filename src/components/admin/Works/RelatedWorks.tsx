'use client';

import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils/formatters';
import { ArrowRight } from 'lucide-react';

interface Work {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  unit: string;
  unitName: string;
  price: number;
  useInCalculator: boolean;
}

interface RelatedWorksProps {
  fenceType: string;
}

export function RelatedWorks({ fenceType }: RelatedWorksProps) {
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchWorks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/works/by-fence-type?fenceType=${fenceType}`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (response.ok) {
          setWorks(data.items || []);
        }
      } catch (error) {
        console.error('Error fetching related works:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorks();
  }, [fenceType]);

  if (isLoading) {
    return null;
  }

  if (works.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>🔧 Связанные работы</span>
      </h3>
      <div className="space-y-3">
        {works.map((work) => (
          <div
            key={work.id}
            className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
            onClick={() => window.open(`/admin/references/works/${work.id}`, '_blank')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900">📦 {work.name}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Категория:</span> {work.categoryName} |{' '}
                  <span className="font-medium">Единица:</span> {work.unitName} |{' '}
                  <span className="font-medium">Стоимость:</span> {formatPrice(work.price)}/{work.unitName}
                </div>
              </div>
              <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

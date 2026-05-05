'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Filter, ImageOff } from 'lucide-react';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { getThumbnailUrl } from '@/lib/utils/imageUrl';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { EVENT_NAMES } from '@/types/analytics';
import { metrikaEvents } from '@/lib/seo/metrika';

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  type?: string;
  description?: string;
  images: string[];
}

interface PortfolioClientProps {
  items: PortfolioItem[];
}

export default function PortfolioClient({ items }: PortfolioClientProps) {
  const { trackEvent } = useAnalytics();
  const [filter, setFilter] = useState<'all' | 'fence' | 'canopy' | 'garage'>('all');

  const handleFilterChange = (newFilter: 'all' | 'fence' | 'canopy' | 'garage') => {
    setFilter(newFilter);
    trackEvent(EVENT_NAMES.PORTFOLIO_VIEW, { filter: newFilter });
  };

  const filteredItems = filter === 'all'
    ? items
    : items.filter(item => item.category === filter);

  return (
    <>
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-md border">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2 flex-wrap">
            {(['all', 'fence', 'canopy', 'garage'] as const).map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'Все работы' : f === 'fence' ? 'Заборы' : f === 'canopy' ? 'Навесы' : 'Гаражи'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.map((item) => {
          const images = item.images as string[];
          const firstImage = images[0];
          const thumbnailUrl = getThumbnailUrl(firstImage);

          return (
            <Link
              key={item.id}
              href={`/portfolio/${item.id}`}
              className="block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border"
              onClick={() => {
                trackEvent(EVENT_NAMES.PORTFOLIO_ITEM_CLICK, {
                  portfolio_id: item.id,
                  title: item.title,
                  category: item.category,
                });
                metrikaEvents.portfolioView(item.id);
              }}
            >
              <div className="relative aspect-video bg-gradient-to-br from-slate-200 to-slate-300">
                {thumbnailUrl ? (
                  <ImageWithFallback
                    src={thumbnailUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-slate-100 to-slate-200">
                    <ImageOff className="w-12 h-12 mb-2 text-gray-300" />
                    <span className="text-sm">Нет фото</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                    {item.type || (item.category === 'fence' ? 'Заборы' : item.category === 'canopy' ? 'Навесы' : 'Гаражи')}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{item.title}</h3>
                {item.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                )}
                <span className="text-primary font-medium text-sm inline-flex items-center gap-1">
                  Подробнее →
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">Нет проектов в выбранной категории</p>
        </div>
      )}
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Filter, Loader2, ImageOff } from 'lucide-react';
import Header from '@/components/layout/Header';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { getThumbnailUrl } from '@/lib/utils/imageUrl';
import { isApiError } from '@/lib/utils/apiResponse';

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  type?: string;
  description?: string;
  images: string[];
}

export default function PortfolioPage() {
  const [filter, setFilter] = useState<'all' | 'fence' | 'canopy'>('all');
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const categoryParam = filter === 'all' ? '' : `?category=${filter}`;
        const res = await fetch(`/api/portfolio${categoryParam}`);
        if (!res.ok) throw new Error('Ошибка загрузки');
        const data = await res.json();

        if (isApiError(data)) {
          console.error('[Portfolio] API Error:', data.error);
          setItems([]);
          setError('Не удалось загрузить портфолио');
          return;
        }

        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        console.error('Error fetching portfolio:', err);
        setError('Не удалось загрузить портфолио');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [filter]);

  const filteredItems = filter === 'all'
    ? items
    : items.filter(item => item.category === filter);

  const handleImageError = (imageUrl: string) => {
    console.error('[Portfolio] Image failed to load:', imageUrl);
    setImageErrors(prev => new Set(prev).add(imageUrl));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <Breadcrumbs items={[{ label: 'Портфолио' }]} />
        <h1 className="text-5xl font-bold text-center mb-4 text-gray-900">Портфолио</h1>
        <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Примеры наших работ выполненных с высоким качеством
        </p>

        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-md border">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Все работы
              </button>
              <button
                onClick={() => setFilter('fence')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'fence'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Заборы
              </button>
              <button
                onClick={() => setFilter('canopy')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'canopy'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Навесы
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 text-lg">{error}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => {
              const images = item.images as string[];
              const firstImage = images[0];
              const thumbnailUrl = getThumbnailUrl(firstImage);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border"
                >
                  <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300">
                    {thumbnailUrl && !imageErrors.has(thumbnailUrl) ? (
                      <img
                        src={thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={() => handleImageError(thumbnailUrl)}
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
                        {item.type || (item.category === 'fence' ? 'Заборы' : 'Навесы')}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">{item.title}</h3>
                    {item.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                    )}
                    <Link
                      href={`/calculator/${item.category === 'fence' ? 'fence' : 'canopy'}`}
                      className="text-primary font-medium text-sm hover:underline inline-flex items-center gap-1"
                    >
                      Рассчитать подобный проект →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && filteredItems.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Нет проектов в выбранной категории</p>
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-white py-10">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">© 2026 Заборы и Навесы. Все права защищены.</p>
          <p className="text-gray-400">+7 (900) 123-45-67 | info@fences.ru</p>
        </div>
      </footer>
    </div>
  );
}

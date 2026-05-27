'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Percent, ArrowRight, Sparkles, Clock } from 'lucide-react';

interface ActivePromotion {
  id: string;
  fenceTypeId: string;
  name: string;
  discountType: string;
  discountPercent: number;
  bannerTitle: string | null;
  bannerText: string | null;
  fenceTypeName: string;
  endDate: string | null;
}

export function PromotionBanner() {
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/promotions/active')
      .then((res) => res.json())
      .then((data) => {
        if (data.promotions && data.promotions.length > 0) {
          setPromotions(data.promotions);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (promotions.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [promotions.length]);

  if (isLoading || promotions.length === 0) {
    return null;
  }

  const promo = promotions[currentIndex];

  const discountTypeLabel = () => {
    switch (promo.discountType) {
      case 'MATERIALS': return 'на материалы';
      case 'WORKS': return 'на работы';
      default: return 'на всё';
    }
  };

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-2xl p-8 md:p-10 bg-white/95 backdrop-blur-sm shadow-2xl">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg animate-pulse-soft">
                  <div className="text-center">
                    <Percent className="w-6 h-6 md:w-8 md:h-8 text-white mx-auto" />
                    <span className="text-white font-bold text-lg md:text-xl block -mt-1">
                      {promo.discountPercent}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
                    Акция
                  </span>
                  {promo.endDate && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      до {new Date(promo.endDate).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {promo.bannerTitle || promo.name}
                </h2>

                {promo.bannerText && (
                  <p className="text-gray-600 text-sm md:text-base mb-3">
                    {promo.bannerText}
                  </p>
                )}

                <p className="text-sm text-gray-500">
                  Скидка {discountTypeLabel()} на заборы из{' '}
                  <span className="font-semibold text-gray-700">{promo.fenceTypeName}</span>
                </p>
              </div>

              <div className="flex-shrink-0">
                <Link
                  href={`/calculator/fence`}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3.5 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  Рассчитать со скидкой
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {promotions.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {promotions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      idx === currentIndex
                        ? 'bg-orange-500 w-6'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';
import { ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { getThumbnailUrl, normalizeImageUrl } from '@/lib/utils/imageUrl';

interface PortfolioGalleryClientProps {
  images: string[];
  title: string;
}

export default function PortfolioGalleryClient({
  images,
  title,
}: PortfolioGalleryClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex flex-col items-center justify-center text-gray-400">
        <ImageOff className="w-16 h-16 mb-3 text-gray-300" />
        <span className="text-lg">Нет фотографий</span>
      </div>
    );
  }

  const currentImage = images[currentIndex];
  const currentUrl = normalizeImageUrl(currentImage);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
        {imageErrors.has(currentUrl) ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <ImageOff className="w-12 h-12 mb-2 text-gray-300" />
            <span className="text-sm">Фото не загружено</span>
          </div>
        ) : (
          <img
            src={currentUrl}
            alt={`${title} — фото ${currentIndex + 1}`}
            className="w-full h-full object-cover"
            onError={() =>
              setImageErrors((prev) => new Set(prev).add(currentUrl))
            }
          />
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              aria-label="Следующее фото"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => {
            const thumbUrl = getThumbnailUrl(img);
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  idx === currentIndex
                    ? 'border-primary'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={thumbUrl || normalizeImageUrl(img)}
                  alt={`${title} — миниатюра ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = normalizeImageUrl(img);
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

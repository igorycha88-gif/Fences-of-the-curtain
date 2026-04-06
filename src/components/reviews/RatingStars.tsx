import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RatingStars({ 
  rating, 
  maxRating = 5, 
  size = 'md',
  className 
}: RatingStarsProps) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasPartialStar = rating % 1 !== 0;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  for (let i = 0; i < maxRating; i++) {
    const isFull = i < fullStars;
    const isPartial = i === fullStars && hasPartialStar;

    stars.push(
      <Star
        key={i}
        className={cn(
          sizeClasses[size],
          isFull || isPartial
            ? 'fill-yellow-400 text-yellow-400'
            : 'fill-gray-200 text-gray-200'
        )}
      />
    );
  }

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {stars}
    </div>
  );
}

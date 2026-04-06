import { cn } from '@/lib/utils';
import { RatingStars } from './RatingStars';

interface ReviewCardProps {
  author: string;
  rating: number;
  text: string;
  date: string;
  className?: string;
}

export function ReviewCard({ 
  author, 
  rating, 
  text, 
  date, 
  className 
}: ReviewCardProps) {
  const formattedDate = new Date(date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const initials = author
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn(
      'glass card-modern p-6 hover-lift h-full flex flex-col',
      className
    )}>
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-semibold text-sm">
            {initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base mb-1 truncate">{author}</h4>
          <RatingStars rating={rating} size="sm" />
        </div>
      </div>

      <p className="text-muted-foreground text-sm leading-relaxed flex-1 line-clamp-4">
        {text}
      </p>

      <p className="text-xs text-muted-foreground/60 mt-4">
        {formattedDate}
      </p>
    </div>
  );
}

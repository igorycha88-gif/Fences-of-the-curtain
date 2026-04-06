'use client';

interface YandexRatingBadgeProps {
  orgId?: string;
  type?: 'rating' | 'reviews';
  width?: number;
  height?: number;
  className?: string;
}

export function YandexRatingBadge({ 
  orgId,
  type = 'rating',
  width = 150,
  height = 50,
  className = ''
}: YandexRatingBadgeProps) {
  const finalOrgId = orgId || process.env.NEXT_PUBLIC_YANDEX_ORG_ID || '154197841574';
  const src = `https://yandex.ru/sprav/widget/rating-badge/${finalOrgId}?type=${type}`;

  return (
    <iframe 
      src={src} 
      width={width} 
      height={height} 
      frameBorder="0"
      className={`rounded-lg ${className}`}
      title="Рейтинг компании в Яндексе"
    />
  );
}

'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, MessageSquare } from 'lucide-react';
import { AnimatedSection } from '@/hooks/useScrollReveal';
import { ReviewCard } from './ReviewCard';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

interface ReviewsData {
  rating: number;
  reviewsCount: number;
  reviews: Review[];
  yandexUrl: string;
}

interface YandexReviewsProps {
  showReviews?: boolean;
  maxReviews?: number;
  className?: string;
}

export function YandexReviews({ 
  showReviews = true, 
  maxReviews = 3,
  className 
}: YandexReviewsProps) {
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  const yandexOrgId = process.env.NEXT_PUBLIC_YANDEX_ORG_ID || '154197841574';
  const yandexOrgUrl = process.env.NEXT_PUBLIC_YANDEX_ORG_URL || 
    `https://yandex.ru/maps/org/${yandexOrgId}/`;
  const yandexReviewsUrl = `${yandexOrgUrl}reviews/`;

  useEffect(() => {
    setMounted(true);
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/yandex-reviews');
      if (response.ok) {
        const data = await response.json();
        setReviewsData(data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state during SSR and initial mount
  if (!mounted || loading) {
    return (
      <div className={cn('py-24 px-4 bg-secondary/30', className)}>
        <div className="container mx-auto">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-64 mx-auto mb-4" />
              <div className="h-4 bg-muted rounded w-48 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !reviewsData) {
    return null;
  }

  const hasReviews = reviewsData.reviews.length > 0;

  if (!hasReviews && reviewsData.reviewsCount === 0) {
    return (
      <section className={cn('py-24 px-4 bg-secondary/30', className)}>
        <div className="container mx-auto">
          <AnimatedSection animation="fade-in-up" className="text-center mb-16">
            <h2 className="section-title mb-4">Отзывы наших клиентов</h2>
            <p className="text-muted-foreground mb-8">
              Пока нет отзывов. Станьте первым!
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-in-up" delay={100}>
            <div className="flex justify-center">
              <a
                href={yandexReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Оставить первый отзыв в Яндексе
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>
    );
  }

  const displayedReviews = reviewsData.reviews.slice(0, maxReviews);

  return (
    <section className={cn('py-24 px-4 bg-secondary/30', className)}>
      <div className="container mx-auto">
        <AnimatedSection animation="fade-in-up" className="text-center mb-16">
          <h2 className="section-title mb-4">Отзывы наших клиентов</h2>
          <div className="flex flex-col items-center gap-4">
            <iframe 
              src={`https://yandex.ru/sprav/widget/rating-badge/${yandexOrgId}?type=rating`}
              width="150" 
              height="50" 
              frameBorder="0"
              className="rounded-lg"
              title="Рейтинг компании в Яндексе"
            />
            <p className="text-muted-foreground">
              {reviewsData.reviewsCount} отзывов в Яндекс.Картах
            </p>
          </div>
        </AnimatedSection>

        {showReviews && displayedReviews.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {displayedReviews.map((review, index) => (
              <AnimatedSection 
                key={review.id} 
                animation="fade-in-up" 
                delay={index * 100}
              >
                <ReviewCard
                  author={review.author}
                  rating={review.rating}
                  text={review.text}
                  date={review.date}
                />
              </AnimatedSection>
            ))}
          </div>
        )}

        <AnimatedSection animation="fade-in-up" delay={300}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={reviewsData.yandexUrl || yandexOrgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Читать все отзывы
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={`${reviewsData.yandexUrl || yandexOrgUrl}reviews/`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              Оставить отзыв в Яндексе
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

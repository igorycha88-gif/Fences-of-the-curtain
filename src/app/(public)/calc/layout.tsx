import React from 'react';
import { Metadata } from 'next';

// Layout с title-строкой отменяет суффикс-шаблон root layout
// («| Заборы и Навесы») для /calc/* — title хаба уже длинный
// и не должен обрезаться поисковиками (SEO, НФТ ЧТЗ v3).
export const metadata: Metadata = {
  title: 'Расчёт забора по соткам участка',
};

export default function CalcLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

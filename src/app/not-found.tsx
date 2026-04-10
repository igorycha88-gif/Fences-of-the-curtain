import Link from 'next/link';
import { Metadata } from 'next';
import { Home, Calculator, Phone, ArrowLeft } from 'lucide-react';
import BackButton from '@/components/BackButton';

export const metadata: Metadata = {
  title: 'Страница не найдена — 404',
  description: 'Запрашиваемая страница не найдена. Вернитесь на главную или воспользуйтесь калькулятором.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
        <h1 className="text-2xl font-semibold text-foreground mb-3">
          Страница не найдена
        </h1>
        <p className="text-muted-foreground mb-8">
          Запрашиваемая страница не существует или была перемещена.
          Воспользуйтесь навигацией или вернитесь на главную.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            На главную
          </Link>
          <Link
            href="/calculator/fence"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
          >
            <Calculator className="w-4 h-4" />
            Калькулятор
          </Link>
          <Link
            href="/contacts"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <Phone className="w-4 h-4" />
            Контакты
          </Link>
        </div>
        <BackButton
          className="inline-flex items-center gap-1 mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Вернуться назад
        </BackButton>
      </div>
    </div>
  );
}

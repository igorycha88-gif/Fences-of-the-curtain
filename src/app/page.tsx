import Link from 'next/link';
import Header from '@/components/layout/Header';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <main>
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-5xl font-bold mb-6 text-gray-900">
              Профессиональные заборы и навесы
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Рассчитайте стоимость онлайн, изучите услуги и просмотрите портфолио выполненных работ
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/calculator/fence"
                className="bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
              >
                Рассчитать забор
              </Link>
              <Link
                href="/calculator/canopy"
                className="bg-secondary text-foreground px-8 py-4 rounded-lg font-semibold hover:bg-secondary/80 transition-colors border"
              >
                Рассчитать навес
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto">
            <h3 className="text-3xl font-bold mb-10 text-center text-gray-900">Наши преимущества</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 bg-slate-50 rounded-xl border hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">⚡</div>
                <h4 className="text-xl font-semibold mb-2">Быстрый расчет</h4>
                <p className="text-gray-600">Мгновенно узнайте стоимость забора или навеса онлайн</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-xl border hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">🏆</div>
                <h4 className="text-xl font-semibold mb-2">Качество гарантируем</h4>
                <p className="text-gray-600">Используем только проверенные материалы и профессиональное оборудование</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-xl border hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">💰</div>
                <h4 className="text-xl font-semibold mb-2">Честные цены</h4>
                <p className="text-gray-600">Прозрачный расчет без скрытых платежей и наценок</p>
              </div>
            </div>
          </div>
        </section>
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

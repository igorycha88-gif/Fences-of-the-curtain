import Link from 'next/link';
import { Fence, Home } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold text-center mb-4 text-gray-900">
          Выберите калькулятор
        </h1>
        <p className="text-xl text-gray-600 text-center mb-16 max-w-2xl mx-auto">
          Рассчитайте стоимость забора или навеса онлайн за несколько минут
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link
            href="/calculator/fence"
            className="group bg-white rounded-xl shadow-lg p-8 border hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <Fence className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Калькулятор забора</h2>
            <p className="text-gray-600 mb-4">
              Рассчитайте стоимость забора из профнастила, евроштакетника, сетки-рабицы или 3D-панелей
            </p>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>• Профнастил</li>
              <li>• Евроштакетник</li>
              <li>• Сетка-рабица</li>
              <li>• 3D-панели</li>
            </ul>
          </Link>

          <Link
            href="/calculator/canopy"
            className="group bg-white rounded-xl shadow-lg p-8 border hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <Home className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Калькулятор навеса</h2>
            <p className="text-gray-600 mb-4">
              Рассчитайте стоимость навеса для автомобиля, террасы или другого назначения
            </p>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>• Поликарбонат</li>
              <li>• Металлочерепица</li>
              <li>• Профнастил</li>
              <li>• Различные формы</li>
            </ul>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

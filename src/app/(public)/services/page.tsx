import Link from 'next/link';
import { Calculator, Shield, Clock, Award } from 'lucide-react';
import Header from '@/components/layout/Header';

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold text-center mb-4 text-gray-900">Наши услуги</h1>
        <p className="text-xl text-gray-600 text-center mb-16 max-w-2xl mx-auto">
          Профессиональные решения для ограждения территории и защиты от солнца и осадков
        </p>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Заборы</h2>
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-md border hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Забор из профнастила</h3>
                <p className="text-gray-600 mb-4">
                  Практичное и надежное решение. Широкий выбор цветов и покрытий. Устойчив к коррозии и механическим повреждениям.
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>от 3 500 ₽/м²</span>
                  <span>•</span>
                  <span>Гарантия 10 лет</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Евроштакетник</h3>
                <p className="text-gray-600 mb-4">
                  Стильный и современный забор с эстетичным внешним видом. Возможность выбора расстояния между штакетинами.
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>от 4 200 ₽/м²</span>
                  <span>•</span>
                  <span>Гарантия 15 лет</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Сетка-рабица</h3>
                <p className="text-gray-600 mb-4">
                  Экономичный вариант ограждения. Пропускает свет, хорошо просматривается, не затеняет участок.
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>от 1 200 ₽/м²</span>
                  <span>•</span>
                  <span>Гарантия 5 лет</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-3">3D-панели</h3>
                <p className="text-gray-600 mb-4">
                  Современный дизайн и высокая прочность. Идеальное решение для ограждения частных домов и коммерческих объектов.
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>от 3 800 ₽/м²</span>
                  <span>•</span>
                  <span>Гарантия 20 лет</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Навесы</h2>
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-md border hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Навес под автомобиль</h3>
                <p className="text-gray-600 mb-4">
                  Защита автомобиля от солнца, дождя и снега. Различные конструкции: односкатные, двускатные и арочные.
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>от 35 000 ₽</span>
                  <span>•</span>
                  <span>Гарантия 10 лет</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Беседка</h3>
                <p className="text-gray-600 mb-4">
                  Уютное место для отдыха на свежем воздухе. Возможность установки барбекю, освещения и мебели.
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>от 45 000 ₽</span>
                  <span>•</span>
                  <span>Гарантия 10 лет</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Навес-терраса</h3>
                <p className="text-gray-600 mb-4">
                  Расширение жилого пространства. Отличное решение для летних вечеров и семейных обедов на открытом воздухе.
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>от 55 000 ₽</span>
                  <span>•</span>
                  <span>Гарантия 10 лет</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Хозблок</h3>
                <p className="text-gray-600 mb-4">
                  Практичное решение для хранения инструментов и инвентаря. Может быть использован как гараж для мотоцикла.
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>от 40 000 ₽</span>
                  <span>•</span>
                  <span>Гарантия 10 лет</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-10 shadow-lg mb-20">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">Почему выбирают нас</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Точный расчет</h3>
              <p className="text-gray-600">Онлайн-калькулятор за несколько секунд</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Гарантия качества</h3>
              <p className="text-gray-600">На все работы до 20 лет гарантии</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Быстрый монтаж</h3>
              <p className="text-gray-600">Установка в кратчайшие сроки</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Опыт работы</h3>
              <p className="text-gray-600">Более 10 лет на рынке</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/calculator/fence"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
          >
            <Calculator className="w-5 h-5" />
            Рассчитать стоимость
          </Link>
        </div>
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

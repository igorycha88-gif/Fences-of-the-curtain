'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { LogOut, ChevronDown, ChevronRight, BookOpen, Menu } from 'lucide-react';
import { MobileSidebar } from '@/components/admin/Layout/MobileSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isReferencesCollapsed, setIsReferencesCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    const saved = localStorage.getItem('referencesCollapsed');
    if (saved !== null) {
      setIsReferencesCollapsed(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('referencesCollapsed', JSON.stringify(isReferencesCollapsed));
  }, [isReferencesCollapsed]);

  const toggleReferences = () => {
    setIsReferencesCollapsed(!isReferencesCollapsed);
  };

  const handleLogout = async () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
    await signOut({ callbackUrl: siteUrl, redirect: true });
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#22c55e',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />

      <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <header className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center gap-3 md:hidden">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Админ-панель</h1>
      </header>

      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r flex flex-col hidden md:flex">
        <div className="p-6 flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900">Админ-панель</h1>
        </div>
        <nav className="flex-1 overflow-y-auto min-h-0">
          <ul className="space-y-2 px-3 pb-4">
            <li>
              <a 
                href="/admin/dashboard" 
                className={`block px-3 py-3 rounded-lg transition-colors ${
                  isActive('/admin/dashboard')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Дашборд
              </a>
            </li>
            <li>
              <a 
                href="/admin/orders" 
                className={`block px-3 py-3 rounded-lg transition-colors ${
                  isActive('/admin/orders')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Заявки
              </a>
            </li>
            <li>
              <a 
                href="/admin/estimates" 
                className={`block px-3 py-3 rounded-lg transition-colors ${
                  isActive('/admin/estimates')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Расчеты
              </a>
            </li>
            <li>
              <a
                href="/admin/truss-calculator"
                className={`block px-3 py-3 rounded-lg transition-colors ${
                  isActive('/admin/truss-calculator')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Калькулятор ферм
              </a>
            </li>
            <li>
              <a 
                href="/admin/about" 
                className={`block px-3 py-3 rounded-lg transition-colors ${
                  isActive('/admin/about')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                О нас
              </a>
            </li>
            <li className="pt-4 border-t mt-4">
              <button
                onClick={toggleReferences}
                className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Справочники</span>
                </div>
                {isReferencesCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </li>
            {!isReferencesCollapsed && (
              <>
                <li>
                  <a 
                    href="/admin/references/fence-types" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/fence-types')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Типы заборов
                  </a>
                </li>
                <li>
                  <a 
                    href="/admin/references/lags" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/lags')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Лаги
                  </a>
                </li>
                <li>
                  <a 
                    href="/admin/references/posts" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/posts')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Столбы
                  </a>
                </li>
                <li>
                  <a 
                    href="/admin/references/profnastil" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/profnastil')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Профнастил
                  </a>
                </li>
                <li>
                  <a 
                    href="/admin/references/picket" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/picket')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Евроштакетник
                  </a>
                </li>
                <li>
                  <a 
                    href="/admin/references/mesh" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/mesh')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Сетка-рабица
                  </a>
                </li>
                <li>
                  <a 
                    href="/admin/references/panel3d" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/panel3d')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    3D-панели
                  </a>
                </li>
                <li className="pt-2 mt-2 border-t border-gray-100">
                  <span className="block px-6 py-1 text-xs font-semibold text-gray-400 uppercase">Фермы</span>
                </li>
                <li>
                  <a 
                    href="/admin/references/truss-roof-coverings" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/truss-roof-coverings')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Покрытие крыши
                  </a>
                </li>
                <li>
                  <a 
                    href="/admin/references/truss-posts" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/truss-posts')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Столбы для навеса
                  </a>
                </li>
                <li>
                  <a 
                    href="/admin/references/truss-crossbeams" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/truss-crossbeams')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Перекладины
                  </a>
                </li>
                <li>
                  <a 
                    href="/admin/references/truss-struts" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/truss-struts')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Перемычки
                  </a>
                </li>
                <li>
                  <a 
                    href="/admin/references/truss-arches" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/truss-arches')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Арочная дуга
                  </a>
                </li>
                <li className="pt-2 mt-2 border-t border-gray-100">
                  <span className="block px-6 py-1 text-xs font-semibold text-gray-400 uppercase">Заборы</span>
                </li>
                <li>
                  <a 
                    href="/admin/references/gates" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/gates')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Ворота
                  </a>
                </li>
                <li>
                  <a 
                    href="/admin/references/wickets" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/wickets')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Калитки
                  </a>
                </li>
                <li>
                  <a 
                    href="/admin/references/mounting-hardware" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/mounting-hardware')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Монтажная фурнитура
                  </a>
                </li>
                <li>
                  <a 
                    href="/admin/references/works" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/works')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Работы по монтажу
                  </a>
                </li>
                <li>
                  <a 
                    href="/admin/references/contact-info" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/contact-info')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Контактная информация
                  </a>
                </li>
                <li>
                  <a 
                    href="/admin/references/notification-recipients" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/references/notification-recipients')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Получатели уведомлений
                  </a>
                </li>
                <li>
                  <a 
                    href="/admin/portfolio" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/portfolio')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Портфолио
                  </a>
                </li>
                <li>
                  <a 
                    href="/admin/users" 
                    className={`block px-6 py-3 rounded-lg transition-colors ${
                      isActive('/admin/users')
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Пользователи
                  </a>
                </li>
              </>
            )}
          </ul>
        </nav>
        <div className="flex-shrink-0 p-4 border-t bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
              {session.user?.name?.[0] || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 truncate">{session.user?.name}</p>
              <p className="text-sm text-gray-500 truncate">{session.user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>
      <main className="ml-0 md:ml-64 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}

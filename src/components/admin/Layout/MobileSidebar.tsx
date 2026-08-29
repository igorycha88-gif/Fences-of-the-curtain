'use client';

import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { LogOut, BookOpen, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isReferencesCollapsed, setIsReferencesCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('referencesCollapsed');
    if (saved !== null) {
      setIsReferencesCollapsed(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('referencesCollapsed', JSON.stringify(isReferencesCollapsed));
  }, [isReferencesCollapsed]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
    await signOut({ callbackUrl: siteUrl, redirect: true });
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  const handleNavClick = () => {
    onClose();
  };

  const toggleReferences = () => {
    setIsReferencesCollapsed(!isReferencesCollapsed);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:hidden`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Админ-панель</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto h-[calc(100%-140px)]">
          <ul className="space-y-1 p-3">
            <li>
              <a
                href="/admin/dashboard"
                onClick={handleNavClick}
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
                onClick={handleNavClick}
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
                onClick={handleNavClick}
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
                href="/admin/business-metrics"
                onClick={handleNavClick}
                className={`block px-3 py-3 rounded-lg transition-colors ${
                  isActive('/admin/business-metrics')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Бизнес-метрики
              </a>
            </li>
            <li>
              <a
                href="/admin/calculator"
                onClick={handleNavClick}
                className={`block px-3 py-3 rounded-lg transition-colors ${
                  isActive('/admin/calculator')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Калькулятор
              </a>
            </li>
            <li>
              <a
                href="/admin/truss-calculator"
                onClick={handleNavClick}
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
                onClick={handleNavClick}
                className={`block px-3 py-3 rounded-lg transition-colors ${
                  isActive('/admin/about')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                О нас
              </a>
            </li>
            <li>
              <a
                href="/admin/reviews"
                onClick={handleNavClick}
                className={`block px-3 py-3 rounded-lg transition-colors ${
                  isActive('/admin/reviews')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Отзывы
              </a>
            </li>
            <li>
              <a
                href="/admin/seo-monitoring"
                onClick={handleNavClick}
                className={`block px-3 py-3 rounded-lg transition-colors ${
                  isActive('/admin/seo-monitoring')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                SEO-мониторинг
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
                    onClick={handleNavClick}
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
                    onClick={handleNavClick}
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
                    onClick={handleNavClick}
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
                    onClick={handleNavClick}
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
                    onClick={handleNavClick}
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
                    onClick={handleNavClick}
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
                    onClick={handleNavClick}
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
                    onClick={handleNavClick}
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
                    onClick={handleNavClick}
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
                    onClick={handleNavClick}
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
                    onClick={handleNavClick}
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
                    onClick={handleNavClick}
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
                    onClick={handleNavClick}
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
                    onClick={handleNavClick}
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
                    onClick={handleNavClick}
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
                    onClick={handleNavClick}
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
                    onClick={handleNavClick}
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
                    href="/admin/portfolio"
                    onClick={handleNavClick}
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
                    onClick={handleNavClick}
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
              {session?.user?.name?.[0] || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 truncate">{session?.user?.name}</p>
              <p className="text-sm text-gray-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти</span>
          </button>
        </div>
      </div>
    </>
  );
}

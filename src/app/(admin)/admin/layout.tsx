'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { LogOut, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isReferencesCollapsed, setIsReferencesCollapsed] = useState(false);

  useEffect(() => {
    console.log('[ADMIN LAYOUT] Session status:', status);
    
    if (status === 'unauthenticated') {
      console.log('[ADMIN LAYOUT] User not authenticated, redirecting to login');
      router.push('/login');
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
    console.log('[ADMIN LAYOUT] Logging out...');
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
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
      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">Админ-панель</h1>
        </div>
        <nav className="mt-6">
          <ul className="space-y-2">
            <li>
              <a 
                href="/admin/dashboard" 
                className={`block px-6 py-3 rounded-lg transition-colors ${
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
                className={`block px-6 py-3 rounded-lg transition-colors ${
                  isActive('/admin/orders')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Заявки
              </a>
            </li>
            <li className="pt-4 border-t mt-4">
              <button
                onClick={toggleReferences}
                className="w-full px-6 py-2 flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
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
              <div className="max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
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
              </div>
            )}
          </ul>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {session.user?.name?.[0] || 'A'}
              </div>
              <div>
                <p className="font-medium text-gray-900">{session.user?.name}</p>
                <p className="text-sm text-gray-500">{session.user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Выйти"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Выйти</span>
            </button>
          </div>
        </div>
      </aside>
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}

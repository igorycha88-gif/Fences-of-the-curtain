'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const getLinkClassName = (path: string) => {
    return isActive(path)
      ? 'text-primary font-semibold'
      : 'text-gray-600 hover:text-primary transition-colors';
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary">
          Заборы и Навесы
        </Link>

        <nav className="hidden md:flex gap-6 items-center">
          <Link href="/" className={getLinkClassName('/')}>
            Главная
          </Link>
          <Link href="/calculator" className={getLinkClassName('/calculator')}>
            Калькулятор
          </Link>
          <Link href="/services" className={getLinkClassName('/services')}>
            Услуги
          </Link>
          <Link href="/portfolio" className={getLinkClassName('/portfolio')}>
            Портфолио
          </Link>
          <Link href="/contacts" className={getLinkClassName('/contacts')}>
            Контакты
          </Link>

          <Link
            href="/admin/login"
            className="ml-4 bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Войти
          </Link>
        </nav>

        <button
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMenuOpen && (
        <nav className="md:hidden bg-white border-t">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link
              href="/"
              className={getLinkClassName('/')}
              onClick={() => setIsMenuOpen(false)}
            >
              Главная
            </Link>
            <Link
              href="/calculator"
              className={getLinkClassName('/calculator')}
              onClick={() => setIsMenuOpen(false)}
            >
              Калькулятор
            </Link>
            <Link
              href="/services"
              className={getLinkClassName('/services')}
              onClick={() => setIsMenuOpen(false)}
            >
              Услуги
            </Link>
            <Link
              href="/portfolio"
              className={getLinkClassName('/portfolio')}
              onClick={() => setIsMenuOpen(false)}
            >
              Портфолио
            </Link>
            <Link
              href="/contacts"
              className={getLinkClassName('/contacts')}
              onClick={() => setIsMenuOpen(false)}
            >
              Контакты
            </Link>
            <Link
              href="/admin/login"
              className="bg-primary text-white px-6 py-2 rounded-lg font-semibold text-center hover:bg-primary/90"
              onClick={() => setIsMenuOpen(false)}
            >
              Войти
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

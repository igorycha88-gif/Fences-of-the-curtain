'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Fence, Sun, Moon } from 'lucide-react';
import ContactPhoneBadge from './ContactPhoneBadge';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const navLinks = [
    { href: '/', label: 'Главная' },
    { href: '/calculator', label: 'Калькулятор' },
    { href: '/services', label: 'Услуги' },
    { href: '/portfolio', label: 'Портфолио' },
    { href: '/about', label: 'О нас' },
    { href: '/contacts', label: 'Контакты' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'glass py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Fence className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
            Заборы и Навесы
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isActive(link.href)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-1">
            <ContactPhoneBadge variant="header" />
            <a
              href="https://t.me/+79261505088"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-[#26A5E4]/10 hover:bg-[#26A5E4]/20 text-[#26A5E4] flex items-center justify-center transition-all duration-300 hover:scale-105"
              title="Написать в Telegram"
              aria-label="Написать в Telegram"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/></svg>
            </a>
            <a
              href="https://max.ru/u/f9LHodD0cOJ7LGkDL9PvtHHVrZvCEayUREFPLzA_z2T6S8TZGGuCAzOPWpY"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] flex items-center justify-center transition-all duration-300 hover:scale-105"
              title="Написать в Макс"
              aria-label="Написать в Макс"
            >
              <svg className="w-4 h-4" viewBox="0 0 25 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12.3405 23.9342C9.97568 23.9342 8.87728 23.5899 6.97252 22.2125C5.76041 23.762 1.94518 24.9672 1.77774 22.9012C1.77774 21.3535 1.42788 20.0492 1.04269 18.6132C0.570922 16.8544 0.0461426 14.898 0.0461426 12.0546C0.0461426 5.27426 5.6424 0.175079 12.2777 0.175079C18.913 0.175079 24.1153 5.52322 24.1153 12.1205C24.1153 18.7178 18.7474 23.9342 12.3405 23.9342ZM12.4368 6.03673C9.20791 5.86848 6.68817 8.0948 6.13253 11.5794C5.6724 14.465 6.48821 17.9812 7.18602 18.1582C7.51488 18.2416 8.35763 17.564 8.87711 17.0475C9.73154 17.5981 10.712 18.0245 11.8019 18.0813C15.1168 18.254 18.0544 15.6761 18.228 12.382C18.4016 9.08792 15.7517 6.20946 12.4368 6.03673Z"/></svg>
            </a>
          </div>
          
          <button
            onClick={() => setIsDark(!isDark)}
            className="w-10 h-10 rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-all duration-300 hover:scale-105"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <Link
            href="/admin/login"
            className="btn-primary"
          >
            Войти
          </Link>
        </div>

        <div className="flex lg:hidden items-center gap-1">
          <ContactPhoneBadge variant="header" />

          <button
            onClick={() => setIsDark(!isDark)}
            className="w-10 h-10 rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-all duration-300 hover:scale-105"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden absolute top-full left-0 right-0 bg-background shadow-lg overflow-hidden transition-all duration-500 ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                isActive(link.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin/login"
            className="mt-2 btn-primary text-center"
            onClick={() => setIsMenuOpen(false)}
          >
            Войти
          </Link>
        </nav>
      </div>
    </header>
  );
}

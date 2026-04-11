'use client';

import Link from 'next/link';
import { Home, ExternalLink } from 'lucide-react';
import { useContactInfo } from '@/components/providers/ContactInfoProvider';

export default function HomeFooter() {
  const contactInfo = useContactInfo();

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-5 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Заборы и Навесы</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Профессиональные решения для ограждения территории
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Услуги</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li><Link href="/services" className="hover:text-primary transition-colors">Заборы</Link></li>
              <li><Link href="/services" className="hover:text-primary transition-colors">Навесы</Link></li>
              <li><Link href="/services" className="hover:text-primary transition-colors">Ворота</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Информация</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li><Link href="/calculator" className="hover:text-primary transition-colors">Калькулятор</Link></li>
              <li><Link href="/portfolio" className="hover:text-primary transition-colors">Портфолио</Link></li>
              <li><Link href="/contacts" className="hover:text-primary transition-colors">Контакты</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Контакты</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>{contactInfo.phone || 'Данные не указаны'}</li>
              <li>{contactInfo.email || 'Данные не указаны'}</li>
              <li>Пн-Сб: 9:00 - 18:00</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Мы на площадках</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <a href="https://avito.ru" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                  Авито <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
              <li>
                <a href="https://youla.ru" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                  Юла <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
              <li>
                <a href="https://profi.ru" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                  Профи.ру <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
              <li>
                <a href="https://yandex.ru/uslugi" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                  Яндекс.Услуги <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
              <li>
                <a href="https://2gis.ru" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                  2ГИС <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-muted/20 pt-8 text-center text-muted-foreground text-sm">
          <p>&copy; 2026 Заборы и Навесы. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}

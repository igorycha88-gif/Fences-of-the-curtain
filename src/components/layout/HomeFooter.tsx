'use client';

import Link from 'next/link';
import { Home, ExternalLink } from 'lucide-react';
import { useContactInfo } from '@/components/providers/ContactInfoProvider';

export default function HomeFooter() {
  const contactInfo = useContactInfo();

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 lg:grid-cols-7 gap-8 mb-12">
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
            <h4 className="font-semibold mb-4">Заборы</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li><Link href="/services/zabor-iz-profnastila" className="hover:text-primary transition-colors">Забор из профнастила</Link></li>
              <li><Link href="/services/zabor-iz-evroshtaketnika" className="hover:text-primary transition-colors">Забор из евроштакетника</Link></li>
              <li><Link href="/services/zabor-iz-3d-panelej" className="hover:text-primary transition-colors">Забор из 3D-панелей</Link></li>
              <li><Link href="/services/zabor-iz-setki-rabitsy" className="hover:text-primary transition-colors">Забор из сетки-рабицы</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Навесы</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li><Link href="/services/naves-pod-mashinu" className="hover:text-primary transition-colors">Навес под машину</Link></li>
              <li><Link href="/services/naves-iz-polikarbonata" className="hover:text-primary transition-colors">Навес из поликарбоната</Link></li>
              <li><Link href="/calculator/fence" className="hover:text-primary transition-colors">Калькулятор забора</Link></li>
              <li><Link href="/calculator/canopy" className="hover:text-primary transition-colors">Калькулятор навеса</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Информация</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li><Link href="/portfolio" className="hover:text-primary transition-colors">Портфолио</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Блог</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">Вопросы и ответы</Link></li>
              <li><Link href="/contacts" className="hover:text-primary transition-colors">Контакты</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Контакты</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>{contactInfo.phone || 'Данные не указаны'}</li>
              <li>{contactInfo.email || 'Данные не указаны'}</li>
              <li>{contactInfo.workHours?.monFri ? `Пн-Пт: ${contactInfo.workHours.monFri}` : 'Пн-Пт: не указано'}</li>
              {contactInfo.workHours?.sat && <li>Сб: {contactInfo.workHours.sat}</li>}
              {contactInfo.workHours?.sun && <li>Вс: {contactInfo.workHours.sun}</li>}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Города</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li><Link href="/zabory-navesy/balashiha" className="hover:text-primary transition-colors">Балашиха</Link></li>
              <li><Link href="/zabory-navesy/lyubercy" className="hover:text-primary transition-colors">Люберцы</Link></li>
              <li><Link href="/zabory-navesy/podolsk" className="hover:text-primary transition-colors">Подольск</Link></li>
              <li><Link href="/zabory-navesy/ramenskoe" className="hover:text-primary transition-colors">Раменское</Link></li>
              <li><Link href="/zabory-navesy/elektrostal" className="hover:text-primary transition-colors">Электросталь</Link></li>
              <li><Link href="/zabory-navesy/kolomna" className="hover:text-primary transition-colors">Коломна</Link></li>
              <li><Link href="/zabory-navesy" className="hover:text-primary transition-colors">Все города →</Link></li>
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
                <a href="https://youla.ru/ramenskoe/uslugi/remont-stroitelstvo/zabory-i-oghrazhdieniia-pod-kliuch-69da7a2a81154d9bd6039bd4" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                  Юла <ExternalLink className="w-3 h-3 opacity-50" />
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

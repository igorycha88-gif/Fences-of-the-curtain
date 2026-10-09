import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  },
}));

jest.mock('@/components/layout/Header', () => ({
  __esModule: true,
  default: function MockHeader() {
    return <div data-testid="mock-header" />;
  },
}));

jest.mock('@/hooks/useScrollReveal', () => ({
  __esModule: true,
  AnimatedSection: function MockAnimatedSection({ children }: any) {
    return <div>{children}</div>;
  },
}));

jest.mock('@/components/providers/ContactInfoProvider', () => ({
  useContactInfo: () => mockContactInfoFn(),
}));

const mockContactInfoFn = jest.fn(() => ({
  address: 'г. Москва, ул. Тестовая, д. 1',
  phone: '+74993901595',
  email: 'info@test.ru',
  workHours: { monFri: '09:00–18:00', sat: '09:00–15:00', sun: 'выходной' },
}));

const trackEventMock = jest.fn();

jest.mock('@/lib/analytics', () => ({
  __esModule: true,
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

jest.mock('@/lib/seo/metrika', () => ({
  __esModule: true,
  metrikaEvents: {
    phoneClick: jest.fn(),
    emailClick: jest.fn(),
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    review: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 0 } }),
    },
  },
}));

jest.mock('@/components/layout/HomeFooter', () => ({
  __esModule: true,
  default: function MockHomeFooter() {
    return <div data-testid="mock-home-footer" />;
  },
}));

jest.mock('@/components/layout/HeroCallButton', () => ({
  __esModule: true,
  default: function MockHeroCallButton() {
    return <div data-testid="mock-hero-call" />;
  },
}));

jest.mock('@/components/garage/GarageBanner', () => ({
  __esModule: true,
  default: function MockGarageBanner() {
    return <div data-testid="mock-garage-banner" />;
  },
}));

jest.mock('@/components/promotions/PromotionBanner', () => ({
  __esModule: true,
  PromotionBanner: function MockPromotionBanner() {
    return <div data-testid="mock-promotion-banner" />;
  },
}));

jest.mock('@/components/reviews/YandexReviews', () => ({
  __esModule: true,
  YandexReviews: function MockYandexReviews() {
    return <div data-testid="mock-yandex-reviews" />;
  },
}));

jest.mock('@/components/seo/CommercialFactors', () => ({
  __esModule: true,
  default: function MockCommercialFactors() {
    return <div data-testid="mock-commercial-factors" />;
  },
}));

jest.mock('@/components/seo/MontageInDayBanner', () => ({
  __esModule: true,
  default: function MockMontageInDayBanner() {
    return <div data-testid="mock-montage-banner" />;
  },
}));

import ContactsPage from '@/app/(public)/contacts/page';
import HomePage from '@/app/page';
import { LEGAL_REQUISITES } from '@/lib/seo/constants';

describe('Страница /contacts: реквизиты', () => {
  it('рендерит все общие реквизиты ИП', () => {
    render(<ContactsPage />);
    expect(screen.getByText(LEGAL_REQUISITES.fullName)).toBeInTheDocument();
    expect(screen.getAllByText(LEGAL_REQUISITES.legalAddress).length).toBeGreaterThan(0);
    expect(screen.getAllByText(LEGAL_REQUISITES.productionAddress).length).toBeGreaterThan(0);
    expect(screen.getByText(LEGAL_REQUISITES.inn)).toBeInTheDocument();
    expect(screen.getByText(LEGAL_REQUISITES.ogrnip)).toBeInTheDocument();
  });

  it('рендерит все банковские реквизиты', () => {
    render(<ContactsPage />);
    expect(screen.getByText(LEGAL_REQUISITES.bank.name)).toBeInTheDocument();
    expect(screen.getByText(LEGAL_REQUISITES.bank.bik)).toBeInTheDocument();
    expect(screen.getByText(LEGAL_REQUISITES.bank.correspondentAccount)).toBeInTheDocument();
    expect(screen.getByText(LEGAL_REQUISITES.bank.checkingAccount)).toBeInTheDocument();
  });

  it('содержит заголовки секций реквизитов', () => {
    render(<ContactsPage />);
    expect(screen.getByText('Реквизиты')).toBeInTheDocument();
    expect(screen.getByText('Банковские реквизиты')).toBeInTheDocument();
  });

  it('содержит ссылку на страницу /rekvizity', () => {
    render(<ContactsPage />);
    const link = screen.getByRole('link', { name: /открыть страницу реквизитов/i });
    expect(link).toHaveAttribute('href', '/rekvizity');
  });
});

describe('Страница /contacts: работа с юрлицами', () => {
  it('рендерит карточку-оффер с заголовком и преимуществами', () => {
    render(<ContactsPage />);
    expect(screen.getByText('Работаем с юридическими лицами и ИП')).toBeInTheDocument();
    expect(screen.getByText('Договор на монтаж забора или навеса')).toBeInTheDocument();
    expect(screen.getByText('Счёт и безналичная оплата')).toBeInTheDocument();
    expect(screen.getByText('Закрывающие документы — акты выполненных работ')).toBeInTheDocument();
    expect(screen.getByText('Подготовка договора и счёта — в течение 1 рабочего дня')).toBeInTheDocument();
  });

  it('упоминает ИП в тексте оффера', () => {
    render(<ContactsPage />);
    expect(screen.getByText(new RegExp(`Мы — ${LEGAL_REQUISITES.shortName}`))).toBeInTheDocument();
  });

  it('CTA юрлицам — кликабельный телефон', () => {
    render(<ContactsPage />);
    const link = screen.getByRole('link', { name: /обсудить сотрудничество/i });
    expect(link).toHaveAttribute('href', 'tel:74993901595');
  });

  it('при отсутствии телефона в БД fallback номера в href совпадает с видимым текстом', () => {
    mockContactInfoFn.mockReturnValueOnce({
      address: null,
      phone: null,
      email: null,
      workHours: null,
    });
    render(<ContactsPage />);
    const ctaLegal = screen.getByRole('link', { name: /обсудить сотрудничество/i });
    expect(ctaLegal).toHaveAttribute('href', 'tel:74993901595');
    expect(ctaLegal.textContent).toContain('+74993901595');
    const telLinks = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('href') === 'tel:74993901595');
    expect(telLinks.length).toBe(2);
  });
});

describe('Страница /contacts: карта', () => {
  it('рендерит iframe Яндекс.Карты с меткой производства (pt) и центром (ll)', () => {
    render(<ContactsPage />);
    const iframe = screen.getByTitle(/адрес производства/i);
    const src = iframe.getAttribute('src') || '';
    expect(src).toContain('yandex.ru/map-widget/v1');
    expect(src).toContain('pt=38.463950,55.587673');
    expect(src).toContain('ll=38.463950%2C55.587673');
    expect(src).toContain('z=15');
    expect(iframe).toHaveAttribute('loading', 'lazy');
  });

  it('подписи под картой содержат производство и юр. адрес', () => {
    render(<ContactsPage />);
    expect(screen.getByText(/Производство:/)).toBeInTheDocument();
    expect(screen.getByText(/Юридический адрес:/)).toBeInTheDocument();
  });
});

describe('Страница /contacts: копирование реквизитов', () => {
  const writeTextMock = jest.fn().mockResolvedValue(undefined);

  it('копирует реквизиты в буфер обмена и показывает подтверждение', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(<ContactsPage />);
    const button = screen.getByRole('button', { name: /скопировать реквизиты/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledTimes(1);
    });
    const copiedText = writeTextMock.mock.calls[0][0] as string;
    expect(copiedText).toContain(LEGAL_REQUISITES.inn);
    expect(copiedText).toContain(LEGAL_REQUISITES.ogrnip);
    expect(copiedText).toContain(LEGAL_REQUISITES.legalAddress);
    expect(copiedText).toContain(LEGAL_REQUISITES.productionAddress);
    expect(copiedText).toContain(LEGAL_REQUISITES.bank.checkingAccount);
    expect(await screen.findByText('Скопировано')).toBeInTheDocument();
  });

  it('не падает, если буфер обмена недоступен', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockRejectedValue(new Error('clipboard denied')) },
    });

    render(<ContactsPage />);
    const button = screen.getByRole('button', { name: /скопировать реквизиты/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /скопировать реквизиты/i })).toBeInTheDocument();
    });
  });
});

describe('Главная страница: бейдж о работе с юрлицами', () => {
  it('рендерит бейдж «Работаем с юрлицами» в hero', async () => {
    render(await HomePage());
    expect(screen.getByText('Работаем с юрлицами')).toBeInTheDocument();
  });
});

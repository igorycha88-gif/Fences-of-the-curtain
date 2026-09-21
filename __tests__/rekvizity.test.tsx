import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

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

jest.mock('@/components/layout/Footer', () => ({
  __esModule: true,
  default: function MockFooter() {
    return <div data-testid="mock-footer" />;
  },
}));

jest.mock('@/hooks/useScrollReveal', () => ({
  __esModule: true,
  AnimatedSection: function MockAnimatedSection({ children }: any) {
    return <div>{children}</div>;
  },
}));

jest.mock('@/components/providers/ContactInfoProvider', () => ({
  useContactInfo: () => ({ phone: '+74993901595', email: 'info@test.ru' }),
}));

jest.mock('@/components/cookie-consent/CookieConsentProvider', () => ({
  CookieConsentContext: {
    Provider: ({ children }: any) => children,
  },
}));

import RekvizityPage from '@/app/(public)/rekvizity/page';
import HomeFooter from '@/components/layout/HomeFooter';
import { LEGAL_REQUISITES, PAGE_METADATA, SITEMAP_CONFIG } from '@/lib/seo/constants';
import { generateOrganizationJsonLd } from '@/lib/seo/jsonld';

const RealFooter =
  jest.requireActual('@/components/layout/Footer').default;

describe('LEGAL_REQUISITES: форматы реквизитов', () => {
  it('ИНН — 12 цифр', () => {
    expect(LEGAL_REQUISITES.inn).toMatch(/^\d{12}$/);
  });

  it('ОГРНИП — 15 цифр', () => {
    expect(LEGAL_REQUISITES.ogrnip).toMatch(/^\d{15}$/);
  });

  it('БИК — 9 цифр', () => {
    expect(LEGAL_REQUISITES.bank.bik).toMatch(/^\d{9}$/);
  });

  it('Расчётный счёт — 20 цифр', () => {
    expect(LEGAL_REQUISITES.bank.checkingAccount).toMatch(/^\d{20}$/);
  });

  it('Корр. счёт — 20 цифр, начинается с 301', () => {
    expect(LEGAL_REQUISITES.bank.correspondentAccount).toMatch(/^301\d{17}$/);
  });

  it('полное наименование содержит статус ИП', () => {
    expect(LEGAL_REQUISITES.fullName).toMatch(/^Индивидуальный предприниматель/);
  });
});

describe('Страница /rekvizity', () => {
  it('рендерит все общие реквизиты', () => {
    render(<RekvizityPage />);
    expect(screen.getByText(LEGAL_REQUISITES.fullName)).toBeInTheDocument();
    expect(screen.getByText(LEGAL_REQUISITES.shortName)).toBeInTheDocument();
    expect(screen.getByText(LEGAL_REQUISITES.legalAddress)).toBeInTheDocument();
    expect(screen.getByText(LEGAL_REQUISITES.productionAddress)).toBeInTheDocument();
    expect(screen.getByText(LEGAL_REQUISITES.inn)).toBeInTheDocument();
    expect(screen.getByText(LEGAL_REQUISITES.ogrnip)).toBeInTheDocument();
  });

  it('рендерит все банковские реквизиты', () => {
    render(<RekvizityPage />);
    expect(screen.getByText(LEGAL_REQUISITES.bank.name)).toBeInTheDocument();
    expect(screen.getByText(LEGAL_REQUISITES.bank.bik)).toBeInTheDocument();
    expect(screen.getByText(LEGAL_REQUISITES.bank.correspondentAccount)).toBeInTheDocument();
    expect(screen.getByText(LEGAL_REQUISITES.bank.checkingAccount)).toBeInTheDocument();
  });

  it('содержит заголовки секций', () => {
    render(<RekvizityPage />);
    expect(screen.getByText('Общие реквизиты')).toBeInTheDocument();
    expect(screen.getByText('Банковские реквизиты')).toBeInTheDocument();
  });
});

describe('Футеры: юридическая строка', () => {
  it('Footer содержит ИП, ИНН и ссылку на /rekvizity', () => {
    render(<RealFooter />);
    expect(screen.getByText(new RegExp(LEGAL_REQUISITES.shortName))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(LEGAL_REQUISITES.inn))).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Реквизиты' });
    expect(link).toHaveAttribute('href', '/rekvizity');
  });

  it('HomeFooter содержит ссылку на /rekvizity в колонке «Информация»', () => {
    render(<HomeFooter />);
    const links = screen.getAllByRole('link', { name: 'Реквизиты' });
    expect(links.length).toBeGreaterThan(0);
    expect(links.some((l) => l.getAttribute('href') === '/rekvizity')).toBe(true);
    expect(screen.getByText(new RegExp(LEGAL_REQUISITES.inn))).toBeInTheDocument();
  });
});

describe('SEO: JSON-LD и sitemap', () => {
  it('Organization JSON-LD содержит taxID (ИНН) и legalName', () => {
    const jsonLd = generateOrganizationJsonLd();
    expect(jsonLd.taxID).toBe(LEGAL_REQUISITES.inn);
    expect(jsonLd.legalName).toBe(LEGAL_REQUISITES.fullName);
  });

  it('страница /rekvizity добавлена в sitemap', () => {
    expect(SITEMAP_CONFIG.pages.some((p) => p.path === '/rekvizity')).toBe(true);
  });

  it('метаданные страницы заданы', () => {
    expect(PAGE_METADATA.rekvizity.title).toContain('Реквизиты');
    expect(PAGE_METADATA.rekvizity.path).toBe('/rekvizity');
  });
});

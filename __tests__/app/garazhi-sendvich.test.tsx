import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  },
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ alt, ...props }: any) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...props} />;
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

import GarazhiSendvichPage, { metadata } from '@/app/(public)/garazhi-iz-sendvich-panelej/page';
import GarageBanner from '@/components/garage/GarageBanner';
import {
  GARAGE_RATE_PER_SQM,
  GARAGE_SIZES,
  garagePriceFrom,
  GARAGE_COMPARE,
  GARAGE_FAQ,
  GARAGE_SIZE_OPTIONS,
} from '@/lib/garazhi/sendvichPaneli';

describe('/garazhi-iz-sendvich-panelej — посадочная «Гаражи из сэндвич-панелей» (ЧТЗ_SEO_Гаражи_Сэндвич_Панели)', () => {
  it('metadata: Title с ценой и размерами, canonical, robots index', () => {
    const title = (metadata.title as { absolute?: string })?.absolute ?? String(metadata.title);
    expect(title).toBe('Гараж из сэндвич-панелей под ключ — цена от 40 000 ₽/м², размеры 3х6–6х6 | Москва и МО');
    expect(metadata.alternates?.canonical).toBe('https://zabor-i-naves.ru/garazhi-iz-sendvich-panelej');
    expect((metadata as { robots?: { index: boolean } }).robots?.index).toBe(true);
  });

  it('рендерит H1 и все обязательные H2 по ЧТЗ', () => {
    render(<GarazhiSendvichPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Гаражи из сэндвич-панелей: цены и размеры');
    expect(screen.getByRole('heading', { name: /Размеры и цены: 3х4, 3х6, 4х6, 6х6/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Что входит в «под ключ»/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Тёплый гараж на зиму/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Сэндвич-панели, профлист или кирпич/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Какой бывает гараж из сэндвич-панелей/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Частые вопросы про гаражи/ })).toBeInTheDocument();
  });

  it('hero: цена от 40 000 ₽/м² + фото гаража с alt', () => {
    render(<GarazhiSendvichPage />);

    expect(screen.getByTestId('garage-rate')).toHaveTextContent('40 000');
    expect(screen.getByAltText(/Гараж из сэндвич-панелей под ключ/)).toBeInTheDocument();
  });

  it('таблица размеров: 5 строк, контрольные цены (3×6 = 720 000, 6×6 = 1 440 000)', () => {
    render(<GarazhiSendvichPage />);

    const table = screen.getByTestId('garage-sizes-table');
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(5);

    expect(table).toHaveTextContent('3 × 4 м');
    expect(table).toHaveTextContent('3 × 6 м');
    expect(table).toHaveTextContent('4 × 4 м');
    expect(table).toHaveTextContent('4 × 6 м');
    expect(table).toHaveTextContent('6 × 6 м');
    expect(table).toHaveTextContent('2 автомобиля');

    expect(table).toHaveTextContent('480 000');
    expect(table).toHaveTextContent('720 000');
    expect(table).toHaveTextContent('640 000');
    expect(table).toHaveTextContent('960 000');
    expect(table).toHaveTextContent('1 440 000');
  });

  it('цены считаются от согласованной ставки 40 000 ₽/м²', () => {
    expect(GARAGE_RATE_PER_SQM).toBe(40000);
    expect(garagePriceFrom(18)).toBe(720000);
    expect(garagePriceFrom(36)).toBe(1440000);
    expect(garagePriceFrom(24)).toBe(960000);
    GARAGE_SIZES.forEach((row) => {
      expect(row.sqm * GARAGE_RATE_PER_SQM).toBe(garagePriceFrom(row.sqm));
    });
  });

  it('SEO-хвост: в тексте обе формы — «сэндвич» и «сендвич»', () => {
    const { container } = render(<GarazhiSendvichPage />);
    const text = container.textContent || '';

    expect(text.toLowerCase()).toContain('сэндвич');
    expect(text.toLowerCase()).toContain('сендвич');
  });

  it('чек-лист «под ключ»: 5 компонентов', () => {
    render(<GarazhiSendvichPage />);

    const items = screen.getAllByTestId('garage-included-item');
    expect(items.length).toBe(5);
    expect(screen.getByText('Каркас')).toBeInTheDocument();
    expect(screen.getByText('Ворота')).toBeInTheDocument();
    expect(screen.getByText('Фундамент')).toBeInTheDocument();
  });

  it('таблица сравнения: сэндвич vs профлист vs кирпич (5 параметров)', () => {
    render(<GarazhiSendvichPage />);

    const table = screen.getByTestId('garage-compare-table');
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(GARAGE_COMPARE.length);
    expect(GARAGE_COMPARE.length).toBe(5);
    expect(table).toHaveTextContent('от 40 000 ₽/м²');
    expect(table).toHaveTextContent('от 20 000 ₽/м²');
    expect(table).toHaveTextContent('от 60 000 ₽/м²');
  });

  it('форма заявки: LeadForm с селектором «Размер гаража» и 5 опциями', () => {
    render(<GarazhiSendvichPage />);

    expect(screen.getByTestId('lead-form')).toBeInTheDocument();
    const select = screen.getByLabelText('Размер гаража');
    expect(select).toBeInTheDocument();
    expect(GARAGE_SIZE_OPTIONS.length).toBe(5);
    expect(GARAGE_SIZE_OPTIONS[1].label).toContain('3 × 6 м (18 м²)');
  });

  it('перелинковка: на зимний навес и цены навесов + телефон', () => {
    render(<GarazhiSendvichPage />);

    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/navesy/na-zimu-ot-snega');
    expect(links).toContain('/navesy/pod-klyuch-ceny');
    expect(links).toContain('tel:+74993901595');
  });

  it('рендерит Service, FAQPage и BreadcrumbList JSON-LD', () => {
    const { container } = render(<GarazhiSendvichPage />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const parsed = Array.from(scripts).map((s) => JSON.parse(s.textContent || '{}'));
    const types = parsed.flatMap((p) => (Array.isArray(p) ? p.map((x: any) => x['@type']) : [p['@type']]));
    expect(types).toContain('Service');
    expect(types).toContain('FAQPage');
    expect(types).toContain('BreadcrumbList');
  });

  it('FAQ: 8 вопросов, включая цену, зиму, профлист и «ракушку»', () => {
    expect(GARAGE_FAQ.length).toBeGreaterThanOrEqual(8);
    const faqText = GARAGE_FAQ.map((f) => f.question).join(' ').toLowerCase();
    expect(faqText).toContain('сколько стоит');
    expect(faqText).toContain('зимой');
    expect(faqText).toContain('профлист');
    expect(faqText).toContain('ракушк');

    render(<GarazhiSendvichPage />);
    expect(screen.getByTestId('faq-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('faq-item-7')).toBeInTheDocument();
  });

  it('GarageBanner на главной: ссылка «Цены и размеры» на посадочную', () => {
    render(<GarageBanner />);

    const link = screen.getByRole('link', { name: /Цены и размеры/ });
    expect(link.getAttribute('href')).toBe('/garazhi-iz-sendvich-panelej');
    expect(screen.getByText('Оставить заявку')).toBeInTheDocument();
  });
});

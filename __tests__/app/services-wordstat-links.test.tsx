import '@testing-library/jest-dom';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { IntersectionObserver: typeof MockIntersectionObserver }).IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

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

const pageContentFindMany = jest.fn();

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    pageContent: {
      findMany: (...args: unknown[]) => pageContentFindMany(...args),
    },
  },
}));

import ServicesPage from '@/app/(public)/services/page';
import HomeFooter from '@/components/layout/HomeFooter';

describe('Навигация на Wordstat-посадочные (ЧТЗ_SEO_расширение_Wordstat, TASK-INF-001)', () => {
  beforeEach(() => {
    pageContentFindMany.mockReset();
    pageContentFindMany.mockResolvedValue([]);
  });

  it('/services: карточки «Забор жалюзи» и «Забор под ключ» ведут на корневые посадочные', async () => {
    render(await ServicesPage());

    const zhalyuzi = screen.getAllByRole('link', { name: /^Забор жалюзи$/ })[0];
    expect(zhalyuzi).toHaveAttribute('href', '/zabor-zhalyuzi');

    const podKlyuch = screen.getAllByRole('link', { name: /^Забор под ключ$/ })[0];
    expect(podKlyuch).toHaveAttribute('href', '/zabory-pod-klyuch');

    // Существующие услуги по-прежнему ведут в /services/*
    const profnastil = screen.getAllByRole('link', { name: 'Забор из профнастила' })[0];
    expect(profnastil).toHaveAttribute('href', '/services/zabor-iz-profnastila');
  });

  it('/services: блок «Ворота и калитки» с ссылкой на /otkatnye-vorota', async () => {
    render(await ServicesPage());

    expect(screen.getByRole('heading', { name: /Ворота и калитки/ })).toBeInTheDocument();
    const vorota = screen.getAllByRole('link', { name: /^Откатные ворота$/ })[0];
    expect(vorota).toHaveAttribute('href', '/otkatnye-vorota');
    const vorotaCalc = screen
      .getAllByRole('link', { name: /Рассчитать стоимость/ })
      .map((link) => link.getAttribute('href'));
    expect(vorotaCalc).toContain('/calculator/gates');
  });

  it('футер: ссылки на все 5 новых страниц', () => {
    render(<HomeFooter />);

    const footerLinks = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(footerLinks).toContain('/zabor-zhalyuzi');
    expect(footerLinks).toContain('/zabory-pod-klyuch');
    expect(footerLinks).toContain('/otkatnye-vorota');
    expect(footerLinks).toContain('/navesy/arochnye');
    expect(footerLinks).toContain('/navesy/dvuskatnye');
  });
});

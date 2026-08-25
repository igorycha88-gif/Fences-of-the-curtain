import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import CityGrid from '@/components/geo/CityGrid';
import { getCityBySlug } from '@/lib/geo/cities';

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  },
}));

jest.mock('lucide-react', () => ({
  MapPin: () => <span data-testid="map-pin" />,
  ArrowRight: () => <span data-testid="arrow" />,
}));

const eastCity = getCityBySlug('balashiha')!;
const southeastCity = getCityBySlug('lyubercy')!;
const southCity = getCityBySlug('podolsk')!;

describe('CityGrid', () => {
  it('renders flat grid of city links', () => {
    render(<CityGrid cities={[eastCity, southeastCity]} />);

    expect(screen.getByText('Балашиха')).toBeInTheDocument();
    expect(screen.getByText('Люберцы')).toBeInTheDocument();
    expect(screen.getByText('Балашиха').closest('a')).toHaveAttribute(
      'href',
      '/zabory-navesy/balashiha'
    );
  });

  it('groups cities by direction when groupByDirection is set', () => {
    render(
      <CityGrid cities={[eastCity, southeastCity, southCity]} groupByDirection />
    );

    expect(screen.getByText('Восток Подмосковья')).toBeInTheDocument();
    expect(screen.getByText('Юго-восток Подмосковья')).toBeInTheDocument();
    expect(screen.getByText('Юг Подмосковья')).toBeInTheDocument();
  });

  it('skips empty direction groups', () => {
    render(<CityGrid cities={[eastCity]} groupByDirection />);

    expect(screen.getByText('Восток Подмосковья')).toBeInTheDocument();
    expect(screen.queryByText('Юг Подмосковья')).not.toBeInTheDocument();
  });

  it('marks current city as non-link badge', () => {
    render(<CityGrid cities={[eastCity, southeastCity]} currentSlug="balashiha" />);

    const current = screen.getByText('Балашиха');
    expect(current.closest('a')).toBeNull();
    expect(screen.getByText('вы здесь')).toBeInTheDocument();
    expect(screen.getByText('Люберцы').closest('a')).toHaveAttribute(
      'href',
      '/zabory-navesy/lyubercy'
    );
  });
});

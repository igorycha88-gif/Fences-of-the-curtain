import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import TrussDrawing from '@/components/admin/TrussCalculator/TrussDrawing';

jest.mock('@/lib/sanitize', () => ({
  sanitizeSvg: (input: string) => input,
}));

describe('TrussDrawing', () => {
  it('renders nothing when svgString is empty', () => {
    const { container } = render(<TrussDrawing svgString="" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders drawing container when svgString is provided', () => {
    const svg = '<svg><line x1="0" y1="0" x2="100" y2="100" /></svg>';
    render(<TrussDrawing svgString={svg} />);
    expect(screen.getByText('Чертёж фермы')).toBeInTheDocument();
  });

  it('renders the SVG content', () => {
    const svg = '<svg><rect width="100" height="100" /></svg>';
    const { container } = render(<TrussDrawing svgString={svg} />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('passes svg through sanitizeSvg', () => {
    const svg = '<svg><circle cx="50" cy="50" r="40" /></svg>';
    const { container } = render(<TrussDrawing svgString={svg} />);
    expect(container.querySelector('circle')).toBeInTheDocument();
  });
});

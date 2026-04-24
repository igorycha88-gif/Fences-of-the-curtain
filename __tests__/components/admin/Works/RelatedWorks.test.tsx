import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RelatedWorks } from '@/components/admin/Works/RelatedWorks';

global.fetch = jest.fn();

const mockWorks = [
  {
    id: 'w1',
    name: 'Монтаж забора',
    category: 'installation',
    categoryName: 'Монтаж',
    unit: 'm',
    unitName: 'м.п.',
    price: 800,
    useInCalculator: true,
  },
];

describe('RelatedWorks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when loading', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { container } = render(<RelatedWorks fenceType="PROFNASTIL" />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when no works found', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
    const { container } = render(<RelatedWorks fenceType="PROFNASTIL" />);
    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('renders work items when data is loaded', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ items: mockWorks }),
    });
    render(<RelatedWorks fenceType="PROFNASTIL" />);
    await waitFor(() => {
      expect(screen.getByText(/Монтаж забора/)).toBeInTheDocument();
    });
    expect(screen.getByText(/800/)).toBeInTheDocument();
  });

  it('renders section header', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ items: mockWorks }),
    });
    render(<RelatedWorks fenceType="PROFNASTIL" />);
    await waitFor(() => {
      expect(screen.getByText(/Связанные работы/)).toBeInTheDocument();
    });
  });

  it('fetches with correct fenceType parameter', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
    render(<RelatedWorks fenceType="MESH" />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('fenceType=MESH'),
        expect.any(Object)
      );
    });
  });
});

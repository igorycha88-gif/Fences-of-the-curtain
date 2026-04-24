import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RelatedWorksByReference } from '@/components/admin/Works/RelatedWorksByReference';

global.fetch = jest.fn();

const mockWorks = [
  {
    id: 'w1',
    name: 'Установка столбов',
    category: 'installation',
    categoryName: 'Монтаж',
    unit: 'pcs',
    unitName: 'шт',
    price: 1500,
    useInCalculator: true,
  },
  {
    id: 'w2',
    name: 'Бетонирование',
    category: 'installation',
    categoryName: 'Монтаж',
    unit: 'pcs',
    unitName: 'шт',
    price: 2000,
    useInCalculator: true,
  },
];

describe('RelatedWorksByReference', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when loading', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { container } = render(
      <RelatedWorksByReference referenceType="POST" referenceId="post-1" />
    );
    expect(container.innerHTML).toBe('');
  });

  it('returns null when no works found', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
    const { container } = render(
      <RelatedWorksByReference referenceType="POST" referenceId="post-1" />
    );
    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('renders work items when data is loaded', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ items: mockWorks }),
    });
    render(<RelatedWorksByReference referenceType="POST" referenceId="post-1" />);
    await waitFor(() => {
      expect(screen.getByText(/Установка столбов/)).toBeInTheDocument();
      expect(screen.getByText(/Бетонирование/)).toBeInTheDocument();
    });
  });

  it('renders section header with correct title', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ items: mockWorks }),
    });
    render(<RelatedWorksByReference referenceType="POST" referenceId="post-1" />);
    await waitFor(() => {
      expect(screen.getByText(/Привязанные работы по монтажу/)).toBeInTheDocument();
    });
  });

  it('fetches with correct parameters', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
    render(<RelatedWorksByReference referenceType="LAG" referenceId="lag-123" />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('referenceType=LAG&referenceId=lag-123'),
        expect.any(Object)
      );
    });
  });
});

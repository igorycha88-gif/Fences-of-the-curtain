import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FaqClient from '@/components/faq/FaqClient';

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('lucide-react', () => ({
  ChevronDown: ({ className }: { className?: string }) => (
    <span data-testid="chevron" className={className}>v</span>
  ),
  Calculator: () => <span data-testid="calculator-icon">Calc</span>,
  HelpCircle: () => <span data-testid="help-icon">?</span>,
}));

jest.mock('@/lib/seo/metrika', () => ({
  metrikaEvents: {
    faqExpand: jest.fn(),
  },
}));

const mockItems = [
  { id: '1', question: 'Сколько стоит забор?', answer: 'Цена зависит от материала.', category: 'Заборы', sortOrder: 1, isActive: true },
  { id: '2', question: 'Какой навес выбрать?', answer: 'Зависит от бюджета.', category: 'Навесы', sortOrder: 2, isActive: true },
  { id: '3', question: 'Есть ли гарантия?', answer: 'Да, гарантия 2 года.', category: 'Заборы', sortOrder: 3, isActive: true },
];

describe('FaqClient', () => {
  it('renders section title', () => {
    render(<FaqClient items={mockItems} />);
    expect(screen.getByText('Вопросы и ответы')).toBeInTheDocument();
  });

  it('renders all FAQ questions', () => {
    render(<FaqClient items={mockItems} />);
    expect(screen.getByText('Сколько стоит забор?')).toBeInTheDocument();
    expect(screen.getByText('Какой навес выбрать?')).toBeInTheDocument();
    expect(screen.getByText('Есть ли гарантия?')).toBeInTheDocument();
  });

  it('renders category filter buttons', () => {
    render(<FaqClient items={mockItems} />);
    expect(screen.getByText('Все вопросы')).toBeInTheDocument();
    const categoryButtons = screen.getAllByRole('button', { name: 'Заборы' });
    expect(categoryButtons.length).toBeGreaterThanOrEqual(1);
    const navesyBtns = screen.getAllByRole('button', { name: 'Навесы' });
    expect(navesyBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('filters items by category when category button clicked', async () => {
    render(<FaqClient items={mockItems} />);
    const navesyBtn = screen.getAllByRole('button', { name: 'Навесы' })[0];
    await userEvent.click(navesyBtn);
    expect(screen.queryByText('Сколько стоит забор?')).not.toBeInTheDocument();
    expect(screen.getByText('Какой навес выбрать?')).toBeInTheDocument();
  });

  it('shows all items when "Все вопросы" is clicked', async () => {
    render(<FaqClient items={mockItems} />);
    const navesyBtn = screen.getAllByRole('button', { name: 'Навесы' })[0];
    await userEvent.click(navesyBtn);
    await userEvent.click(screen.getByText('Все вопросы'));
    expect(screen.getByText('Сколько стоит забор?')).toBeInTheDocument();
    expect(screen.getByText('Какой навес выбрать?')).toBeInTheDocument();
  });

  it('expands answer when question is clicked', async () => {
    render(<FaqClient items={mockItems} />);
    const questionBtn = screen.getByText('Сколько стоит забор?').closest('button')!;
    const answerContainer = questionBtn.parentElement!.querySelector('.overflow-hidden');
    expect(answerContainer?.className).toContain('max-h-0');
    await userEvent.click(questionBtn);
    expect(answerContainer?.className).toContain('max-h-96');
  });

  it('renders link to calculator', () => {
    render(<FaqClient items={mockItems} />);
    expect(screen.getByText('Калькулятор стоимости')).toHaveAttribute('href', '/calculator');
  });
});

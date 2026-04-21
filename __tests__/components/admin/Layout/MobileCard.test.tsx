import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileCard } from '@/components/admin/Layout/MobileCard';

describe('MobileCard', () => {
  const defaultFields = [
    { label: 'Имя', value: 'Иван Иванов' },
    { label: 'Телефон', value: '+7 (999) 123-45-67' },
    { label: 'Статус', value: 'Новая' },
  ];

  it('renders string title', () => {
    render(<MobileCard title="Test Card" fields={defaultFields} />);
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('renders all field labels and values', () => {
    render(<MobileCard title="Card" fields={defaultFields} />);
    expect(screen.getByText('Имя')).toBeInTheDocument();
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getAllByText('Телефон').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('+7 (999) 123-45-67').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onClick when card is clicked', () => {
    const onClick = jest.fn();
    render(<MobileCard title="Clickable" fields={defaultFields} onClick={onClick} />);
    fireEvent.click(screen.getByText('Clickable'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders badge when provided', () => {
    render(
      <MobileCard
        title="Card"
        fields={defaultFields}
        badge={<span data-testid="badge">Active</span>}
      />
    );
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(
      <MobileCard
        title="Card"
        fields={defaultFields}
        actions={<button data-testid="action-btn">Edit</button>}
      />
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
  });

  it('does not render actions section when not provided', () => {
    const { container } = render(<MobileCard title="Card" fields={defaultFields} />);
    const actionSection = container.querySelector('.border-t');
    expect(actionSection).toBeNull();
  });

  it('renders fullWidth fields correctly', () => {
    const fields = [
      { label: 'Комментарий', value: 'Длинный комментарий', fullWidth: true },
    ];
    render(<MobileCard title="Card" fields={fields} />);
    expect(screen.getByText('Длинный комментарий')).toBeInTheDocument();
  });

  it('renders React node title', () => {
    render(
      <MobileCard
        title={<span data-testid="custom-title">Custom Title</span>}
        fields={defaultFields}
      />
    );
    expect(screen.getByTestId('custom-title')).toBeInTheDocument();
  });
});

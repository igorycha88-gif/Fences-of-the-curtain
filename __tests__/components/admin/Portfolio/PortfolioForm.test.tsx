import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PortfolioForm } from '@/components/admin/Portfolio/PortfolioForm';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock('@/components/admin/Portfolio/ImageUploader', () => ({
  ImageUploader: ({ images, onChange }: any) => (
    <div data-testid="image-uploader">
      <span>Images: {images.length}</span>
      <button onClick={() => onChange(['img1.jpg'])}>Add Image</button>
    </div>
  ),
}));

describe('PortfolioForm', () => {
  const defaultProps = {
    onSubmit: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields', () => {
    render(<PortfolioForm {...defaultProps} />);
    expect(screen.getByText('Название')).toBeInTheDocument();
    expect(screen.getByText('Заборы')).toBeInTheDocument();
    expect(screen.getByText('Навесы')).toBeInTheDocument();
    expect(screen.getByText('Тип работы')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Описание выполненной работы...')).toBeInTheDocument();
  });

  it('renders with initial data when editing', () => {
    render(
      <PortfolioForm
        {...defaultProps}
        initialData={{
          title: 'Test Portfolio',
          category: 'fence',
          type: 'Забор из профнастила',
          description: 'Описание',
          images: ['img1.jpg'],
          active: true,
        }}
        isEditing={true}
      />
    );
    const titleInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    expect(titleInput.value).toBe('Test Portfolio');
  });

  it('shows validation errors on empty submit', () => {
    render(<PortfolioForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Сохранить'));
    expect(screen.getByText('Название обязательно')).toBeInTheDocument();
    expect(screen.getByText('Минимум 1 изображение')).toBeInTheDocument();
  });

  it('updates category on radio change', () => {
    render(<PortfolioForm {...defaultProps} />);
    const canopyRadio = screen.getByDisplayValue('canopy');
    fireEvent.click(canopyRadio);
    expect(canopyRadio).toBeChecked();
  });

  it('renders cancel button', () => {
    render(<PortfolioForm {...defaultProps} />);
    expect(screen.getByText('Отмена')).toBeInTheDocument();
  });

  it('renders active checkbox', () => {
    render(<PortfolioForm {...defaultProps} />);
    const checkbox = document.getElementById('active') as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(true);
  });

  it('renders image uploader', () => {
    render(<PortfolioForm {...defaultProps} />);
    expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
  });
});

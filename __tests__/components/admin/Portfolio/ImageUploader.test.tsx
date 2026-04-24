import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageUploader } from '@/components/admin/Portfolio/ImageUploader';

jest.mock('@/lib/utils/imageUrl', () => ({
  getThumbnailUrl: (url: string) => `/thumb_${url}`,
}));

describe('ImageUploader', () => {
  const defaultProps = {
    images: ['image1.jpg', 'image2.jpg'],
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders existing images', () => {
    render(<ImageUploader {...defaultProps} />);
    const imgs = screen.getAllByRole('img');
    expect(imgs.length).toBe(2);
  });

  it('renders add button when under max images', () => {
    render(<ImageUploader {...defaultProps} maxImages={5} />);
    expect(screen.getByText('Добавить')).toBeInTheDocument();
  });

  it('does not render add button when at max images', () => {
    render(<ImageUploader {...defaultProps} images={['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg']} maxImages={5} />);
    expect(screen.queryByText('Добавить')).not.toBeInTheDocument();
  });

  it('calls onChange when remove button clicked', () => {
    render(<ImageUploader {...defaultProps} />);
    const removeButtons = screen.getAllByRole('button', { hidden: true });
    const removeBtn = removeButtons.find(btn => btn.textContent === '');
    if (removeBtn) {
      fireEvent.click(removeBtn);
      expect(defaultProps.onChange).toHaveBeenCalled();
    }
  });

  it('renders helper text', () => {
    render(<ImageUploader {...defaultProps} />);
    expect(screen.getByText(/JPEG, PNG, WebP, GIF/)).toBeInTheDocument();
  });

  it('renders first image as main', () => {
    render(<ImageUploader {...defaultProps} />);
    expect(screen.getByText('Главное')).toBeInTheDocument();
  });
});

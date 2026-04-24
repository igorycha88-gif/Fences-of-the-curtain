import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Label } from '@/components/ui/label';

describe('Label', () => {
  it('renders children text', () => {
    render(<Label>Email</Label>);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders as a label element', () => {
    render(<Label>Username</Label>);
    expect(screen.getByText('Username').tagName).toBe('LABEL');
  });

  it('applies htmlFor attribute', () => {
    render(<Label htmlFor="email-input">Email</Label>);
    expect(screen.getByText('Email')).toHaveAttribute('for', 'email-input');
  });

  it('applies custom className', () => {
    render(<Label className="text-red-500">Custom</Label>);
    expect(screen.getByText('Custom').className).toContain('text-red-500');
  });

  it('has default text-sm font-medium styling', () => {
    render(<Label>Default</Label>);
    const label = screen.getByText('Default');
    expect(label.className).toContain('text-sm');
    expect(label.className).toContain('font-medium');
  });
});

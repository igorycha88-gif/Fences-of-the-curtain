import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default').className).toContain('bg-blue-600');
  });

  it('applies secondary variant classes', () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    expect(screen.getByText('Secondary').className).toContain('bg-gray-100');
  });

  it('applies destructive variant classes', () => {
    render(<Badge variant="destructive">Error</Badge>);
    expect(screen.getByText('Error').className).toContain('bg-red-600');
  });

  it('applies outline variant classes', () => {
    render(<Badge variant="outline">Outline</Badge>);
    const el = screen.getByText('Outline');
    expect(el.className).toContain('border-gray-300');
    expect(el.className).toContain('bg-white');
  });

  it('applies custom className', () => {
    render(<Badge className="extra-class">Badge</Badge>);
    expect(screen.getByText('Badge').className).toContain('extra-class');
  });

  it('renders as a span element with rounded-full', () => {
    render(<Badge>Test</Badge>);
    const el = screen.getByText('Test');
    expect(el.tagName).toBe('SPAN');
    expect(el.className).toContain('rounded-full');
  });
});

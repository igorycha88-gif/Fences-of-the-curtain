import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

describe('Card', () => {
  it('renders children inside a card container', () => {
    render(<Card>Card body</Card>);
    expect(screen.getByText('Card body')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Card className="extra">Content</Card>);
    expect(screen.getByText('Content').className).toContain('extra');
  });

  it('composes a full card layout', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content here</CardContent>
        <CardFooter>Footer here</CardFooter>
      </Card>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Content here')).toBeInTheDocument();
    expect(screen.getByText('Footer here')).toBeInTheDocument();
  });

  it('renders CardTitle as h3', () => {
    render(<CardTitle>My Title</CardTitle>);
    expect(screen.getByText('My Title').tagName).toBe('H3');
  });

  it('renders CardDescription as p element', () => {
    render(<CardDescription>My description</CardDescription>);
    expect(screen.getByText('My description').tagName).toBe('P');
  });
});

import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

describe('Table components', () => {
  it('renders a complete table structure', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Item 1</TableCell>
            <TableCell>100</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders TableHead as th elements', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(screen.getByText('Header').tagName).toBe('TH');
  });

  it('renders TableCell as td elements', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText('Cell').tagName).toBe('TD');
  });

  it('applies custom className to Table', () => {
    render(
      <Table className="custom-table">
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const wrapper = screen.getByText('Data').closest('.relative');
    expect(wrapper?.className).toContain('custom-table');
  });

  it('supports colSpan on TableCell', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={2}>Spanning</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText('Spanning')).toHaveAttribute('colspan', '2');
  });

  it('applies custom className to TableRow', () => {
    render(
      <Table>
        <TableBody>
          <TableRow className="highlighted">
            <TableCell>Row</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText('Row').closest('tr')?.className).toContain('highlighted');
  });
});

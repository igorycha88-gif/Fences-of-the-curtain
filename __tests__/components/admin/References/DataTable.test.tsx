import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DataTable } from '@/components/admin/References/DataTable';

const mockData = [
  { id: '1', name: 'Item 1', price: 100, active: true },
  { id: '2', name: 'Item 2', price: 200, active: false },
];

const columns = [
  { key: 'name' as const, label: 'Name' },
  { key: 'price' as const, label: 'Price' },
];

const defaultProps = {
  title: 'Test Table',
  columns,
  data: mockData,
  total: 2,
  page: 1,
  pageSize: 10,
  onSearch: jest.fn(),
  onPageChange: jest.fn(),
};

describe('DataTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and column headers', () => {
    render(<DataTable {...defaultProps} />);
    expect(screen.getByText('Test Table')).toBeInTheDocument();
    expect(screen.getAllByText('Name').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Price').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Действия').length).toBeGreaterThan(0);
  });

  it('renders table rows with data in both desktop and mobile views', () => {
    render(<DataTable {...defaultProps} />);
    expect(screen.getAllByText('Item 1').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Item 2').length).toBeGreaterThanOrEqual(2);
  });

  it('renders empty state when no data', () => {
    render(<DataTable {...defaultProps} data={[]} />);
    const emptyMessages = screen.getAllByText('Данные не найдены');
    expect(emptyMessages.length).toBeGreaterThanOrEqual(1);
  });

  it('renders loading state', () => {
    render(<DataTable {...defaultProps} isLoading={true} data={[]} />);
    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('calls onSearch on form submit', () => {
    render(<DataTable {...defaultProps} />);
    const input = screen.getByPlaceholderText('Поиск...');
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.submit(input.closest('form')!);
    expect(defaultProps.onSearch).toHaveBeenCalledWith('test query');
  });

  it('renders add button when onAdd provided', () => {
    const onAdd = jest.fn();
    render(<DataTable {...defaultProps} onAdd={onAdd} />);
    const addBtn = screen.getByText('Создать');
    fireEvent.click(addBtn);
    expect(onAdd).toHaveBeenCalled();
  });

  it('renders edit and delete buttons when handlers provided', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(<DataTable {...defaultProps} onEdit={onEdit} onDelete={onDelete} />);
    const editBtns = screen.getAllByText('Изменить');
    const deleteBtns = screen.getAllByText('Удалить');
    expect(editBtns.length).toBeGreaterThan(0);
    expect(deleteBtns.length).toBeGreaterThan(0);
  });

  it('renders pagination when totalPages > 1', () => {
    render(<DataTable {...defaultProps} total={25} pageSize={10} />);
    expect(screen.getByText('Назад')).toBeInTheDocument();
    expect(screen.getByText('Вперёд')).toBeInTheDocument();
  });

  it('disables back button on first page', () => {
    render(<DataTable {...defaultProps} total={25} pageSize={10} page={1} />);
    const backBtn = screen.getByText('Назад');
    expect(backBtn).toBeDisabled();
  });
});

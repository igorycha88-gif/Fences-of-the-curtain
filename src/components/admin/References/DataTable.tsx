'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Search, Plus, Edit, Trash2, Power } from 'lucide-react';
import { Select } from '../../ui/select';

interface Column<T> {
  key: keyof T | string;
  label: React.ReactNode;
  render?: (item: T) => React.ReactNode;
}

interface FilterOption {
  value: string;
  label: string;
}

interface Filter {
  key: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
}

interface DataTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  searchPlaceholder?: string;
  onSearch: (search: string) => void;
  onPageChange: (page: number) => void;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onToggleActive?: (item: T) => void;
  isLoading?: boolean;
  filters?: Filter[];
}

export function DataTable<T extends { id: string; active?: boolean }>({
  title,
  columns,
  data,
  total,
  page,
  pageSize,
  searchPlaceholder = 'Поиск...',
  onSearch,
  onPageChange,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
  isLoading = false,
  filters,
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);

  const renderCell = useCallback((item: T, column: Column<T>) => {
    if (column.render) {
      return column.render(item);
    }

    const keys = (column.key as string).split('.');
    let value: any = item;

    for (const key of keys) {
      value = value?.[key];
    }

    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Да' : 'Нет'}
        </Badge>
      );
    }

    if (typeof value === 'number') {
      return value.toLocaleString('ru-RU');
    }

    return String(value);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Создать
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="max-w-sm"
              />
              <Button type="submit" variant="secondary">
                <Search className="mr-2 h-4 w-4" />
                Найти
              </Button>
            </div>
            {filters && filters.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {filters.map((filter) => (
                  <div key={filter.key} className="flex items-center gap-2">
                    <label className="text-sm font-medium">{filter.label}:</label>
                    <Select
                      options={filter.options}
                      value={filter.value}
                      onChange={(e) => filter.onChange(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {isLoading ? (
          <div className="text-center py-8">Загрузка...</div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={String(column.key)}>{column.label}</TableHead>
                    ))}
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!data || data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length + 1}
                        className="text-center py-8"
                      >
                        Данные не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => (
                      <TableRow key={item.id}>
                        {columns.map((column) => (
                          <TableCell key={String(column.key)}>
                            {renderCell(item, column)}
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {onToggleActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleActive(item)}
                                title={item.active ? 'Деактивировать' : 'Активировать'}
                              >
                                <Power
                                  className={`h-4 w-4 ${
                                    item.active ? 'text-green-600' : 'text-gray-400'
                                  }`}
                                />
                              </Button>
                            )}
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(item)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden space-y-3">
              {!data || data.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Данные не найдены</div>
              ) : (
                data.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3 border">
                    <div className="space-y-2">
                      {columns.slice(0, 4).map((column, idx) => (
                        <div key={idx}>
                          <span className="text-xs text-gray-500 block">{column.label}</span>
                          <div className="text-sm text-gray-900 mt-0.5">{renderCell(item, column)}</div>
                        </div>
                      ))}
                    </div>
                    {(onEdit || onDelete || onToggleActive) && (
                      <div className="mt-3 pt-3 border-t flex gap-2">
                        {onToggleActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onToggleActive(item)}
                            className="flex-1 min-h-[44px]"
                          >
                            <Power className={`h-4 w-4 mr-1 ${item.active ? 'text-green-600' : 'text-gray-400'}`} />
                            {item.active ? 'Деактив.' : 'Актив.'}
                          </Button>
                        )}
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(item)}
                            className="flex-1 min-h-[44px]"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Изменить
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(item)}
                            className="flex-1 min-h-[44px] text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Удалить
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Показано {(page - 1) * pageSize + 1} -{' '}
                  {Math.min(page * pageSize, total)} из {total}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                  >
                    Назад
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onPageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                  >
                    Вперёд
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default React.memo(DataTable) as typeof DataTable;

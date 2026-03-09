'use client';

import React, { useState } from 'react';
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

interface Column<T> {
  key: keyof T | string;
  label: React.ReactNode;
  render?: (item: T) => React.ReactNode;
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
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onToggleActive?: (item: T) => void;
  isLoading?: boolean;
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
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  const totalPages = Math.ceil(total / pageSize);

  const renderCell = (item: T, column: Column<T>) => {
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
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Создать
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="mb-4">
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
        </form>

        {isLoading ? (
          <div className="text-center py-8">Загрузка...</div>
        ) : (
          <>
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
                {data.length === 0 ? (
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(item)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

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

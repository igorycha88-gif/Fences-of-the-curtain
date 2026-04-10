export interface ExportOptions {
  filename: string;
  format: 'xlsx' | 'csv';
}

export class ExportService {
  async exportToExcel(data: any[], filename: string) {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  async exportToCSV(data: any[], filename: string) {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatOrdersForExport(orders: any[]) {
    return orders.map((order) => ({
      ID: order.id,
      'Дата': new Date(order.createdAt).toLocaleDateString('ru-RU'),
      'Клиент': order.clientName,
      'Телефон': order.phone,
      'Email': order.email,
      'Тип услуги': order.serviceType === 'fence' ? 'Забор' : 'Навес',
      'Стоимость': order.calculatedCost,
      'Статус': this.translateStatus(order.status),
      'Менеджер': order.assignedUser?.name || 'Не назначен',
      'Комментарий': order.managerComment || '',
    }));
  }

  formatMaterialsForExport(materials: any[], type: 'fence' | 'canopy') {
    return materials.map((material) => ({
      ID: material.id,
      'Название': material.name,
      'Категория': material.category,
      'Единица': material.unit,
      'Цена': material.basePrice,
      'Активен': material.active ? 'Да' : 'Нет',
      'Сортировка': material.sortOrder,
      ...(type === 'fence' && {
        'Толщина': material.thickness,
        'Ширина': material.width,
        'Высота': material.height,
        'Покрытие': material.coating,
      }),
      ...(type === 'canopy' && {
        'Цвет': material.color,
      }),
    }));
  }

  formatPriceHistoryForExport(history: any[]) {
    return history.map((item) => ({
      ID: item.id,
      'Тип сущности': item.entityType,
      'ID сущности': item.entityId,
      'Поле': item.fieldName,
      'Старое значение': item.oldValue,
      'Новое значение': item.newValue,
      'Кто изменил': item.user?.name || 'Неизвестно',
      'Дата изменения': new Date(item.changedAt).toLocaleString('ru-RU'),
    }));
  }

  private translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      NEW: 'Новая',
      IN_PROGRESS: 'В работе',
      COMPLETED: 'Завершена',
      CANCELLED: 'Отменена',
    };
    return statusMap[status] || status;
  }
}

export const exportService = new ExportService();

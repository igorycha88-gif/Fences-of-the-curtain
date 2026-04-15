'use client';

import { DataTable } from '@/components/admin/References/DataTable';
import { Modal } from '@/components/ui/modal';
import { useTrussProfilePage } from '@/components/admin/TrussReferences/useTrussProfilePage';

export default function TrussCrossbeamsPage() {
  const {
    items, total, page, search, validityFilter, isLoading, isModalOpen,
    columns, filterOptions, renderForm, editingItem,
    setPage, setSearch, setValidityFilter,
    handleAdd, handleEdit, handleDelete, handleToggleActive, setIsModalOpen, title, pageSize, itemName,
  } = useTrussProfilePage({
    title: 'Перекладины (фермы)',
    category: 'CROSSBEAM',
    itemName: 'Перекладина',
    defaultValues: { sectionWidth: 60, sectionHeight: 40, wallThickness: 2, length: 6 },
  });

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4 flex gap-4 items-center">
        <select value={validityFilter} onChange={e => setValidityFilter(e.target.value as any)}
          className="border rounded px-3 py-2">
          {filterOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <DataTable
        title={title} columns={columns} data={items} total={total} page={page} pageSize={pageSize}
        searchPlaceholder="Поиск по названию..." onSearch={setSearch} onPageChange={setPage}
        onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} onToggleActive={handleToggleActive}
        isLoading={isLoading}
      />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Редактировать ${itemName.toLowerCase()}` : `Создать ${itemName.toLowerCase()}`}>
        {renderForm()}
      </Modal>
    </div>
  );
}

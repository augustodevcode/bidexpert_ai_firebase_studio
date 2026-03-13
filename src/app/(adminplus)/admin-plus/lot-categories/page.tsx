/**
 * @fileoverview Página CRUD de LotCategory — Admin Plus.
 */
'use client';

import { useState, useCallback, useMemo } from 'react';
import { Tag } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { getLotCategoryColumns } from './columns';
import {
  listLotCategories,
  createLotCategory,
  updateLotCategory,
  deleteLotCategory,
} from './actions';
import { LotCategoryForm } from './form';
import type { LotCategoryRow } from './types';

export default function LotCategoriesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<LotCategoryRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<LotCategoryRow | null>(null);

  const table = useDataTable<LotCategoryRow>({
    queryKey: 'lot-categories',
    fetchFn: listLotCategories,
    defaultSort: { field: 'name', direction: 'asc' },
  });

  const handleEdit = useCallback((row: LotCategoryRow) => {
    setEditRow(row);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((row: LotCategoryRow) => {
    setDeleteRow(row);
  }, []);

  const columns = useMemo(
    () => getLotCategoryColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete],
  );

  const handleSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      const res = editRow
        ? await updateLotCategory({ id: editRow.id, data: values as Parameters<typeof updateLotCategory>[0]['data'] })
        : await createLotCategory(values as Parameters<typeof createLotCategory>[0]);
      if (res?.success) {
        toast.success(editRow ? 'Categoria atualizada' : 'Categoria criada');
        setFormOpen(false);
        setEditRow(null);
        table.refresh();
      } else {
        toast.error(res?.error ?? 'Erro ao salvar');
      }
    },
    [editRow, table],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteRow) return;
    const res = await deleteLotCategory({ id: deleteRow.id });
    if (res?.success) {
      toast.success('Categoria excluída');
      setDeleteRow(null);
      table.refresh();
    } else {
      toast.error(res?.error ?? 'Erro ao excluir');
    }
  }, [deleteRow, table]);

  return (
    <div className="space-y-6" data-ai-id="lot-categories-page">
      <PageHeader
        title="Categorias"
        description="Gerenciar categorias de lotes"
        icon={Tag}
        onAdd={() => { setEditRow(null); setFormOpen(true); }}
        addLabel="Nova Categoria"
      />

      <DataTablePlus
        columns={columns}
        data={table.data}
        isLoading={table.isLoading}
        onRowDoubleClick={handleEdit}
        data-ai-id="lot-categories-data-table"
      />

      <LotCategoryForm
        open={formOpen}
        onOpenChange={(v) => {
          if (!v) { setFormOpen(false); setEditRow(null); } else setFormOpen(true);
        }}
        onSubmit={handleSubmit}
        defaultValues={editRow}
      />

      <ConfirmationDialog
        open={!!deleteRow}
        onOpenChange={(v) => !v && setDeleteRow(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Categoria"
        description={`Excluir a categoria "${deleteRow?.name}"? Esta ação não pode ser desfeita.`}
        data-ai-id="lot-categories-delete-dialog"
      />
    </div>
  );
}

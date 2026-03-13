/**
 * @fileoverview Página CRUD de Subcategory — Admin Plus.
 */
'use client';

import { useState, useCallback, useMemo } from 'react';
import { Tags } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { getSubcategoryColumns } from './columns';
import {
  listSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from './actions';
import { SubcategoryForm } from './form';
import type { SubcategoryRow } from './types';

export default function SubcategoriesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<SubcategoryRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<SubcategoryRow | null>(null);

  const table = useDataTable<SubcategoryRow>({
    queryKey: 'subcategories',
    fetchFn: listSubcategories,
    defaultSort: { field: 'name', direction: 'asc' },
  });

  const handleEdit = useCallback((row: SubcategoryRow) => {
    setEditRow(row);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((row: SubcategoryRow) => {
    setDeleteRow(row);
  }, []);

  const columns = useMemo(
    () => getSubcategoryColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete],
  );

  const handleSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      const res = editRow
        ? await updateSubcategory({ id: editRow.id, data: values as Parameters<typeof updateSubcategory>[0]['data'] })
        : await createSubcategory(values as Parameters<typeof createSubcategory>[0]);
      if (res?.success) {
        toast.success(editRow ? 'Subcategoria atualizada' : 'Subcategoria criada');
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
    const res = await deleteSubcategory({ id: deleteRow.id });
    if (res?.success) {
      toast.success('Subcategoria excluída');
      setDeleteRow(null);
      table.refresh();
    } else {
      toast.error(res?.error ?? 'Erro ao excluir');
    }
  }, [deleteRow, table]);

  return (
    <div className="space-y-6" data-ai-id="subcategories-page">
      <PageHeader
        title="Subcategorias"
        description="Gerenciar subcategorias de lotes"
        icon={Tags}
        onAdd={() => { setEditRow(null); setFormOpen(true); }}
        addLabel="Nova Subcategoria"
      />

      <DataTablePlus
        columns={columns}
        data={table.data}
        isLoading={table.isLoading}
        onRowDoubleClick={handleEdit}
        data-ai-id="subcategories-data-table"
      />

      <SubcategoryForm
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
        title="Excluir Subcategoria"
        description={`Excluir a subcategoria "${deleteRow?.name}"? Esta ação não pode ser desfeita.`}
        data-ai-id="subcategories-delete-dialog"
      />
    </div>
  );
}

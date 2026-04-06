/**
 * Lot listing page for Admin Plus CRUD.
 * Uses useDataTable hook with hybrid pagination and DataTablePlus.
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { Gavel } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { getLotColumns } from './columns';
import { listLots, createLot, updateLot, deleteLot } from './actions';
import { LotForm } from './form';
import type { LotRow } from './types';

export default function LotsPage() {
  const table = useDataTable<LotRow>({
    fetchFn: listLots,
    defaultSort: { field: 'createdAt', order: 'desc' },
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LotRow | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<LotRow | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const handleEdit = useCallback((row: LotRow) => {
    setEditing(row);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((row: LotRow) => {
    setDeleteTarget(row);
  }, []);

  const columns = useMemo(() => getLotColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      if (editing) {
        const res = await updateLot({ ...values, id: editing.id });
        if (res.success) {
          toast.success('Lote atualizado com sucesso');
          setFormOpen(false);
          setEditing(undefined);
          table.refresh();
        } else {
          toast.error(res.error ?? 'Erro ao atualizar');
        }
      } else {
        const res = await createLot(values);
        if (res.success) {
          toast.success('Lote criado com sucesso');
          setFormOpen(false);
          table.refresh();
        } else {
          toast.error(res.error ?? 'Erro ao criar');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteLot({ id: deleteTarget.id });
    if (res.success) {
      toast.success('Lote excluído');
      setDeleteTarget(undefined);
      table.refresh();
    } else {
      toast.error(res.error ?? 'Erro ao excluir');
    }
  };

  return (
    <div className="space-y-6" data-ai-id="lots-page">
      <PageHeader
        title="Lotes"
        icon={Gavel}
        subtitle="Gerenciar lotes de leilão"
        onAdd={() => { setEditing(undefined); setFormOpen(true); }}
      />

      <DataTablePlus
        columns={columns}
        data={table.data}
        isLoading={table.isLoading}
        pagination={table.pagination}
        sorting={table.sorting}
        onPaginationChange={table.onPaginationChange}
        onSortingChange={table.onSortingChange}
        searchValue={table.search}
        onSearchChange={table.onSearchChange}
        onRowDoubleClick={handleEdit}
      />

      <LotForm
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(undefined); }}
        onSubmit={handleSubmit}
        defaultValues={editing}
        isSubmitting={submitting}
      />

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => { if (!o) setDeleteTarget(undefined); }}
        title="Excluir Lote"
        description={`Deseja excluir o lote "${deleteTarget?.title}"?`}
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  );
}

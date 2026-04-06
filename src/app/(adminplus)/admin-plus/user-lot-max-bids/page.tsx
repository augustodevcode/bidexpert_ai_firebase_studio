/**
 * Página de listagem de Lances Máximos por Lote/Usuário (UserLotMaxBid).
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { getUserLotMaxBidColumns } from './columns';
import { UserLotMaxBidForm } from './form';
import { listUserLotMaxBids, createUserLotMaxBid, updateUserLotMaxBid, deleteUserLotMaxBid } from './actions';
import type { UserLotMaxBidRow } from './types';
import type { UserLotMaxBidFormData } from './schema';

export default function UserLotMaxBidsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<UserLotMaxBidRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<UserLotMaxBidRow | null>(null);

  const dt = useDataTable<UserLotMaxBidRow>({
    fetchFn: listUserLotMaxBids,
    defaultSort: { field: 'createdAt', direction: 'desc' },
  });

  const handleEdit = useCallback((row: UserLotMaxBidRow) => {
    setEditingRow(row);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((row: UserLotMaxBidRow) => {
    setDeleteRow(row);
  }, []);

  const handleSubmit = useCallback(async (data: UserLotMaxBidFormData) => {
    const response = editingRow
      ? await updateUserLotMaxBid({ ...data, id: editingRow.id })
      : await createUserLotMaxBid(data);

    if (response?.success) {
      toast.success(editingRow ? 'Lance máximo atualizado.' : 'Lance máximo criado.');
      setFormOpen(false);
      setEditingRow(null);
      dt.refresh();
      return;
    }

    toast.error(response?.error ?? 'Erro ao salvar lance máximo.');
  }, [dt, editingRow]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteRow) {
      return;
    }

    const response = await deleteUserLotMaxBid({ id: deleteRow.id });
    if (response?.success) {
      toast.success('Lance máximo excluído.');
      setDeleteRow(null);
      dt.refresh();
      return;
    }

    toast.error(response?.error ?? 'Erro ao excluir lance máximo.');
  }, [deleteRow, dt]);

  const columns = useMemo(() => getUserLotMaxBidColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleDelete, handleEdit]);

  return (
    <div className="space-y-4" data-ai-id="user-lot-max-bids-page">
      <PageHeader title="Lances Máximos" icon={TrendingUp} onAdd={() => { setEditingRow(null); setFormOpen(true); }} />
      <DataTablePlus
        columns={columns}
        data={dt.data}
        total={dt.total}
        page={dt.page}
        pageSize={dt.pageSize}
        onPageChange={dt.setPage}
        onPageSizeChange={dt.setPageSize}
        sorting={dt.sorting}
        onSortingChange={dt.setSorting}
        search={dt.search}
        onSearchChange={dt.setSearch}
        isLoading={dt.isLoading}
        onRowDoubleClick={handleEdit}
      />
      <UserLotMaxBidForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSubmit} defaultValues={editingRow} />
      <ConfirmationDialog
        open={!!deleteRow}
        onOpenChange={(open) => !open && setDeleteRow(null)}
        title="Excluir Lance Máximo"
        description={`Deseja realmente excluir o lance máximo ${deleteRow?.id ?? ''}?`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

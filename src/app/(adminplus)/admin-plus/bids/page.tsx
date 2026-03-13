/**
 * Admin Plus CRUD page for managing Bids (Lances).
 * Lists bids with search, sort, pagination and full CRUD.
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { DollarSign } from 'lucide-react';

import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { getBidColumns } from './columns';
import type { BidRow } from './types';
import BidForm from './form';
import { listBids, deleteBid } from './actions';
import { toast } from 'sonner';

export default function BidsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<BidRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<BidRow | null>(null);

  const { data, isLoading, pagination, sorting, search, refresh } = useDataTable<BidRow>({
    fetchFn: listBids,
    defaultSort: { field: 'timestamp', order: 'desc' },
  });

  const handleEdit = useCallback((row: BidRow) => {
    setEditItem(row);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((row: BidRow) => {
    setDeleteItem(row);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteItem) return;
    const res = await deleteBid({ id: deleteItem.id });
    if (res.success) {
      toast.success('Lance excluÃ­do!');
      refresh();
    } else {
      toast.error(res.error ?? 'Erro ao excluir.');
    }
    setDeleteItem(null);
  }, [deleteItem, refresh]);

  const columns = useMemo(() => getBidColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  return (
    <div className="space-y-4" data-ai-id="bids-page">
      <PageHeader
        title="Lances"
        description="Gerenciamento de lances das praÃ§as"
        icon={DollarSign}
        onAdd={() => { setEditItem(null); setFormOpen(true); }}
      />

      <DataTablePlus
        columns={columns}
        data={data}
        isLoading={isLoading}
        pagination={pagination}
        sorting={sorting}
        search={search}
        onRowDoubleClick={handleEdit}
      />

      <BidForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        onSuccess={refresh}
      />

      <ConfirmationDialog
        open={!!deleteItem}
        onOpenChange={(o) => { if (!o) setDeleteItem(null); }}
        title="Excluir Lance"
        description={`Deseja excluir o lance #${deleteItem?.id}?`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

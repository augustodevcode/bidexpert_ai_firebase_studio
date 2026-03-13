/**
 * @fileoverview PÃ¡gina de listagem de Auctions â€” Admin Plus.
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { Gavel } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { getAuctionColumns } from './columns';
import { listAuctions, createAuction, updateAuction, deleteAuction } from './actions';
import { AuctionForm } from './form';
import type { AuctionRow } from './types';
import type { AuctionSchema } from './schema';

export default function AuctionsPage() {
  const table = useDataTable<AuctionRow>({ fetchFn: listAuctions, defaultSort: { id: 'createdAt', desc: true } });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AuctionRow | null>(null);
  const [deleting, setDeleting] = useState<AuctionRow | null>(null);

  const handleEdit = useCallback((row: AuctionRow) => { setEditing(row); setFormOpen(true); }, []);
  const handleDelete = useCallback((row: AuctionRow) => { setDeleting(row); }, []);

  const columns = useMemo(() => getAuctionColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  const handleSubmit = async (values: AuctionSchema) => {
    const res = editing ? await updateAuction(editing.id, values) : await createAuction(values);
    if (res?.success) {
      toast.success(editing ? 'LeilÃ£o atualizado.' : 'LeilÃ£o criado.');
      setFormOpen(false); setEditing(null); table.refresh();
    } else {
      toast.error(res?.error ?? 'Erro ao salvar.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    const res = await deleteAuction(deleting.id);
    if (res?.success) { toast.success('LeilÃ£o excluÃ­do.'); setDeleting(null); table.refresh(); }
    else toast.error(res?.error ?? 'Erro ao excluir.');
  };

  return (
    <div className="space-y-6" data-ai-id="auctions-page">
      <PageHeader
        title="LeilÃµes"
        description="Gerencie os leilÃµes da plataforma."
        icon={Gavel}
        onAdd={() => { setEditing(null); setFormOpen(true); }}
      />

      <DataTablePlus
        columns={columns}
        data={table.data}
        isLoading={table.isLoading}
        pagination={table.pagination}
        sorting={table.sorting}
        onPaginationChange={table.onPaginationChange}
        onSortingChange={table.onSortingChange}
        searchValue={table.searchValue}
        onSearchChange={table.onSearchChange}
        onRowDoubleClick={handleEdit}
      />

      <AuctionForm
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        onSubmit={handleSubmit}
        defaultValues={editing}
      />

      <ConfirmationDialog
        open={!!deleting}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        onConfirm={handleConfirmDelete}
        title="Excluir LeilÃ£o"
        description={`Deseja realmente excluir "${deleting?.title}"?`}
      />
    </div>
  );
}

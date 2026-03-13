/**
 * @fileoverview Página de listagem de AuctionStage — Admin Plus.
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { Layers } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { getAuctionStageColumns } from './columns';
import { listAuctionStages, createAuctionStage, updateAuctionStage, deleteAuctionStage } from './actions';
import { AuctionStageForm } from './form';
import type { AuctionStageRow } from './types';
import type { AuctionStageSchema } from './schema';

export default function AuctionStagesPage() {
  const table = useDataTable<AuctionStageRow>({ fetchFn: listAuctionStages, defaultSort: { id: 'startDate', desc: true } });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AuctionStageRow | null>(null);
  const [deleting, setDeleting] = useState<AuctionStageRow | null>(null);

  const handleEdit = useCallback((row: AuctionStageRow) => { setEditing(row); setFormOpen(true); }, []);
  const handleDelete = useCallback((row: AuctionStageRow) => { setDeleting(row); }, []);

  const columns = useMemo(() => getAuctionStageColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  const handleSubmit = async (values: AuctionStageSchema) => {
    const res = editing ? await updateAuctionStage(editing.id, values) : await createAuctionStage(values);
    if (res?.success) {
      toast.success(editing ? 'Praça atualizada.' : 'Praça criada.');
      setFormOpen(false); setEditing(null); table.refresh();
    } else {
      toast.error(res?.error ?? 'Erro ao salvar.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    const res = await deleteAuctionStage(deleting.id);
    if (res?.success) { toast.success('Praça excluída.'); setDeleting(null); table.refresh(); }
    else toast.error(res?.error ?? 'Erro ao excluir.');
  };

  return (
    <div className="space-y-6" data-ai-id="auction-stages-page">
      <PageHeader
        title="Praças"
        description="Gerencie as praças dos leilões."
        icon={Layers}
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

      <AuctionStageForm
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        onSubmit={handleSubmit}
        defaultValues={editing}
      />

      <ConfirmationDialog
        open={!!deleting}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        onConfirm={handleConfirmDelete}
        title="Excluir Praça"
        description={`Deseja realmente excluir "${deleting?.name}"?`}
      />
    </div>
  );
}

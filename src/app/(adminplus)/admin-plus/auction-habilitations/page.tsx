/**
 * Página de listagem de Habilitações em Leilões (AuctionHabilitation).
 * Composite PK: userId + auctionId — gerenciamento manual de delete.
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { getAuctionHabilitationColumns } from './columns';
import { AuctionHabilitationForm } from './form';
import { listAuctionHabilitations, createAuctionHabilitation, updateAuctionHabilitation, deleteAuctionHabilitation } from './actions';
import type { AuctionHabilitationRow } from './types';
import type { AuctionHabilitationFormData } from './schema';

export default function AuctionHabilitationsPage() {
  const { data, isLoading, refresh, total, page, pageSize } = useDataTable<AuctionHabilitationRow>({
    fetchFn: listAuctionHabilitations,
    defaultSort: { field: 'habilitatedAt', direction: 'desc' },
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<AuctionHabilitationRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<AuctionHabilitationRow | null>(null);

  const handleEdit = useCallback((row: AuctionHabilitationRow) => { setEditItem(row); setFormOpen(true); }, []);
  const handleDelete = useCallback((row: AuctionHabilitationRow) => { setDeleteItem(row); }, []);

  const handleSubmit = useCallback(async (formData: AuctionHabilitationFormData) => {
    const action = editItem ? updateAuctionHabilitation : createAuctionHabilitation;
    const res = await action(formData);
    if (res.success) { toast.success(editItem ? 'Habilitação atualizada!' : 'Habilitação criada!'); setFormOpen(false); setEditItem(null); refresh(); }
    else toast.error(res.error ?? 'Erro ao salvar.');
  }, [editItem, refresh]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteItem) return;
    const res = await deleteAuctionHabilitation({ userId: deleteItem.userId, auctionId: deleteItem.auctionId });
    if (res.success) { toast.success('Habilitação removida!'); refresh(); }
    else toast.error(res.error ?? 'Erro ao excluir.');
    setDeleteItem(null);
  }, [deleteItem, refresh]);

  const columns = useMemo(() => getAuctionHabilitationColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  return (
    <div className="space-y-4" data-ai-id="auction-habilitations-page">
      <PageHeader title="Habilitações em Leilões" icon={ShieldCheck} onAdd={() => { setEditItem(null); setFormOpen(true); }} />
      <DataTablePlus columns={columns} data={data?.data ?? []} isLoading={isLoading} onRowDoubleClick={handleEdit} />
      <AuctionHabilitationForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSubmit} defaultValues={editItem} />
      <ConfirmationDialog
        open={!!deleteItem}
        onOpenChange={(o) => { if (!o) setDeleteItem(null); }}
        title="Remover Habilitação"
        description={`Desabilitar "${deleteItem?.userName}" do leilão "${deleteItem?.auctionTitle}"?`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

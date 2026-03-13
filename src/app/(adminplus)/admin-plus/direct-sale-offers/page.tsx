/**
 * Página de listagem de Ofertas de Venda Direta (DirectSaleOffer).
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { PageHeader } from '@/components/admin-plus/page-header';
import { ConfirmationDialog } from '@/components/admin-plus/confirmation-dialog';

import { getDirectSaleOfferColumns } from './columns';
import { listDirectSaleOffers, createDirectSaleOffer, updateDirectSaleOffer, deleteDirectSaleOffer } from './actions';
import { DirectSaleOfferForm } from './form';
import type { DirectSaleOfferRow } from './types';

export default function DirectSaleOffersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DirectSaleOfferRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DirectSaleOfferRow | null>(null);

  const table = useDataTable<DirectSaleOfferRow>({
    fetchAction: listDirectSaleOffers,
    defaultSort: { field: 'createdAt', order: 'desc' },
  });

  const handleEdit = useCallback((row: DirectSaleOfferRow) => {
    setEditing(row);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((row: DirectSaleOfferRow) => {
    setDeleteTarget(row);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const res = await deleteDirectSaleOffer({ id: deleteTarget.id });
    if (res.success) { toast.success('Oferta excluída'); table.refresh(); }
    else toast.error(res.error || 'Erro ao excluir');
    setDeleteTarget(null);
  }, [deleteTarget, table]);

  const handleSubmit = useCallback(async (data: any) => {
    const res = editing
      ? await updateDirectSaleOffer({ ...data, id: editing.id })
      : await createDirectSaleOffer(data);
    if (res.success) { toast.success(editing ? 'Oferta atualizada' : 'Oferta criada'); setFormOpen(false); setEditing(null); table.refresh(); }
    else toast.error(res.error || 'Erro ao salvar');
  }, [editing, table]);

  const columns = useMemo(() => getDirectSaleOfferColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  return (
    <div className="space-y-4" data-ai-id="direct-sale-offers-page">
      <PageHeader
        title="Ofertas de Venda Direta"
        description="Gerencie as ofertas de venda direta da plataforma"
        icon={ShoppingBag}
        onAdd={() => { setEditing(null); setFormOpen(true); }}
      />

      <DataTablePlus
        columns={columns}
        data={table.data}
        isLoading={table.isLoading}
        pagination={table.pagination}
        onPaginationChange={table.onPaginationChange}
        sorting={table.sorting}
        onSortingChange={table.onSortingChange}
        search={table.search}
        onSearchChange={table.onSearchChange}
        onRowDoubleClick={handleEdit}
      />

      <DirectSaleOfferForm open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }} onSubmit={handleSubmit} defaultValues={editing} />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        onConfirm={handleConfirmDelete}
        title="Excluir Oferta"
        description={`Tem certeza que deseja excluir "${deleteTarget?.title}"?`}
      />
    </div>
  );
}

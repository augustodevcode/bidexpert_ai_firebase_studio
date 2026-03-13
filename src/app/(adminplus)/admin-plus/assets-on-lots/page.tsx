/**
 * Admin Plus CRUD page for AssetsOnLots junction (Ativos nos Lotes).
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { Link2 } from 'lucide-react';

import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { getAssetsOnLotsColumns } from './columns';
import type { AssetsOnLotsRow } from './types';
import AssetsOnLotsForm from './form';
import { listAssetsOnLots, deleteAssetsOnLots } from './actions';
import { toast } from 'sonner';

export default function AssetsOnLotsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<AssetsOnLotsRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<AssetsOnLotsRow | null>(null);

  const { data, isLoading, pagination, sorting, search, refresh } = useDataTable<AssetsOnLotsRow>({
    fetchFn: listAssetsOnLots,
    defaultSort: { field: 'assignedAt', order: 'desc' },
  });

  const handleEdit = useCallback((row: AssetsOnLotsRow) => { setEditItem(row); setFormOpen(true); }, []);
  const handleDelete = useCallback((row: AssetsOnLotsRow) => { setDeleteItem(row); }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteItem) return;
    const res = await deleteAssetsOnLots({ lotId: deleteItem.lotId, assetId: deleteItem.assetId });
    if (res.success) { toast.success('Vínculo removido!'); refresh(); }
    else toast.error(res.error ?? 'Erro ao excluir.');
    setDeleteItem(null);
  }, [deleteItem, refresh]);

  const columns = useMemo(() => getAssetsOnLotsColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  return (
    <div className="space-y-4" data-ai-id="assets-on-lots-page">
      <PageHeader title="Ativos nos Lotes" description="Vínculos entre ativos e lotes" icon={Link2} onAdd={() => { setEditItem(null); setFormOpen(true); }} />
      <DataTablePlus columns={columns} data={data} isLoading={isLoading} pagination={pagination} sorting={sorting} search={search} onRowDoubleClick={handleEdit} />
      <AssetsOnLotsForm open={formOpen} onOpenChange={setFormOpen} editItem={editItem} onSuccess={refresh} />
      <ConfirmationDialog
        open={!!deleteItem}
        onOpenChange={(o) => { if (!o) setDeleteItem(null); }}
        title="Remover Vínculo"
        description={`Remover vínculo do ativo "${deleteItem?.assetTitle}" do lote "${deleteItem?.lotTitle}"?`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

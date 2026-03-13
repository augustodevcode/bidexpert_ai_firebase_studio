/**
 * @fileoverview PÃ¡gina CRUD de Asset (Ativo) â€” Admin Plus.
 */
'use client';

import { useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/admin-plus/forms/page-header';
import DataTablePlus from '@/components/admin-plus/data-table-plus';
import ConfirmationDialog from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { getAssetColumns } from './columns';
import type { AssetRow } from './types';
import { listAssets, deleteAsset } from './actions';
import AssetForm from './form';

export default function AssetsPage() {
  const table = useDataTable<AssetRow>({ fetchFn: listAssets, defaultSort: { field: 'createdAt', order: 'desc' } });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AssetRow | null>(null);
  const [deleting, setDeleting] = useState<AssetRow | null>(null);

  const handleEdit = (row: AssetRow) => { setEditing(row); setFormOpen(true); };
  const handleDelete = (row: AssetRow) => setDeleting(row);
  const handleConfirmDelete = async () => {
    if (!deleting) return;
    const res = await deleteAsset(deleting.id);
    if (res.success) { toast.success('Ativo excluÃ­do!'); table.refresh(); } else toast.error(res.error ?? 'Erro');
    setDeleting(null);
  };

  const columns = useMemo(() => getAssetColumns({ onEdit: handleEdit, onDelete: handleDelete }), []);

  return (
    <div className="space-y-4" data-ai-id="assets-page">
      <PageHeader title="Ativos" icon={Package} onCreate={() => { setEditing(null); setFormOpen(true); }} />
      <DataTablePlus data={table.data} columns={columns} isLoading={table.isLoading} pageCount={table.pageCount} totalRecords={table.total} pagination={table.pagination} onPaginationChange={table.onPaginationChange} sorting={table.sorting} onSortingChange={table.onSortingChange} search={table.search} onSearchChange={table.onSearchChange} onRowDoubleClick={handleEdit} />
      <AssetForm open={formOpen} onOpenChange={setFormOpen} row={editing} onSuccess={table.refresh} />
      <ConfirmationDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)} title="Excluir Ativo" description={`Excluir "${deleting?.title}"?`} onConfirm={handleConfirmDelete} />
    </div>
  );
}

/**
 * Página principal de listagem de WonLot (Lotes Arrematados) no Admin Plus.
 */
'use client';

import { useCallback, useState } from 'react';
import { Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { ConfirmationDialog } from '@/components/admin-plus/confirmation-dialog';
import { getWonLotColumns } from './columns';
import type { WonLotRow } from './types';
import { listWonLots, deleteWonLot } from './actions';
import { WonLotForm } from './form';

export default function WonLotsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<WonLotRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WonLotRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFn = useCallback(async (params: { page: number; pageSize: number; sortField?: string; sortDirection?: string; search?: string }) => {
    const res = await listWonLots(params);
    if (res?.success && res.data) return res.data as { data: WonLotRow[]; total: number; page: number; pageSize: number; totalPages: number };
    return { data: [] as WonLotRow[], total: 0, page: params.page, pageSize: params.pageSize, totalPages: 0 };
  }, []);

  const table = useDataTable<WonLotRow>({ fetchFn, defaultSort: { field: 'createdAt', direction: 'desc' } });

  const onEdit = (row: WonLotRow) => { setEditItem(row); setFormOpen(true); };
  const onDelete = (row: WonLotRow) => setDeleteTarget(row);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteWonLot({ id: deleteTarget.id });
      if (res?.success) { toast.success('Excluído!'); table.refresh(); } else toast.error(res?.error ?? 'Erro');
    } catch { toast.error('Erro ao excluir'); } finally { setDeleting(false); setDeleteTarget(null); }
  };

  const columns = getWonLotColumns({ onEdit, onDelete });

  return (
    <div className="space-y-4" data-ai-id="won-lots-page">
      <PageHeader title="Lotes Arrematados" icon={Trophy} onAdd={() => { setEditItem(null); setFormOpen(true); }} />
      <DataTablePlus columns={columns} data={table.data} totalItems={table.total} page={table.page} pageSize={table.pageSize} onPageChange={table.setPage} onPageSizeChange={table.setPageSize} onSortChange={table.setSorting} onSearchChange={table.setSearch} sorting={table.sorting} isLoading={table.isLoading} />
      <WonLotForm open={formOpen} onOpenChange={setFormOpen} editItem={editItem} onSuccess={table.refresh} />
      <ConfirmationDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={confirmDelete} loading={deleting} title="Excluir lote arrematado?" description={`Deseja excluir "${deleteTarget?.title ?? ''}"?`} />
    </div>
  );
}

/**
 * Página CRUD de ParticipationHistory no Admin Plus.
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import { History } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { listParticipationHistory, createParticipationHistory, updateParticipationHistory, deleteParticipationHistory } from './actions';
import { getParticipationHistoryColumns } from './columns';
import { ParticipationHistoryForm } from './form';
import type { ParticipationHistoryRow } from './types';
import type { ParticipationHistoryFormData } from './schema';

export default function ParticipationHistoryPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ParticipationHistoryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ParticipationHistoryRow | null>(null);

  const fetchFn = useCallback(async (params: { page: number; pageSize: number; sortField?: string; sortDirection?: string; search?: string }) => {
    const res = await listParticipationHistory(params);
    if (!res.success) throw new Error(res.error);
    return res.data as { data: ParticipationHistoryRow[]; total: number; page: number; pageSize: number; totalPages: number };
  }, []);

  const { tableData, totalRows, page, pageSize, setPage, setPageSize, sorting, setSorting, searchQuery, setSearchQuery, isLoading, refresh } =
    useDataTable<ParticipationHistoryRow>({ fetchFn, defaultSort: { field: 'createdAt', direction: 'desc' } });

  const handleEdit = useCallback((row: ParticipationHistoryRow) => { setEditing(row); setFormOpen(true); }, []);
  const handleDelete = useCallback((row: ParticipationHistoryRow) => { setDeleteTarget(row); }, []);
  const columns = useMemo(() => getParticipationHistoryColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  const handleSubmit = async (data: ParticipationHistoryFormData) => {
    const res = editing ? await updateParticipationHistory({ id: editing.id, data }) : await createParticipationHistory(data);
    if (!res.success) { toast.error(res.error ?? 'Erro ao salvar'); return; }
    toast.success(editing ? 'Atualizado!' : 'Criado!');
    setFormOpen(false); setEditing(null); refresh();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteParticipationHistory({ id: deleteTarget.id });
    if (!res.success) { toast.error(res.error ?? 'Erro ao excluir'); return; }
    toast.success('Excluído!');
    setDeleteTarget(null); refresh();
  };

  return (
    <div className="space-y-4" data-ai-id="participation-history-page">
      <PageHeader title="Histórico de Participações" icon={History} onAdd={() => { setEditing(null); setFormOpen(true); }} />
      <DataTablePlus
        columns={columns} data={tableData} totalRows={totalRows}
        page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize}
        sorting={sorting} onSortingChange={setSorting}
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        isLoading={isLoading}
      />
      <ParticipationHistoryForm open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }} onSubmit={handleSubmit} initialData={editing} />
      <ConfirmationDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }} onConfirm={confirmDelete}
        title="Confirmar exclusão" description={`Deseja excluir a participação "${deleteTarget?.title}"?`} />
    </div>
  );
}

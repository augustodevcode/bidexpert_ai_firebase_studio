/**
 * Página CRUD de Subscriber no Admin Plus.
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { listSubscribers, createSubscriber, updateSubscriber, deleteSubscriber } from './actions';
import { getSubscriberColumns } from './columns';
import { SubscriberForm } from './form';
import type { SubscriberRow } from './types';
import type { SubscriberFormData } from './schema';

export default function SubscribersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriberRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubscriberRow | null>(null);

  const fetchFn = useCallback(async (params: { page: number; pageSize: number; sortField?: string; sortDirection?: string; search?: string }) => {
    const res = await listSubscribers(params);
    if (!res.success) throw new Error(res.error);
    return res.data as { data: SubscriberRow[]; total: number; page: number; pageSize: number; totalPages: number };
  }, []);

  const { tableData, totalRows, page, pageSize, setPage, setPageSize, sorting, setSorting, searchQuery, setSearchQuery, isLoading, refresh } =
    useDataTable<SubscriberRow>({ fetchFn, defaultSort: { field: 'createdAt', direction: 'desc' } });

  const handleEdit = useCallback((row: SubscriberRow) => { setEditing(row); setFormOpen(true); }, []);
  const handleDelete = useCallback((row: SubscriberRow) => { setDeleteTarget(row); }, []);
  const columns = useMemo(() => getSubscriberColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  const handleSubmit = async (data: SubscriberFormData) => {
    const res = editing ? await updateSubscriber({ id: editing.id, data }) : await createSubscriber(data);
    if (!res.success) { toast.error(res.error ?? 'Erro ao salvar'); return; }
    toast.success(editing ? 'Atualizado!' : 'Criado!');
    setFormOpen(false); setEditing(null); refresh();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteSubscriber({ id: deleteTarget.id });
    if (!res.success) { toast.error(res.error ?? 'Erro ao excluir'); return; }
    toast.success('Excluído!');
    setDeleteTarget(null); refresh();
  };

  return (
    <div className="space-y-4" data-ai-id="subscribers-page">
      <PageHeader title="Assinantes" icon={Mail} onAdd={() => { setEditing(null); setFormOpen(true); }} />
      <DataTablePlus
        columns={columns} data={tableData} totalRows={totalRows}
        page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize}
        sorting={sorting} onSortingChange={setSorting}
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        isLoading={isLoading}
      />
      <SubscriberForm open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }} onSubmit={handleSubmit} initialData={editing} />
      <ConfirmationDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }} onConfirm={confirmDelete}
        title="Confirmar exclusão" description={`Deseja excluir o assinante ${deleteTarget?.email}?`} />
    </div>
  );
}

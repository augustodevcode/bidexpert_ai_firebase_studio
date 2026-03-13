/**
 * Página de listagem de Notificações de Arrematante (BidderNotification) no Admin Plus.
 */
'use client';

import { useState, useCallback } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';

import { getBidderNotificationColumns } from './columns';
import { BidderNotificationForm } from './form';
import { listBidderNotifications, createBidderNotification, updateBidderNotification, deleteBidderNotification } from './actions';
import type { BidderNotificationRow } from './types';
import type { BidderNotificationFormData } from './schema';
import type { PaginatedResponse } from '@/lib/admin-plus/types';
import type { BulkAction } from '@/components/admin-plus/data-table-plus';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export default function BidderNotificationsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BidderNotificationRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BidderNotificationRow | null>(null);

  const fetchFn = useCallback(async (params: { page: number; pageSize: number; sort?: { field: string; direction: string }; search?: string }) => {
    const r = await listBidderNotifications({ page: params.page, pageSize: params.pageSize, sortField: params.sort?.field, sortDirection: params.sort?.direction as any, search: params.search });
    if (r.success && r.data) return r.data as PaginatedResponse<BidderNotificationRow>;
    return { data: [], total: 0, page: 1, pageSize: params.pageSize, totalPages: 0 } as PaginatedResponse<BidderNotificationRow>;
  }, []);

  const { data, total, page, pageSize, totalPages, sorting, setSorting, search, setSearch, setPage, setPageSize, isLoading, refresh } = useDataTable<BidderNotificationRow>({ fetchFn, defaultSort: { field: 'createdAt', direction: 'desc' } });

  const handleEdit = (row: BidderNotificationRow) => { setEditing(row); setFormOpen(true); };
  const handleDelete = (row: BidderNotificationRow) => setDeleteTarget(row);

  const handleSubmit = async (formData: BidderNotificationFormData) => {
    const r = editing ? await updateBidderNotification({ id: editing.id, data: formData }) : await createBidderNotification(formData);
    if (r.success) { toast.success(editing ? 'Notificação atualizada' : 'Notificação criada'); setFormOpen(false); setEditing(null); refresh(); } else { toast.error(r.error || 'Erro'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const r = await deleteBidderNotification({ id: deleteTarget.id });
    if (r.success) { toast.success('Notificação excluída'); setDeleteTarget(null); refresh(); } else { toast.error(r.error || 'Erro'); }
  };

  const columns = getBidderNotificationColumns({ onEdit: handleEdit, onDelete: handleDelete });

  const bulkActions: BulkAction<BidderNotificationRow>[] = [
    { label: 'Excluir selecionados', icon: Trash2, variant: 'destructive' as const, onExecute: async (rows) => { for (const row of rows) await deleteBidderNotification({ id: row.id }); toast.success(`${rows.length} notificação(ões) excluída(s)`); refresh(); } },
  ];

  return (
    <div className="space-y-6" data-ai-id="bidder-notifications-page">
      <PageHeader icon={Bell} title="Notificações de Arrematantes" description="Gerencie notificações enviadas a arrematantes.">
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} data-ai-id="bidder-notification-new-btn"><Plus className="mr-2 h-4 w-4" /> Nova Notificação</Button>
      </PageHeader>

      <DataTablePlus columns={columns} data={data} total={total} page={page} pageSize={pageSize} totalPages={totalPages} onPageChange={setPage} onPageSizeChange={setPageSize} pageSizeOptions={[...(PAGE_SIZE_OPTIONS as readonly number[])]} sorting={sorting} onSortingChange={setSorting} search={search} onSearchChange={setSearch} isLoading={isLoading} bulkActions={bulkActions} />

      <BidderNotificationForm open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }} onSubmit={handleSubmit} defaultValues={editing} />

      <ConfirmationDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} title="Excluir Notificação" description={`Excluir "${deleteTarget?.title}"?`} onConfirm={confirmDelete} />
    </div>
  );
}

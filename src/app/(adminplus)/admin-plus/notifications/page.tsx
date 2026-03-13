/**
 * Página principal do CRUD de Notification (Notificações) no Admin Plus.
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { PageHeader } from '@/components/admin-plus/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { ConfirmationDialog } from '@/components/admin-plus/confirmation-dialog';
import { getNotificationColumns } from './columns';
import { listNotifications, deleteNotification } from './actions';
import { NotificationForm } from './form';
import { toast } from 'sonner';
import type { NotificationRow } from './types';

export default function NotificationsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<NotificationRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NotificationRow | null>(null);

  const table = useDataTable<NotificationRow>({ fetchAction: listNotifications, defaultSort: { field: 'createdAt', order: 'desc' } });

  const handleEdit = useCallback((r: NotificationRow) => { setEditData(r); setFormOpen(true); }, []);
  const handleDelete = useCallback((r: NotificationRow) => setDeleteTarget(r), []);
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const res = await deleteNotification({ id: deleteTarget.id });
    if (res.success) { toast.success('Notificação excluída'); table.refresh(); } else { toast.error(res.error || 'Erro'); }
    setDeleteTarget(null);
  }, [deleteTarget, table]);

  const columns = useMemo(() => getNotificationColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  return (
    <div className="space-y-4" data-ai-id="notifications-page">
      <PageHeader title="Notificações" description="Gerenciamento de notificações dos usuários" icon={Bell}
        onAdd={() => { setEditData(null); setFormOpen(true); }} />
      <DataTablePlus data={table.data} columns={columns} isLoading={table.isLoading}
        pageCount={table.totalPages} pageIndex={table.page - 1} pageSize={table.pageSize}
        onPaginationChange={table.onPaginationChange} onSortingChange={table.onSortingChange}
        searchValue={table.search} onSearchChange={table.onSearchChange}
        onRowDoubleClick={handleEdit} />
      <NotificationForm open={formOpen} onOpenChange={setFormOpen} editData={editData} onSuccess={table.refresh} />
      <ConfirmationDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}
        title="Excluir Notificação" description={`Deseja excluir a notificação #${deleteTarget?.id}?`}
        onConfirm={handleConfirmDelete} />
    </div>
  );
}

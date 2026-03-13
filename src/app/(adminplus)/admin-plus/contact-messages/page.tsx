/**
 * PÃ¡gina principal do CRUD de ContactMessage (Mensagens de Contato) no Admin Plus.
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { Mail } from 'lucide-react';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { getContactMessageColumns } from './columns';
import { listContactMessages, deleteContactMessage } from './actions';
import { ContactMessageForm } from './form';
import { toast } from 'sonner';
import type { ContactMessageRow } from './types';

export default function ContactMessagesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<ContactMessageRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessageRow | null>(null);

  const table = useDataTable<ContactMessageRow>({ fetchAction: listContactMessages, defaultSort: { field: 'createdAt', order: 'desc' } });

  const handleEdit = useCallback((r: ContactMessageRow) => { setEditData(r); setFormOpen(true); }, []);
  const handleDelete = useCallback((r: ContactMessageRow) => setDeleteTarget(r), []);
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const res = await deleteContactMessage({ id: deleteTarget.id });
    if (res.success) { toast.success('Mensagem excluÃ­da'); table.refresh(); } else { toast.error(res.error || 'Erro'); }
    setDeleteTarget(null);
  }, [deleteTarget, table]);

  const columns = useMemo(() => getContactMessageColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  return (
    <div className="space-y-4" data-ai-id="contact-messages-page">
      <PageHeader title="Mensagens de Contato" description="Mensagens recebidas pelo formulÃ¡rio de contato" icon={Mail}
        onAdd={() => { setEditData(null); setFormOpen(true); }} />
      <DataTablePlus data={table.data} columns={columns} isLoading={table.isLoading}
        pageCount={table.totalPages} pageIndex={table.page - 1} pageSize={table.pageSize}
        onPaginationChange={table.onPaginationChange} onSortingChange={table.onSortingChange}
        searchValue={table.search} onSearchChange={table.onSearchChange}
        onRowDoubleClick={handleEdit} />
      <ContactMessageForm open={formOpen} onOpenChange={setFormOpen} editData={editData} onSuccess={table.refresh} />
      <ConfirmationDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}
        title="Excluir Mensagem" description={`Deseja excluir a mensagem de "${deleteTarget?.name}"?`}
        onConfirm={handleConfirmDelete} />
    </div>
  );
}

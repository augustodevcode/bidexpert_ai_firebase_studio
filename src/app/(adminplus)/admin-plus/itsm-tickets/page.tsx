/**
 * Página de listagem CRUD de ITSM_Ticket no Admin Plus.
 */
'use client';

import React, { useCallback, useState } from 'react';
import { Headset } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/admin-plus/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { ConfirmationDialog } from '@/components/admin-plus/confirmation-dialog';
import { getItsmTicketColumns } from './columns';
import type { ItsmTicketRow } from './types';
import type { ItsmTicketFormData } from './schema';
import { listItsmTickets, createItsmTicket, updateItsmTicket, deleteItsmTicket } from './actions';
import ItsmTicketForm from './form';

export default function ItsmTicketsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ItsmTicketRow | null>(null);
  const [deleting, setDeleting] = useState<ItsmTicketRow | null>(null);

  const fetchFn = useCallback(async (params: { page: number; pageSize: number; sortField?: string; sortDirection?: string; search?: string }) => {
    const res: any = await listItsmTickets(params);
    if (res?.success) return res.data;
    return { data: [], total: 0, page: 1, pageSize: params.pageSize, totalPages: 0 };
  }, []);

  const table = useDataTable<ItsmTicketRow>({ fetchFn, defaultSort: { field: 'createdAt', direction: 'desc' } });

  const handleEdit = (row: ItsmTicketRow) => { setEditing(row); setFormOpen(true); };
  const handleDelete = (row: ItsmTicketRow) => setDeleting(row);
  const columns = getItsmTicketColumns({ onEdit: handleEdit, onDelete: handleDelete });

  const handleSubmit = async (data: ItsmTicketFormData) => {
    if (editing) {
      const res: any = await updateItsmTicket({ id: editing.id, data });
      if (res?.success) { toast.success('Ticket atualizado.'); table.refresh(); } else { toast.error(res?.error || 'Erro ao atualizar.'); throw new Error(); }
    } else {
      const res: any = await createItsmTicket(data);
      if (res?.success) { toast.success('Ticket criado.'); table.refresh(); } else { toast.error(res?.error || 'Erro ao criar.'); throw new Error(); }
    }
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const res: any = await deleteItsmTicket({ id: deleting.id });
    if (res?.success) { toast.success('Ticket excluído.'); table.refresh(); } else { toast.error(res?.error || 'Erro ao excluir.'); }
    setDeleting(null);
  };

  return (
    <div className="space-y-4" data-ai-id="itsm-tickets-page">
      <PageHeader icon={Headset} title="Tickets ITSM" description="Gerencie os tickets de suporte." onAdd={() => { setEditing(null); setFormOpen(true); }} />
      <DataTablePlus columns={columns} data={table.data} pagination={table.pagination} sorting={table.sorting} onPaginationChange={table.onPaginationChange} onSortingChange={table.onSortingChange} search={table.search} onSearchChange={table.onSearchChange} isLoading={table.isLoading} />
      <ItsmTicketForm open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }} onSubmit={handleSubmit} defaultValues={editing} />
      <ConfirmationDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null); }} onConfirm={confirmDelete} title="Excluir Ticket" description={`Excluir ticket "${deleting?.publicId}"?`} />
    </div>
  );
}

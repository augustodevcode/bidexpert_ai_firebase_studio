/**
 * Página de listagem CRUD de TenantInvoice no Admin Plus.
 */
'use client';

import React, { useCallback, useState } from 'react';
import { Receipt } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/admin-plus/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { ConfirmationDialog } from '@/components/admin-plus/confirmation-dialog';
import { getTenantInvoiceColumns } from './columns';
import type { TenantInvoiceRow } from './types';
import type { TenantInvoiceFormData } from './schema';
import { listTenantInvoices, createTenantInvoice, updateTenantInvoice, deleteTenantInvoice } from './actions';
import TenantInvoiceForm from './form';

export default function TenantInvoicesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TenantInvoiceRow | null>(null);
  const [deleting, setDeleting] = useState<TenantInvoiceRow | null>(null);

  const fetchFn = useCallback(async (params: { page: number; pageSize: number; sortField?: string; sortDirection?: string; search?: string }) => {
    const res: any = await listTenantInvoices(params);
    if (res?.success) return res.data;
    return { data: [], total: 0, page: 1, pageSize: params.pageSize, totalPages: 0 };
  }, []);

  const table = useDataTable<TenantInvoiceRow>({ fetchFn, defaultSort: { field: 'createdAt', direction: 'desc' } });

  const handleEdit = (row: TenantInvoiceRow) => { setEditing(row); setFormOpen(true); };
  const handleDelete = (row: TenantInvoiceRow) => setDeleting(row);
  const columns = getTenantInvoiceColumns({ onEdit: handleEdit, onDelete: handleDelete });

  const handleSubmit = async (data: TenantInvoiceFormData) => {
    if (editing) {
      const res: any = await updateTenantInvoice({ id: editing.id, data });
      if (res?.success) { toast.success('Fatura atualizada.'); table.refresh(); } else { toast.error(res?.error || 'Erro ao atualizar.'); throw new Error(); }
    } else {
      const res: any = await createTenantInvoice(data);
      if (res?.success) { toast.success('Fatura criada.'); table.refresh(); } else { toast.error(res?.error || 'Erro ao criar.'); throw new Error(); }
    }
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const res: any = await deleteTenantInvoice({ id: deleting.id });
    if (res?.success) { toast.success('Fatura excluída.'); table.refresh(); } else { toast.error(res?.error || 'Erro ao excluir.'); }
    setDeleting(null);
  };

  return (
    <div className="space-y-4" data-ai-id="tenant-invoices-page">
      <PageHeader icon={Receipt} title="Faturas" description="Gerencie as faturas dos tenants." onAdd={() => { setEditing(null); setFormOpen(true); }} />
      <DataTablePlus columns={columns} data={table.data} pagination={table.pagination} sorting={table.sorting} onPaginationChange={table.onPaginationChange} onSortingChange={table.onSortingChange} search={table.search} onSearchChange={table.onSearchChange} isLoading={table.isLoading} />
      <TenantInvoiceForm open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }} onSubmit={handleSubmit} defaultValues={editing} />
      <ConfirmationDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null); }} onConfirm={confirmDelete} title="Excluir Fatura" description={`Excluir fatura "${deleting?.invoiceNumber}"?`} />
    </div>
  );
}

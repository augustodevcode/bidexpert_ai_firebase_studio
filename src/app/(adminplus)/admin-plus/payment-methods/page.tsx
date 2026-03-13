/**
 * PÃ¡gina principal de listagem de PaymentMethod no Admin Plus.
 */
'use client';

import { useCallback, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { getPaymentMethodColumns } from './columns';
import type { PaymentMethodRow } from './types';
import { listPaymentMethods, deletePaymentMethod } from './actions';
import { PaymentMethodForm } from './form';

export default function PaymentMethodsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<PaymentMethodRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethodRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFn = useCallback(async (params: { page: number; pageSize: number; sortField?: string; sortDirection?: string; search?: string }) => {
    const res = await listPaymentMethods(params);
    if (res?.success && res.data) return res.data as { data: PaymentMethodRow[]; total: number; page: number; pageSize: number; totalPages: number };
    return { data: [] as PaymentMethodRow[], total: 0, page: params.page, pageSize: params.pageSize, totalPages: 0 };
  }, []);

  const table = useDataTable<PaymentMethodRow>({ fetchFn, defaultSort: { field: 'createdAt', direction: 'desc' } });

  const onEdit = (row: PaymentMethodRow) => { setEditItem(row); setFormOpen(true); };
  const onDelete = (row: PaymentMethodRow) => setDeleteTarget(row);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deletePaymentMethod({ id: deleteTarget.id });
      if (res?.success) { toast.success('ExcluÃ­do!'); table.refresh(); } else toast.error(res?.error ?? 'Erro');
    } catch { toast.error('Erro ao excluir'); } finally { setDeleting(false); setDeleteTarget(null); }
  };

  const columns = getPaymentMethodColumns({ onEdit, onDelete });

  return (
    <div className="space-y-4" data-ai-id="payment-methods-page">
      <PageHeader title="MÃ©todos de Pagamento" icon={CreditCard} onAdd={() => { setEditItem(null); setFormOpen(true); }} />
      <DataTablePlus columns={columns} data={table.data} totalItems={table.total} page={table.page} pageSize={table.pageSize} onPageChange={table.setPage} onPageSizeChange={table.setPageSize} onSortChange={table.setSorting} onSearchChange={table.setSearch} sorting={table.sorting} isLoading={table.isLoading} />
      <PaymentMethodForm open={formOpen} onOpenChange={setFormOpen} editItem={editItem} onSuccess={table.refresh} />
      <ConfirmationDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={confirmDelete} loading={deleting} title="Excluir mÃ©todo de pagamento?" description={`Deseja excluir o mÃ©todo "${deleteTarget?.type ?? ''}"?`} />
    </div>
  );
}

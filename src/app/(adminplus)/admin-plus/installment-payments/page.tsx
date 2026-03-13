/**
 * PÃ¡gina de listagem de InstallmentPayment (Parcelas de Pagamento).
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { toast } from 'sonner';
import { getInstallmentPaymentColumns } from './columns';
import { listInstallmentPayments, deleteInstallmentPayment } from './actions';
import InstallmentPaymentForm from './form';
import type { InstallmentPaymentRow } from './types';

export default function InstallmentPaymentsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InstallmentPaymentRow | null>(null);
  const [deleting, setDeleting] = useState<InstallmentPaymentRow | null>(null);

  const { data, isLoading, pagination, sorting, setSorting, setSearch, refresh } = useDataTable<InstallmentPaymentRow>({ fetchFn: listInstallmentPayments, defaultSort: { id: 'dueDate', desc: false } });

  const handleEdit = useCallback((r: InstallmentPaymentRow) => { setEditing(r); setFormOpen(true); }, []);
  const handleDelete = useCallback((r: InstallmentPaymentRow) => setDeleting(r), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleting) return;
    const res = await deleteInstallmentPayment({ id: deleting.id });
    if (res?.success) { toast.success('ExcluÃ­do!'); refresh(); } else toast.error(res?.error ?? 'Erro');
    setDeleting(null);
  }, [deleting, refresh]);

  const columns = useMemo(() => getInstallmentPaymentColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  return (
    <div className="space-y-4" data-ai-id="installment-payments-page">
      <PageHeader title="Parcelas de Pagamento" icon={CreditCard} onAdd={() => { setEditing(null); setFormOpen(true); }} />
      <DataTablePlus columns={columns} data={data?.data ?? []} isLoading={isLoading} pagination={pagination} sorting={sorting} onSortingChange={setSorting} onSearchChange={setSearch} onRowDoubleClick={handleEdit} />
      <InstallmentPaymentForm open={formOpen} onOpenChange={setFormOpen} editingItem={editing} onSuccess={refresh} />
      <ConfirmationDialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)} onConfirm={handleConfirmDelete} title="Excluir Parcela" description={`Excluir parcela #${deleting?.id}?`} />
    </div>
  );
}

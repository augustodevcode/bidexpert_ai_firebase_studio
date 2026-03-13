/**
 * PÃ¡gina CRUD de Riscos de Lotes (LotRisk).
 */
'use client';

import React, { useMemo } from 'react';
import { ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import DataTablePlus from '@/components/admin-plus/data-table-plus';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import LotRiskForm from './form';
import { getLotRiskColumns } from './columns';
import { listLotRisks, deleteLotRisk } from './actions';
import type { LotRiskRow } from './types';

export default function LotRisksPage() {
  const dt = useDataTable<LotRiskRow>({ fetchFn: listLotRisks, defaultSort: { field: 'createdAt', order: 'desc' } });
  const columns = useMemo(() => getLotRiskColumns({ onEdit: dt.handleEdit, onDelete: dt.handleDelete }), [dt.handleEdit, dt.handleDelete]);

  async function handleConfirmDelete() {
    if (!dt.deletingRow) return;
    const res = await deleteLotRisk({ id: dt.deletingRow.id });
    if (res.success) { dt.handleConfirmDelete(); } else { dt.setDeletingRow(null); }
  }

  return (
    <div className="space-y-4 p-6" data-ai-id="lot-risks-page">
      <PageHeader title="Riscos de Lotes" icon={ShieldAlert} description="Gerencie riscos associados a lotes" onAdd={() => dt.handleAdd()} />
      <DataTablePlus data={dt.data} columns={columns} isLoading={dt.isLoading} pageCount={dt.pageCount} pagination={dt.pagination} onPaginationChange={dt.onPaginationChange} sorting={dt.sorting} onSortingChange={dt.onSortingChange} search={dt.search} onSearchChange={dt.onSearchChange} onRowDoubleClick={dt.handleEdit} />
      <LotRiskForm open={dt.formOpen} onOpenChange={dt.setFormOpen} editingRow={dt.editingRow} onSuccess={dt.refresh} />
      <ConfirmationDialog open={!!dt.deletingRow} onOpenChange={o => !o && dt.setDeletingRow(null)} onConfirm={handleConfirmDelete} title="Excluir Risco" description={`Deseja excluir "${dt.deletingRow?.riskDescription?.slice(0, 50)}..."?`} />
    </div>
  );
}

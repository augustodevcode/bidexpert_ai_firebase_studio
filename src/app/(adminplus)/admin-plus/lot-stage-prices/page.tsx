/**
 * Página CRUD de Preço por Praça (LotStagePrice).
 */
'use client';

import React, { useMemo } from 'react';
import { DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/admin-plus/page-header';
import DataTablePlus from '@/components/admin-plus/data-table-plus';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { ConfirmationDialog } from '@/components/admin-plus/confirmation-dialog';
import LotStagePriceForm from './form';
import { getLotStagePriceColumns } from './columns';
import { listLotStagePrices, deleteLotStagePrice } from './actions';
import type { LotStagePriceRow } from './types';

export default function LotStagePricesPage() {
  const dt = useDataTable<LotStagePriceRow>({ fetchFn: listLotStagePrices, defaultSort: { field: 'id', order: 'desc' } });
  const columns = useMemo(() => getLotStagePriceColumns({ onEdit: dt.handleEdit, onDelete: dt.handleDelete }), [dt.handleEdit, dt.handleDelete]);

  async function handleConfirmDelete() {
    if (!dt.deletingRow) return;
    const res = await deleteLotStagePrice({ id: dt.deletingRow.id });
    if (res.success) { dt.handleConfirmDelete(); } else { dt.setDeletingRow(null); }
  }

  return (
    <div className="space-y-4 p-6" data-ai-id="lot-stage-prices-page">
      <PageHeader title="Preços por Praça" icon={DollarSign} description="Gerencie preços e incrementos por praça de leilão" onAdd={() => dt.handleAdd()} />
      <DataTablePlus data={dt.data} columns={columns} isLoading={dt.isLoading} pageCount={dt.pageCount} pagination={dt.pagination} onPaginationChange={dt.onPaginationChange} sorting={dt.sorting} onSortingChange={dt.onSortingChange} search={dt.search} onSearchChange={dt.onSearchChange} onRowDoubleClick={dt.handleEdit} />
      <LotStagePriceForm open={dt.formOpen} onOpenChange={dt.setFormOpen} editingRow={dt.editingRow} onSuccess={dt.refresh} />
      <ConfirmationDialog open={!!dt.deletingRow} onOpenChange={o => !o && dt.setDeletingRow(null)} onConfirm={handleConfirmDelete} title="Excluir Preço" description={`Deseja excluir o preço do lote "${dt.deletingRow?.lotTitle}"?`} />
    </div>
  );
}

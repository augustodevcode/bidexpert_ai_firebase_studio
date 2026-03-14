/**
 * @fileoverview PÃ¡gina de listagem de CounterState â€” Admin Plus.
 * CRUD completo com DataTablePlus, dialog form, confirmaÃ§Ã£o de exclusÃ£o.
 */
'use client';

import { useState, useCallback } from 'react';
import { Hash, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';

import { columns } from './columns';
import { CounterStateForm } from './form';
import { listCounterStatesAction, deleteCounterStateAction } from './actions';
import type { CounterStateRow } from './types';

export default function CounterStatesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<CounterStateRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<CounterStateRow | null>(null);

  const fetchData = useCallback(async (params: { page: number; pageSize: number; search: string; sortField: string; sortOrder: 'asc' | 'desc' }) => {
    const res = await listCounterStatesAction(params);
    if (res?.success && res.data) return res.data as unknown as { data: CounterStateRow[]; total: number; page: number; pageSize: number; totalPages: number };
    return { data: [], total: 0, page: 1, pageSize: params.pageSize, totalPages: 0 };
  }, []);

  const table = useDataTable<CounterStateRow>({ fetchData, defaultSort: { field: 'entityType', order: 'asc' } });

  const handleEdit = (row: CounterStateRow) => { setEditRow(row); setFormOpen(true); };
  const handleNew = () => { setEditRow(null); setFormOpen(true); };
  const handleDelete = async () => {
    if (!deleteRow) return;
    try {
      const res = await deleteCounterStateAction({ id: deleteRow.id });
      if (res?.success) { toast.success('Contador excluÃ­do.'); table.refresh(); }
      else toast.error(res?.error ?? 'Erro ao excluir.');
    } catch { toast.error('Erro inesperado.'); }
    setDeleteRow(null);
  };

  return (
    <div data-ai-id="counter-states-page">
      <PageHeader title="Contadores de SequÃªncia" icon={Hash}>
        <Button onClick={handleNew} data-ai-id="counter-states-add">
          <Plus className="mr-2 h-4 w-4" /> Novo Contador
        </Button>
      </PageHeader>

      <DataTablePlus
        columns={columns}
        data={table.data}
        total={table.total}
        page={table.page}
        pageSize={table.pageSize}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onSearchChange={table.setSearch}
        onSortChange={table.setSort}
        isLoading={table.isLoading}
        onRowDoubleClick={handleEdit}
        rowActions={(row: CounterStateRow) => [
          { label: 'Editar', onClick: () => handleEdit(row) },
          { label: 'Excluir', onClick: () => setDeleteRow(row), variant: 'destructive' as const },
        ]}
      />

      <CounterStateForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editRow={editRow}
        onSuccess={table.refresh}
      />

      <ConfirmationDialog
        open={!!deleteRow}
        onOpenChange={() => setDeleteRow(null)}
        title="Excluir Contador"
        description={`Deseja realmente excluir o contador "${deleteRow?.entityType}"?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}

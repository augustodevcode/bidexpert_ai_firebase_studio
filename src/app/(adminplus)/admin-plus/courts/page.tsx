/**
 * @fileoverview Página de listagem de Tribunais/Comarcas no Admin Plus.
 */
'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Scale } from 'lucide-react';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import type { Court } from '@/types';
import type { BulkAction, PaginatedResponse } from '@/lib/admin-plus/types';
import { listCourtsAction, createCourtAction, updateCourtAction, deleteCourtAction } from './actions';
import { getCourtColumns } from './columns';
import { CourtForm } from './form';
import type { CreateCourtInput } from './schema';

export default function CourtsListPage() {
  const [data, setData] = useState<PaginatedResponse<Court>>({ data: [], total: 0, page: 1, pageSize: 25, totalPages: 1 });
  const [isLoading, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Court | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Court | null>(null);

  const loadData = useCallback(() => {
    startTransition(async () => {
      const result = await listCourtsAction(undefined as never);
      if (result.success && result.data) setData(result.data);
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = useCallback((row: Court) => {
    setEditRow(row);
    setFormOpen(true);
  }, []);

  const handleSubmit = useCallback(async (values: CreateCourtInput) => {
    const result = editRow
      ? await updateCourtAction({ id: editRow.id, data: values })
      : await createCourtAction(values);
    if (result.success) {
      toast.success(editRow ? 'Tribunal atualizado' : 'Tribunal criado');
      setFormOpen(false);
      setEditRow(null);
      loadData();
    } else {
      toast.error(result.error ?? 'Erro ao salvar');
    }
  }, [editRow, loadData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteCourtAction({ id: deleteTarget.id });
    if (result.success) {
      toast.success('Tribunal excluído');
      loadData();
    } else {
      toast.error(result.error ?? 'Erro ao excluir');
    }
    setDeleteTarget(null);
  };

  const columns = useMemo(
    () =>
      getCourtColumns({
        onEdit: handleEdit,
        onDelete: (row) => setDeleteTarget(row),
      }),
    [handleEdit],
  );

  const bulkActions: BulkAction<Court>[] = useMemo(
    () => [
      {
        label: 'Excluir selecionados',
        variant: 'destructive' as const,
        onExecute: async (rows) => {
          for (const row of rows) await deleteCourtAction({ id: row.id });
          toast.success(`${rows.length} tribunal(is) excluído(s)`);
          loadData();
        },
      },
    ],
    [loadData],
  );

  return (
    <>
      <PageHeader
        title="Tribunais / Comarcas"
        description="Gerencie os tribunais e comarcas do sistema."
        icon={Scale}
        primaryAction={{
          label: 'Novo Tribunal',
          onClick: () => { setEditRow(null); setFormOpen(true); },
        }}
        data-ai-id="courts-page-header"
      />

      <DataTablePlus
        columns={columns}
        data={data}
        isLoading={isLoading}
        onPaginationChange={loadData}
        bulkActions={bulkActions}
        onRowDoubleClick={handleEdit}
        data-ai-id="courts-data-table"
      />

      <CourtForm
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditRow(null); }}
        onSubmit={handleSubmit}
        defaultValues={editRow}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Excluir Tribunal"
        description={`Deseja realmente excluir "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        variant="destructive"
        data-ai-id="courts-delete-dialog"
      />
    </>
  );
}

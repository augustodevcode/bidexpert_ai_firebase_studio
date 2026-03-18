/**
 * @fileoverview Página de listagem de Estados no Admin Plus.
 * Client-side pagination (< 30 estados).
 */
'use client';

import { useEffect, useMemo, useState, useCallback, useTransition } from 'react';
import { toast } from 'sonner';
import { MapPin, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { getStateColumns } from './columns';
import { listStatesAction, createStateAction, updateStateAction, deleteStateAction } from './actions';
import { StateForm } from './form';
import type { PaginatedResponse, BulkAction } from '@/lib/admin-plus/types';
import type { StateInfo } from '@/types';
import type { CreateStateInput } from './schema';

export default function StatesPage() {
  const [data, setData] = useState<PaginatedResponse<StateInfo> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<StateInfo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StateInfo | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const result = await listStatesAction(undefined as never);
    if (result.success && result.data) {
      setData(result.data);
    } else {
      toast.error(result.error ?? 'Erro ao carregar estados');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = useCallback((row: StateInfo) => {
    setEditRow(row);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((row: StateInfo) => setDeleteTarget(row), []);

  const handleSubmit = useCallback(async (values: CreateStateInput) => {
    const result = editRow
      ? await updateStateAction({ id: editRow.id, data: values })
      : await createStateAction(values);
    if (result.success) {
      toast.success(editRow ? 'Estado atualizado com sucesso' : 'Estado criado com sucesso');
      setFormOpen(false);
      setEditRow(null);
      loadData();
    } else {
      toast.error(result.error ?? 'Erro ao salvar estado');
    }
  }, [editRow, loadData]);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteStateAction({ id: deleteTarget.id });
      if (result.success) {
        toast.success('Estado excluído com sucesso');
        loadData();
      } else {
        toast.error(result.error ?? 'Erro ao excluir estado');
      }
      setDeleteTarget(null);
    });
  }, [deleteTarget, loadData]);

  const columns = useMemo(
    () => getStateColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete],
  );

  const bulkActions: BulkAction<StateInfo>[] = useMemo(
    () => [
      {
        label: 'Excluir selecionados',
        icon: Trash2,
        variant: 'destructive',
        onExecute: async (rows) => {
          for (const row of rows) {
            await deleteStateAction({ id: row.id });
          }
          toast.success(`${rows.length} estado(s) excluído(s)`);
          loadData();
        },
      },
    ],
    [loadData],
  );

  return (
    <>
      <PageHeader
        title="Estados"
        description="Gerencie os estados (UFs) cadastrados no sistema."
        icon={MapPin}
        primaryAction={{
          label: 'Novo Estado',
          onClick: () => { setEditRow(null); setFormOpen(true); },
        }}
        data-ai-id="states-page-header"
      />

      <DataTablePlus
        columns={columns}
        data={data}
        isLoading={isLoading || isPending}
        searchPlaceholder="Buscar por nome ou UF..."
        bulkActions={bulkActions}
        onRowDoubleClick={handleEdit}
        data-ai-id="states-data-table"
      />

      <StateForm
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditRow(null); }}
        onSubmit={handleSubmit}
        defaultValues={editRow}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir Estado"
        description={`Tem certeza que deseja excluir o estado "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={confirmDelete}
        data-ai-id="states-delete-dialog"
      />
    </>
  );
}

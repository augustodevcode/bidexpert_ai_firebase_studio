/**
 * @fileoverview Página de listagem de Modelos de Veículo no Admin Plus.
 * Client-side pagination.
 */
'use client';

import { useEffect, useMemo, useState, useCallback, useTransition } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { getVehicleModelColumns } from './columns';
import {
  listVehicleModelsAction,
  createVehicleModelAction,
  updateVehicleModelAction,
  deleteVehicleModelAction,
} from './actions';
import { VehicleModelForm } from './form';
import type { PaginatedResponse, BulkAction } from '@/lib/admin-plus/types';
import type { VehicleModel } from '@/types';
import type { CreateVehicleModelInput } from './schema';

export default function VehicleModelsPage() {
  const [data, setData] = useState<PaginatedResponse<VehicleModel> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<VehicleModel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleModel | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const result = await listVehicleModelsAction(undefined as never);
    if (result.success && result.data) {
      setData(result.data);
    } else {
      toast.error(result.error ?? 'Erro ao carregar modelos');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = useCallback((row: VehicleModel) => {
    setEditRow(row);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((row: VehicleModel) => setDeleteTarget(row), []);

  const handleSubmit = useCallback(async (values: CreateVehicleModelInput) => {
    const result = editRow
      ? await updateVehicleModelAction({ id: editRow.id, data: values })
      : await createVehicleModelAction(values);
    if (result.success) {
      toast.success(editRow ? 'Modelo atualizado com sucesso' : 'Modelo criado com sucesso');
      setFormOpen(false);
      setEditRow(null);
      loadData();
    } else {
      toast.error(result.error ?? 'Erro ao salvar modelo');
    }
  }, [editRow, loadData]);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteVehicleModelAction({ id: deleteTarget.id });
      if (result.success) {
        toast.success('Modelo excluído com sucesso');
        loadData();
      } else {
        toast.error(result.error ?? 'Erro ao excluir modelo');
      }
      setDeleteTarget(null);
    });
  }, [deleteTarget, loadData]);

  const columns = useMemo(
    () => getVehicleModelColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete],
  );

  const bulkActions: BulkAction<VehicleModel>[] = useMemo(
    () => [
      {
        label: 'Excluir selecionados',
        icon: Trash2,
        variant: 'destructive',
        onExecute: async (rows) => {
          for (const row of rows) {
            await deleteVehicleModelAction({ id: row.id });
          }
          toast.success(`${rows.length} modelo(s) excluído(s)`);
          loadData();
        },
      },
    ],
    [loadData],
  );

  return (
    <>
      <PageHeader
        title="Modelos de Veículo"
        description="Gerencie os modelos de veículo cadastrados no sistema."
        primaryAction={{
          label: 'Novo Modelo',
          onClick: () => { setEditRow(null); setFormOpen(true); },
        }}
        data-ai-id="vehicle-models-page-header"
      />

      <DataTablePlus
        columns={columns}
        data={data}
        isLoading={isLoading || isPending}
        searchPlaceholder="Buscar por modelo ou marca..."
        bulkActions={bulkActions}
        onRowDoubleClick={handleEdit}
        data-ai-id="vehicle-models-data-table"
      />

      <VehicleModelForm
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditRow(null); }}
        onSubmit={handleSubmit}
        defaultValues={editRow}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir Modelo"
        description={`Tem certeza que deseja excluir o modelo "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={confirmDelete}
        data-ai-id="vehicle-models-delete-dialog"
      />
    </>
  );
}

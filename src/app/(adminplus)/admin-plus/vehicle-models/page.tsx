/**
 * @fileoverview Página de listagem de Modelos de Veículo no Admin Plus.
 * Client-side pagination.
 */
'use client';

import { useEffect, useMemo, useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { getVehicleModelColumns } from './columns';
import { listVehicleModelsAction, deleteVehicleModelAction } from './actions';
import type { PaginatedResponse, BulkAction } from '@/lib/admin-plus/types';
import type { VehicleModel } from '@/types';

export default function VehicleModelsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<VehicleModel> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
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

  const handleEdit = useCallback(
    (row: VehicleModel) => router.push(`/admin-plus/vehicle-models/${row.id}`),
    [router],
  );

  const handleDelete = useCallback((row: VehicleModel) => setDeleteTarget(row), []);

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
        data-ai-id="vehicle-models-page-header"
      >
        <Button onClick={() => router.push('/admin-plus/vehicle-models/new')} data-ai-id="vehicle-models-btn-new">
          <Plus className="mr-2 h-4 w-4" />
          Novo Modelo
        </Button>
      </PageHeader>

      <DataTablePlus
        columns={columns}
        data={data}
        isLoading={isLoading || isPending}
        searchPlaceholder="Buscar por modelo ou marca..."
        bulkActions={bulkActions}
        onRowDoubleClick={handleEdit}
        data-ai-id="vehicle-models-data-table"
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

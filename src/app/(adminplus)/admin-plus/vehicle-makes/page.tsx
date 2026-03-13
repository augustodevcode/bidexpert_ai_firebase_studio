/**
 * @fileoverview Página de listagem de VehicleMakes no Admin Plus.
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { ADMIN_PLUS_BASE_PATH } from '@/lib/admin-plus/constants';
import type { BulkAction } from '@/lib/admin-plus/types';
import type { VehicleMake } from '@/types';
import { getVehicleMakeColumns } from './columns';
import { listVehicleMakesAction, deleteVehicleMakeAction } from './actions';

export default function VehicleMakesPage() {
  const router = useRouter();
  const [data, setData] = useState<VehicleMake[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<VehicleMake | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await listVehicleMakesAction();
    if (result.success && result.data) setData(result.data.data);
    else toast.error(result.error ?? 'Erro ao carregar marcas');
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEdit = useCallback((row: VehicleMake) => {
    router.push(`${ADMIN_PLUS_BASE_PATH}/vehicle-makes/${row.id}`);
  }, [router]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const result = await deleteVehicleMakeAction({ id: deleteTarget.id });
    if (result.success) { toast.success('Marca excluída com sucesso'); fetchData(); }
    else toast.error(result.error ?? 'Erro ao excluir');
    setDeleteTarget(null);
  }, [deleteTarget, fetchData]);

  const columns = useMemo(() => getVehicleMakeColumns({ onEdit: handleEdit, onDelete: setDeleteTarget }), [handleEdit]);

  const bulkActions: BulkAction<VehicleMake>[] = useMemo(() => [
    {
      label: 'Excluir Selecionados',
      variant: 'destructive' as const,
      onExecute: async (rows) => {
        let ok = 0;
        for (const row of rows) {
          const r = await deleteVehicleMakeAction({ id: row.id });
          if (r.success) ok++;
        }
        toast.success(`${ok} de ${rows.length} excluídas`);
        fetchData();
      },
    },
  ], [fetchData]);

  return (
    <div className="space-y-6" data-ai-id="vehicle-makes-listing-page">
      <PageHeader heading="Marcas de Veículos" description="Gerencie as marcas de veículos do sistema.">
        <Button onClick={() => router.push(`${ADMIN_PLUS_BASE_PATH}/vehicle-makes/new`)} data-ai-id="vehicle-make-new-btn">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Nova Marca
        </Button>
      </PageHeader>

      <DataTablePlus columns={columns} data={data} loading={loading} bulkActions={bulkActions} searchColumn="name" searchPlaceholder="Buscar por marca…" />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Excluir Marca"
        description={`Deseja excluir "${deleteTarget?.name}"? Marcas com modelos vinculados não podem ser excluídas.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}

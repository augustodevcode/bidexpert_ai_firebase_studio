/**
 * @fileoverview Página de listagem de VehicleMakes no Admin Plus.
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Car } from 'lucide-react';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import type { BulkAction } from '@/lib/admin-plus/types';
import type { VehicleMake } from '@/types';
import { getVehicleMakeColumns } from './columns';
import { listVehicleMakesAction, createVehicleMakeAction, updateVehicleMakeAction, deleteVehicleMakeAction } from './actions';
import { VehicleMakeForm } from './form';
import type { CreateVehicleMakeInput } from './schema';

export default function VehicleMakesPage() {
  const [data, setData] = useState<VehicleMake[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<VehicleMake | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleMake | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await listVehicleMakesAction(undefined as never);
    if (result.success && result.data) setData(result.data.data);
    else toast.error(result.error ?? 'Erro ao carregar marcas');
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEdit = useCallback((row: VehicleMake) => {
    setEditRow(row);
    setFormOpen(true);
  }, []);

  const handleSubmit = useCallback(async (values: CreateVehicleMakeInput) => {
    const result = editRow
      ? await updateVehicleMakeAction({ id: editRow.id, data: values })
      : await createVehicleMakeAction(values);
    if (result.success) {
      toast.success(editRow ? 'Marca atualizada com sucesso' : 'Marca criada com sucesso');
      setFormOpen(false);
      setEditRow(null);
      fetchData();
    } else {
      toast.error(result.error ?? 'Erro ao salvar');
    }
  }, [editRow, fetchData]);

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
      <PageHeader
        title="Marcas de Veículos"
        description="Gerencie as marcas de veículos do sistema."
        icon={Car}
        primaryAction={{
          label: 'Nova Marca',
          onClick: () => { setEditRow(null); setFormOpen(true); },
        }}
      />

      <DataTablePlus
        columns={columns}
        data={data}
        isLoading={loading}
        bulkActions={bulkActions}
        searchPlaceholder="Buscar por marca…"
        onRowDoubleClick={handleEdit}
        data-ai-id="vehicle-makes-data-table"
      />

      <VehicleMakeForm
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditRow(null); }}
        onSubmit={handleSubmit}
        defaultValues={editRow}
      />

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

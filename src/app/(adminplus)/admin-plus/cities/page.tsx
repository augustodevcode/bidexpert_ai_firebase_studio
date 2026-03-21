/**
 * @fileoverview Página de listagem de Cidades no Admin Plus.
 * Client-side pagination (serviço retorna tudo de uma vez).
 */
'use client';

import { useEffect, useMemo, useState, useCallback, useTransition } from 'react';
import { toast } from 'sonner';
import { Building2, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { getCityColumns } from './columns';
import { listCitiesAction, createCityAction, updateCityAction, deleteCityAction } from './actions';
import { CityForm } from './form';
import type { PaginatedResponse, BulkAction } from '@/lib/admin-plus/types';
import type { CityInfo } from '@/types';
import type { CreateCityInput } from './schema';

export default function CitiesPage() {
  const [data, setData] = useState<PaginatedResponse<CityInfo> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<CityInfo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CityInfo | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const result = await listCitiesAction(undefined as never);
    if (result.success && result.data) {
      setData(result.data);
    } else {
      toast.error(result.error ?? 'Erro ao carregar cidades');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = useCallback((row: CityInfo) => {
    setEditRow(row);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((row: CityInfo) => setDeleteTarget(row), []);

  const handleSubmit = useCallback(async (values: CreateCityInput) => {
    const result = editRow
      ? await updateCityAction({ id: editRow.id, data: values })
      : await createCityAction(values);
    if (result.success) {
      toast.success(editRow ? 'Cidade atualizada com sucesso' : 'Cidade criada com sucesso');
      setFormOpen(false);
      setEditRow(null);
      loadData();
    } else {
      toast.error(result.error ?? 'Erro ao salvar cidade');
    }
  }, [editRow, loadData]);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteCityAction({ id: deleteTarget.id });
      if (result.success) {
        toast.success('Cidade excluída com sucesso');
        loadData();
      } else {
        toast.error(result.error ?? 'Erro ao excluir cidade');
      }
      setDeleteTarget(null);
    });
  }, [deleteTarget, loadData]);

  const columns = useMemo(
    () => getCityColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete],
  );

  const bulkActions: BulkAction<CityInfo>[] = useMemo(
    () => [
      {
        label: 'Excluir selecionados',
        icon: Trash2,
        variant: 'destructive',
        onExecute: async (rows) => {
          for (const row of rows) {
            await deleteCityAction({ id: row.id });
          }
          toast.success(`${rows.length} cidade(s) excluída(s)`);
          loadData();
        },
      },
    ],
    [loadData],
  );

  return (
    <>
      <PageHeader
        title="Cidades"
        description="Gerencie as cidades cadastradas no sistema."
        icon={Building2}
        primaryAction={{
          label: 'Nova Cidade',
          onClick: () => { setEditRow(null); setFormOpen(true); },
        }}
        data-ai-id="cities-page-header"
      />

      <DataTablePlus
        columns={columns}
        data={data}
        isLoading={isLoading || isPending}
        searchPlaceholder="Buscar por nome, UF ou código IBGE..."
        bulkActions={bulkActions}
        onRowDoubleClick={handleEdit}
        data-ai-id="cities-data-table"
      />

      <CityForm
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditRow(null); }}
        onSubmit={handleSubmit}
        defaultValues={editRow}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir Cidade"
        description={`Tem certeza que deseja excluir a cidade "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={confirmDelete}
        data-ai-id="cities-delete-dialog"
      />
    </>
  );
}

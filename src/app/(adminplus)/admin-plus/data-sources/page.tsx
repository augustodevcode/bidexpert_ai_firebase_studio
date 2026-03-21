/**
 * @fileoverview Página de listagem de DataSources no Admin Plus.
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Database } from 'lucide-react';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import type { BulkAction } from '@/lib/admin-plus/types';
import { getDataSourceColumns } from './columns';
import {
  listDataSourcesAction,
  createDataSourceAction,
  updateDataSourceAction,
  deleteDataSourceAction,
} from './actions';
import { DataSourceForm } from './form';
import type { CreateDataSourceInput } from './schema';

type DSRow = { id: string; name: string; modelName: string; fields: string };

export default function DataSourcesPage() {
  const [data, setData] = useState<DSRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<DSRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DSRow | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await listDataSourcesAction(undefined as never);
    if (result.success && result.data) setData(result.data.data);
    else toast.error(result.error ?? 'Erro ao carregar data sources');
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEdit = useCallback((row: DSRow) => {
    setEditRow(row);
    setFormOpen(true);
  }, []);

  const handleSubmit = useCallback(async (values: CreateDataSourceInput) => {
    const result = editRow
      ? await updateDataSourceAction({ id: editRow.id, data: values })
      : await createDataSourceAction(values);
    if (result.success) {
      toast.success(editRow ? 'DataSource atualizado com sucesso' : 'DataSource criado com sucesso');
      setFormOpen(false);
      setEditRow(null);
      fetchData();
    } else {
      toast.error(result.error ?? 'Erro ao salvar');
    }
  }, [editRow, fetchData]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const result = await deleteDataSourceAction({ id: deleteTarget.id });
    if (result.success) { toast.success('DataSource excluído com sucesso'); fetchData(); }
    else toast.error(result.error ?? 'Erro ao excluir');
    setDeleteTarget(null);
  }, [deleteTarget, fetchData]);

  const columns = useMemo(() => getDataSourceColumns({ onEdit: handleEdit, onDelete: setDeleteTarget }), [handleEdit]);

  const bulkActions: BulkAction<DSRow>[] = useMemo(() => [
    {
      label: 'Excluir Selecionados',
      variant: 'destructive' as const,
      onExecute: async (rows) => {
        let ok = 0;
        for (const row of rows) {
          const r = await deleteDataSourceAction({ id: row.id });
          if (r.success) ok++;
        }
        toast.success(`${ok} de ${rows.length} excluídos`);
        fetchData();
      },
    },
  ], [fetchData]);

  return (
    <div className="space-y-6" data-ai-id="data-sources-listing-page">
      <PageHeader
        title="Data Sources"
        description="Gerencie as fontes de dados do sistema."
        icon={Database}
        primaryAction={{
          label: 'Novo Data Source',
          onClick: () => { setEditRow(null); setFormOpen(true); },
        }}
      />

      <DataTablePlus
        columns={columns}
        data={data}
        isLoading={loading}
        bulkActions={bulkActions}
        searchPlaceholder="Buscar por nome…"
        onRowDoubleClick={handleEdit}
        data-ai-id="data-sources-data-table"
      />

      <DataSourceForm
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditRow(null); }}
        onSubmit={handleSubmit}
        defaultValues={editRow}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Excluir Data Source"
        description={`Deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}

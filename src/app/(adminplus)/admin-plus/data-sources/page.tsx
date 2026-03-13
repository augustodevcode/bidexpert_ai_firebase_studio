/**
 * @fileoverview Página de listagem de DataSources no Admin Plus.
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
import { getDataSourceColumns } from './columns';
import { listDataSourcesAction, deleteDataSourceAction } from './actions';

type DSRow = { id: string; name: string; modelName: string; fields: string };

export default function DataSourcesPage() {
  const router = useRouter();
  const [data, setData] = useState<DSRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DSRow | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await listDataSourcesAction();
    if (result.success && result.data) setData(result.data.data);
    else toast.error(result.error ?? 'Erro ao carregar data sources');
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEdit = useCallback((row: DSRow) => {
    router.push(`${ADMIN_PLUS_BASE_PATH}/data-sources/${row.id}`);
  }, [router]);

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
      <PageHeader heading="Data Sources" description="Gerencie as fontes de dados do sistema.">
        <Button onClick={() => router.push(`${ADMIN_PLUS_BASE_PATH}/data-sources/new`)} data-ai-id="datasource-new-btn">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Novo Data Source
        </Button>
      </PageHeader>

      <DataTablePlus columns={columns} data={data} loading={loading} bulkActions={bulkActions} searchColumn="name" searchPlaceholder="Buscar por nome…" />

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

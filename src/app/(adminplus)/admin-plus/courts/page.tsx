/**
 * @fileoverview Página de listagem de Tribunais/Comarcas no Admin Plus.
 */
'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import type { Court } from '@/types';
import type { BulkAction, PaginatedResponse } from '@/lib/admin-plus/types';
import { listCourtsAction, deleteCourtAction } from './actions';
import { getCourtColumns } from './columns';

export default function CourtsListPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Court>>({ data: [], total: 0, page: 1, pageSize: 25, totalPages: 1 });
  const [isLoading, startTransition] = useTransition();
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
        onEdit: (row) => router.push(`/admin-plus/courts/${row.id}`),
        onDelete: (row) => setDeleteTarget(row),
      }),
    [router],
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
        data-ai-id="courts-page-header"
      >
        <Button onClick={() => router.push('/admin-plus/courts/new')} data-ai-id="courts-btn-new">
          <Plus className="mr-2 h-4 w-4" /> Novo Tribunal
        </Button>
      </PageHeader>

      <DataTablePlus
        columns={columns}
        data={data}
        isLoading={isLoading}
        onPaginationChange={loadData}
        bulkActions={bulkActions}
        onRowDoubleClick={(row) => router.push(`/admin-plus/courts/${row.id}`)}
        data-ai-id="courts-data-table"
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

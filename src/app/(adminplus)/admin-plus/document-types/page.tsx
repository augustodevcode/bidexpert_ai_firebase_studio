/**
 * @fileoverview Página de listagem de Tipos de Documento no Admin Plus.
 */
'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import type { BulkAction, PaginatedResponse } from '@/lib/admin-plus/types';
import { listDocumentTypesAction, deleteDocumentTypeAction } from './actions';
import { getDocumentTypeColumns } from './columns';

type DocTypeRow = {
  id: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  appliesTo: string;
};

export default function DocumentTypesListPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<DocTypeRow>>({ data: [], total: 0, page: 1, pageSize: 25, totalPages: 1 });
  const [isLoading, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<DocTypeRow | null>(null);

  const loadData = useCallback(() => {
    startTransition(async () => {
      const result = await listDocumentTypesAction(undefined as never);
      if (result.success && result.data) setData(result.data);
    });
  }, []);

  useState(() => { loadData(); });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteDocumentTypeAction({ id: deleteTarget.id });
    if (result.success) {
      toast.success('Tipo de documento excluído');
      loadData();
    } else {
      toast.error(result.error ?? 'Erro ao excluir');
    }
    setDeleteTarget(null);
  };

  const columns = useMemo(
    () =>
      getDocumentTypeColumns({
        onEdit: (row) => router.push(`/admin-plus/document-types/${row.id}`),
        onDelete: (row) => setDeleteTarget(row),
      }),
    [router],
  );

  const bulkActions: BulkAction<DocTypeRow>[] = useMemo(
    () => [
      {
        label: 'Excluir selecionados',
        variant: 'destructive' as const,
        onExecute: async (rows) => {
          for (const row of rows) await deleteDocumentTypeAction({ id: row.id });
          toast.success(`${rows.length} tipo(s) excluído(s)`);
          loadData();
        },
      },
    ],
    [loadData],
  );

  return (
    <>
      <PageHeader
        title="Tipos de Documento"
        description="Gerencie os tipos de documento exigidos no cadastro."
        data-ai-id="document-types-page-header"
      >
        <Button onClick={() => router.push('/admin-plus/document-types/new')} data-ai-id="document-types-btn-new">
          <Plus className="mr-2 h-4 w-4" /> Novo Tipo
        </Button>
      </PageHeader>

      <DataTablePlus
        columns={columns}
        data={data}
        isLoading={isLoading}
        onPaginationChange={loadData}
        bulkActions={bulkActions}
        onRowDoubleClick={(row) => router.push(`/admin-plus/document-types/${row.id}`)}
        data-ai-id="document-types-data-table"
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Excluir Tipo de Documento"
        description={`Deseja realmente excluir "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        variant="destructive"
        data-ai-id="document-types-delete-dialog"
      />
    </>
  );
}

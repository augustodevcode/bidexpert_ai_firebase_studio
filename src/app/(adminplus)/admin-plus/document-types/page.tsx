/**
 * @fileoverview Página de listagem de Tipos de Documento no Admin Plus.
 */
'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import type { BulkAction, PaginatedResponse } from '@/lib/admin-plus/types';
import {
  listDocumentTypesAction,
  createDocumentTypeAction,
  updateDocumentTypeAction,
  deleteDocumentTypeAction,
} from './actions';
import { getDocumentTypeColumns } from './columns';
import { DocumentTypeForm } from './form';
import type { CreateDocumentTypeInput } from './schema';

type DocTypeRow = {
  id: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  appliesTo: string;
};

export default function DocumentTypesListPage() {
  const [data, setData] = useState<PaginatedResponse<DocTypeRow>>({ data: [], total: 0, page: 1, pageSize: 25, totalPages: 1 });
  const [isLoading, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<DocTypeRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocTypeRow | null>(null);

  const loadData = useCallback(() => {
    startTransition(async () => {
      const result = await listDocumentTypesAction(undefined as never);
      if (result.success && result.data) setData(result.data);
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = useCallback((row: DocTypeRow) => {
    setEditRow(row);
    setFormOpen(true);
  }, []);

  const handleSubmit = useCallback(async (values: CreateDocumentTypeInput) => {
    const result = editRow
      ? await updateDocumentTypeAction({ id: editRow.id, data: values })
      : await createDocumentTypeAction(values);
    if (result.success) {
      toast.success(editRow ? 'Tipo de documento atualizado' : 'Tipo de documento criado');
      setFormOpen(false);
      setEditRow(null);
      loadData();
    } else {
      toast.error(result.error ?? 'Erro ao salvar');
    }
  }, [editRow, loadData]);

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
        onEdit: handleEdit,
        onDelete: (row) => setDeleteTarget(row),
      }),
    [handleEdit],
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
        icon={FileText}
        primaryAction={{
          label: 'Novo Tipo',
          onClick: () => { setEditRow(null); setFormOpen(true); },
        }}
        data-ai-id="document-types-page-header"
      />

      <DataTablePlus
        columns={columns}
        data={data}
        isLoading={isLoading}
        onPaginationChange={loadData}
        bulkActions={bulkActions}
        onRowDoubleClick={handleEdit}
        data-ai-id="document-types-data-table"
      />

      <DocumentTypeForm
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditRow(null); }}
        onSubmit={handleSubmit}
        defaultValues={editRow}
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

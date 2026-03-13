/**
 * @fileoverview Página CRUD de UserDocument — Admin Plus.
 */
'use client';

import { useState, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { columns } from './columns';
import {
  listUserDocuments,
  createUserDocument,
  updateUserDocument,
  deleteUserDocument,
} from './actions';
import { UserDocumentForm } from './form';
import type { UserDocumentRow } from './types';

export default function UserDocumentsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<UserDocumentRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<UserDocumentRow | null>(null);

  const table = useDataTable<UserDocumentRow>({
    fetchFn: async ({ page, pageSize, search }) => {
      const res = await listUserDocuments({ page, pageSize, search });
      if (res?.data && 'data' in res.data) return res.data;
      throw new Error(res?.data?.error ?? 'Erro ao carregar documentos');
    },
  });

  const handleSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      const action = editRow
        ? updateUserDocument({ ...values, id: editRow.id } as Parameters<typeof updateUserDocument>[0])
        : createUserDocument(values as Parameters<typeof createUserDocument>[0]);
      const res = await action;
      if (res?.data?.success) {
        toast.success(editRow ? 'Documento atualizado' : 'Documento criado');
        setFormOpen(false);
        setEditRow(null);
        table.refresh();
      } else {
        toast.error(res?.data?.error ?? 'Erro ao salvar');
      }
    },
    [editRow, table],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteRow) return;
    const res = await deleteUserDocument({ id: deleteRow.id });
    if (res?.data?.success) {
      toast.success('Documento excluído');
      setDeleteRow(null);
      table.refresh();
    } else {
      toast.error(res?.data?.error ?? 'Erro ao excluir');
    }
  }, [deleteRow, table]);

  return (
    <div className="space-y-6" data-ai-id="user-documents-page">
      <PageHeader
        title="Documentos de Usuários"
        description="Gerenciar documentos enviados pelos usuários"
        icon={FileText}
        onAdd={() => { setEditRow(null); setFormOpen(true); }}
        data-ai-id="ud-page-header"
      />

      <DataTablePlus
        columns={columns}
        data={table.data}
        totalItems={table.total}
        page={table.page}
        pageSize={table.pageSize}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onSearch={table.setSearch}
        isLoading={table.isLoading}
        onEdit={(row) => { setEditRow(row); setFormOpen(true); }}
        onDelete={(row) => setDeleteRow(row)}
        data-ai-id="ud-data-table"
      />

      <UserDocumentForm
        open={formOpen}
        onOpenChange={(v) => { if (!v) { setFormOpen(false); setEditRow(null); } else setFormOpen(true); }}
        onSubmit={handleSubmit}
        defaultValues={editRow}
      />

      <ConfirmationDialog
        open={!!deleteRow}
        onOpenChange={(v) => !v && setDeleteRow(null)}
        onConfirm={handleDelete}
        title="Excluir Documento"
        description={`Excluir documento "${deleteRow?.fileName || deleteRow?.id}" do usuário "${deleteRow?.userName}"?`}
        data-ai-id="ud-delete-dialog"
      />
    </div>
  );
}

/**
 * Página de listagem de Templates de Documentos (DocumentTemplate).
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { PageHeader } from '@/components/admin-plus/page-header';
import { ConfirmationDialog } from '@/components/admin-plus/confirmation-dialog';

import { getDocumentTemplateColumns } from './columns';
import { listDocumentTemplates, createDocumentTemplate, updateDocumentTemplate, deleteDocumentTemplate } from './actions';
import { DocumentTemplateForm } from './form';
import type { DocumentTemplateRow } from './types';

export default function DocumentTemplatesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentTemplateRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentTemplateRow | null>(null);

  const table = useDataTable<DocumentTemplateRow>({ fetchAction: listDocumentTemplates, defaultSort: { field: 'name', order: 'asc' } });

  const handleEdit = useCallback((row: DocumentTemplateRow) => { setEditing(row); setFormOpen(true); }, []);
  const handleDelete = useCallback((row: DocumentTemplateRow) => { setDeleteTarget(row); }, []);
  const handleConfirmDelete = useCallback(async () => { if (!deleteTarget) return; const res = await deleteDocumentTemplate({ id: deleteTarget.id }); if (res.success) { toast.success('Template excluído'); table.refresh(); } else toast.error(res.error || 'Erro'); setDeleteTarget(null); }, [deleteTarget, table]);
  const handleSubmit = useCallback(async (data: any) => { const res = editing ? await updateDocumentTemplate({ ...data, id: editing.id }) : await createDocumentTemplate(data); if (res.success) { toast.success(editing ? 'Atualizado' : 'Criado'); setFormOpen(false); setEditing(null); table.refresh(); } else toast.error(res.error || 'Erro'); }, [editing, table]);

  const columns = useMemo(() => getDocumentTemplateColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  return (
    <div className="space-y-4" data-ai-id="document-templates-page">
      <PageHeader title="Templates de Documentos" description="Gerencie os modelos de documentos do sistema" icon={FileText} onAdd={() => { setEditing(null); setFormOpen(true); }} />
      <DataTablePlus columns={columns} data={table.data} isLoading={table.isLoading} pagination={table.pagination} onPaginationChange={table.onPaginationChange} sorting={table.sorting} onSortingChange={table.onSortingChange} search={table.search} onSearchChange={table.onSearchChange} onRowDoubleClick={handleEdit} />
      <DocumentTemplateForm open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }} onSubmit={handleSubmit} defaultValues={editing} />
      <ConfirmationDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={handleConfirmDelete} title="Excluir Template" description={`Excluir "${deleteTarget?.name}"?`} />
    </div>
  );
}

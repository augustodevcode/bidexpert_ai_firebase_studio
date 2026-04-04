/**
 * Page component for LotDocument CRUD management.
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { getLotDocumentColumns } from './columns';
import { listLotDocuments, deleteLotDocument } from './actions';
import { LotDocumentForm } from './form';
import type { LotDocumentRow } from './types';

export default function LotDocumentsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LotDocumentRow | null>(null);
  const [deleting, setDeleting] = useState<LotDocumentRow | null>(null);

  const { data, isLoading, pagination, sorting, searchQuery, setSearchQuery, setPagination, setSorting, refresh } = useDataTable<LotDocumentRow>({ fetchFn: listLotDocuments, defaultSort: { field: 'createdAt', order: 'desc' } });

  const handleEdit = useCallback((row: LotDocumentRow) => { setEditing(row); setFormOpen(true); }, []);
  const handleDelete = useCallback((row: LotDocumentRow) => setDeleting(row), []);
  const handleConfirmDelete = useCallback(async () => {
    if (!deleting) return;
    const res = await deleteLotDocument({ id: deleting.id });
    if (res.success) { toast.success('Documento excluído'); refresh(); } else toast.error(res.error ?? 'Erro ao excluir');
    setDeleting(null);
  }, [deleting, refresh]);

  const columns = useMemo(() => getLotDocumentColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  return (
    <div className="space-y-4" data-ai-id="lot-documents-page">
      <PageHeader title="Documentos de Lotes" description="Gerencie documentos vinculados aos lotes" icon={FileText} onCreate={() => { setEditing(null); setFormOpen(true); }} />
      <DataTablePlus columns={columns} data={data?.data ?? []} totalRows={data?.total ?? 0} isLoading={isLoading} pagination={pagination} onPaginationChange={setPagination} sorting={sorting} onSortingChange={setSorting} searchQuery={searchQuery} onSearchChange={setSearchQuery} onRowDoubleClick={handleEdit} />
      <LotDocumentForm open={formOpen} onOpenChange={setFormOpen} editingRow={editing} onSuccess={refresh} />
      <ConfirmationDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} onConfirm={handleConfirmDelete} title="Excluir Documento" description={`Deseja excluir o documento "${deleting?.title}"?`} />
    </div>
  );
}
